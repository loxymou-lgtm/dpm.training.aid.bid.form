import React, { useState, useEffect, useMemo } from "react";
import nationalEmblemUrl from "../image/png-national-emblem.png?url";
import {
  Sparkles,
  Printer,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Users,
  CheckCircle,
  Save,
  FolderOpen,
  Eye,
  SlidersHorizontal,
  Send,
  ShieldCheck,
} from "lucide-react";
import { DPMBidFormData, DPMSubmissionRecord } from "./types";
import { sampleProfiles, initialEmptyBidForm } from "./data/sampleProfiles";
import { Header } from "./components/Header";
import { StepProgress, WIZARD_STEPS } from "./components/FormWizard/StepProgress";
import { Step1CourseInfo } from "./components/FormWizard/Step1CourseInfo";
import { Step2PersonalParticulars } from "./components/FormWizard/Step2PersonalParticulars";
import { Step3EducationHistory } from "./components/FormWizard/Step3EducationHistory";
import { Step4JobNeedsReintegration } from "./components/FormWizard/Step4JobNeedsReintegration";
import { Step5ProgramTarget } from "./components/FormWizard/Step5ProgramTarget";
import { Step6JustificationDTC } from "./components/FormWizard/Step6JustificationDTC";
import { Step7DeptHeadActionOfficer } from "./components/FormWizard/Step7DeptHeadActionOfficer";
import { OfficialDocumentView } from "./components/OfficialDocumentView";
import { AiAssistantModal } from "./components/AiAssistantModal";
import { AiReviewModal } from "./components/AiReviewModal";
import { SignaturePadModal } from "./components/SignaturePadModal";
import { DraftsManagerModal } from "./components/DraftsManagerModal";
import { SubmitBidModal } from "./components/SubmitBidModal";
import { AdminSubmissionsDashboard } from "./components/AdminSubmissionsDashboard";
import { ShareParticipantLinkModal } from "./components/ShareParticipantLinkModal";
import { generateDPMBidFormPDF } from "./utils/pdfGenerator";
import { Link2, Building, Award, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "dpm_bid_form_active_draft";
const ADMIN_AUTH_STORAGE_KEY = "dpm_admin_authenticated";
const OFFICIAL_ADMIN_EMAIL = "scholarship@dpm";

export default function App() {
  // Form State
  const [formData, setFormData] = useState<DPMBidFormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return { ...initialEmptyBidForm, ...parsed };
        }
      }
    } catch (e) {
      console.warn("Failed to load stored form draft", e);
    }
    return initialEmptyBidForm;
  });

  const FIELD_ID_MAP: Record<string, string> = {
    courseTitle: "training-title-input",
    trainingProvider: "training-provider-input",
    countryLocation: "training-location-input",
    trainingStartDate: "training-start-date",
    trainingEndDate: "training-end-date",
    modeOfDelivery: "mode-of-delivery-select",
    trainingCategory: "training-category-select",
    organisation: "org-name-input",
    aidDonor: "aid-donor-input",
    descriptionOfProposedProgramme: "proposed-programme-desc-input",
    familyName: "personal-family-name",
    otherNames: "personal-other-names",
    employeeNo: "employee-no-input",
    nidNo: "nid-no-input",
    gender: "gender-select",
    dateOfBirth: "dob-input",
    age: "age-input",
    substantivePosition: "substantive-position-input",
    datePermanencyPublicService: "permanency-date-input",
    email: "email-input",
    mobile: "mobile-phone-input",
    provinceDistrictWorking: "province-district-working-input",
    emergencyName: "emergency-name-input",
    emergencyPhone: "emergency-phone-input",
    secondaryQualificationType: "secondary-qualification-type",
    highestGradeCompleted: "highest-grade-input",
    provincialHighSchoolAttended: "high-school-attended-input",
    qualifications: "qualification-table",
    currentJobDescription: "current-job-description-input",
    trainingNeedsIdentification: "training-needs-input",
    reintegrationPlan: "reintegration-plan-input",
    targetedPositionUponCompletion: "targeted-position-input",
    kraJustification: "kra-justification-input",
    priorityJobGroupJustification: "priority-job-group-input",
    dtcAuthorityName: "dtc-authority-name-input",
    dtcAuthorityTitle: "dtc-authority-title-input",
    dtcSignatureDataUrl: "open-dtc-signature-pad-btn",
    deptHeadName: "dept-head-name-input",
    deptHeadDesignation: "dept-head-designation-group",
    deptHeadSignDate: "dept-head-sign-date-input",
    deptHeadSignatureDataUrl: "open-dept-head-signature-pad-btn",
    actionOfficerName: "action-officer-name-input",
    actionOfficerTitle: "action-officer-title-input",
    actionOfficerTelephone: "action-officer-phone-input",
  };

  const getActiveSectionValidation = (stepNumber: number, data: DPMBidFormData): Record<string, boolean> => {
    const invalid: Record<string, boolean> = {};

    const markInvalid = (field: keyof DPMBidFormData) => {
      invalid[String(field)] = true;
    };

    const hasText = (value: unknown) => typeof value === "string" ? value.trim().length > 0 : Boolean(value);

    if (stepNumber === 1) {
      if (!hasText(data.courseTitle)) markInvalid("courseTitle");
      if (!hasText(data.trainingProvider) && !hasText(data.venue)) markInvalid("trainingProvider");
      if (!hasText(data.countryLocation) && !hasText(data.venue)) markInvalid("countryLocation");
      if (!hasText(data.trainingStartDate) && !hasText(data.durationFromDate)) markInvalid("trainingStartDate");
      if (!hasText(data.trainingEndDate) && !hasText(data.durationToDate)) markInvalid("trainingEndDate");
      if (!hasText(data.modeOfDelivery)) markInvalid("modeOfDelivery");
      if (!hasText(data.trainingCategory)) markInvalid("trainingCategory");
      if (!hasText(data.organisation)) markInvalid("organisation");
      if (!hasText(data.aidDonor)) markInvalid("aidDonor");
    }

    if (stepNumber === 2) {
      if (!hasText(data.familyName)) markInvalid("familyName");
      if (!hasText(data.otherNames)) markInvalid("otherNames");
      if (!hasText(data.employeeNo)) markInvalid("employeeNo");
      if (!hasText(data.nidNo)) markInvalid("nidNo");
      if (!hasText(data.gender)) markInvalid("gender");
      if (!hasText(data.dateOfBirth)) markInvalid("dateOfBirth");
      if (!hasText(data.substantivePosition)) markInvalid("substantivePosition");
      if (!hasText(data.datePermanencyPublicService)) markInvalid("datePermanencyPublicService");
      if (!hasText(data.email)) markInvalid("email");
      if (!hasText(data.mobile)) markInvalid("mobile");
      if (!hasText(data.provinceDistrictWorking)) markInvalid("provinceDistrictWorking");
      if (!hasText(data.emergencyName)) markInvalid("emergencyName");
      if (!hasText(data.emergencyPhone)) markInvalid("emergencyPhone");
    }

    if (stepNumber === 3) {
      if (!hasText(data.secondaryQualificationType)) markInvalid("secondaryQualificationType");
      if ((data.secondaryQualificationType === "Grade Twelve or Above" || data.secondaryQualificationType === "Grade Ten") && !hasText(data.highestGradeCompleted)) {
        markInvalid("highestGradeCompleted");
      }
      if (data.secondaryQualificationType === "Grade Twelve or Above" && !hasText(data.provincialHighSchoolAttended)) {
        markInvalid("provincialHighSchoolAttended");
      }
      if (!(data.qualifications && data.qualifications.length > 0 && data.qualifications.some((qualification) =>
        hasText(qualification.institution) || hasText(qualification.year) || hasText(qualification.courses) || hasText(qualification.qualifications)
      ))) {
        markInvalid("qualifications");
      }
      if (!hasText(data.hasAttendedProgrammeLastTwoYears)) markInvalid("hasAttendedProgrammeLastTwoYears");
    }

    if (stepNumber === 4) {
      if (!(data.currentJobDescription && data.currentJobDescription.trim().length > 20)) markInvalid("currentJobDescription");
      if (!(data.trainingNeedsIdentification && data.trainingNeedsIdentification.trim().length > 20)) markInvalid("trainingNeedsIdentification");
      if (!(data.reintegrationPlan && data.reintegrationPlan.trim().length > 20)) markInvalid("reintegrationPlan");
    }

    if (stepNumber === 5) {
      if (!(data.descriptionOfProposedProgramme && data.descriptionOfProposedProgramme.trim().length > 20)) markInvalid("descriptionOfProposedProgramme");
      if (!hasText(data.targetedPositionUponCompletion)) markInvalid("targetedPositionUponCompletion");
    }

    if (stepNumber === 6) {
      if (!(data.kraJustification && data.kraJustification.trim().length > 20)) markInvalid("kraJustification");
      if (!(data.priorityJobGroupJustification && data.priorityJobGroupJustification.trim().length > 10)) markInvalid("priorityJobGroupJustification");
      if (!hasText(data.dtcAuthorityName)) markInvalid("dtcAuthorityName");
      if (!hasText(data.dtcAuthorityTitle)) markInvalid("dtcAuthorityTitle");
      if (!hasText(data.dtcSignatureDataUrl)) markInvalid("dtcSignatureDataUrl");
    }

    if (stepNumber === 7) {
      if (!hasText(data.deptHeadName)) markInvalid("deptHeadName");
      if (!hasText(data.deptHeadDesignation)) markInvalid("deptHeadDesignation");
      if (!hasText(data.deptHeadSignDate)) markInvalid("deptHeadSignDate");
      if (!hasText(data.deptHeadSignatureDataUrl)) markInvalid("deptHeadSignatureDataUrl");
      if (!hasText(data.actionOfficerName)) markInvalid("actionOfficerName");
      if (!hasText(data.actionOfficerTitle)) markInvalid("actionOfficerTitle");
      if (!hasText(data.actionOfficerTelephone)) markInvalid("actionOfficerTelephone");
    }

    return invalid;
  };

  const [stepValidationState, setStepValidationState] = useState<Record<number, Record<string, boolean>>>({});

  const handleStepAdvance = (nextStep: number) => {
    const invalidFields = getActiveSectionValidation(currentStep, formData);
    if (Object.keys(invalidFields).length > 0) {
      setStepValidationState((prev) => ({ ...prev, [currentStep]: invalidFields }));
      const fieldName = Object.keys(invalidFields)[0];
      const fieldId = FIELD_ID_MAP[fieldName] || fieldName;
      const input = document.getElementById(fieldId) as HTMLElement | null;
      input?.focus();
      return;
    }
    setStepValidationState((prev) => ({ ...prev, [currentStep]: {} }));
    setCurrentStep(nextStep);
  };

  const initialAdminRoute = typeof window !== "undefined" && window.location.pathname === "/admin";
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"wizard" | "document" | "admin">(
    initialAdminRoute ? "admin" : "wizard"
  );
  const [isParticipantMode, setIsParticipantMode] = useState<boolean>(!initialAdminRoute);
  const [adminLoginEmail, setAdminLoginEmail] = useState<string>("");
  const [adminLoginEmailPassword, setAdminLoginEmailPassword] = useState<string>("");
  const [adminLoginError, setAdminLoginError] = useState<string>("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "true";
  });
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [invitationInfo, setInvitationInfo] = useState<{
    token: string;
    targetDepartment?: string;
    targetDonor?: string;
    targetNomineeName?: string;
    targetNomineeEmail?: string;
    courseTitle?: string;
    studyLevel?: string;
  } | null>(null);

  // Modals state
  const [aiAssistantState, setAiAssistantState] = useState<{
    isOpen: boolean;
    sectionType:
      | "job_description"
      | "training_needs"
      | "reintegration_plan"
      | "programme_description"
      | "kra_justification"
      | "priority_job_group";
    sectionTitle: string;
    currentValue: string;
  }>({
    isOpen: false,
    sectionType: "job_description",
    sectionTitle: "",
    currentValue: "",
  });

  const [isAiReviewOpen, setIsAiReviewOpen] = useState(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [signatureModalState, setSignatureModalState] = useState<{
    isOpen: boolean;
    type: "dtc" | "deptHead";
    title: string;
    signeeName: string;
    signeeTitle: string;
  }>({
    isOpen: false,
    type: "dtc",
    title: "",
    signeeName: "",
    signeeTitle: "",
  });

  // Parse URL query parameters on initial mount for participant links & modes
  useEffect(() => {
    try {
      const isAdminRoute = window.location.pathname === "/admin";
      const urlParams = new URLSearchParams(window.location.search);
      const inviteToken = urlParams.get("invite");
      const modeParam = urlParams.get("mode");

      if (isAdminRoute) {
        setViewMode("admin");
        setIsParticipantMode(false);
        return;
      }

      if (inviteToken || modeParam === "participant") {
        setIsParticipantMode(true);
        setViewMode("wizard");
      } else {
        setIsParticipantMode(true);
        setViewMode("wizard");
      }

      if (modeParam === "document") {
        setViewMode("document");
      }

      // Check for URL query parameter pre-fills (for shared open links)
      const qOrg = urlParams.get("org");
      const qDonor = urlParams.get("donor");
      const qLevel = urlParams.get("level");
      const qNominee = urlParams.get("nominee");
      const qEmail = urlParams.get("email");
      const qCourse = urlParams.get("course");

      if (qOrg || qDonor || qLevel || qNominee || qEmail || qCourse) {
        setFormData((prev) => ({
          ...initialEmptyBidForm,
          ...(qOrg && { organisation: qOrg }),
          ...(qDonor && { aidDonor: qDonor }),
          ...(qLevel && { proposedStudyLevel: qLevel }),
          ...(qCourse && { courseTitle: qCourse }),
          ...(qEmail && { email: qEmail }),
          ...(qNominee && {
            familyName: qNominee.split(" ").pop() || "",
            otherNames: qNominee.split(" ").slice(0, -1).join(" ") || "",
          }),
        }));
      }

      if (inviteToken) {
        // Fetch invitation details and increment visit count
        fetch(`/api/invitations/${inviteToken}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && data.invitation) {
              const inv = data.invitation;
              setInvitationInfo({
                token: inv.token,
                targetDepartment: inv.targetDepartment,
                targetDonor: inv.targetDonor,
                targetNomineeName: inv.targetNomineeName,
                targetNomineeEmail: inv.targetNomineeEmail,
                courseTitle: inv.targetCourseTitle,
                studyLevel: inv.studyLevel,
              });

              // Initialize with a clean form populated with invitation presets
              setFormData({
                ...initialEmptyBidForm,
                invitationToken: inv.token,
                ...(inv.targetDepartment && { organisation: inv.targetDepartment }),
                ...(inv.sectorCategory && { organisationSector: inv.sectorCategory }),
                ...(inv.targetDonor && { aidDonor: inv.targetDonor }),
                ...(inv.studyLevel && { proposedStudyLevel: inv.studyLevel }),
                ...(inv.targetCourseTitle && { courseTitle: inv.targetCourseTitle }),
                ...(inv.targetNomineeEmail && { email: inv.targetNomineeEmail }),
                ...(inv.targetNomineeName && {
                  familyName: inv.targetNomineeName.split(" ").pop() || "",
                  otherNames: inv.targetNomineeName.split(" ").slice(0, -1).join(" ") || "",
                }),
              });

              showToast(`Welcome! Official Nomination Form loaded for ${inv.targetDepartment}`);
            }
          })
          .catch((err) => console.warn("Failed to load invitation token", err));
      }
    } catch (e) {
      console.warn("Error parsing URL params", e);
    }
  }, []);

  // Auto-save active draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.error("Failed to auto-save draft", e);
    }
  }, [formData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Field change handler
  const handleFieldChange = (field: keyof DPMBidFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "familyName" && { familyName: value }),
      ...(field === "otherNames" && { otherNames: value }),
    }));

    setStepValidationState((prev) => {
      const nextStepState = { ...(prev[currentStep] || {}) };
      delete nextStepState[String(field)];
      return {
        ...prev,
        [currentStep]: nextStepState,
      };
    });
  };

  // Calculate completion percentage
  const { percentage: completionPercentage, completedSteps } = useMemo(() => {
    const requiredChecks = [
      // Step 1
      !!(formData?.bidYear && formData?.familyName && formData?.proposedStudyLevel && formData?.courseTitle && formData?.organisation && formData?.aidDonor && formData?.venue),
      // Step 2
      !!(formData?.employeeNo && formData?.gender && formData?.datePermanencyPublicService && formData?.substantivePosition && formData?.mobile && formData?.emergencyName && formData?.emergencyPhone),
      // Step 3
      !!(formData?.secondaryQualificationType && (formData?.secondaryQualificationType === "Grade Ten" || formData?.highestGradeCompleted) && (formData?.qualifications?.length || 0) > 0 && formData?.hasAttendedProgrammeLastTwoYears),
      // Step 4
      !!(formData?.currentJobDescription?.trim().length > 20 && formData?.trainingNeedsIdentification?.trim().length > 20 && formData?.reintegrationPlan?.trim().length > 20),
      // Step 5
      !!(formData?.descriptionOfProposedProgramme?.trim().length > 20 && formData?.targetedPositionUponCompletion?.trim().length > 2),
      // Step 6
      !!(formData?.kraJustification?.trim().length > 20 && formData?.priorityJobGroupJustification?.trim().length > 10 && formData?.dtcAuthorityName && formData?.dtcSignatureDataUrl),
      // Step 7
      !!(formData?.deptHeadName && formData?.deptHeadSignatureDataUrl && formData?.actionOfficerName && formData?.actionOfficerTelephone),
    ];

    const completed = requiredChecks
      .map((isMet, idx) => (isMet ? idx + 1 : null))
      .filter((step): step is number => step !== null);

    const pct = Math.round((completed.length / 7) * 100);
    return { percentage: pct, completedSteps: completed };
  }, [formData]);

  // Sample Profile Loader
  const handleSelectSampleProfile = (profileOrId: string | DPMBidFormData) => {
    if (typeof profileOrId === "string") {
      const found = sampleProfiles.find((p) => p.id === profileOrId);
      if (found) {
        setFormData(found.data);
        showToast(`Loaded sample public service profile: ${found.label}`);
      }
    } else if (profileOrId && typeof profileOrId === "object") {
      setFormData(profileOrId);
      const found = sampleProfiles.find((p) => p.data.courseTitle === profileOrId.courseTitle);
      showToast(`Loaded sample public service profile: ${found ? found.label : "Nominee Profile"}`);
    }
  };

  const handleResetForm = () => {
    if (window.confirm("Are you sure you want to reset the form to a blank template?")) {
      setFormData(initialEmptyBidForm);
      setCurrentStep(1);
      showToast("Form reset to blank official template");
    }
  };

  // Open AI Assist
  const handleOpenAiAssist = (
    sectionType: any,
    sectionTitle: string,
    currentValue: string
  ) => {
    setAiAssistantState({
      isOpen: true,
      sectionType,
      sectionTitle,
      currentValue,
    });
  };

  // Apply AI Drafted Text
  const handleApplyAiText = (generatedText: string) => {
    switch (aiAssistantState.sectionType) {
      case "job_description":
        handleFieldChange("currentJobDescription", generatedText);
        break;
      case "training_needs":
        handleFieldChange("trainingNeedsIdentification", generatedText);
        break;
      case "reintegration_plan":
        handleFieldChange("reintegrationPlan", generatedText);
        break;
      case "programme_description":
        handleFieldChange("descriptionOfProposedProgramme", generatedText);
        break;
      case "kra_justification":
        handleFieldChange("kraJustification", generatedText);
        break;
      case "priority_job_group":
        handleFieldChange("priorityJobGroupJustification", generatedText);
        break;
    }
    showToast(`AI text applied to ${aiAssistantState.sectionTitle}`);
  };

  // Open Signature Pad
  const handleOpenSignaturePad = (
    type: "dtc" | "deptHead",
    title: string,
    signeeName: string,
    signeeTitle: string
  ) => {
    setSignatureModalState({
      isOpen: true,
      type,
      title,
      signeeName,
      signeeTitle,
    });
  };

  // Save Signature
  const handleSaveSignature = (dataUrl: string) => {
    if (signatureModalState.type === "dtc") {
      handleFieldChange("dtcSignatureDataUrl", dataUrl);
      if (!formData.dtcEndorsementDate) {
        const today = new Date().toLocaleDateString("en-GB");
        handleFieldChange("dtcEndorsementDate", today);
      }
      showToast("DTC endorsement signature recorded");
    } else {
      handleFieldChange("deptHeadSignatureDataUrl", dataUrl);
      if (!formData.deptHeadSignDate) {
        const today = new Date().toLocaleDateString("en-GB");
        handleFieldChange("deptHeadSignDate", today);
      }
      showToast("Departmental Head signature recorded");
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      showToast("Generating official PDF document...");
      await generateDPMBidFormPDF(formData);
      showToast("Official PDF bid form generated successfully");
    } catch (err) {
      console.error("Failed to generate PDF", err);
      showToast("Error generating PDF document");
    }
  };

  const handleSubmissionSuccess = (submission: DPMSubmissionRecord) => {
    setFormData((prev) => ({
      ...prev,
      submissionStatus: "Submitted",
      submissionReferenceNumber: submission.referenceNumber,
      submissionTimestamp: submission.timestamp,
    }));
    showToast(`Bid officially registered: ${submission.referenceNumber}`);
  };

  const handleAdminLogin = async () => {
    const normalizedEmail = adminLoginEmail.trim().toLowerCase();

    if (normalizedEmail !== OFFICIAL_ADMIN_EMAIL) {
      setAdminLoginError("Only the official DPM Scholarship admin account can access this intake.");
      return;
    }

    setAdminLoginError("");

    try {
      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password: adminLoginEmailPassword || "" }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setAdminLoginError(data?.error || "Failed to sign in");
        return;
      }

      setIsAdminAuthenticated(true);
      window.sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "true");
      setIsParticipantMode(false);
      setViewMode("admin");
    } catch (err: any) {
      console.error("Admin login error", err);
      setAdminLoginError("Failed to reach authentication server");
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (e) {
      // ignore network errors on logout
    }
    window.sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    setIsAdminAuthenticated(false);
    setAdminLoginEmail("");
    setAdminLoginError("");
    setIsParticipantMode(true);
    setViewMode("wizard");
  };

  const isAdminAccessGateVisible =
    typeof window !== "undefined" && window.location.pathname === "/admin" && !isAdminAuthenticated;

  if (isAdminAccessGateVisible) {
    return (
      <div className="login-page-container bg-slate-100 p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
        >
          <img
            src={nationalEmblemUrl}
            alt=""
            className="select-none object-contain opacity-[0.22]"
            style={{
              width: "min(85vw, 750px)",
              height: "auto",
              filter: "grayscale(100%)",
            }}
          />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div
            className="sign-in-card w-full max-w-md rounded-2xl border border-white/70 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
            style={{
              background: "rgba(255, 255, 255, 0.82)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.18)",
            }}
          >
            <div className="mb-6 flex items-center justify-center">
              <img
                src={nationalEmblemUrl}
                alt="PNG National Emblem"
                className="h-16 w-16 object-contain bg-transparent opacity-100"
              />
            </div>

            <div className="mb-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c79a38]">
                Restricted Access
              </p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">DPM Admin Sign-In</h1>
              <p className="mt-2 text-sm text-slate-600">
                Only the official DPM scholarship administration account may enter the central intake console.
              </p>
            </div>

            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="admin-email">
              Official admin email
            </label>
            <input
              id="admin-email"
              type="email"
              value={adminLoginEmail}
              onChange={(event) => setAdminLoginEmail(event.target.value)}
              placeholder="scholarship@dpm"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-[#12385b] focus:ring-2 focus:ring-[#12385b]/15"
            />

            <label className="mt-3 block text-sm font-semibold text-slate-700" htmlFor="admin-password">
              Admin password
            </label>
            <input
              id="admin-password"
              type="password"
              value={adminLoginEmailPassword}
              onChange={(event) => setAdminLoginEmailPassword(event.target.value)}
              placeholder="Enter admin password"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-[#12385b] focus:ring-2 focus:ring-[#12385b]/15"
            />

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Use the official account: <span className="font-bold text-slate-900">{OFFICIAL_ADMIN_EMAIL}</span>
            </div>

            {adminLoginError && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {adminLoginError}
              </p>
            )}

            <button
              type="button"
              onClick={handleAdminLogin}
              className="mt-5 w-full rounded-xl bg-[#12385b] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0d2b47]"
            >
              Access Admin Intake
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-semibold shadow-xl flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Header & Control Shell */}
      <Header
        currentMode={viewMode}
        onModeChange={setViewMode}
        completionPercentage={completionPercentage}
        formData={formData}
        onOpenAiReview={() => setIsAiReviewOpen(true)}
        onOpenDrafts={() => setIsDraftsModalOpen(true)}
        onResetForm={handleResetForm}
        onSelectSampleProfile={handleSelectSampleProfile}
        onTriggerPrint={handleTriggerPrint}
        onExportPdf={handleExportPdf}
        onSubmitBid={() => setIsSubmitModalOpen(true)}
        onOpenShareLink={() => setIsShareModalOpen(true)}
        isParticipantMode={isParticipantMode}
        onSwitchToAdminView={() => {
          if (!isAdminAuthenticated) {
            setAdminLoginError("Please sign in with the official DPM admin account to continue.");
            window.location.href = "/admin";
            return;
          }
          setIsParticipantMode(false);
          setViewMode("admin");
        }}
        onAdminLogout={handleAdminLogout}
      />

      {/* Participant Invitation Banner (if accessed via generated link) */}
      {invitationInfo && viewMode === "wizard" && !isBannerDismissed && (
        <div className="bg-gradient-to-r from-red-900 via-slate-900 to-amber-950 text-white px-4 py-3 shadow-md border-b border-amber-500/30">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold shrink-0">
                <Link2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-amber-200 flex items-center gap-2">
                  <span>Official DPM Nomination Form</span>
                  <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono border border-amber-400/30">
                    ID: {invitationInfo.token}
                  </span>
                </p>
                <p className="text-slate-300 text-[11px]">
                  Pre-configured for <strong className="text-white">{invitationInfo.targetDepartment || "Public Service Nomination"}</strong> {invitationInfo.targetDonor ? `under ${invitationInfo.targetDonor}` : ""}. Fill in your information and submit when complete.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setIsBannerDismissed(true)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Step Progress (Visible only in wizard mode) */}
      {viewMode === "wizard" && (
        <StepProgress
          currentStep={currentStep}
          onSelectStep={setCurrentStep}
          completedSteps={completedSteps}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {viewMode === "admin" ? (
          /* Admin Submissions & Intake Registry View */
          <AdminSubmissionsDashboard
            onBackToWizard={() => setViewMode("wizard")}
            onOpenDocumentViewForData={(subData) => {
              setFormData(subData);
              setViewMode("document");
            }}
          />
        ) : viewMode === "wizard" ? (
          <div className="space-y-6">
            {/* Active Step Content */}
            {currentStep === 1 && (
              <Step1CourseInfo
                formData={formData}
                onChange={handleFieldChange}
                validationErrors={stepValidationState[currentStep] || {}}
              />
            )}

            {currentStep === 2 && (
              <Step2PersonalParticulars
                formData={formData}
                onChange={handleFieldChange}
                validationErrors={stepValidationState[currentStep] || {}}
              />
            )}

            {currentStep === 3 && (
              <Step3EducationHistory
                formData={formData}
                onChange={handleFieldChange}
                validationErrors={stepValidationState[currentStep] || {}}
              />
            )}

            {currentStep === 4 && (
              <Step4JobNeedsReintegration
                formData={formData}
                onChange={handleFieldChange}
                onOpenAiAssist={handleOpenAiAssist}
                validationErrors={stepValidationState[currentStep] || {}}
              />
            )}

            {currentStep === 5 && (
              <Step5ProgramTarget
                formData={formData}
                onChange={handleFieldChange}
                onOpenAiAssist={handleOpenAiAssist}
                validationErrors={stepValidationState[currentStep] || {}}
              />
            )}

            {currentStep === 6 && (
              <Step6JustificationDTC
                formData={formData}
                onChange={handleFieldChange}
                onOpenAiAssist={handleOpenAiAssist}
                onOpenSignaturePad={handleOpenSignaturePad}
                validationErrors={stepValidationState[currentStep] || {}}
              />
            )}

            {currentStep === 7 && (
              <Step7DeptHeadActionOfficer
                formData={formData}
                onChange={handleFieldChange}
                onOpenSignaturePad={handleOpenSignaturePad}
                onSwitchToDocumentView={() => setViewMode("document")}
                onTriggerPrint={handleTriggerPrint}
                onExportPdf={handleExportPdf}
                onSubmitBid={() => setIsSubmitModalOpen(true)}
                onOpenAiReview={() => setIsAiReviewOpen(true)}
                onOpenShareLink={() => setIsShareModalOpen(true)}
                isParticipantMode={isParticipantMode}
                validationErrors={stepValidationState[currentStep] || {}}
              />
            )}

            {/* Bottom Wizard Navigation Controls */}
            <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="wizard-prev-btn"
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("document")}
                  className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  Official Form Preview
                </button>
              </div>

              <div className="text-xs font-semibold text-slate-500 hidden md:block">
                Section {currentStep} of {WIZARD_STEPS.length}:{" "}
                <span className="text-slate-900 font-bold">
                  {WIZARD_STEPS[currentStep - 1].label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isParticipantMode && (
                  <button
                    type="button"
                    onClick={() => setIsAiReviewOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-600/10 border border-amber-300/80 px-3.5 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-600/20 transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-amber-700" />
                    Audit Bid
                  </button>
                )}

                {currentStep < 7 ? (
                  <button
                    type="button"
                    id="wizard-next-btn"
                    onClick={() => handleStepAdvance(Math.min(7, currentStep + 1))}
                    className="flex items-center gap-1.5 rounded-xl bg-red-800 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-900 transition cursor-pointer"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    id="wizard-submit-btn"
                    onClick={() => {
                      const invalidFields = getActiveSectionValidation(currentStep, formData);
                      if (Object.keys(invalidFields).length > 0) {
                        setStepValidationState((prev) => ({ ...prev, [currentStep]: invalidFields }));
                        const fieldName = Object.keys(invalidFields)[0];
                        const fieldId = FIELD_ID_MAP[fieldName] || fieldName;
                        document.getElementById(fieldId)?.focus();
                        return;
                      }
                      setIsSubmitModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-700 via-red-800 to-amber-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:from-red-800 hover:to-amber-800 transition cursor-pointer"
                  >
                    <Send className="h-4 w-4 text-amber-200" />
                    Submit
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Live Printable Official Document View */
          <OfficialDocumentView
            formData={formData}
            onEditSection={(stepId) => {
              setCurrentStep(stepId);
              setViewMode("wizard");
            }}
            onTriggerPrint={handleTriggerPrint}
            onOpenAiReview={() => setIsAiReviewOpen(true)}
          />
        )}
      </main>

      {/* Clean Global Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              Department of Personnel Management (DPM)
            </span>
            <span>•</span>
            <span>National Public Service Training Aid Form (Bid Year 2026)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            {!isParticipantMode && (
              <button
                type="button"
                onClick={() => {
                  setIsParticipantMode(true);
                  setViewMode("wizard");
                }}
                className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Preview Nominee View
              </button>
            )}
            <span>{isParticipantMode ? "Participant Nomination Submission Form" : "Port Moresby, Papua New Guinea"}</span>
          </div>
        </div>
      </footer>

      {/* Submit Bid Modal */}
      <SubmitBidModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        formData={formData}
        onSubmissionSuccess={handleSubmissionSuccess}
        onNavigateToStep={(stepIdx) => {
          setIsSubmitModalOpen(false);
          setCurrentStep(stepIdx + 1);
          setViewMode("wizard");
        }}
        onOpenAdminView={() => {
          setIsSubmitModalOpen(false);
          setViewMode("admin");
        }}
        isParticipantMode={isParticipantMode}
      />

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={aiAssistantState.isOpen}
        onClose={() => setAiAssistantState((prev) => ({ ...prev, isOpen: false }))}
        sectionType={aiAssistantState.sectionType}
        sectionTitle={aiAssistantState.sectionTitle}
        currentValue={aiAssistantState.currentValue}
        formData={formData}
        onApplyGeneratedText={handleApplyAiText}
      />

      {/* AI Compliance Review Modal */}
      <AiReviewModal
        isOpen={isAiReviewOpen}
        onClose={() => setIsAiReviewOpen(false)}
        formData={formData}
        onNavigateToStep={(stepId) => {
          setIsAiReviewOpen(false);
          setCurrentStep(stepId);
          setViewMode("wizard");
        }}
      />

      {/* Digital Signature Pad Modal */}
      <SignaturePadModal
        isOpen={signatureModalState.isOpen}
        onClose={() =>
          setSignatureModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onSaveSignature={handleSaveSignature}
        title={signatureModalState.title}
        signeeName={signatureModalState.signeeName}
        signeeTitle={signatureModalState.signeeTitle}
      />

      {/* Drafts and Export/Import Manager Modal */}
      <DraftsManagerModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        currentFormData={formData}
        onLoadDraft={(loaded) => {
          setFormData(loaded);
          showToast("Draft successfully loaded");
        }}
      />

      {/* Share Participant Link Modal */}
      <ShareParticipantLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentFormData={formData}
      />
    </div>
  );
}
