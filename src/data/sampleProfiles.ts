import { DPMBidFormData } from "../types";

export const initialEmptyBidForm: DPMBidFormData = {
  bidYear: new Date().getFullYear().toString(),
  proposedStudyLevel: "",
  courseTitle: "",
  familyName: "",
  otherNames: "",

  dpmSectorCategory: "",
  dpmPreliminaryRank: "",

  organisation: "",
  postalAddress: "",
  organisationSector: "",

  aidDonor: "",
  venue: "",
  trainingProvider: "",
  countryLocation: "",
  trainingStartDate: "",
  trainingEndDate: "",
  modeOfDelivery: "",
  trainingCategory: "",

  durationYears: "",
  durationMonths: "",
  durationWeeks: "",
  durationFromDate: "",
  durationToDate: "",

  employeeNo: "",
  age: "",
  gender: "",
  dateOfBirth: "",
  nidNo: "",
  dateCommencedCurrentJob: "",
  datePermanencyPublicService: "",
  substantivePosition: "",
  actingPosition: "",
  contactAddress: "",
  telephone: "",
  mobile: "",
  email: "",
  provinceDistrictWorking: "",

  emergencyName: "",
  emergencyAddress: "",
  emergencyPhone: "",
  emergencyEmail: "",
  emergencyRelationship: "",

  secondaryQualificationType: "",
  highestGradeCompleted: "",
  provincialHighSchoolAttended: "",

  qualifications: [
    {
      id: "qual-1",
      institution: "",
      year: "",
      courses: "",
      qualifications: "",
    },
  ],

  currentJobDescription: "",
  trainingNeedsIdentification: "",
  reintegrationPlan: "",
  descriptionOfProposedProgramme: "",
  courseBrochureFileName: "",
  targetedPositionUponCompletion: "",

  hasAttendedProgrammeLastTwoYears: "",
  programmesLastTwoYears: [],
  priorProgrammeDetailsNote: "",

  kraJustification: "",
  priorityJobGroupJustification: "",

  dtcEndorsement: "",
  dtcAuthorityName: "",
  dtcAuthorityTitle: "",
  dtcSignatureDataUrl: "",
  dtcEndorsementDate: "",

  deptHeadName: "",
  deptHeadDesignation: "",
  deptHeadDelegationEvidenceNote: "",
  deptHeadSignatureDataUrl: "",
  deptHeadSignDate: "",

  actionOfficerName: "",
  actionOfficerTitle: "",
  actionOfficerTelephone: "",
  actionOfficerEmail: "",
};

