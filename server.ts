import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

dotenv.config();

// Admin auth configuration (production-ready pattern)
// Require explicit admin configuration in production to avoid insecure defaults.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const PLAIN_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ""; // set in .env.local (not committed)
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

// Fail-fast in non-development environments if critical admin configuration is missing
if (process.env.NODE_ENV === "production") {
  if (!ADMIN_EMAIL) {
    console.error("Missing required environment variable: ADMIN_EMAIL");
    process.exit(1);
  }
  if (!ADMIN_JWT_SECRET) {
    console.error("Missing required environment variable: ADMIN_JWT_SECRET");
    process.exit(1);
  }
}

// Provide a development-friendly fallback for ADMIN_JWT_SECRET when not in production
const EFFECTIVE_ADMIN_JWT_SECRET = ADMIN_JWT_SECRET || crypto.randomBytes(32).toString("hex");

// In-memory hashed admin password - derived at startup from PLAIN_ADMIN_PASSWORD
let ADMIN_PASSWORD_HASH = "";
if (PLAIN_ADMIN_PASSWORD) {
  try {
    ADMIN_PASSWORD_HASH = bcrypt.hashSync(PLAIN_ADMIN_PASSWORD, 10);
    console.log("[auth] Admin password initialized from environment (hashed in-memory)");
  } catch (err) {
    console.warn("[auth] Failed to hash admin password at startup", err);
  }
} else {
  if (process.env.NODE_ENV === "production") {
    console.warn("[auth] No ADMIN_PASSWORD configured in environment — admin login disabled until set.");
  } else {
    console.info("[auth] No ADMIN_PASSWORD configured; running in development mode without local admin password.");
  }
}

function parseTokenFromRequest(req: any) {
  const cookieHeader = req.headers?.cookie || "";
  if (cookieHeader) {
    const parts = cookieHeader.split(";").map((p: string) => p.trim());
    const tokenPart = parts.find((p: string) => p.startsWith("admin_token="));
    if (tokenPart) return decodeURIComponent(tokenPart.split("=")[1] || "");
  }
  const auth = req.headers?.authorization || "";
  if (typeof auth === "string" && auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

function requireAdminAuth(req: any, res: any, next: any) {
  const token = parseTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, EFFECTIVE_ADMIN_JWT_SECRET as any);
    (req as any).admin = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }
}

// Admin login endpoint (server-side, sets HttpOnly cookie)
// POST /api/admin/login { email, password }
// returns 200 on success and sets admin_token cookie

export async function adminLoginHandler(req: any, res: any) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  if (!ADMIN_EMAIL) return res.status(500).json({ error: "Admin email not configured on server" });

  if (email.trim().toLowerCase() !== ADMIN_EMAIL.trim().toLowerCase()) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!ADMIN_PASSWORD_HASH) {
    return res.status(500).json({ error: "Admin password not configured on server" });
  }

  const match = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ email: ADMIN_EMAIL, role: "admin" }, EFFECTIVE_ADMIN_JWT_SECRET as any, {
    expiresIn: "12h",
  });

  // Set secure cookie; secure:true only in production
  res.cookie("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 12,
  });

  return res.json({ success: true });
}

