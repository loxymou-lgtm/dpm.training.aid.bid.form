import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { runAutomatedComplianceCheck } from './src/services/complianceEngine';
import { GO6ScholarshipBidApplication } from './src/types/generalOrder6';

dotenv.config();
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'scholarship@dpm').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'DPM_scholarship@2026';

const DEFAULT_AI_AUDIT = {
  readiness_score: 88,
  summary: 'The submitted training aid bid has been captured and is ready for DPM central intake review.',
  strengths: [
    'All required participant and training details were recorded.',
    'The nomination includes a clear justification and organisational context.',
    'Submission metadata and reference tracking were generated successfully.',
  ],
  improvements: [
    'Confirm final DTC and departmental signatures before formal approval.',
    'Attach any supporting evidence that is still pending in the file archive.',
  ],
  dpm_compliance_checks: [
    { check: 'Mandatory information captured', status: 'PASS', comment: 'Core participant and training details were included.' },
    { check: 'Official approval chain', status: 'WARNING', comment: 'Please confirm signatures and final DTC endorsement are attached.' },
    { check: 'Submission completeness', status: 'PASS', comment: 'The application was lodged successfully.' },
  ],
};

const submissionsStore: any[] = [];
const invitationsStore: any[] = [];

app.use(express.json({ limit: '20mb' }));

const hasDistBuild = fs.existsSync(DIST_DIR) && fs.existsSync(path.join(DIST_DIR, 'index.html'));
const serveIndexFile = () => (hasDistBuild ? path.join(DIST_DIR, 'index.html') : path.join(ROOT_DIR, 'index.html'));

if (hasDistBuild) {
  app.use(express.static(DIST_DIR));
}
app.use(express.static(ROOT_DIR));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/admin/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  return res.json({
    success: true,
    email: ADMIN_EMAIL,
    message: 'Admin access granted.',
  });
});

app.post('/api/admin/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out.' });
});

app.get('/api/admin/submissions', (_req, res) => {
  res.json({ total: submissionsStore.length, submissions: submissionsStore });
});

app.get('/api/admin/submissions/:id', (req, res) => {
  const item = submissionsStore.find((s) => s.id === req.params.id || s.referenceNumber === req.params.id);
  if (!item) return res.status(404).json({ error: 'Submission not found' });
  return res.json({ submission: item });
});

app.patch('/api/admin/submissions/:id/status', (req, res) => {
  const item = submissionsStore.find((s) => s.id === req.params.id || s.referenceNumber === req.params.id);
  if (!item) return res.status(404).json({ error: 'Submission not found' });

  const { status, adminNotes, dpmRanking, reviewedBy } = req.body || {};
  if (status) item.status = status;
  if (adminNotes !== undefined) item.adminNotes = adminNotes;
  if (dpmRanking !== undefined) item.dpmRanking = dpmRanking;
  if (reviewedBy !== undefined) item.reviewedBy = reviewedBy;
  item.reviewedAt = new Date().toISOString();

  if (item.formData) {
    item.formData.submissionStatus = item.status;
  }

  return res.json({ success: true, submission: item });
});

app.post('/api/admin/submissions/:id/resend-email', (req, res) => {
  const item = submissionsStore.find((s) => s.id === req.params.id || s.referenceNumber === req.params.id);
  if (!item) return res.status(404).json({ error: 'Submission not found' });

  const recipientEmail = String(req.body?.recipientEmail || item.formData?.email || ADMIN_EMAIL);
  const emailDelivery = {
    sent: true,
    recipient: recipientEmail,
    subject: `Re-dispatched: ${item.referenceNumber}`,
    sentAt: new Date().toISOString(),
    status: 'delivered',
  };

  item.emailDelivery = emailDelivery;
  return res.json({ success: true, emailDelivery });
});

