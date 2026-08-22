import React, { useState } from "react";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  User,
  Award,
  Loader2,
  Mail,
  Download,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Users,
} from "lucide-react";
import { DPMBidFormData, DPMSubmissionRecord, DPM_DESIGNATED_ADMINS } from "../types";
import { validateDPMBidForm, ValidationSummary } from "../utils/formValidator";
import { getDPMBidFormPDFBase64, generateDPMBidFormPDF } from "../utils/pdfGenerator";

interface SubmitBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: DPMBidFormData;
  onSubmissionSuccess: (submission: DPMSubmissionRecord) => void;
  onNavigateToStep: (stepIndex: number) => void;
  onOpenAdminView?: () => void;
  isParticipantMode?: boolean;
}

export const SubmitBidModal: React.FC<SubmitBidModalProps> = ({
  isOpen,
  onClose,
  formData,
  onSubmissionSuccess,
  onNavigateToStep,
  onOpenAdminView,
  isParticipantMode = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string>("");
  const [submissionResult, setSubmissionResult] = useState<DPMSubmissionRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [adminEmail, setAdminEmail] = useState("admin@dpm.gov.pg");
  const [allowBypassValidation, setAllowBypassValidation] = useState(false);

  if (!isOpen) return null;

  const validation: ValidationSummary = validateDPMBidForm(formData);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      // Step 1: Generate PDF Base64
      setSubmissionStep("Generating official DPM print-ready PDF package...");
      const { base64: pdfBase64, fileName } = await getDPMBidFormPDFBase64(formData);

      // Step 2: Transmit to Backend with AI Evaluation & Email Dispatch
      setSubmissionStep("Running DPM AI audit & dispatching to Administrator...");
      const response = await fetch("/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          pdfBase64,
          adminEmailOverride: adminEmail,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Submission failed with status ${response.status}`);
      }

      const data = await response.json();
      setSubmissionStep("Submission confirmed!");
      setSubmissionResult(data.submission);
      onSubmissionSuccess(data.submission);
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage(err.message || "Failed to finalize and submit bid form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadSubmittedPdf = () => {
    if (submissionResult?.formData) {
      generateDPMBidFormPDF(submissionResult.formData);
    } else {
      generateDPMBidFormPDF(formData);
    }
  };

  return (
    <div
      id="submit-bid-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div
        id="submit-bid-modal-card"
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-red-950 via-slate-900 to-red-950 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-800 text-amber-300 shadow-md">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {submissionResult ? "Bid Submission Confirmed" : "Submit Training Aid Bid to DPM"}
              </h3>
              <p className="text-xs text-slate-300">
                Independent State of Papua New Guinea • Department of Personnel Management
              </p>
            </div>
          </div>
          <button
            id="close-submit-modal-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-6">
          {/* SUCCESS STATE */}
          {submissionResult ? (
            <div className="space-y-6 animate-in fade-in">
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-6 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <div className="space-y-1">
                  <span className="inline-block rounded-full bg-emerald-200/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">
                    Official Bid Lodged & Registered
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900">
                    Reference: {submissionResult.referenceNumber}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Your Training Aid Bid Form has been successfully registered with DPM. The submission package and AI Audit report have been dispatched to the Central Intake desk.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-left">
                  <div className="rounded-xl border border-emerald-200 bg-white p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Lodged For</span>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {submissionResult.formData.familyName}, {submissionResult.formData.otherNames}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-white p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Organisation</span>
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {submissionResult.formData.organisation}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-white p-3 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">AI Readiness</span>
                    <p className="text-xs font-extrabold text-emerald-700">
                      {submissionResult.aiAudit.readiness_score}/100 Score
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Transmission Notification */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Mail className="h-4 w-4 text-red-800" />
                    <span>DPM Intake Registry</span>
                  </div>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                    Registered
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  This submission has been formally recorded in the DPM Administrator intake registry and the official package has been copied to the designated DPM intake officers by email.
                </p>

                <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                  Message Subject: {submissionResult.emailDelivery.subject}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadSubmittedPdf}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Download Official PDF
                </button>
                {!isParticipantMode && onOpenAdminView && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminView();
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Admin Intake Dashboard
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            /* PRE-SUBMISSION FORM & VALIDATION SCREEN */
            <div className="space-y-6">
              {/* Validation Status Banner */}
              {!validation.isValid && !allowBypassValidation ? (
                <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-amber-950">
                        Incomplete Sections Detected ({validation.errors.length} items to review)
                      </h4>
                      <p className="text-xs text-amber-800">
                        Official DPM guidelines require completeness across all sections 1 to 17 before final statutory endorsement. You can jump directly to missing fields:
                      </p>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-amber-200/60 rounded-xl border border-amber-200 bg-white">
                    {validation.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 text-xs hover:bg-amber-50/40 transition"
                      >
                        <div>
                          <span className="font-bold text-slate-800">
                            Sec {err.sectionNumber} ({err.sectionName}):
                          </span>{" "}
                          <span className="text-slate-600">{err.message}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigateToStep(err.stepIndex);
                          }}
                          className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-200 transition"
                        >
                          Jump to Sec {err.sectionNumber}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setAllowBypassValidation(true)}
                      className="text-[11px] font-bold text-amber-900 underline hover:text-amber-950"
                    >
                      Bypass validation and submit as Provisional/Draft
                    </button>
                    <span className="text-[11px] font-bold text-amber-800">
                      Progress: {validation.percentage}% complete
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      All Mandatory Sections Validated (100% Complete)
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      Sections 1 to 17 including personal particulars, justifications, DTC and Departmental Head sign-off are verified.
                    </p>
                  </div>
                </div>
              )}

              {/* Nomination Summary Grid */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <FileText className="h-4 w-4 text-red-800" />
                  Submission Package Summary
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Nominee</span>
                    <p className="font-bold text-slate-800">
                      {formData.familyName || "—"}, {formData.otherNames || ""}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formData.substantivePosition || "Public Servant"} (Emp #{formData.employeeNo || "—"})
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Nominating Organisation</span>
                    <p className="font-bold text-slate-800">{formData.organisation || "—"}</p>
                    <p className="text-[11px] text-slate-500">{formData.organisationSector || "Public Sector"}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Proposed Programme</span>
                    <p className="font-bold text-slate-800">{formData.courseTitle || "—"}</p>
                    <p className="text-[11px] text-slate-500">Level: {formData.proposedStudyLevel || "—"}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Aid Donor & Venue</span>
                    <p className="font-bold text-slate-800">{formData.aidDonor || "—"}</p>
                    <p className="text-[11px] text-slate-500 truncate">{formData.venue || "—"}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">DTC Endorsement</span>
                    <p className="font-bold text-slate-800">{formData.dtcAuthorityName || "Pending Sign-off"}</p>
                    <p className="text-[11px] text-slate-500">{formData.dtcAuthorityTitle || "—"}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Departmental Head</span>
                    <p className="font-bold text-slate-800">{formData.deptHeadName || "Pending Sign-off"}</p>
                    <p className="text-[11px] text-slate-500">Capacity: {formData.deptHeadDesignation || "Agency Head"}</p>
                  </div>
                </div>

                {/* Target Intake Dispatch Administrators (All 3 Admins) */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase text-slate-700">
                      Designated DPM Intake Administrators (All 3 Receive Form):
                    </label>
                    <span className="text-[10px] font-bold text-red-900 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      Official DPM Secretariat
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {DPM_DESIGNATED_ADMINS.map((admin, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 space-y-1 hover:border-red-300 transition"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-800 text-[10px] text-white">
                            {idx + 1}
                          </span>
                          <span className="truncate">{admin.name}</span>
                        </div>
                        <p className="font-mono text-[11px] font-semibold text-red-900 truncate">
                          {admin.email}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{admin.role}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500 pt-1">
                    Upon submission, the backend automatically generates the official signed PDF package, conducts automated MTDP IV AI screening, and dispatches intake notifications to <strong>Lawrence Mou</strong>, <strong>Eileen Wahee</strong>, and <strong>Agnes Tamate</strong>.
                  </p>
                </div>
              </div>

              {/* Error Alert if any */}
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* Submission CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel & Return to Form
                </button>

                <button
                  type="button"
                  id="confirm-dpm-submission-btn"
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!validation.isValid && !allowBypassValidation)}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-extrabold text-white shadow-lg transition ${
                    isSubmitting || (!validation.isValid && !allowBypassValidation)
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-slate-900 cursor-pointer"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{submissionStep || "Processing Submission..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Confirm & Submit to DPM</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