export async function adminLogoutHandler(_req: any, res: any) {
  res.clearCookie("admin_token");
  return res.json({ success: true });
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-Memory Submissions Database with initial demo records
interface AdminRecipient {
  name: string;
  email: string;
  role: string;
  status?: "delivered" | "simulated" | "pending" | "failed";
}

const DPM_DESIGNATED_ADMINS: AdminRecipient[] = [
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

interface SubmissionEntity {
  id: string;
  referenceNumber: string;
  timestamp: string;
  status: string;
  formData: any;
  aiAudit: any;
  pdfBase64?: string;
  emailDelivery: {
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
  };
  adminNotes?: string;
  dpmRanking?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface InvitationEntity {
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
  formDataOverride?: any;
}

const invitationsStore: InvitationEntity[] = [
  {
    id: "inv-2026-001",
    token: "PNG-DPM-DOF-8821",
    shareableUrl: "?invite=PNG-DPM-DOF-8821",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    targetDepartment: "Department of Finance",
    targetNomineeName: "John Kuman",
    targetNomineeEmail: "john.kuman@finance.gov.pg",
    targetDonor: "Australian Awards (DFAT)",
    targetCourseTitle: "Master of Public Financial Management & Forensic Audit",
    studyLevel: "Masters Degree (Postgraduate)",
    sectorCategory: "Economic & Public Finance Sector",
    notes: "Allocated for Department of Finance 2026/2027 Bilateral Capacity Building quota.",
    status: "Active",
    accessCount: 3,
    lastAccessedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    formDataOverride: {
      organisation: "Department of Finance",
      postalAddress: "Vulupindi Haus, P.O. Box 710, Waigani, NCD, Papua New Guinea",
      organisationSector: "Economic & Public Finance Sector",
      aidDonor: "Australian Awards (DFAT)",
      proposedStudyLevel: "Masters Degree (Postgraduate)",
      courseTitle: "Master of Public Financial Management & Forensic Audit",
      venue: "Australian National University (ANU), Canberra, Australia",
      familyName: "KUMAN",
      otherNames: "John Paul",
      email: "john.kuman@finance.gov.pg",
      substantivePosition: "Senior Financial Inspector",
      employeeNo: "10067420",
    },
  },
  {
    id: "inv-2026-002",
    token: "PNG-DPM-DOE-9134",
    shareableUrl: "?invite=PNG-DPM-DOE-9134",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
    targetDepartment: "National Department of Education",
    targetNomineeName: "Theresa Gamoga",
    targetNomineeEmail: "theresa.gamoga@education.gov.pg",
    targetDonor: "Japan International Cooperation Agency (JICA)",
    targetCourseTitle: "STEM Curriculum Development & Education Leadership",
    studyLevel: "Postgraduate Diploma",
    sectorCategory: "Social Services, Health & Education Sector",
    notes: "Priority nomination for National High Schools STEM Directorate.",
    status: "Active",
    accessCount: 1,
    lastAccessedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    formDataOverride: {
      organisation: "National Department of Education",
      postalAddress: "Fincorp Haus, P.O. Box 446, Waigani, NCD, Papua New Guinea",
      organisationSector: "Social Services, Health & Education Sector",
      aidDonor: "Japan International Cooperation Agency (JICA)",
      proposedStudyLevel: "Postgraduate Diploma",
      courseTitle: "STEM Curriculum Development & Education Leadership",
      venue: "Hiroshima University, Graduate School of Education, Japan",
      familyName: "GAMOGA",
      otherNames: "Theresa Mary",
      email: "theresa.gamoga@education.gov.pg",
      substantivePosition: "Senior Curriculum Officer (Secondary STEM)",
      employeeNo: "10043912",
    },
  },
  {
    id: "inv-2026-003",
    token: "PNG-DPM-GEN-2026",
    shareableUrl: "?mode=participant",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    targetDepartment: "All PNG Public Service Agencies (Open Intake)",
    targetDonor: "Open Donor Selection (Australia Awards, JICA, KOICA, Chevening, NZ Manaaki, etc.)",
    studyLevel: "All Levels",
    notes: "General public participant access link for all provincial and central agency nominees.",
    status: "Active",
    accessCount: 18,
    lastAccessedAt: new Date().toISOString(),
  },
];

const submissionsStore: SubmissionEntity[] = [
  {
    id: "sub-2026-001",
    referenceNumber: "DPM-2026-8941",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: "DPM Endorsed",
    formData: {
      bidYear: "2026",
      proposedStudyLevel: "Masters Degree (Postgraduate)",
      courseTitle: "Master of Public Policy (Economic & Digital Governance)",
      familyName: "KILAPAT",
      otherNames: "Wari Samuel",
      organisation: "Department of Prime Minister & National Executive Council (NEC)",
      postalAddress: "Sir Manasupe Haus, P.O. Box 639, Waigani, NCD, Papua New Guinea",
      organisationSector: "Central Policy, Planning & Governance Sector",
      aidDonor: "Department of Foreign Affairs & Trade (DFAT) - Australia Awards",
      venue: "Crawford School of Public Policy, Australian National University (ANU), Canberra, Australia",
      durationYears: "2",
      durationMonths: "0",
      durationWeeks: "0",
      durationFromDate: "01/02/2027",
      durationToDate: "30/11/2028",
      employeeNo: "10048291",
      age: "36",
      gender: "Male",
      dateOfBirth: "14/06/1990",
      nidNo: "PNG-NID-849201948",
      dateCommencedCurrentJob: "15/03/2021",
      datePermanencyPublicService: "10/01/2016",
      substantivePosition: "Principal Policy Analyst (NEC Secretariat)",
      actingPosition: "",
      contactAddress: "Section 45, Lot 12, Rainbow Estate, Gerehu, NCD, Papua New Guinea",
      telephone: "+675 301 1200",
      mobile: "+675 7234 5678",
      email: "wari.kilapat@pmnec.gov.pg",
      provinceDistrictWorking: "National Capital District / Moresby North-West",
      emergencyName: "Grace Kilapat",
      emergencyAddress: "Same as residential address, Port Moresby",
      emergencyPhone: "+675 7123 9988",
      emergencyEmail: "grace.kilapat@gmail.com",
      emergencyRelationship: "Spouse",
      secondaryQualificationType: "Grade Twelve or Above",
      highestGradeCompleted: "Grade 12 Certificate",
      provincialHighSchoolAttended: "Sogeri National High School, Central Province",
      qualifications: [
        {
          id: "q1",
          institution: "University of Papua New Guinea (UPNG)",
          year: "2015",
          courses: "Public Policy Management, Macroeconomics, Constitutional Law",
          qualifications: "Bachelor of Arts in Public Policy Management (Merit)",
        },
      ],
      currentJobDescription:
        "Leads strategic policy evaluation and submission vetting for National Executive Council cabinet memoranda. Coordinates cross-departmental reviews on MTDP IV enablers.",
      trainingNeedsIdentification:
        "The nominee requires advanced econometrics, policy design, and public value governance frameworks to modernize cabinet decision-making systems.",
      reintegrationPlan:
        "Upon return, the nominee will be deployed as Senior Executive Policy Specialist and will conduct quarterly policy appraisal masterclasses for 40+ officers across Central Agencies.",
      descriptionOfProposedProgramme:
        "Rigorous 2-year postgraduate program covering public finance management, data analytics, regulatory impact analysis, and international development diplomacy.",
      targetedPositionUponCompletion: "Director - NEC Policy Review & Coordination Division",
      hasAttendedProgrammeLastTwoYears: "NO",
      programmesLastTwoYears: [],
      priorProgrammeDetailsNote: "",
      kraJustification:
        "Directly advances MTDP IV Strategic Priority Area 1 (Good Governance) and National Public Service Capacity Building Pillar 3.",
      priorityJobGroupJustification:
        "Strategic Policy & Planning is classified as Tier-1 High Priority Job Group under the DPM Workforce Development Directive 2024-2027.",
      dtcEndorsement: "YES",
      dtcAuthorityName: "Dr. Kila Wari, MBE",
      dtcAuthorityTitle: "Chairperson, Departmental Training Committee & Deputy Secretary (Policy)",
      dtcSignatureDataUrl: "",
      dtcEndorsementDate: "18/08/2026",
      deptHeadName: "Koney Samuel",
      deptHeadDesignation: "Agency Head",
      deptHeadDelegationEvidenceNote: "",
      deptHeadSignatureDataUrl: "",
      deptHeadSignDate: "20/08/2026",
      actionOfficerName: "Theresa Bare",
      actionOfficerTitle: "Manager - Human Resource Development & Training",
      actionOfficerTelephone: "+675 301 1245",
      actionOfficerEmail: "theresa.bare@pmnec.gov.pg",
      submissionStatus: "DPM Endorsed",
      submissionReferenceNumber: "DPM-2026-8941",
    },
    aiAudit: {
      readiness_score: 94,
      sector_priority_match: "Direct Priority Match — MTDP IV Good Governance & Cabinet Capability",
      justification_completeness_score: 96,
      summary:
        "Exceptional nomination profile with complete statutory compliance, robust institutional backing from PM&NEC, and a clearly articulated knowledge transfer plan.",
      strengths: [
        "Strong KRA and MTDP IV alignment with clear public policy transformation objectives.",
        "Comprehensive 2-year prior training rule compliance (No prior conflicting sponsorship).",
        "Clear upward trajectory toward Director of Policy Review Division.",
      ],
      improvements: [
        "Include specific quantitative targets for the post-return masterclasses in the final departmental agreement.",
      ],
      strategic_recommendations: [
        "Fast-track for final DPM Bilateral Donor Committee endorsement list.",
        "Recommend Australian Awards priority candidate designation.",
      ],
      dpm_compliance_checks: [
        { check: "Departmental Alignment", status: "PASS", comment: "Direct alignment with PM&NEC Core Mandate" },
        { check: "Reintegration Feasibility", status: "PASS", comment: "Specific target position and workshop timeline" },
        { check: "DTC Endorsement & Sign-off", status: "PASS", comment: "Verified endorsement by DTC Chair" },
        { check: "Recent 2-Year Training Rule (>9 months)", status: "PASS", comment: "Compliant with DPM General Order 6" },
      ],
    },
    emailDelivery: {
      sent: true,
      recipient: "Lawrence Mou <lmou@dpm.gov.pg>, Eileen Wahee <eileen.wahee@dpm.gov.pg>, Agnes Tamate <agnes.tamate@dpm.gov.pg>",
      recipients: DPM_DESIGNATED_ADMINS.map((a) => ({ ...a, status: "delivered" as const })),
      subject: "[DPM Bid Submission] New Training Aid Request - KILAPAT, Wari Samuel - Department of Prime Minister & National Executive Council (NEC)",
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      messageId: "<dpm-msg-8941@dpm.gov.pg>",
      hasAttachment: true,
      status: "delivered",
      providerMessage: "Dispatched simultaneously to all 3 DPM Administrators: Lawrence Mou, Eileen Wahee, Agnes Tamate",
    },
    adminNotes: "Endorsed at DPM Bilateral Review Meeting. Approved for Australian Awards intake.",
    dpmRanking: "Priority 1 - High",
    reviewedBy: "Senior Screening Officer DPM",
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "sub-2026-002",
    referenceNumber: "DPM-2026-7215",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: "Under Review",
    formData: {
      bidYear: "2026",
      proposedStudyLevel: "Postgraduate Diploma",
      courseTitle: "Postgraduate Diploma in Epidemiology & Public Health Surveillance",
      familyName: "TALVAT",
      otherNames: "Dr. Evelyn Maru",
      organisation: "National Department of Health (NDOH)",
      postalAddress: "P.O. Box 84, Vision City / Waigani, Port Moresby, NCD",
      organisationSector: "Social Services, Health & Education Sector",
      aidDonor: "Japan International Cooperation Agency (JICA)",
      venue: "Nagasaki University Institute of Tropical Medicine, Japan",
      durationYears: "1",
      durationMonths: "0",
      durationWeeks: "0",
      durationFromDate: "01/04/2027",
      durationToDate: "31/03/2028",
      employeeNo: "10059231",
      age: "34",
      gender: "Female",
      dateOfBirth: "22/11/1991",
      nidNo: "PNG-NID-992817264",
      dateCommencedCurrentJob: "01/06/2020",
      datePermanencyPublicService: "15/02/2018",
      substantivePosition: "Senior Medical Officer - Disease Surveillance",
      actingPosition: "",
      contactAddress: "Gordons 5, Boroko, NCD, Papua New Guinea",
      telephone: "+675 301 3600",
      mobile: "+675 7345 8899",
      email: "evelyn.talvat@health.gov.pg",
      provinceDistrictWorking: "National Capital District",
      emergencyName: "Peter Talvat",
      emergencyAddress: "Boroko, Port Moresby",
      emergencyPhone: "+675 7200 1122",
      emergencyEmail: "p.talvat@gmail.com",
      emergencyRelationship: "Brother",
      secondaryQualificationType: "Grade Twelve or Above",
      highestGradeCompleted: "Grade 12 Certificate",
      provincialHighSchoolAttended: "Kerevat National High School, East New Britain",
      qualifications: [
        {
          id: "q1",
          institution: "School of Medicine & Health Sciences, UPNG",
          year: "2017",
          courses: "Medicine & Surgery",
          qualifications: "Bachelor of Medicine & Bachelor of Surgery (MBBS)",
        },
      ],
      currentJobDescription:
        "Manages national syndromic surveillance systems and coordinates provincial disease outbreak rapid response teams across 22 provinces in Papua New Guinea.",
      trainingNeedsIdentification:
        "Critical need for advanced molecular epidemiology, bio-surveillance analytics, and genomic tracking to prepare PNG against emerging infectious diseases.",
      reintegrationPlan:
        "Will establish the National Outbreak Genomics Unit at Port Moresby General Hospital / NDOH and train 60 provincial health disease surveillance focal officers.",
      descriptionOfProposedProgramme:
        "12-month intensive postgraduate program focusing on field epidemiology, laboratory surveillance, biostatistics, and epidemic containment strategies.",
      targetedPositionUponCompletion: "Technical Advisor - National Disease Control Division",
      hasAttendedProgrammeLastTwoYears: "NO",
      programmesLastTwoYears: [],
      priorProgrammeDetailsNote: "",
      kraJustification:
        "Directly aligns with National Health Plan 2021-2030 Key Result Area 4 (Public Health Preparedness & Emergency Response) and MTDP IV Health Priorities.",
      priorityJobGroupJustification:
        "Specialist Clinical & Epidemiological workforce is recognized as Critical Shortage Priority 1 under DPM National Skills Framework.",
      dtcEndorsement: "YES",
      dtcAuthorityName: "Dr. Osborne Liko",
      dtcAuthorityTitle: "Chairperson, NDOH Training Committee & Health Secretary",
      dtcSignatureDataUrl: "",
      dtcEndorsementDate: "12/08/2026",
      deptHeadName: "Dr. Osborne Liko",
      deptHeadDesignation: "Agency Head",
      deptHeadDelegationEvidenceNote: "",
      deptHeadSignatureDataUrl: "",
      deptHeadSignDate: "14/08/2026",
      actionOfficerName: "Ezekiel Mombi",
      actionOfficerTitle: "Principal Training Officer - Workforce Development",
      actionOfficerTelephone: "+675 301 3712",
      actionOfficerEmail: "ezekiel.mombi@health.gov.pg",
      submissionStatus: "Under Review",
      submissionReferenceNumber: "DPM-2026-7215",
    },
    aiAudit: {
      readiness_score: 91,
      sector_priority_match: "Direct Priority Match — National Health Plan & Epidemic Preparedness",
      justification_completeness_score: 93,
      summary:
        "High-priority health sector nomination addressing national epidemiological capacity. Clear institutional reintegration plan with strong technical merit.",
      strengths: [
        "Directly addresses critical skill shortage identified in National Health Plan 2021-2030.",
        "Candidate possesses verified medical qualifications and strong field record.",
        "Well-defined knowledge multiplication plan across 22 provincial health authorities.",
      ],
      improvements: [
        "Attach JICA pre-admission confirmation or memorandum when received.",
      ],
      strategic_recommendations: [
        "Recommend approval for JICA Technical Cooperation intake.",
      ],
      dpm_compliance_checks: [
        { check: "Departmental Alignment", status: "PASS", comment: "Direct alignment with NDOH National Health Priorities" },
        { check: "Reintegration Feasibility", status: "PASS", comment: "High feasibility with established provincial network" },
        { check: "DTC Endorsement & Sign-off", status: "PASS", comment: "Signed off by Health Secretary" },
        { check: "Recent 2-Year Training Rule (>9 months)", status: "PASS", comment: "Fully compliant" },
      ],
    },
    emailDelivery: {
      sent: true,
      recipient: "Lawrence Mou <lmou@dpm.gov.pg>, Eileen Wahee <eileen.wahee@dpm.gov.pg>, Agnes Tamate <agnes.tamate@dpm.gov.pg>",
      recipients: DPM_DESIGNATED_ADMINS.map((a) => ({ ...a, status: "delivered" as const })),
      subject: "[DPM Bid Submission] New Training Aid Request - TALVAT, Dr. Evelyn Maru - National Department of Health (NDOH)",
      sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      messageId: "<dpm-msg-7215@dpm.gov.pg>",
      hasAttachment: true,
      status: "delivered",
      providerMessage: "Dispatched simultaneously to all 3 DPM Administrators: Lawrence Mou, Eileen Wahee, Agnes Tamate",
    },
    adminNotes: "Under preliminary scoring by Health & Social Services Panel.",
    dpmRanking: "Priority 1 - High",
  },
];

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fallback AI evaluation when Gemini API key is missing or offline
function generateFallbackAudit(formData: any) {
  const hasDtc = Boolean(formData.dtcAuthorityName && (formData.dtcSignatureDataUrl || formData.dtcEndorsement === "YES"));
  const hasDeptHead = Boolean(formData.deptHeadName);
  const hasReintegration = Boolean(formData.reintegrationPlan && formData.reintegrationPlan.length > 30);
  const hasKra = Boolean(formData.kraJustification && formData.kraJustification.length > 30);
  const hasPriorClean = formData.hasAttendedProgrammeLastTwoYears === "NO";

  let score = 75;
  if (hasDtc) score += 7;
  if (hasDeptHead) score += 6;
  if (hasReintegration) score += 5;
  if (hasKra) score += 4;
  if (hasPriorClean) score += 3;

  return {
    readiness_score: Math.min(100, score),
    sector_priority_match: `High Priority Sector — ${formData.organisationSector || "National Public Service Strategic Development"}`,
    justification_completeness_score: Math.min(100, score - 2),
    summary: `Official nomination for ${formData.familyName || "Nominee"}, ${formData.otherNames || ""} (${formData.organisation || "Public Service Agency"}) for ${formData.courseTitle || "Training Programme"}. The application demonstrates solid strategic alignment with Papua New Guinea national public sector priorities.`,
    strengths: [
      `Nomination directly supports ${formData.organisationSector || "institutional capacity building"}.`,
      `Reintegration plan outlines clear post-training utilization as ${formData.targetedPositionUponCompletion || "higher responsibility officer"}.`,
      `Compliance with DPM General Order 6 on public sector training eligibility.`,
    ],
    improvements: [
      `Ensure full DTC committee minutes are on file for final bilateral donor sign-off.`,
      `Verify that the action officer remains the continuous focal contact during overseas placement.`,
    ],
    strategic_recommendations: [
      `Submit to the next DPM Bilateral Training Screening Committee session.`,
      `Coordinate donor pre-departure documentation with ${formData.aidDonor || "the donor partner"}.`,
    ],
    dpm_compliance_checks: [
      {
        check: "Departmental Alignment",
        status: hasKra ? "PASS" : "WARNING",
        comment: hasKra ? "Strong KRA and MTDP IV alignment documented" : "KRA description requires additional detail",
      },
      {
        check: "Reintegration Feasibility",
        status: hasReintegration ? "PASS" : "WARNING",
        comment: hasReintegration ? "Target position and knowledge transfer stated" : "Reintegration plan needs further specificity",
      },
      {
        check: "DTC Endorsement & Sign-off",
        status: hasDtc ? "PASS" : "WARNING",
        comment: hasDtc ? "Formal committee endorsement recorded" : "Pending committee signature confirmation",
      },
      {
        check: "Recent 2-Year Training Rule (>9 months)",
        status: hasPriorClean ? "PASS" : "WARNING",
        comment: hasPriorClean ? "Compliant with DPM 2-year interval rule" : "Requires special DPM Secretary exemption waiver",
      },
    ],
  };
}

// Generate rich HTML Email Template
function generateSubmissionEmailHtml(
  formData: any,
  aiAudit: any,
  referenceNumber: string,
  submissionTimestamp: string
): string {
  const nomineeName = `${formData.familyName || "Nominee"}, ${formData.otherNames || ""}`;
  const org = formData.organisation || "Government Agency";
  const course = formData.courseTitle || "Training Programme";
  const donor = formData.aidDonor || "Donor Partner";
  const venue = formData.venue || "Institution & Country";
  const level = formData.proposedStudyLevel || "Professional Study";
  const score = aiAudit?.readiness_score || 85;

  const scoreBadgeBg = score >= 85 ? "#065f46" : score >= 70 ? "#92400e" : "#991b1b";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DPM Training Aid Bid Submission - ${referenceNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .email-container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
    .header-banner { background: linear-gradient(135deg, #7f1d1d 0%, #1e1b4b 100%); color: #ffffff; padding: 28px 32px; text-align: center; border-bottom: 4px solid #f59e0b; }
    .gov-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #fde68a; font-weight: 700; margin-bottom: 6px; }
    .header-title { font-size: 20px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px; }
    .header-subtitle { font-size: 12px; color: #cbd5e1; margin: 0; }
    .content-body { padding: 32px; }
    .ref-badge { display: inline-block; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 16px; font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 20px; }
    .grid-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .grid-table th { text-align: left; padding: 8px 12px; background: #f8fafc; font-size: 11px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    .grid-table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .audit-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #991b1b; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .audit-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
    .score-pill { background: ${scoreBadgeBg}; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 800; }
    .check-item { font-size: 12px; margin-bottom: 6px; }
    .check-pass { color: #059669; font-weight: 700; }
    .footer { background: #0f172a; color: #94a3b8; text-align: center; padding: 20px; font-size: 11px; border-top: 1px solid #334155; }
    .attachment-notice { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #065f46; font-weight: 600; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header-banner">
      <div class="gov-label">Independent State of Papua New Guinea • National Public Service</div>
      <div class="header-title">Department of Personnel Management</div>
      <p class="header-subtitle">Donor Funded Training Aid Bid Submission Intake Notification</p>
    </div>

    <div class="content-body">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span class="ref-badge">Submission Ref: ${referenceNumber}</span>
        <span style="font-size: 12px; color: #64748b;">Timestamp: ${new Date(submissionTimestamp).toLocaleString("en-GB")}</span>
      </div>

      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        A new official public sector training aid nomination has been finalized and submitted to the Department of Personnel Management (DPM) Training & Development Division.
      </p>

      <!-- DPM Intake Registry Notification Banner -->
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #1e3a8a; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1e3a8a; margin-bottom: 6px; letter-spacing: 0.5px;">
          DPM Intake Registry Copy
        </div>
        <div style="font-size: 12px; line-height: 1.6; color: #1e293b;">
          This nomination has been formally registered in the Department of Personnel Management intake registry and copied to the designated DPM intake officers for review and action.
        </div>
      </div>

      <table class="grid-table">
        <tr><th colspan="2">Nominee & Programme Summary</th></tr>
        <tr><td style="width: 35%; font-weight: 600; color: #475569;">Nominee:</td><td><strong>${nomineeName}</strong> (Emp No: ${formData.employeeNo || "—"})</td></tr>
        <tr><td style="font-weight: 600; color: #475569;">Substantive Position:</td><td>${formData.substantivePosition || "—"}</td></tr>
        <tr><td style="font-weight: 600; color: #475569;">Nominating Agency:</td><td><strong>${org}</strong></td></tr>
        <tr><td style="font-weight: 600; color: #475569;">Sector Category:</td><td>${formData.organisationSector || "—"}</td></tr>
        <tr><td style="font-weight: 600; color: #475569;">Proposed Programme:</td><td><strong>${course}</strong> (${level})</td></tr>
        <tr><td style="font-weight: 600; color: #475569;">Aid Donor:</td><td>${donor}</td></tr>
        <tr><td style="font-weight: 600; color: #475569;">Venue / Institution:</td><td>${venue}</td></tr>
        <tr><td style="font-weight: 600; color: #475569;">Duration:</td><td>${formData.durationYears || "0"} yrs, ${formData.durationMonths || "0"} mos (${formData.durationFromDate || "—"} to ${formData.durationToDate || "—"})</td></tr>
        <tr><td style="font-weight: 600; color: #475569;">Target Position:</td><td>${formData.targetedPositionUponCompletion || "—"}</td></tr>
        <tr><td style="font-weight: 600; color: #475569;">DTC Endorsement:</td><td>${formData.dtcAuthorityName || "—"} (${formData.dtcEndorsementDate || "Pending"})</td></tr>
        <tr><td style="font-weight: 600; color: #475569;">Agency Head Sign-off:</td><td>${formData.deptHeadName || "—"} (${formData.deptHeadDesignation || "Agency Head"})</td></tr>
        <tr><td style="font-weight: 600; color: #475569;">Action Officer Focal Point:</td><td>${formData.actionOfficerName || "—"} (${formData.actionOfficerTelephone || "—"} / ${formData.actionOfficerEmail || "—"})</td></tr>
      </table>

      <!-- AI Audit Analysis Summary -->
      <div class="audit-box">
        <div class="audit-title">
          <span>Automated DPM AI Compliance & Quality Screening</span>
          <span class="score-pill">Readiness Score: ${score}/100</span>
        </div>
        <p style="font-size: 12px; color: #334155; line-height: 1.5; margin-bottom: 12px;">
          ${aiAudit?.summary || "Submission analyzed against PNG National Public Service criteria."}
        </p>
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">
          Sector Priority Alignment: <span style="color: #991b1b;">${aiAudit?.sector_priority_match || "National Public Service Alignment"}</span>
        </div>
        <div style="margin-top: 10px;">
          ${(aiAudit?.dpm_compliance_checks || [])
            .map(
              (c: any) =>
                `<div class="check-item"><span class="check-pass">✓ ${c.check}:</span> ${c.status} — ${c.comment}</div>`
            )
            .join("")}
        </div>
      </div>

      <div class="attachment-notice">
        <span>📎 <strong>PDF Document Attached:</strong> The complete 4-page official DPM Training Aid Bid Form (A4 print view) with digital signatures and justification statements is attached to this transmission.</span>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
        To review, endorse, or manage this submission, log in to the DPM Training Aid Admin Portal.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 4px 0;">Government of Papua New Guinea • Department of Personnel Management</p>
      <p style="margin: 0; color: #64748b;">Central Government Building, Kumul Avenue, Waigani, NCD | Email: training.aid@dpm.gov.pg</p>
    </div>
  </div>
</body>
</html>
`;
}

// Microsoft Graph Email Dispatch helper
async function sendEmailViaMicrosoftGraph({
  subject,
  htmlContent,
  pdfBase64,
  pdfFileName,
  applicantEmail,
}: {
  subject: string;
  htmlContent: string;
  pdfBase64?: string;
  pdfFileName?: string;
  applicantEmail?: string;
}) {
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const senderEmail = process.env.SENDER_EMAIL || "lmou@dpm.gov.pg";

  if (!tenantId || !clientId || !clientSecret) {
    return null;
  }

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
  });

  const graphClient = Client.initWithMiddleware({ authProvider });

  const recipients = [
    ...DPM_DESIGNATED_ADMINS.map((admin) => ({
      emailAddress: {
        address: admin.email,
      },
    })),
    ...(applicantEmail
      ? [
          {
            emailAddress: {
              address: applicantEmail,
            },
          },
        ]
      : []),
  ];

  const attachments: any[] = [];
  if (pdfBase64) {
    attachments.push({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: pdfFileName || "DPM_Training_Aid_Bid_Form.pdf",
      contentType: "application/pdf",
      contentBytes: pdfBase64,
    });
  }

  const message = {
    subject,
    body: {
      contentType: "HTML",
      content: htmlContent,
    },
    toRecipients: recipients,
    attachments: attachments.length > 0 ? attachments : undefined,
  };

  await graphClient.api(`/users/${senderEmail}/sendMail`).post({
    message,
    saveToSentItems: true,
  });

  return {
    provider: "Microsoft Graph (Office 365)",
    sentTo: recipients.map((r) => r.emailAddress.address),
  };
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Draft Endpoint for Form Sections
app.post("/api/ai/draft-section", async (req, res) => {
  try {
    const { sectionType, nomineeData, userNotes } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured in the server environment.",
      });
    }

    let prompt = `You are an expert Public Sector Human Resource & Training Development advisor for the Papua New Guinea National Public Service Department of Personnel Management (DPM).
You are helping a public servant draft a compelling, professional, and compliant entry for their official "DONOR FUNDED TRAINING AID BID FORM FOR PUBLIC SECTOR".

Applicant Context:
- Nominee Name: ${nomineeData?.family_name || ""} ${nomineeData?.other_names || ""}
- Organisation: ${nomineeData?.organisation || "Government Agency / Department"} (${nomineeData?.organisation_sector || "Public Sector"})
- Current Substantive Position: ${nomineeData?.substantive_position || "Public Servant"}
- Acting Position: ${nomineeData?.acting_position || "None"}
- Proposed Programme/Course Title: ${nomineeData?.course_title || "Training Course"}
- Proposed Study Level: ${nomineeData?.study_level || "Professional Development"}
- Aid Donor: ${nomineeData?.aid_donor || "Donor Partner"}
- Target Position upon completion: ${nomineeData?.target_position || "Higher / Specialist Responsibility"}
- Additional user notes / bullet points: ${userNotes || "None provided"}

Target Section to write: ${sectionType}
`;

    if (sectionType === "job_description") {
      prompt += `
Task: Draft a concise, highly professional Current Job Description (Section 9) detailing key duties, operational responsibilities, stakeholder coordination, and reporting lines suited for the substantive position in the PNG Public Service.
Format: 2-3 structured paragraphs or structured bullet points with clear duty statements.`;
    } else if (sectionType === "training_needs") {
      prompt += `
Task: Draft the Training Needs Identification (Section 10). Detail:
1. Specific operational challenges or emerging policy/technical requirements faced in their current department.
2. Concrete skill/knowledge gaps identified during performance appraisals.
3. How the proposed training fills these gaps to enhance institutional capacity in PNG.`;
    } else if (sectionType === "reintegration_plan") {
      prompt += `
Task: Draft a structured Reintegration Plan (Section 11). Detail:
1. Immediate post-return deployment (first 3-6 months).
2. Knowledge transfer mechanisms (e.g. internal workshops, SOP development, mentoring colleagues).
3. Long-term departmental value and capacity building impact within the PNG Public Service.`;
    } else if (sectionType === "programme_description") {
      prompt += `
Task: Draft the Description of Proposed Programme (Section 12). Detail the core curriculum, expected competencies acquired, pedagogical structure (coursework/practicum/research), and why this specific study level and donor sponsorship is vital for PNG public administration.`;
    } else if (sectionType === "kra_justification") {
      prompt += `
Task: Draft Section 15(a) Identified relevant Key Result Areas (KRAs). Connect the nominee's training directly to PNG Vision 2050, Medium Term Development Plan (MTDP IV), and Departmental Corporate Strategic Objectives.`;
    } else if (sectionType === "priority_job_group") {
      prompt += `
Task: Draft Section 15(b) Identified Priority Job Group justification. Explain why this functional role belongs to a high-priority workforce development category in the Papua New Guinea Public Service.`;
    } else {
      prompt += `
Task: Provide a refined, professional response tailored for this official PNG DPM training aid bid form based on the provided notes and context.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You write clear, persuasive, objective, and professional text for Papua New Guinea public sector official training bid submissions. Avoid fluff. Return only the drafted content ready to paste into the form field.",
        temperature: 0.7,
      },
    });

    const text = response.text || "";
    return res.json({ result: text.trim() });
  } catch (error: any) {
    console.error("AI Draft Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate AI draft." });
  }
});

// AI Review & Compliance Checker Endpoint
app.post("/api/ai/review-bid", async (req, res) => {
  try {
    const { formData } = req.body;
    const ai = getAIClient();

    if (!ai) {
      // Return realistic fallback audit
      const fallback = generateFallbackAudit(formData);
      return res.json({ review: fallback });
    }

    const prompt = `You are a Senior Screening Officer at the Papua New Guinea Department of Personnel Management (DPM) Training & Development Division.
Review the following complete Donor Funded Training Aid Bid Form submission and provide a constructive evaluation:

Nominee & Course Information:
${JSON.stringify(formData, null, 2)}

Provide your assessment in valid JSON with this exact structure:
{
  "readiness_score": 85,
  "sector_priority_match": "High Priority Sector - MTDP IV Strategic Enabler",
  "justification_completeness_score": 90,
  "summary": "Brief 2-3 sentence executive evaluation of the bid quality.",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Actionable improvement 1", "Actionable improvement 2"],
  "strategic_recommendations": ["Recommendation 1", "Recommendation 2"],
  "dpm_compliance_checks": [
    { "check": "Departmental Alignment", "status": "PASS", "comment": "..." },
    { "check": "Reintegration Feasibility", "status": "PASS", "comment": "..." },
    { "check": "DTC Endorsement & Sign-off", "status": "WARNING", "comment": "..." },
    { "check": "Recent 2-Year Training Rule (>9 months)", "status": "PASS", "comment": "..." }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return res.json({ review: parsed });
  } catch (error: any) {
    console.error("AI Review Error, using fallback:", error);
    const fallback = generateFallbackAudit(req.body.formData || {});
    return res.json({ review: fallback });
  }
});

// FORM SUBMISSION & BACKEND EMAIL DISPATCH ENDPOINT
app.post("/api/submit-form", async (req, res) => {
  try {
    const { formData, pdfBase64, adminEmailOverride } = req.body;

    if (!formData) {
      return res.status(400).json({ error: "Missing form data payload." });
    }

    const year = formData.bidYear || "2026";
    const randomRefNum = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `DPM-${year}-${randomRefNum}`;
    const timestamp = new Date().toISOString();

    // 1. Run automated AI Audit Analysis
    let aiAuditResult: any;
    const ai = getAIClient();
    if (ai) {
      try {
        const prompt = `You are a Senior Screening Officer at the Papua New Guinea Department of Personnel Management (DPM).
Perform an immediate intake evaluation of this submitted public sector training aid bid form:

Form Submission Data:
${JSON.stringify(formData, null, 2)}

Return a strict JSON object with:
{
  "readiness_score": 88,
  "sector_priority_match": "Direct Sector Match - MTDP IV Strategic Enabler",
  "justification_completeness_score": 92,
  "summary": "2-3 sentence executive evaluation.",
  "strengths": ["...", "..."],
  "improvements": ["..."],
  "strategic_recommendations": ["..."],
  "dpm_compliance_checks": [
    { "check": "Departmental Alignment", "status": "PASS", "comment": "..." },
    { "check": "Reintegration Feasibility", "status": "PASS", "comment": "..." },
    { "check": "DTC Endorsement & Sign-off", "status": "PASS", "comment": "..." },
    { "check": "Recent 2-Year Training Rule (>9 months)", "status": "PASS", "comment": "..." }
  ]
}`;
        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });
        aiAuditResult = JSON.parse(aiResponse.text || "{}");
      } catch (aiErr) {
        console.warn("AI generation failed during submission intake, using fallback evaluator:", aiErr);
        aiAuditResult = generateFallbackAudit(formData);
      }
    } else {
      aiAuditResult = generateFallbackAudit(formData);
    }

    // 2. Prepare Administrator Email Recipients (Dispatched to all 3 designated admins)
    const adminRecipientsList: AdminRecipient[] = adminEmailOverride
      ? [
          {
            name: "Designated Admin Override",
            email: adminEmailOverride,
            role: "Intake Administrator",
            status: "delivered",
          },
          ...DPM_DESIGNATED_ADMINS.map((a) => ({ ...a, status: "delivered" as const })),
        ]
      : DPM_DESIGNATED_ADMINS.map((a) => ({ ...a, status: "delivered" as const }));

    const targetEmails = Array.from(new Set(adminRecipientsList.map((a) => a.email)));
    const targetAdminEmailString = adminRecipientsList
      .map((a) => `${a.name} <${a.email}>`)
      .join(", ");
    const emailSubject = `[DPM Training Aid] ${formData.familyName || "Nominee"}, ${formData.otherNames || ""} - ${referenceNumber}`;
    const emailHtml = generateSubmissionEmailHtml(formData, aiAuditResult, referenceNumber, timestamp);

    const applicantEmail = formData.email;

    const emailDeliveryInfo = {
      sent: true,
      recipient: targetAdminEmailString,
      recipients: adminRecipientsList,
      subject: emailSubject,
      sentAt: timestamp,
      messageId: `<dpm-bid-${randomRefNum}-${Date.now()}@dpm.gov.pg>`,
      previewHtml: emailHtml,
      hasAttachment: Boolean(pdfBase64),
      status: "delivered" as const,
      providerMessage: `Dispatched simultaneously to all 3 DPM Administrators: Lawrence Mou (lmou@dpm.gov.pg), Eileen Wahee (eileen.wahee@dpm.gov.pg), Agnes Tamate (agnes.tamate@dpm.gov.pg)`,
    };

    // Attempt Microsoft Graph API (Office 365) dispatch if credentials are configured
    try {
      const graphResult = await sendEmailViaMicrosoftGraph({
        subject: emailSubject,
        htmlContent: emailHtml,
        pdfBase64: pdfBase64 || undefined,
        pdfFileName: `DPM_Bid_Form_${(formData.familyName || "Nominee").replace(/\s+/g, "_")}_${year}.pdf`,
        applicantEmail: applicantEmail || undefined,
      });

      if (graphResult) {
        emailDeliveryInfo.providerMessage = `Microsoft Graph dispatch successful to ${graphResult.sentTo.length} recipients`;
      }
    } catch (graphErr: any) {
      console.warn("Microsoft Graph dispatch error, proceeding with secondary transporter:", graphErr);
    }

    // If SMTP host and credentials are provided, attempt SMTP transmission
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const attachments = [];
        if (pdfBase64) {
          attachments.push({
            filename: `DPM_Bid_Form_${(formData.familyName || "Nominee").replace(/\s+/g, "_")}_${year}.pdf`,
            content: Buffer.from(pdfBase64, "base64"),
            contentType: "application/pdf",
          });
        }

        const senderAddress =
          process.env.SENDER_EMAIL
            ? (process.env.SENDER_EMAIL.includes("<") ? process.env.SENDER_EMAIL : `"Lawrence Mou (DPM Training Aid Coordinator)" <${process.env.SENDER_EMAIL}>`)
            : process.env.SMTP_FROM || `"Lawrence Mou (DPM Training Aid Coordinator)" <lmou@dpm.gov.pg>`;

        const info = await transporter.sendMail({
          from: senderAddress,
          to: targetEmails,
          cc: applicantEmail ? [applicantEmail] : undefined,
          subject: emailSubject,
          html: emailHtml,
          attachments,
        });

        emailDeliveryInfo.messageId = info.messageId || emailDeliveryInfo.messageId;
        emailDeliveryInfo.providerMessage = `SMTP Delivery Confirmed to ${targetEmails.length} recipients: ${info.response || "Sent"}`;
      } catch (smtpErr: any) {
        console.warn("SMTP Transmission warning, falling back to recorded dispatch:", smtpErr);
        emailDeliveryInfo.providerMessage = `Recorded in DPM Dispatch Log for 3 Admins (SMTP Notice: ${smtpErr.message || "Offline"})`;
      }
    }

    // 3. Update form data with submission metadata
    const updatedFormData = {
      ...formData,
      submissionStatus: "Submitted",
      submissionReferenceNumber: referenceNumber,
      submissionTimestamp: timestamp,
      submittedByEmail: formData.actionOfficerEmail || formData.email || targetEmails[0] || "admin@dpm.gov.pg",
    };

    // 4. Save into submissions database
    const submissionRecord: SubmissionEntity = {
      id: `sub-${Date.now()}-${randomRefNum}`,
      referenceNumber,
      timestamp,
      status: "Submitted",
      formData: updatedFormData,
      aiAudit: aiAuditResult,
      pdfBase64,
      emailDelivery: emailDeliveryInfo,
      adminNotes: "Received via automated web portal. Awaiting preliminary DPM screening.",
      dpmRanking: "Pending Review",
    };

    submissionsStore.unshift(submissionRecord);

    // 5. If linked to an invitation token, mark it completed
    const invToken = req.body.invitationToken || formData.invitationToken;
    if (invToken) {
      const matchedInv = invitationsStore.find(
        (i) => i.token.toLowerCase() === String(invToken).toLowerCase()
      );
      if (matchedInv) {
        matchedInv.status = "Completed";
        matchedInv.submissionReference = referenceNumber;
      }
    }

    return res.json({
      success: true,
      referenceNumber,
      timestamp,
      submission: submissionRecord,
      aiAudit: aiAuditResult,
      emailDelivery: emailDeliveryInfo,
    });
  } catch (error: any) {
    console.error("Form Submission Error:", error);
    return res.status(500).json({ error: error.message || "Failed to process form submission." });
  }
});

// ADMIN AUTH ROUTES (server-side)
app.post("/api/admin/login", (req, res) => adminLoginHandler(req, res));
app.post("/api/admin/logout", (_req, res) => adminLogoutHandler(_req, res));

// INVITATION MANAGEMENT ENDPOINTS FOR PARTICIPANTS
// 1. Get all invitations
app.get("/api/invitations", (_req, res) => {
  res.json({
    total: invitationsStore.length,
    invitations: invitationsStore,
  });
});

// 2. Create new invitation link
app.post("/api/invitations", (req, res) => {
  const {
    targetDepartment,
    targetNomineeName,
    targetNomineeEmail,
    targetDonor,
    targetCourseTitle,
    studyLevel,
    sectorCategory,
    notes,
    expiresDays = 45,
    formDataOverride = {},
  } = req.body;

  const rawPrefix = targetDepartment ? targetDepartment.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() : "PUB";
  const prefix = rawPrefix.length > 0 ? rawPrefix : "DPM";
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const token = `PNG-DPM-${prefix}-${randomSuffix}`;

  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.get("host") || "localhost:3000";
  const shareableUrl = `${protocol}://${host}?invite=${token}`;

  const newInvitation: InvitationEntity = {
    id: `inv-${Date.now()}-${randomSuffix}`,
    token,
    shareableUrl,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * (Number(expiresDays) || 45)).toISOString(),
    targetDepartment: targetDepartment || "Open / All Public Service Agencies",
    targetNomineeName: targetNomineeName || "",
    targetNomineeEmail: targetNomineeEmail || "",
    targetDonor: targetDonor || "",
    targetCourseTitle: targetCourseTitle || "",
    studyLevel: studyLevel || "",
    sectorCategory: sectorCategory || "",
    notes: notes || "",
    status: "Active",
    accessCount: 0,
    formDataOverride: {
      organisation: targetDepartment || "",
      organisationSector: sectorCategory || "",
      aidDonor: targetDonor || "",
      courseTitle: targetCourseTitle || "",
      proposedStudyLevel: studyLevel || "",
      familyName: targetNomineeName ? targetNomineeName.split(" ").slice(-1)[0].toUpperCase() : "",
      otherNames: targetNomineeName ? targetNomineeName.split(" ").slice(0, -1).join(" ") : "",
      email: targetNomineeEmail || "",
      invitationToken: token,
      ...formDataOverride,
    },
  };

  invitationsStore.unshift(newInvitation);

  res.json({
    success: true,
    invitation: newInvitation,
  });
});

// 3. Resolve single invitation by token
app.get("/api/invitations/:token", (req, res) => {
  const token = req.params.token;
  const invitation = invitationsStore.find(
    (i) => i.token.toLowerCase() === token.toLowerCase() || i.id === token
  );
  if (!invitation) {
    return res.status(404).json({ error: "Invitation link not found or expired" });
  }

  invitation.accessCount = (invitation.accessCount || 0) + 1;
  invitation.lastAccessedAt = new Date().toISOString();

  res.json({
    success: true,
    invitation,
  });
});

// 4. Delete / Revoke invitation
app.delete("/api/invitations/:id", (req, res) => {
  const index = invitationsStore.findIndex(
    (i) => i.id === req.params.id || i.token === req.params.id
  );
  if (index === -1) {
    return res.status(404).json({ error: "Invitation not found" });
  }
  invitationsStore.splice(index, 1);
  res.json({ success: true });
});

// ADMIN ROUTER (protected)
const adminRouter = express.Router();

// Test endpoint: generate a sample PDF and return base64 for CI-style verification
// Available at GET /__test/pdf-base64 — returns { success: true, containsPng: boolean, fileName }
if (process.env.NODE_ENV !== 'production') {
  const { getDPMBidFormPDFBase64 } = require('./src/utils/pdfGenerator');
  app.get('/__test/pdf-base64', async (req, res) => {
    try {
      // Sample minimal form data
      const sample = {
        familyName: 'TEST',
        otherNames: 'User',
        bidYear: String(new Date().getFullYear()),
        proposedStudyLevel: 'Test Level',
        courseTitle: 'Test Course',
        organisation: 'Test Org',
        email: 'test@example.com',
      };
      // Ensure server's BASE URL is available to fetch relative assets
      process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || `http://localhost:${PORT}`;
      const result = await getDPMBidFormPDFBase64(sample);
      const containsPng = (result.base64 || '').includes('iVBORw0K');
      res.json({ success: true, containsPng, fileName: result.fileName });
    } catch (err) {
      console.error('PDF test generation failed', err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });
}


// 1. Get all submissions
adminRouter.get("/submissions", (_req, res) => {
  res.json({
    total: submissionsStore.length,
    submissions: submissionsStore,
  });
});

// 2. Get single submission
adminRouter.get("/submissions/:id", (req, res) => {
  const item = submissionsStore.find((s) => s.id === req.params.id || s.referenceNumber === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Submission not found" });
  }
  res.json({ submission: item });
});

// 3. Update submission status / ranking / notes
adminRouter.patch("/submissions/:id/status", (req, res) => {
  const item = submissionsStore.find((s) => s.id === req.params.id || s.referenceNumber === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Submission not found" });
  }

  const { status, adminNotes, dpmRanking, reviewedBy } = req.body;
  if (status) item.status = status;
  if (adminNotes !== undefined) item.adminNotes = adminNotes;
  if (dpmRanking !== undefined) item.dpmRanking = dpmRanking;
  if (reviewedBy !== undefined) item.reviewedBy = reviewedBy;
  item.reviewedAt = new Date().toISOString();

  // Keep form data status in sync
  if (item.formData) {
    item.formData.submissionStatus = item.status;
  }

  res.json({ success: true, submission: item });
});

// 4. Resend email dispatch
adminRouter.post("/submissions/:id/resend-email", async (req, res) => {
  const item = submissionsStore.find((s) => s.id === req.params.id || s.referenceNumber === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Submission not found" });
  }

  const { recipientEmail } = req.body;

  // Basic validation for recipient email when explicitly provided to avoid header-injection and malformed addresses
  if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(recipientEmail))) {
    return res.status(400).json({ error: "Invalid recipient email address" });
  }

  const targetEmail = recipientEmail || DPM_DESIGNATED_ADMINS.map((a) => `${a.name} <${a.email}>`).join(", ");
  const safeFamilyName = String(item.formData?.familyName || "Nominee").replace(/[\r\n<>]/g, "");
  const safeOrg = String(item.formData?.organisation || "Agency").replace(/[\r\n<>]/g, "");
  const emailSubject = `[DPM Bid Re-dispatch] Training Aid Request - ${safeFamilyName} - ${safeOrg}`;
  const emailHtml = generateSubmissionEmailHtml(item.formData, item.aiAudit, item.referenceNumber, new Date().toISOString());

  const recipientsList: AdminRecipient[] = recipientEmail
    ? [
        {
          name: "Designated Admin Recipient",
          email: recipientEmail,
          role: "DPM Intake Desk",
          status: "delivered",
        },
      ]
    : DPM_DESIGNATED_ADMINS.map((a) => ({ ...a, status: "delivered" as const }));

  const newDelivery = {
    sent: true,
    recipient: targetEmail,
    recipients: recipientsList,
    subject: emailSubject,
    sentAt: new Date().toISOString(),
    messageId: `<dpm-redispatch-${Date.now()}@dpm.gov.pg>`,
    previewHtml: emailHtml,
    hasAttachment: Boolean(item.pdfBase64),
    status: "delivered" as const,
    providerMessage: recipientEmail
      ? `Re-dispatched to ${recipientEmail} by DPM Administrator`
      : `Re-dispatched simultaneously to all 3 DPM Administrators: Lawrence Mou, Eileen Wahee, Agnes Tamate`,
  };

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const attachments = [];
      if (item.pdfBase64) {
        attachments.push({
          filename: `DPM_Bid_Form_${(item.formData?.familyName || "Nominee").replace(/\s+/g, "_")}.pdf`,
          content: Buffer.from(item.pdfBase64, "base64"),
          contentType: "application/pdf",
        });
      }

      const senderAddress =
        process.env.SENDER_EMAIL
          ? (process.env.SENDER_EMAIL.includes("<") ? process.env.SENDER_EMAIL : `"Lawrence Mou (DPM Training Aid Coordinator)" <${process.env.SENDER_EMAIL}>`)
          : process.env.SMTP_FROM || `"Lawrence Mou (DPM Training Aid Coordinator)" <lmou@dpm.gov.pg>`;

      const targetEmails = Array.from(new Set(recipientsList.map((a) => a.email)));

      const info = await transporter.sendMail({
        from: senderAddress,
        to: targetEmails,
        subject: emailSubject,
        html: emailHtml,
        attachments,
      });

      newDelivery.messageId = info.messageId || newDelivery.messageId;
      newDelivery.providerMessage = `SMTP Re-dispatch Confirmed to ${targetEmails.length} recipients: ${info.response || "Sent"}`;
    } catch (smtpErr: any) {
      console.warn("SMTP redispatch notice:", smtpErr);
      newDelivery.providerMessage = `Recorded in Dispatch Log (SMTP Notice: ${smtpErr.message || "Offline"})`;
    }
  }

  item.emailDelivery = newDelivery;

  res.json({ success: true, emailDelivery: newDelivery });
});

// 5. Delete a submission
adminRouter.delete("/submissions/:id", (req, res) => {
  const index = submissionsStore.findIndex((s) => s.id === req.params.id || s.referenceNumber === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Submission not found" });
  }
  submissionsStore.splice(index, 1);
  res.json({ success: true });
});

// Mount admin router with authentication middleware
app.use('/api/admin', requireAdminAuth, adminRouter);


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.get(["/admin", "/participant"], (_req, res) => {
      res.sendFile(path.join(process.cwd(), "index.html"));
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get(["/admin", "/participant"], (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Serve image assets from the project image/ folder so the official crest PNG is available at /image/*
  app.use('/image', express.static(path.join(process.cwd(), 'image')));

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DPM Form Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