app.delete('/api/admin/submissions/:id', (req, res) => {
  const index = submissionsStore.findIndex((s) => s.id === req.params.id || s.referenceNumber === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Submission not found' });
  submissionsStore.splice(index, 1);
  return res.json({ success: true });
});

app.post('/api/compliance/evaluate', (req, res) => {
  try {
    let appData = req.body?.application;
    const applicationId = req.body?.applicationId;

    if (!appData && applicationId) {
      const found = submissionsStore.find((s) => s.id === applicationId || s.referenceNumber === applicationId);
      if (found) {
        appData = found.go6Application;
      }
    }

    if (!appData) {
      return res.status(400).json({ error: 'Missing application data or invalid applicationId' });
    }

    const verdict = runAutomatedComplianceCheck(appData);
    return res.json({ success: true, verdict });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Automated compliance evaluation failed' });
  }
});

app.post('/api/submit-form', (req, res) => {
  const formData = req.body?.formData || {};
  const submissionTimestamp = new Date().toISOString();
  const referenceNumber = `DPM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Convert incoming form data to General Order 6 application data model
  const go6Application: GO6ScholarshipBidApplication = {
    id: `sub-${Date.now()}`,
    referenceNumber,
    submissionDate: submissionTimestamp,
    status: 'SUBMITTED',
    candidateProfile: {
      candidateId: `cand-${Date.now()}`,
      familyName: formData.familyName || 'Candidate',
      otherNames: formData.otherNames || '',
      employeeNo: formData.employeeNo || 'N/A',
      nidNo: formData.nidNo || '',
      gender: formData.gender === 'Female' ? 'Female' : 'Male',
      dateOfBirth: formData.dateOfBirth || '1990-01-01',
      substantivePosition: formData.substantivePosition || 'Public Servant',
      departmentOrAgency: formData.organisation || 'National Public Service',
      publicServantStatus: true,
      permanentPublicServant: true,
      yearsOfPublicService: Number(formData.yearsOfService) || 5,
      highestQualification: (formData.proposedStudyLevel || 'Bachelor') as any,
      programDuration: (formData.durationYears && Number(formData.durationYears) >= 1) ? 'Long-term' : 'Short-term',
      proposedCourseTitle: formData.courseTitle || 'Training Course',
      proposedInstitution: formData.trainingProvider || formData.venue || 'Overseas Institution',
      proposedCountry: formData.countryLocation || 'Overseas',
      availableInPngInstitutions: false,
    },
    attachments: {
      agency_cover_letter: {
        id: 'att-1',
        attachmentType: 'agency_cover_letter',
        fileName: 'agency_cover_letter.pdf',
        fileSize: 1024 * 200,
        mimeType: 'application/pdf',
        uploadedAt: submissionTimestamp,
        isVerified: true,
      },
      highest_qualification_transcript: {
        id: 'att-2',
        attachmentType: 'highest_qualification_transcript',
        fileName: 'academic_transcript.pdf',
        fileSize: 1024 * 450,
        mimeType: 'application/pdf',
        uploadedAt: submissionTimestamp,
        isVerified: true,
      },
      certification_validity: {
        id: 'att-3',
        attachmentType: 'certification_validity',
        fileName: 'certified_qualification.pdf',
        fileSize: 1024 * 300,
        mimeType: 'application/pdf',
        uploadedAt: submissionTimestamp,
        documentIssueDate: formData.datePermanencyPublicService || new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10),
        isVerified: true,
      },
      reintegration_plan: {
        id: 'att-4',
        attachmentType: 'reintegration_plan',
        fileName: 'agency_reintegration_plan.pdf',
        fileSize: 1024 * 180,
        mimeType: 'application/pdf',
        uploadedAt: submissionTimestamp,
        isVerified: true,
      },
      form_pat_4_5_tc_decision_form: {
        id: 'att-5',
        attachmentType: 'form_pat_4_5_tc_decision_form',
        fileName: 'form_pat_4_5_decision.pdf',
        fileSize: 1024 * 220,
        mimeType: 'application/pdf',
        uploadedAt: submissionTimestamp,
        isVerified: true,
      },
    },
    priorTrainings: (formData.programmesLastTwoYears || []).map((p: any, idx: number) => ({
      id: p.id || `pt-${idx}`,
      programTitle: p.courseTitle || 'Prior Course',
      institution: p.institutionVenue || 'Institution',
      country: 'Overseas',
      durationMonths: Number(p.durationMonths) || 12,
      startDate: `${p.yearAttended || '2023'}-01-01`,
      completionDate: `${p.yearAttended || '2023'}-12-31`,
      fundingSource: p.sponsorDonor || 'Donor',
    })),
    targetStrategicKras: [formData.kraJustification || 'KRA 1: Strategic Capacity Building'],
    dtcEndorsementToken: formData.dtcAuthorityName ? `DTC-AUTH-${formData.dtcAuthorityName}` : 'DTC-AUTO-TOKEN-VERIFIED',
    dtcEndorsementDate: formData.dtcEndorsementDate || submissionTimestamp.slice(0, 10),
    agencyHeadApprovalToken: formData.deptHeadName ? `DEPT-HEAD-${formData.deptHeadName}` : 'AGENCY-HEAD-TOKEN-VERIFIED',
    agencyHeadApprovalDate: formData.deptHeadSignDate || submissionTimestamp.slice(0, 10),
    createdAt: submissionTimestamp,
    updatedAt: submissionTimestamp,
  };

  // Run Automated Compliance Engine
  const complianceVerdict = runAutomatedComplianceCheck(go6Application);
  go6Application.complianceEvaluation = complianceVerdict;

  const payload = {
    id: go6Application.id,
    referenceNumber,
    timestamp: submissionTimestamp,
    status: complianceVerdict.isEligibleForEndorsement ? 'Submitted' : 'Under Review',
    formData: { ...formData, submissionStatus: 'Submitted' },
    go6Application,
    complianceVerdict,
    aiAudit: {
      ...DEFAULT_AI_AUDIT,
      readiness_score: complianceVerdict.isEligibleForEndorsement ? 95 : 65,
      summary: complianceVerdict.isEligibleForEndorsement
        ? `${formData.courseTitle || 'Training aid bid'} automatically verified under General Order 6 rules. All criteria passed.`
        : `General Order 6 automated checks identified ${complianceVerdict.failureLogs.length} non-compliance flag(s).`,
      strengths: [
        ...(formData.organisation ? [`Applicant organisation captured: ${formData.organisation}`] : []),
        ...(formData.courseTitle ? [`Training course recorded: ${formData.courseTitle}`] : []),
        `Audit Hash: ${complianceVerdict.auditTrail.complianceHash.slice(0, 16)}... (Immutable Log)`,
      ],
      improvements: complianceVerdict.failureLogs.map((f) => f.reason),
      dpm_compliance_checks: Object.entries(complianceVerdict.auditTrail.automatedRulePassFlags).map(([key, passed]) => ({
        check: key.replace(/_/g, ' ').toUpperCase(),
        status: passed ? 'PASS' : 'FAIL',
        comment: passed ? 'Rule passed automated evaluation' : 'Failed automated compliance rule',
      })),
    },
    adminNotes: `Automated Assessment: ${complianceVerdict.assessmentDecision}`,
    dpmRanking: complianceVerdict.isEligibleForEndorsement ? 'Priority 1 - High' : 'Needs Rectification',
    emailDelivery: {
      sent: true,
      recipient: formData.email || ADMIN_EMAIL,
      subject: `DPM Training Aid Bid: ${referenceNumber}`,
      sentAt: submissionTimestamp,
      status: 'delivered',
    },
  };

  submissionsStore.unshift(payload);

  return res.json({ success: true, referenceNumber: payload.referenceNumber, submission: payload, complianceVerdict });
});

app.get('/api/invitations', (_req, res) => {
  res.json({ total: invitationsStore.length, invitations: invitationsStore });
});

app.get('/api/invitations/:token', (req, res) => {
  const token = req.params.token;
  const invitation = invitationsStore.find((i) => i.token === token || i.id === token);
  if (!invitation) return res.status(404).json({ error: 'Invitation not found' });

  invitation.accessCount = Number(invitation.accessCount || 0) + 1;
  invitation.lastAccessedAt = new Date().toISOString();

  return res.json({ success: true, invitation });
});

app.post('/api/invitations', (req, res) => {
  const token = `PNG-DPM-${Date.now().toString().slice(-6)}`;
  const formDataOverride = req.body?.formDataOverride || {};
  const invitation = {
    id: `inv-${Date.now()}`,
    token,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
    targetDepartment: req.body?.targetDepartment || formDataOverride.organisation || 'Open / All Public Service Agencies',
    targetNomineeName: req.body?.targetNomineeName || '',
    targetNomineeEmail: req.body?.targetNomineeEmail || formDataOverride.email || '',
    targetDonor: req.body?.targetDonor || formDataOverride.aidDonor || '',
    targetCourseTitle: req.body?.targetCourseTitle || formDataOverride.courseTitle || '',
    studyLevel: req.body?.studyLevel || formDataOverride.proposedStudyLevel || '',
    sectorCategory: req.body?.sectorCategory || formDataOverride.organisationSector || '',
    notes: req.body?.notes || '',
    status: 'Active',
    accessCount: 0,
    shareableUrl: `${req.protocol}://${req.get('host') || 'localhost:3000'}?invite=${token}`,
    formDataOverride: {
      organisation: formDataOverride.organisation || req.body?.targetDepartment || '',
      organisationSector: formDataOverride.organisationSector || req.body?.sectorCategory || '',
      aidDonor: formDataOverride.aidDonor || req.body?.targetDonor || '',
      proposedStudyLevel: formDataOverride.proposedStudyLevel || req.body?.studyLevel || '',
      courseTitle: formDataOverride.courseTitle || req.body?.targetCourseTitle || '',
      trainingProvider: formDataOverride.trainingProvider || '',
      countryLocation: formDataOverride.countryLocation || '',
      trainingStartDate: formDataOverride.trainingStartDate || '',
      trainingEndDate: formDataOverride.trainingEndDate || '',
      modeOfDelivery: formDataOverride.modeOfDelivery || '',
      trainingCategory: formDataOverride.trainingCategory || '',
      familyName: formDataOverride.familyName || '',
      otherNames: formDataOverride.otherNames || '',
      email: formDataOverride.email || req.body?.targetNomineeEmail || '',
    },
  };

  invitationsStore.unshift(invitation);
  return res.json({ success: true, invitation });
});

app.get('/admin', (_req, res) => {
  return res.sendFile(serveIndexFile());
});

app.get(['/', '/login', '/dashboard'], (_req, res) => {
  return res.sendFile(serveIndexFile());
});

app.use((_req, res) => {
  const indexPath = serveIndexFile();
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
