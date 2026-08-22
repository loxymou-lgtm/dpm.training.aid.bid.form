import { DPMBidFormData } from "../types";

export interface ValidationError {
  sectionNumber: number;
  sectionName: string;
  stepIndex: number;
  fieldKey: keyof DPMBidFormData;
  fieldName: string;
  message: string;
}

export interface ValidationSummary {
  isValid: boolean;
  errors: ValidationError[];
  completedSectionsCount: number;
  totalSectionsCount: number;
  percentage: number;
}

export const validateDPMBidForm = (formData: DPMBidFormData): ValidationSummary => {
  const errors: ValidationError[] = [];

  // Helper
  const check = (
    condition: boolean,
    sectionNumber: number,
    sectionName: string,
    stepIndex: number,
    fieldKey: keyof DPMBidFormData,
    fieldName: string,
    message: string
  ) => {
    if (!condition) {
      errors.push({
        sectionNumber,
        sectionName,
        stepIndex,
        fieldKey,
        fieldName,
        message,
      });
    }
  };

  // Section 1: Organisation
  check(Boolean(formData.organisation?.trim()), 1, "Organisation", 0, "organisation", "Organisation / Department", "Organisation name is required.");
  check(Boolean(formData.postalAddress?.trim()), 1, "Organisation", 0, "postalAddress", "Postal Address", "Departmental postal address is required.");

  // Section 2: Organisation Sector
  check(Boolean(formData.organisationSector?.trim()), 2, "Organisation Sector", 0, "organisationSector", "Organisation Sector Category", "Public sector classification is required.");

  // Section 3: Aid Donor & Venue
  check(Boolean(formData.aidDonor?.trim()), 3, "Aid Donor & Venue", 1, "aidDonor", "Aid Donor", "Aid donor name is required.");
  check(Boolean(formData.venue?.trim()), 3, "Aid Donor & Venue", 1, "venue", "Venue / Institution & Country", "Venue institution and country is required.");

  // Section 4: Course Duration
  const hasDuration = Boolean(formData.durationYears || formData.durationMonths || formData.durationWeeks);
  check(hasDuration, 4, "Course Duration", 1, "durationYears", "Course Duration", "Duration in years, months or weeks is required.");
  check(Boolean(formData.durationFromDate?.trim()), 4, "Course Duration", 1, "durationFromDate", "Commencement Date", "Commencement date (DD/MM/YYYY) is required.");
  check(Boolean(formData.durationToDate?.trim()), 4, "Course Duration", 1, "durationToDate", "Completion Date", "Completion date (DD/MM/YYYY) is required.");

  // Section 5: Personal Particulars
  check(Boolean(formData.familyName?.trim()), 5, "Personal Particulars", 2, "familyName", "Family Name", "Nominee family name is required.");
  check(Boolean(formData.otherNames?.trim()), 5, "Personal Particulars", 2, "otherNames", "Other Names", "Nominee given names are required.");
  check(Boolean(formData.employeeNo?.trim()), 5, "Personal Particulars", 2, "employeeNo", "Public Service Employee No", "Public service payroll employee number is required.");
  check(Boolean(formData.gender), 5, "Personal Particulars", 2, "gender", "Gender", "Gender selection is required.");
  check(Boolean(formData.dateOfBirth?.trim()), 5, "Personal Particulars", 2, "dateOfBirth", "Date of Birth", "Date of birth (DD/MM/YYYY) is required.");
  check(Boolean(formData.substantivePosition?.trim()), 5, "Personal Particulars", 2, "substantivePosition", "Substantive Position", "Substantive position title is required.");
  check(Boolean(formData.contactAddress?.trim()), 5, "Personal Particulars", 2, "contactAddress", "Residential / Contact Address", "Physical contact address is required.");
  check(Boolean(formData.telephone?.trim() || formData.mobile?.trim()), 5, "Personal Particulars", 2, "telephone", "Contact Phone", "Telephone or mobile number is required.");
  check(Boolean(formData.email?.trim()), 5, "Personal Particulars", 2, "email", "Email Address", "Contact email address is required.");
  check(Boolean(formData.provinceDistrictWorking?.trim()), 5, "Personal Particulars", 2, "provinceDistrictWorking", "Province / District", "Working location province and district is required.");

  // Section 6: Emergency Contact
  check(Boolean(formData.emergencyName?.trim()), 6, "Emergency Contact", 2, "emergencyName", "Emergency Contact Name", "Emergency contact name is required.");
  check(Boolean(formData.emergencyPhone?.trim()), 6, "Emergency Contact", 2, "emergencyPhone", "Emergency Contact Phone", "Emergency contact phone is required.");

  // Section 7: Secondary Education
  check(Boolean(formData.secondaryQualificationType), 7, "Secondary Education", 3, "secondaryQualificationType", "Secondary Qualification Type", "Secondary qualification level is required.");
  check(Boolean(formData.highestGradeCompleted?.trim()), 7, "Secondary Education", 3, "highestGradeCompleted", "Highest Grade Completed", "Highest school grade completed is required.");

  // Section 8: Educational Qualifications
  check(Boolean(formData.qualifications && formData.qualifications.length > 0), 8, "Educational Qualifications", 3, "qualifications", "Tertiary Qualifications", "At least one educational/tertiary qualification entry is required.");

  // Section 9: Current Job Description
  check(Boolean(formData.currentJobDescription?.trim() && formData.currentJobDescription.length >= 20), 9, "Current Job Description", 4, "currentJobDescription", "Current Job Description", "Detailed job description (min 20 chars) is required.");

  // Section 10: Training Needs Identification
  check(Boolean(formData.trainingNeedsIdentification?.trim() && formData.trainingNeedsIdentification.length >= 20), 10, "Training Needs Identification", 4, "trainingNeedsIdentification", "Training Needs Statement", "Training needs identification (min 20 chars) is required.");

  // Section 11: Reintegration Plan
  check(Boolean(formData.reintegrationPlan?.trim() && formData.reintegrationPlan.length >= 20), 11, "Reintegration Plan", 4, "reintegrationPlan", "Reintegration Plan", "Post-training reintegration plan (min 20 chars) is required.");

  // Section 12: Description of Proposed Programme
  check(Boolean(formData.descriptionOfProposedProgramme?.trim() && formData.descriptionOfProposedProgramme.length >= 20), 12, "Description of Proposed Programme", 4, "descriptionOfProposedProgramme", "Programme Curriculum Description", "Description of proposed training programme is required.");

  // Section 13: Targeted Position Upon Completion
  check(Boolean(formData.targetedPositionUponCompletion?.trim()), 13, "Targeted Position", 4, "targetedPositionUponCompletion", "Targeted Position", "Targeted post-study position title is required.");

  // Section 14: 2-Year Prior Programme
  check(Boolean(formData.hasAttendedProgrammeLastTwoYears), 14, "Prior Training Attendance", 4, "hasAttendedProgrammeLastTwoYears", "2-Year Prior Attendance Check", "Confirmation of 2-year prior training attendance status is required.");

  // Section 15: Justifications (KRAs & Priority Job Group)
  check(Boolean(formData.kraJustification?.trim() && formData.kraJustification.length >= 20), 15, "Justification (KRA)", 5, "kraJustification", "Key Result Area (KRA) Alignment", "Justification against Key Result Areas is required.");
  check(Boolean(formData.priorityJobGroupJustification?.trim() && formData.priorityJobGroupJustification.length >= 20), 15, "Justification (Priority Job Group)", 5, "priorityJobGroupJustification", "Priority Job Group Alignment", "Justification for Priority Job Group is required.");

  // Section 16: DTC Endorsement
  check(Boolean(formData.dtcAuthorityName?.trim()), 16, "DTC Endorsement", 5, "dtcAuthorityName", "DTC Authority Name", "DTC Chairperson / Authority Name is required.");
  check(Boolean(formData.dtcAuthorityTitle?.trim()), 16, "DTC Endorsement", 5, "dtcAuthorityTitle", "DTC Authority Title", "DTC Authority Official Title is required.");

  // Section 17: Departmental Head Signature
  check(Boolean(formData.deptHeadName?.trim()), 17, "Departmental Head Sign-off", 6, "deptHeadName", "Departmental Head Name", "Departmental Head / Delegate Name is required.");
  check(Boolean(formData.deptHeadDesignation), 17, "Departmental Head Sign-off", 6, "deptHeadDesignation", "Authority Capacity", "Departmental Head designation is required.");

  // Action Officer
  check(Boolean(formData.actionOfficerName?.trim()), 18, "Action Officer Particulars", 6, "actionOfficerName", "Action Officer Name", "Action Officer Name is required.");
  check(Boolean(formData.actionOfficerTelephone?.trim()), 18, "Action Officer Particulars", 6, "actionOfficerTelephone", "Action Officer Telephone", "Action Officer telephone contact is required.");

  const totalSectionsCount = 17;
  // Calculate distinct sections that have zero errors
  const failedSections = new Set(errors.map((e) => e.sectionNumber));
  const completedSectionsCount = Math.max(0, totalSectionsCount - failedSections.size);
  const percentage = Math.round((completedSectionsCount / totalSectionsCount) * 100);

  return {
    isValid: errors.length === 0,
    errors,
    completedSectionsCount,
    totalSectionsCount,
    percentage,
  };
};
