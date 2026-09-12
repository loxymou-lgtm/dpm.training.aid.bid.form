/**
 * Papua New Guinea Accredited Tertiary & Public Sector Training Institution Course Catalog
 * Used by the GO6 Automated Compliance Engine to programmatically determine
 * whether a proposed overseas course is already available domestically.
 */

export interface PNGInstitutionCourse {
  courseId: string;
  courseTitle: string;
  institutionName: string;
  studyLevel: string;
  discipline: string;
  durationMonths: number;
  accreditedBy: string;
  keywords: string[];
}

export const PNG_INSTITUTIONS_CATALOG: PNGInstitutionCourse[] = [
  // University of Papua New Guinea (UPNG)
  {
    courseId: 'PNG-UPNG-001',
    courseTitle: 'Bachelor of Business and Public Policy Management',
    institutionName: 'University of Papua New Guinea',
    studyLevel: 'Bachelor',
    discipline: 'Public Administration',
    durationMonths: 48,
    accreditedBy: 'DHERST',
    keywords: ['business', 'public policy', 'management', 'administration', 'governance'],
  },
  {
    courseId: 'PNG-UPNG-002',
    courseTitle: 'Master of Public Administration',
    institutionName: 'University of Papua New Guinea',
    studyLevel: 'Master',
    discipline: 'Public Administration',
    durationMonths: 24,
    accreditedBy: 'DHERST',
    keywords: ['mpa', 'public administration', 'public sector', 'executive governance'],
  },
  {
    courseId: 'PNG-UPNG-003',
    courseTitle: 'Bachelor of Laws (LL.B)',
    institutionName: 'University of Papua New Guinea',
    studyLevel: 'Bachelor',
    discipline: 'Law',
    durationMonths: 48,
    accreditedBy: 'DHERST / Legal Training Institute',
    keywords: ['law', 'legal', 'jurisprudence', 'statutory drafting'],
  },
  {
    courseId: 'PNG-UPNG-004',
    courseTitle: 'Bachelor of Economics',
    institutionName: 'University of Papua New Guinea',
    studyLevel: 'Bachelor',
    discipline: 'Economics & Finance',
    durationMonths: 48,
    accreditedBy: 'DHERST',
    keywords: ['economics', 'econometrics', 'fiscal policy', 'public finance'],
  },
  {
    courseId: 'PNG-UPNG-005',
    courseTitle: 'Master of Economics and Public Policy',
    institutionName: 'University of Papua New Guinea',
    studyLevel: 'Master',
    discipline: 'Economics & Finance',
    durationMonths: 24,
    accreditedBy: 'DHERST',
    keywords: ['economics', 'public policy', 'development economics'],
  },

  // PNG University of Technology (PNGUOT - Lae)
  {
    courseId: 'PNG-UOT-001',
    courseTitle: 'Bachelor of Science in Information Technology',
    institutionName: 'Papua New Guinea University of Technology',
    studyLevel: 'Bachelor',
    discipline: 'Information Technology',
    durationMonths: 48,
    accreditedBy: 'DHERST',
    keywords: ['it', 'computer science', 'software engineering', 'networking', 'database'],
  },
  {
    courseId: 'PNG-UOT-002',
    courseTitle: 'Master of Science in Information Technology',
    institutionName: 'Papua New Guinea University of Technology',
    studyLevel: 'Master',
    discipline: 'Information Technology',
    durationMonths: 24,
    accreditedBy: 'DHERST',
    keywords: ['cybersecurity', 'cloud computing', 'distributed systems'],
  },
  {
    courseId: 'PNG-UOT-003',
    courseTitle: 'Bachelor of Civil Engineering',
    institutionName: 'Papua New Guinea University of Technology',
    studyLevel: 'Bachelor',
    discipline: 'Engineering',
    durationMonths: 48,
    accreditedBy: 'Engineers PNG / Washington Accord',
    keywords: ['civil engineering', 'infrastructure', 'structural', 'roads'],
  },

  // Somare Institute of Leadership and Governance (SILAG)
  {
    courseId: 'PNG-SILAG-001',
    courseTitle: 'Diploma in Public Administration and Governance',
    institutionName: 'Somare Institute of Leadership and Governance (SILAG)',
    studyLevel: 'Diploma',
    discipline: 'Public Administration',
    durationMonths: 18,
    accreditedBy: 'DHERST / DPM',
    keywords: ['public administration', 'general orders', 'civil service', 'governance'],
  },
  {
    courseId: 'PNG-SILAG-002',
    courseTitle: 'Executive Diploma in Human Resource Management',
    institutionName: 'Somare Institute of Leadership and Governance (SILAG)',
    studyLevel: 'Diploma',
    discipline: 'Human Resources',
    durationMonths: 12,
    accreditedBy: 'DHERST / DPM',
    keywords: ['human resources', 'hrm', 'personnel management', 'payroll', 'dpm regulations'],
  },
  {
    courseId: 'PNG-SILAG-003',
    courseTitle: 'National Certificate in Local-level Government Administration',
    institutionName: 'Somare Institute of Leadership and Governance (SILAG)',
    studyLevel: 'Certificate',
    discipline: 'Local Governance',
    durationMonths: 6,
    accreditedBy: 'DPM',
    keywords: ['llg', 'local government', 'ward administration', 'district management'],
  },

  // Divine Word University (DWU - Madang/POM)
  {
    courseId: 'PNG-DWU-001',
    courseTitle: 'Bachelor of Health Management',
    institutionName: 'Divine Word University',
    studyLevel: 'Bachelor',
    discipline: 'Health Administration',
    durationMonths: 48,
    accreditedBy: 'DHERST',
    keywords: ['health administration', 'hospital management', 'public health'],
  },
  {
    courseId: 'PNG-DWU-002',
    courseTitle: 'Master of Leadership in Development',
    institutionName: 'Divine Word University',
    studyLevel: 'Master',
    discipline: 'Leadership',
    durationMonths: 24,
    accreditedBy: 'DHERST',
    keywords: ['leadership', 'development studies', 'strategic management'],
  },

  // Pacific Adventist University (PAU)
  {
    courseId: 'PNG-PAU-001',
    courseTitle: 'Bachelor of Business (Accounting)',
    institutionName: 'Pacific Adventist University',
    studyLevel: 'Bachelor',
    discipline: 'Accounting',
    durationMonths: 48,
    accreditedBy: 'CPA PNG / DHERST',
    keywords: ['accounting', 'audit', 'financial management', 'cpa'],
  },
];