export const sampleProfiles: { id: string; label: string; description: string; data: DPMBidFormData }[] = [
  {
    id: "policy-analyst",
    label: "Senior Policy Analyst (Dept of National Planning & Monitoring)",
    description: "Nominee applying for Master of Public Policy at Australian National University (Canberra) via Australia Awards.",
    data: {
      ...initialEmptyBidForm,
      bidYear: "2026",
      proposedStudyLevel: "Masters Programme (Postgraduate)",
      courseTitle: "Master of Public Policy (Economic & Social Development)",
      familyName: "KOPANA",
      otherNames: "Samuel Gari",

      dpmSectorCategory: "Economic & Governance",
      dpmPreliminaryRank: "Priority 1",

      organisation: "Department of National Planning & Monitoring (DNPM)",
      postalAddress: "P.O. Box 631, Waigani, NCD, Papua New Guinea",
      organisationSector: "Economic & Strategic Planning",

      aidDonor: "Australia Awards (DFAT - Commonwealth of Australia)",
      venue: "Australian National University (Crawford School of Public Policy), Canberra, Australia",

      durationYears: "2",
      durationMonths: "0",
      durationWeeks: "0",
      durationFromDate: "15/01/2027",
      durationToDate: "15/12/2028",

      employeeNo: "DNPM-884920",
      age: "34",
      gender: "Male",
      dateOfBirth: "14/06/1992",
      nidNo: "PNG-NID-10492819",
      dateCommencedCurrentJob: "01/02/2021",
      datePermanencyPublicService: "15/05/2017",
      substantivePosition: "Senior Policy Analyst - Macro Planning Division",
      actingPosition: "Acting Principal Policy Advisor (Strategic Priorities)",
      contactAddress: "Vulupindi Haus, 4th Floor, Somare Drive, Waigani, NCD",
      telephone: "+675 301 1200",
      mobile: "+675 7234 5678",
      email: "samuel.kopana@planning.gov.pg",
      provinceDistrictWorking: "National Capital District, Moresby North-West",

      emergencyName: "Grace Kopana",
      emergencyAddress: "Section 45, Lot 12, Gerehu Stage 3B, Port Moresby, NCD",
      emergencyPhone: "+675 7123 9876",
      emergencyEmail: "grace.kopana@gmail.com",
      emergencyRelationship: "Spouse",

      secondaryQualificationType: "Grade Twelve or Above",
      highestGradeCompleted: "Grade 12 (Higher School Certificate)",
      provincialHighSchoolAttended: "Sogeri National High School, Central Province",

      qualifications: [
        {
          id: "qual-1",
          institution: "University of Papua New Guinea (UPNG)",
          year: "2015",
          courses: "Economics & Public Policy Analysis",
          qualifications: "Bachelor of Economics (Honours)",
        },
        {
          id: "qual-2",
          institution: "PNG Institute of Public Administration (PNGIPA / PILAG)",
          year: "2019",
          courses: "Public Sector Strategic Leadership & Ethics",
          qualifications: "Certificate IV in Government Management",
        },
      ],

      currentJobDescription: `1. Lead macroeconomic policy evaluation and coordinate sector policy alignment with the Medium Term Development Plan IV (MTDP IV 2023-2027).
2. Formulate annual capital budget allocation frameworks across national departments and 22 provincial administrations.
3. Prepare quarterly ministerial briefs, National Executive Council (NEC) information papers, and strategic development expenditure reviews.
4. Facilitate inter-agency technical working groups with Treasury, Bank of PNG, and multilateral donor development partners.`,

      trainingNeedsIdentification: `The nominee manages complex public investment programs requiring advanced quantitative policy appraisal, econometric modeling, and donor co-financing project design.
Recent departmental capacity assessments highlighted institutional gaps in evidence-based policy formulation, cost-benefit risk matrices, and strategic monitoring frameworks. This specialized Master of Public Policy will provide the nominee with rigorous international training in fiscal policy evaluation, institutional governance, and public resource management to bridge these critical capabilities.`,

      reintegrationPlan: `Upon successful completion, the nominee will be deployed back into the Macroeconomic & Policy Division to:
1. First 3 Months: Lead internal knowledge-sharing masterclasses for 18 Junior & Mid-level Policy Officers on MTDP IV econometric monitoring tools.
2. 6-12 Months: Spearhead the modernization of the DNPM Capital Investment Evaluation Manual and train provincial planning units in Highlands and Coastal regions.
3. Policy Formulation: Lead the drafting of policy papers submitted to the Central Agencies Coordinating Committee (CACC) and NEC.`,

      descriptionOfProposedProgramme: `The Master of Public Policy at ANU Crawford School is a 2-year intensive program covering:
- Advanced Applied Economic Analysis & Public Finance Management
- Evidence-based Policy Formulation and Monitoring Systems
- Global Development Governance and Public Sector Accountability
- Quantitative Program Evaluation and Infrastructure Project Modeling.`,
      courseBrochureFileName: "ANU_Master_Public_Policy_2027_Syllabus.pdf",

      targetedPositionUponCompletion: "Principal Policy Advisor / Director - National Strategic Planning Division",

      hasAttendedProgrammeLastTwoYears: "NO",
      programmesLastTwoYears: [],
      priorProgrammeDetailsNote: "Nil. The nominee has been continuously on substantive public service duty without attending any training exceeding 9 months in the last 24 months.",

      kraJustification: `KRA 1: Strategic Economic Growth & National Development Coordination (Aligns with MTDP IV Strategic Priority Area 1).
KRA 2: Good Governance, Institutional Strengthening and Policy Capability in Central Government Agencies.
KRA 3: Effective Public Finance & Capital Investment Budget Planning aligned with PNG Vision 2050 Pillar 1 (Human Capital Development).`,

      priorityJobGroupJustification: `Policy Analysis, Macroeconomic Planning, and Public Sector Strategic Governance are designated under DPM National Public Service Priority Training Category A (Executive & Technical Professional Cadre).`,

      dtcEndorsement: "YES",
      dtcAuthorityName: "Dr. Kila Wari, MBE",
      dtcAuthorityTitle: "Chairperson, Departmental Training Committee & Deputy Secretary (Policy)",
      dtcSignatureDataUrl: "",
      dtcEndorsementDate: "",

      deptHeadName: "Koney Samuel",
      deptHeadDesignation: "Agency Head",
      deptHeadDelegationEvidenceNote: "Substantive Departmental Head as gazetted under the Public Services (Management) Act.",
      deptHeadSignatureDataUrl: "",
      deptHeadSignDate: "",

      actionOfficerName: "Theresa Bare",
      actionOfficerTitle: "Manager - Human Resource Development & Training",
      actionOfficerTelephone: "+675 301 1245",
      actionOfficerEmail: "theresa.bare@planning.gov.pg",
    },
  },
  {
    id: "health-epidemiologist",
    label: "Senior Health Surveillance Officer (National Dept of Health)",
    description: "Nominee applying for Postgraduate Diploma in Infectious Disease Surveillance (JICA - Tokyo, Japan).",
    data: {
      ...initialEmptyBidForm,
      bidYear: "2026",
      proposedStudyLevel: "Postgraduate Diploma / Professional Certificate",
      courseTitle: "Epidemiological Surveillance & Health Systems Resilience in Tropical Environments",
      familyName: "TALU",
      otherNames: "Miriam Bau",

      dpmSectorCategory: "Social & Community Development (Health)",
      dpmPreliminaryRank: "Priority 1",

      organisation: "National Department of Health (NDOH)",
      postalAddress: "P.O. Box 84, Badili, NCD, Papua New Guinea",
      organisationSector: "Health & Disease Control",

      aidDonor: "Japan International Cooperation Agency (JICA)",
      venue: "National Institute of Infectious Diseases (NIID) & JICA Tokyo International Center, Tokyo, Japan",

      durationYears: "0",
      durationMonths: "8",
      durationWeeks: "2",
      durationFromDate: "01/03/2027",
      durationToDate: "15/11/2027",

      employeeNo: "NDOH-441209",
      age: "31",
      gender: "Female",
      dateOfBirth: "22/09/1995",
      nidNo: "PNG-NID-20941842",
      dateCommencedCurrentJob: "10/01/2022",
      datePermanencyPublicService: "04/08/2018",
      substantivePosition: "Senior Disease Surveillance & Outbreak Response Officer",
      actingPosition: "None",
      contactAddress: "NDOH Headquarters, Aopi Centre, Tower 1, Waigani, NCD",
      telephone: "+675 301 3600",
      mobile: "+675 7345 8812",
      email: "miriam.talu@health.gov.pg",
      provinceDistrictWorking: "National Capital District (with National field deployments)",

      emergencyName: "Pastor John Talu",
      emergencyAddress: "P.O. Box 112, Boroko, NCD",
      emergencyPhone: "+675 7981 2234",
      emergencyEmail: "johntalu.fam@gmail.com",
      emergencyRelationship: "Parent / Guardian",

      secondaryQualificationType: "Grade Twelve or Above",
      highestGradeCompleted: "Grade 12",
      provincialHighSchoolAttended: "Aiyura National High School, Eastern Highlands Province",

      qualifications: [
        {
          id: "qual-1",
          institution: "University of Papua New Guinea (School of Medicine & Health Sciences)",
          year: "2017",
          courses: "Medical Laboratory Sciences & Microbiology",
          qualifications: "Bachelor of Medical Laboratory Science",
        },
      ],

      currentJobDescription: `1. Manage the National Early Warning, Alert and Response System (EWARS) across all 22 Provincial Health Authorities (PHAs).
2. Investigate sudden infectious disease outbreaks including malaria surges, tuberculosis, vaccine-preventable diseases, and arboviruses.
3. Coordinate laboratory specimen logistics with Central Public Health Laboratory (CPHL) and WHO reference labs.
4. Prepare weekly epidemiological bulletins for the Health Secretary and Provincial Health Directors.`,

      trainingNeedsIdentification: `PNG continues to face severe infectious disease burdens in remote rural provinces. The nominee requires advanced international laboratory and field epidemiology competencies in molecular surveillance, geospatial mapping (GIS), outbreak modeling, and emergency health incident management systems to strengthen national preparedness against emerging health threats.`,

      reintegrationPlan: `1. Reintegration into the Public Health & Surveillance Directorate to update National Outbreak Standard Operating Procedures (SOPs).
2. Facilitate regional training modules for Provincial Disease Control Officers in Momase, Highlands, Southern, and New Guinea Islands regions.
3. Integrate digital geospatial real-time alert dashboards within the National Emergency Operations Centre (EOC).`,

      descriptionOfProposedProgramme: `Intensive 8.5-month practical and academic curriculum including:
- Molecular epidemiology and genomic pathogen sequencing
- Field outbreak rapid response protocols and containment
- Disaster health management and multi-agency biosafety
- Biostatistics and health GIS spatial tracking.`,
      courseBrochureFileName: "JICA_Tokyo_Disease_Surveillance_2027.pdf",

      targetedPositionUponCompletion: "Principal Epidemiologist / Manager - Disease Surveillance Division",

      hasAttendedProgrammeLastTwoYears: "NO",
      programmesLastTwoYears: [],
      priorProgrammeDetailsNote: "Nil. Full-time active emergency surveillance duty.",

      kraJustification: `KRA 1: Prevention, Control and Eradication of Communicable Diseases (National Health Plan 2021-2030).
KRA 2: Strengthening Emergency Preparedness and Rapid Disease Outbreak Response across Rural and Urban Health Systems.
KRA 3: Human Resource Development for Specialized Health Cadres in alignment with DPM Guidelines.`,

      priorityJobGroupJustification: `Public Health Surveillance, Tropical Epidemiology, and Clinical Diagnostics are listed under National Priority Health Specialized Cadre.`,

      dtcEndorsement: "YES",
      dtcAuthorityName: "Dr. Osborne Liko",
      dtcAuthorityTitle: "Chairperson, NDOH Training Committee & Health Secretary",
      dtcSignatureDataUrl: "",
      dtcEndorsementDate: "",

      deptHeadName: "Dr. Osborne Liko",
      deptHeadDesignation: "Agency Head",
      deptHeadDelegationEvidenceNote: "Secretary for Health as Chief Executive Officer.",
      deptHeadSignatureDataUrl: "",
      deptHeadSignDate: "",

      actionOfficerName: "Ezekiel Mombi",
      actionOfficerTitle: "Principal Training Officer - Workforce Development",
      actionOfficerTelephone: "+675 301 3712",
      actionOfficerEmail: "ezekiel.mombi@health.gov.pg",
    },
  },
  {
    id: "it-cybersecurity",
    label: "ICT Systems & Infrastructure Specialist (Morobe Provincial Admin)",
    description: "Nominee applying for Advanced Cybersecurity & GovCloud Management (New Zealand Aid Programme).",
    data: {
      ...initialEmptyBidForm,
      bidYear: "2026",
      proposedStudyLevel: "Professional Certification & Postgraduate Diploma",
      courseTitle: "Government Cloud Architecture, Cybersecurity & Critical Digital Infrastructure Protection",
      familyName: "WAINE",
      otherNames: "Paul Raymond",

      dpmSectorCategory: "Provincial & Local Level Governments / ICT",
      dpmPreliminaryRank: "Priority 1",

      organisation: "Morobe Provincial Administration (Department of Morobe)",
      postalAddress: "P.O. Box 572, Lae, Morobe Province 411, Papua New Guinea",
      organisationSector: "Provincial Administration & Digital Transformation",

      aidDonor: "New Zealand Aid Programme (Ministry of Foreign Affairs & Trade - MFAT)",
      venue: "Auckland University of Technology (AUT) & Cyber Security Centre, Auckland, New Zealand",

      durationYears: "1",
      durationMonths: "0",
      durationWeeks: "0",
      durationFromDate: "01/02/2027",
      durationToDate: "01/02/2028",

      employeeNo: "MPA-991204",
      age: "29",
      gender: "Male",
      dateOfBirth: "18/11/1997",
      nidNo: "PNG-NID-39102849",
      dateCommencedCurrentJob: "15/03/2020",
      datePermanencyPublicService: "01/06/2019",
      substantivePosition: "Senior ICT Systems & Network Administrator",
      actingPosition: "Acting Provincial ICT Coordinator",
      contactAddress: "Morobe Provincial Administration Headquarters, Bumbu Road, Lae",
      telephone: "+675 473 1700",
      mobile: "+675 7012 3456",
      email: "paul.waine@morobe.gov.pg",
      provinceDistrictWorking: "Morobe Province, Lae District",

      emergencyName: "Sarah Waine",
      emergencyAddress: "Section 14, Eriku Suburb, Lae, Morobe Province",
      emergencyPhone: "+675 7200 9988",
      emergencyEmail: "sarahwaine@outlook.com",
      emergencyRelationship: "Spouse",

      secondaryQualificationType: "Grade Twelve or Above",
      highestGradeCompleted: "Grade 12",
      provincialHighSchoolAttended: "Bugandi Secondary School, Lae, Morobe Province",

      qualifications: [
        {
          id: "qual-1",
          institution: "Papua New Guinea University of Technology (UNITECH), Lae",
          year: "2018",
          courses: "Computer Science & Information Technology",
          qualifications: "Bachelor of Science in Computer Science",
        },
      ],

      currentJobDescription: `1. Oversee the provincial government local area network (LAN), wide area network (WAN) connecting 10 district administration offices, and server infrastructure.
2. Manage public sector payroll (ALESIUS/Ascender), Integrated Financial Management System (IFMS) provincial terminals, and land registry databases.
3. Protect government digital networks against cyber intrusions, ransomware, and data loss.
4. Provide technical support to provincial statutory bodies, health authority links, and education boards.`,

      trainingNeedsIdentification: `Morobe Provincial Administration is migrating critical district revenue and financial services to GovCloud under the Digital Government Act 2022. The nominee requires specialized enterprise cloud engineering, zero-trust network security, and disaster recovery competencies to safeguard provincial government databases against sophisticated cyber threats.`,

      reintegrationPlan: `1. Deploy a secure GovCloud hybrid node for Morobe Province and connect all 10 district offices with end-to-end encrypted tunnels.
2. Formulate the Morobe Provincial Cyber Incident Response Protocol in partnership with the Department of Information and Communications Technology (DICT).
3. Conduct hands-on cybersecurity hygiene training for over 150 provincial public servants.`,

      descriptionOfProposedProgramme: `Comprehensive 1-year postgraduate program covering:
- Enterprise Cloud Security Architecture & Virtualization
- Cyber Threat Hunting, Penetration Testing & Defensive Forensics
- Disaster Recovery, High Availability and Business Continuity in Public Sector
- National Critical Infrastructure Cyber Standards and Compliance.`,
      courseBrochureFileName: "AUT_GovCloud_CyberSecurity_2027.pdf",

      targetedPositionUponCompletion: "Director - Provincial Information, Communication & Digital Transformation",

      hasAttendedProgrammeLastTwoYears: "NO",
      programmesLastTwoYears: [],
      priorProgrammeDetailsNote: "Nil. Full-time on substantive ICT administration duty.",

      kraJustification: `KRA 1: Digital Transformation, Provincial E-Governance and Secure Service Delivery (Digital Government Act 2022).
KRA 2: District Connectivity and Decentralized Financial Management Infrastructure.
KRA 3: Institutional Security and Protection of Public Records & Assets.`,

      priorityJobGroupJustification: `Information & Communications Technology (ICT), Cybersecurity, and Digital Infrastructure are prioritized under National Public Service Digitalization Directives.`,

      dtcEndorsement: "YES",
      dtcAuthorityName: "Max Bruten",
      dtcAuthorityTitle: "Chairperson, Morobe Provincial Training Committee & Provincial Administrator",
      dtcSignatureDataUrl: "",
      dtcEndorsementDate: "",

      deptHeadName: "Max Bruten",
      deptHeadDesignation: "Agency Head",
      deptHeadDelegationEvidenceNote: "Provincial Administrator / Head of Provincial Public Service.",
      deptHeadSignatureDataUrl: "",
      deptHeadSignDate: "",

      actionOfficerName: "Gibson Kalo",
      actionOfficerTitle: "Principal HR Advisor (Provincial Staff Development)",
      actionOfficerTelephone: "+675 473 1755",
      actionOfficerEmail: "gibson.kalo@morobe.gov.pg",
    },
  },
];
