export interface EducationalQualification {
  id: string;
  institution: string;
  year: string;
  courses: string;
  qualifications: string;
}

export interface PriorTrainingProgramme {
  id: string;
  courseTitle: string;
  institutionVenue: string;
  durationMonths: string;
  yearAttended: string;
  sponsorDonor: string;
}

export interface DPMBidFormData {
  // Metadata & Header
  bidYear: string;
  proposedStudyLevel: string; // e.g., Certificate, Diploma, Bachelor, Postgraduate Diploma, Masters, PhD, Short Course, Attachment
  courseTitle: string;
  familyName: string;
  otherNames: string;

  // DPM Use Only
  dpmSectorCategory: string;
  dpmPreliminaryRank: string;

  // 1. Organisation
  organisation: string;
  postalAddress: string;

  // 2. Organisation Sector
  organisationSector: string;

  // 3. Aid Donor, Provider & Venue
  aidDonor: string;
  venue: string;
  trainingProvider?: string;
  countryLocation?: string;
  trainingStartDate?: string;
  trainingEndDate?: string;
  modeOfDelivery?: "Face-to-face" | "Online" | "Hybrid" | "";
  trainingCategory?: "Professional Development" | "Technical Training" | "Leadership and Management" | "Academic / Qualification" | "Other" | "";

  // 4. Course Duration
  durationYears: string;
  durationMonths: string;
  durationWeeks: string;
  durationFromDate: string; // DD/MM/YYYY
  durationToDate: string; // DD/MM/YYYY

  // 5. Personal Particulars
  employeeNo: string;
  age: string;
  gender: "Male" | "Female" | "Other" | "";
  dateOfBirth: string; // DD/MM/YYYY
  nidNo: string;
  dateCommencedCurrentJob: string; // DD/MM/YYYY
  datePermanencyPublicService: string; // DD/MM/YYYY
  substantivePosition: string;
  actingPosition: string;
  contactAddress: string;
  telephone: string;
  mobile: string;
  email: string;
  provinceDistrictWorking: string;

  // 6. Emergency Contact
  emergencyName: string;
  emergencyAddress: string;
  emergencyPhone: string;
  emergencyEmail: string;
  emergencyRelationship: string;

  // 7. Secondary Education
  secondaryQualificationType: "Grade Ten" | "Grade Twelve or Above" | "";
  highestGradeCompleted: string;
  provincialHighSchoolAttended: string;

  // 8. Educational Qualifications (Table)
  qualifications: EducationalQualification[];

  // 9. Current Job Description
  currentJobDescription: string;

  // 10. Training Needs Identification
  trainingNeedsIdentification: string;

  // 11. Reintegration Plan
  reintegrationPlan: string;

  // 12. Description of Proposed Programme
  descriptionOfProposedProgramme: string;
  courseBrochureFileName?: string;

  // 13. Targeted Position Upon Completion
  targetedPositionUponCompletion: string;

  // 14. Details of Any Programme (> 9 months) in last 2 years
  hasAttendedProgrammeLastTwoYears: "NO" | "YES";
  programmesLastTwoYears: PriorTrainingProgramme[];
  priorProgrammeDetailsNote: string;

  // 15. Justification of Nomination
  kraJustification: string;
  priorityJobGroupJustification: string;

  // 16. Endorsement by Departmental Training Committee (DTC)
  dtcEndorsement: "YES" | "NO" | "";
  dtcAuthorityName: string;
  dtcAuthorityTitle: string;
  dtcSignatureDataUrl: string;
  dtcEndorsementDate: string;

  // 17. Signature of Respective Departmental Head / Delegate
  deptHeadName: string;
  deptHeadDesignation: "Agency Head" | "Delegate";
  deptHeadDelegationEvidenceNote: string;
  deptHeadSignatureDataUrl: string;
  deptHeadSignDate: string;

  // Action Officer Details
  actionOfficerName: string;
  actionOfficerTitle: string;
  actionOfficerTelephone: string;
  actionOfficerEmail: string;

  // Timestamps, submission state & versioning
  lastUpdated?: string;
  id?: string;
  savedTitle?: string;
  submissionStatus?: SubmissionStatus;
  submissionReferenceNumber?: string;
  submissionTimestamp?: string;
  submittedByEmail?: string;
  invitationToken?: string;
}

export interface ParticipantInvitation {
  id: string;
  token: string;
  shareableUrl: string;
  createdAt: string;
  expiresAt?: string;
  targetDepartment: string;
  targetNomineeName?: string;
  targetNomineeEmail?: string;
  targetDonor?: string;
  targetCourseTitle?: string;
  studyLevel?: string;
  sectorCategory?: string;
  notes?: string;
  status: "Active" | "Completed" | "Expired";
  submissionReference?: string;
  accessCount: number;
  lastAccessedAt?: string;
  formDataOverride?: Partial<DPMBidFormData>;
}

export type SubmissionStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "DPM Endorsed"
  | "Approved"
  | "Flagged"
  | "Rejected";

export interface AIReviewResult {
  readiness_score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  sector_priority_match?: string;
  justification_completeness_score?: number;
  strategic_recommendations?: string[];
  dpm_compliance_checks: {
    check: string;
    status: "PASS" | "WARNING" | "FAIL";
    comment: string;
  }[];
}

export interface AdminRecipient {
  name: string;
  email: string;
  role: string;
  status?: "delivered" | "simulated" | "pending" | "failed";
}

export const DPM_DESIGNATED_ADMINS: AdminRecipient[] = [
  {
    name: "Lawrence Mou",
    email: "lmou@dpm.gov.pg",
    role: "Training Aid Coordinator",
  },
  {
    name: "Eileen Wahee",
    email: "eileen.wahee@dpm.gov.pg",
    role: "Scholarship Administrator",
  },
  {
    name: "Agnes Tamate",
    email: "agnes.tamate@dpm.gov.pg",
    role: "DPM Secretariat",
  },
];

export interface EmailDeliveryInfo {
  sent: boolean;
  recipient: string;
  recipients?: AdminRecipient[];
  subject: string;
  sentAt: string;
  messageId?: string;
  previewHtml?: string;
  hasAttachment: boolean;
  status: "delivered" | "simulated" | "failed";
  providerMessage?: string;
}

export interface DPMSubmissionRecord {
  id: string;
  referenceNumber: string;
  timestamp: string;
  status: SubmissionStatus;
  formData: DPMBidFormData;
  aiAudit?: AIReviewResult;
  pdfBase64?: string;
  emailDelivery: EmailDeliveryInfo;
  adminNotes?: string;
  dpmRanking?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}