/**
 * Cross-reference helper to programmatically match a candidate's proposed overseas study
 * against locally available PNG accredited courses.
 */
export function matchLocalPNGInstitutionCourse(
  proposedTitle: string,
  proposedStudyLevel: string
): PNGInstitutionCourse | null {
  if (!proposedTitle) return null;

  const normalizedTitle = proposedTitle.toLowerCase().trim();
  const normalizedLevel = proposedStudyLevel.toLowerCase().trim();

  // 1. Exact or substring match on course title and study level
  for (const course of PNG_INSTITUTIONS_CATALOG) {
    const courseTitleLower = course.courseTitle.toLowerCase();
    const courseLevelLower = course.studyLevel.toLowerCase();

    const isLevelMatch =
      normalizedLevel === courseLevelLower ||
      (normalizedLevel.includes('master') && courseLevelLower.includes('master')) ||
      (normalizedLevel.includes('bachelor') && courseLevelLower.includes('bachelor')) ||
      (normalizedLevel.includes('diploma') && courseLevelLower.includes('diploma')) ||
      (normalizedLevel.includes('certificate') && courseLevelLower.includes('certificate'));

    if (isLevelMatch) {
      if (
        courseTitleLower === normalizedTitle ||
        courseTitleLower.includes(normalizedTitle) ||
        normalizedTitle.includes(courseTitleLower)
      ) {
        return course;
      }

      // Keyword density match
      const matchingKeywords = course.keywords.filter((kw) =>
        normalizedTitle.includes(kw)
      );
      if (matchingKeywords.length >= 2) {
        return course;
      }
    }
  }

  return null;
}

