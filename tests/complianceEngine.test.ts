import assert from 'node:assert/strict';
import {
  runAutomatedComplianceCheck,
  verifyCertificationValidity,
  calculateTrainingFrequencyGap,
  computeComplianceAuditHash,
  MANDATORY_ATTACHMENTS,
} from '../src/services/complianceEngine';
import { matchLocalPNGInstitutionCourse } from '../src/data/pngInstitutionsCatalog';
import {
  GO6ScholarshipBidApplication,
  AttachmentMetadata,
  PriorAcademicTrainingRecord,
} from '../src/types/generalOrder6';

console.log('------------------------------------------------------------');
console.log('Running General Order 6 Automated Compliance Engine Tests...');
console.log('------------------------------------------------------------');

const nowIso = '2026-09-12T12:00:00.000Z';

function createMockAttachment(
  type: AttachmentMetadata['attachmentType'],
  issueDate?: string
): AttachmentMetadata {
  return {
    id: `att-${type}-1`,
    attachmentType: type,
    fileName: `${type}_official_doc.pdf`,
    fileSize: 1024 * 350,
    mimeType: 'application/pdf',
    uploadedAt: nowIso,
    documentIssueDate: issueDate,
    isVerified: true,
  };
}

function createBaseMockApplication(): GO6ScholarshipBidApplication {
  const attachments: GO6ScholarshipBidApplication['attachments'] = {
    agency_cover_letter: createMockAttachment('agency_cover_letter'),
    highest_qualification_transcript: createMockAttachment('highest_qualification_transcript'),
    certification_validity: createMockAttachment('certification_validity', '2025-11-15'), // ~10 months old (valid < 2 years)
    reintegration_plan: createMockAttachment('reintegration_plan'),
    form_pat_4_5_tc_decision_form: createMockAttachment('form_pat_4_5_tc_decision_form'),
  };

  return {
    id: 'APP-2026-DPM-0891',
    referenceNumber: 'DPM-GO6-2026-0891',
    submissionDate: nowIso,
    status: 'SUBMITTED',
    candidateProfile: {
      candidateId: 'CAND-001',
      familyName: 'Kila',
      otherNames: 'Gari David',
      employeeNo: 'PS-89210',
      nidNo: 'PNG-NID-992140',
      gender: 'Male',
      dateOfBirth: '1989-05-14',
      substantivePosition: 'Senior Policy Analyst - Bilateral Aid',
      departmentOrAgency: 'Department of Personnel Management',
      publicServantStatus: true,
      permanentPublicServant: true,
      yearsOfPublicService: 8,
      highestQualification: 'Bachelor',
      programDuration: 'Long-term',
      proposedCourseTitle: 'Master of Geothermal Reservoir Engineering',
      proposedInstitution: 'University of Auckland',
      proposedCountry: 'New Zealand',
      availableInPngInstitutions: false,
    },
    attachments,
    priorTrainings: [
      {
        id: 'prior-1',
        programTitle: 'Certificate in Advanced Policy Drafting',
        institution: 'SILAG',
        country: 'Papua New Guinea',
        durationMonths: 3, // short duration, <= 9 months
        startDate: '2025-01-10',
        completionDate: '2025-04-10',
        fundingSource: 'GoPNG',
      },
    ],
    targetStrategicKras: ['KRA 1: Public Sector Reform & Good Governance', 'MTDP IV Strategic Priority 3'],
    dtcEndorsementToken: 'DTC-STAMP-DPM-2026-081',
    dtcEndorsementDate: '2026-08-20',
    agencyHeadApprovalToken: 'SEC-DPM-APPRV-8823',
    agencyHeadApprovalDate: '2026-08-25',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

let passedTests = 0;

// =========================================================================
// TEST 1: Fully Compliant Candidate Evaluation
// =========================================================================
(() => {
  console.log('TEST 1: Evaluating fully compliant application...');
  const app = createBaseMockApplication();
  const verdict = runAutomatedComplianceCheck(app);

  assert.equal(
    verdict.assessmentDecision,
    'Meets all requirements',
    'Decision must be "Meets all requirements"'
  );
  assert.equal(verdict.isEligibleForEndorsement, true);
  assert.equal(verdict.failureLogs.filter((f) => f.severity === 'FATAL').length, 0);
  assert.equal(verdict.auditTrail.complianceHash.length, 64);
  assert.equal(verdict.auditTrail.automatedRulePassFlags['public_servant_status'], true);
  assert.equal(verdict.auditTrail.automatedRulePassFlags['permanent_public_servant'], true);
  assert.equal(verdict.auditTrail.automatedRulePassFlags['all_mandatory_documents_present'], true);
  assert.equal(verdict.auditTrail.automatedRulePassFlags['certification_within_validity_period'], true);
  assert.equal(verdict.auditTrail.automatedRulePassFlags['completed_two_year_gap'], true);
  assert.equal(verdict.auditTrail.automatedRulePassFlags['endorsed_by_dtc'], true);

  console.log('âœ“ TEST 1 PASSED: Fully compliant application approved automatically.\n');
  passedTests++;
})();

// =========================================================================
// TEST 2: File Integrity Engine - Missing Mandatory Document
// =========================================================================
(() => {
  console.log('TEST 2: File Integrity Engine - Missing reintegration plan...');
  const app = createBaseMockApplication();
  // Simulate missing reintegration plan
  app.attachments.reintegration_plan = null;

  const verdict = runAutomatedComplianceCheck(app);

  assert.equal(
    verdict.assessmentDecision,
    'Does not meet most of the requirements',
    'Decision must be rejected if document missing'
  );
  assert.equal(verdict.isEligibleForEndorsement, false);
  assert.equal(verdict.auditTrail.automatedRulePassFlags['all_mandatory_documents_present'], false);
  assert.equal(verdict.auditTrail.automatedRulePassFlags['doc_reintegration_plan'], false);

  const missingDocError = verdict.failureLogs.find((f) => f.code === 'GO6-DOC-ERR');
  assert.ok(missingDocError, 'Must record GO6-DOC-ERR failure log');
  assert.ok(verdict.assessmentReasons.some((r) => r.toLowerCase().includes('reintegration plan')));

  console.log('âœ“ TEST 2 PASSED: Missing mandatory document programmatically caught.\n');
  passedTests++;
})();

// =========================================================================
// TEST 3: Certification Expiry Validation (> 2 Years Old)
// =========================================================================
(() => {
  console.log('TEST 3: Date & Expiry Engine - Expired certified qualification...');
  const app = createBaseMockApplication();
  // Set certification issue date to 3 years before submission date (expired)
  app.attachments.certification_validity = createMockAttachment(
    'certification_validity',
    '2023-01-10' // > 3.5 years old
  );

  const certCheck = verifyCertificationValidity(
    app.attachments.certification_validity,
    app.submissionDate
  );
  assert.equal(certCheck.isValid, false);
  assert.ok(certCheck.reason?.includes('exceeds the 2-year'));

  const verdict = runAutomatedComplianceCheck(app);
  assert.equal(verdict.assessmentDecision, 'Does not meet most of the requirements');
  assert.equal(verdict.auditTrail.automatedRulePassFlags['certification_within_validity_period'], false);
  assert.ok(verdict.failureLogs.some((f) => f.code === 'GO6-CERT-EXPIRED'));

  console.log('âœ“ TEST 3 PASSED: Expired certification (> 2 years) automatically rejected.\n');
  passedTests++;
})();

// =========================================================================
// TEST 4: Training Frequency Check - 2-Year Stand-down Gap Rule
// =========================================================================
(() => {
  console.log('TEST 4: Training Frequency Engine - Prior study >9 months completed 10 months ago...');
  const app = createBaseMockApplication();
  const priorTrainingLong: PriorAcademicTrainingRecord = {
    id: 'prior-long-1',
    programTitle: 'Master of Public Administration',
    institution: 'Australian National University (ANU)',
    country: 'Australia',
    durationMonths: 18, // > 9 months
    startDate: '2024-01-15',
    completionDate: '2025-11-30', // Only ~9.5 months ago relative to 2026-09-12 (< 24 months)
    fundingSource: 'Australia Awards',
  };
  app.priorTrainings = [priorTrainingLong];

  const gapResult = calculateTrainingFrequencyGap(app.priorTrainings, app.submissionDate);
  assert.equal(gapResult.completedTwoYearGap, false);
  assert.ok(gapResult.reason?.includes('mandatory 2.0 years gap required'));

  const verdict = runAutomatedComplianceCheck(app);
  assert.equal(verdict.assessmentDecision, 'Does not meet most of the requirements');
  assert.equal(verdict.auditTrail.automatedRulePassFlags['completed_two_year_gap'], false);
  assert.ok(verdict.failureLogs.some((f) => f.code === 'GO6-GAP-VIOLATION'));

  console.log('âœ“ TEST 4 PASSED: 2-year post-training stand-down gap violation flagged.\n');
  passedTests++;
})();

// =========================================================================
// TEST 5: Local PNG Institution Availability Cross-Referencing
// =========================================================================
(() => {
  console.log('TEST 5: Institution Qualification Check - Cross-referencing local PNG offerings...');

  // 1. Program available locally (Master of Public Administration at UPNG)
  const matched = matchLocalPNGInstitutionCourse('Master of Public Administration', 'Master');
  assert.ok(matched, 'Should match UPNG Master of Public Administration');
  assert.equal(matched?.courseId, 'PNG-UPNG-002');
  assert.equal(matched?.institutionName, 'University of Papua New Guinea');

  // 2. Program NOT available locally in PNG catalog
  const unmatched = matchLocalPNGInstitutionCourse('Doctor of Philosophy in Nuclear Astrophysics', 'PhD');
  assert.equal(unmatched, null, 'Specialized overseas course should not match PNG catalog');

  console.log('âœ“ TEST 5 PASSED: Domestic institution cross-referencing matched accurately.\n');
  passedTests++;
})();

// =========================================================================
// TEST 6: Cryptographic Audit Trail Chaining
// =========================================================================
(() => {
  console.log('TEST 6: Cryptographic Audit Trail Hash Consistency...');
  const flags = { ruleA: true, ruleB: false };
  const hash1 = computeComplianceAuditHash('APP-100', '2026-09-12', flags, 1);
  const hash2 = computeComplianceAuditHash('APP-100', '2026-09-12', flags, 1);
  const hashTampered = computeComplianceAuditHash('APP-100', '2026-09-12', { ...flags, ruleB: true }, 0);

  assert.equal(hash1, hash2, 'Identical evaluations must produce identical SHA-256 hash');
  assert.notEqual(hash1, hashTampered, 'Modified flags must alter the compliance audit hash');
  assert.equal(hash1.length, 64, 'Must be valid 64-char hex SHA-256 digest');

  console.log('âœ“ TEST 6 PASSED: Cryptographic audit trail hash integrity verified.\n');
  passedTests++;
})();

console.log('============================================================');
console.log(`ALL ${passedTests} INTEGRATION TESTS PASSED SUCCESSFULLY!`);
console.log('============================================================');
