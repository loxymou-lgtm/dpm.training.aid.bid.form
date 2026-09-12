/**
 * General Order 6 (GO6) Public Sector Overseas Training Nominations
 * Application Data Model & Automated Compliance Engine Schema
 */

export type ProgramDuration = 'Short-term' | 'Long-term';

export type HighestQualification =
  | 'High School'
  | 'Certificate'
  | 'Diploma'
  | 'Bachelor'
  | 'Postgraduate'
  | 'Master'
  | 'PhD';

export type CandidateGender = 'Male' | 'Female';

export type AssessmentDecision =
  | 'Meets all requirements'
  | 'Does not meet most of the requirements';

export type MandatoryAttachmentType =
  | 'agency_cover_letter'
  | 'highest_qualification_transcript'
  | 'certification_validity'
  | 'reintegration_plan'
  | 'form_pat_4_5_tc_decision_form';

export interface AttachmentMetadata {
  id: string;
  attachmentType: MandatoryAttachmentType;
  fileName: string;
  fileSize: number; // bytes
  mimeType: string;
  uploadedAt: string; // ISO 8601
  storageUrl?: string;
  sha256Checksum?: string;
  /**
   * For certification_validity: the certified / notarized date on the document
   * parsed via OCR or extracted from document metadata.
   */
  documentIssueDate?: string; // YYYY-MM-DD or ISO
  isVerified: boolean;
  verificationNotes?: string;
}

export interface PriorAcademicTrainingRecord {
  id: string;
  programTitle: string;
  institution: string;
  country: string;
  durationMonths: number;
  startDate: string; // YYYY-MM-DD
  completionDate: string; // YYYY-MM-DD
  fundingSource: string;
  qualificationAwarded?: string;
}

export interface CandidateProfileGO6 {
  candidateId: string;
  familyName: string;
  otherNames: string;
  employeeNo: string;
  nidNo?: string;
  gender: CandidateGender;
  dateOfBirth: string; // YYYY-MM-DD
  substantivePosition: string;
  departmentOrAgency: string;
  publicServantStatus: boolean;
  permanentPublicServant: boolean;
  yearsOfPublicService: number;
  highestQualification: HighestQualification;
  programDuration: ProgramDuration;
  proposedCourseTitle: string;
  proposedInstitution: string;
  proposedCountry: string;
  availableInPngInstitutions: boolean;
  matchedLocalCourseId?: string;
}

export interface EligibilityComplianceFlags {
  public_servant_status: boolean;
  permanent_public_servant: boolean;
  relevant_qualification_acquired: boolean;
  completed_two_year_gap: boolean;
  directly_relevant_to_duties: boolean;
  falls_under_govt_priority: boolean;
  endorsed_by_dtc: boolean;
  approved_by_head_or_delegate: boolean;
  all_mandatory_documents_present: boolean;
  certification_within_validity_period: boolean;
}

export interface ComplianceFailureLog {
  code: string;
  field: string;
  ruleTitle: string;
  severity: 'FATAL' | 'WARNING';
  reason: string;
  timestamp: string;
}

export interface AutomatedAuditTrail {
  systemVerificationTimestamp: string;
  complianceHash: string;
  automatedRulePassFlags: Record<string, boolean>;
  engineVersion: string;
  assessorVerificationMode: 'FULLY_AUTOMATED';
  evaluatedBy: string; // e.g. "DPM-GO6-Compliance-Engine-v2"
}

export interface AutomatedAssessmentVerdict {
  assessmentDecision: AssessmentDecision;
  assessmentReasons: string[];
  failureLogs: ComplianceFailureLog[];
  auditTrail: AutomatedAuditTrail;
  isEligibleForEndorsement: boolean;
  evaluatedAt: string;
}

export interface GO6ScholarshipBidApplication {
  id: string;
  referenceNumber: string;
  submissionDate: string; // ISO 8601
  status: 'DRAFT' | 'SUBMITTED' | 'AUTO_REJECTED' | 'AUTO_QUALIFIED' | 'DPM_ENDORSED';
  candidateProfile: CandidateProfileGO6;
  attachments: Record<MandatoryAttachmentType, AttachmentMetadata | null>;
  priorTrainings: PriorAcademicTrainingRecord[];
  targetStrategicKras: string[];
  dtcEndorsementToken?: string;
  dtcEndorsementDate?: string;
  agencyHeadApprovalToken?: string;
  agencyHeadApprovalDate?: string;
  complianceEvaluation?: AutomatedAssessmentVerdict;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

