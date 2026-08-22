import React, { useState } from "react";
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle, XCircle, Sparkles, X, Award } from "lucide-react";
import { DPMBidFormData, AIReviewResult } from "../types";

interface AiReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: DPMBidFormData;
  onNavigateToStep?: (stepId: number) => void;
}

export const AiReviewModal: React.FC<AiReviewModalProps> = ({
  isOpen,
  onClose,
  formData,
  onNavigateToStep,
}) => {
  const [reviewResult, setReviewResult] = useState<AIReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleRunReview = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/ai/review-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      setReviewResult(data.review);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to audit bid form.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="ai-review-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div
        id="ai-review-modal-card"
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-red-900 to-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-800 text-amber-300 shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                DPM Compliance & Quality Audit
              </h3>
              <p className="text-xs text-red-200">
                Department of Personnel Management Screening Simulator
              </p>
            </div>
          </div>
          <button
            id="close-ai-review-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-red-200 hover:bg-red-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {!reviewResult && !isLoading && (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-800 border border-red-100">
                <Award className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-base font-bold text-slate-800">
                  Analyze Bid Readiness for DPM Review
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Evaluate your nomination for alignment with PNG MTDP IV, clarity of reintegration plan, 2-year prior training rules, and departmental sign-off completeness.
                </p>
              </div>
              <button
                type="button"
                id="start-ai-review-btn"
                onClick={handleRunReview}
                className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-red-900 transition"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                Run DPM Audit Now
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12 space-y-3">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-800" />
              <p className="text-sm font-semibold text-slate-700">
                Auditing bid form against PNG Public Service guidelines...
              </p>
              <p className="text-xs text-slate-400">
                Checking KRA justifications, reintegration feasibility, and required authorities.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Audit Service Error
              </div>
              <p>{errorMessage}</p>
              <button
                type="button"
                onClick={handleRunReview}
                className="text-xs font-semibold underline text-red-800 hover:text-red-900"
              >
                Try Again
              </button>
            </div>
          )}

          {reviewResult && (
            <div className="space-y-6">
              {/* Readiness Score Card */}
              <div className="flex flex-col sm:flex-row items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-red-50/40 p-5 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Estimated DPM Screening Readiness
                  </span>
                  <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                    {reviewResult.summary}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-16 w-16 flex-col items-center justify-center rounded-2xl border text-center shadow-sm ${
                      reviewResult.readiness_score >= 80
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : reviewResult.readiness_score >= 60
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-red-200 bg-red-50 text-red-800"
                    }`}
                  >
                    <span className="text-2xl font-black">{reviewResult.readiness_score}%</span>
                    <span className="text-[9px] font-bold uppercase tracking-tight">Score</span>
                  </div>
                </div>
              </div>

              {/* Compliance Checklist Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  DPM Criteria Verification
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reviewResult.dpm_compliance_checks?.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{item.check}</span>
                        {item.status === "PASS" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> PASS
                          </span>
                        )}
                        {item.status === "WARNING" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            <AlertTriangle className="h-3 w-3" /> ATTENTION
                          </span>
                        )}
                        {item.status === "FAIL" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                            <XCircle className="h-3 w-3" /> INCOMPLETE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-normal">{item.comment}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Key Application Strengths
                  </h5>
                  <ul className="space-y-1.5 text-xs text-emerald-950 list-disc list-inside">
                    {reviewResult.strengths?.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Recommended Refinements
                  </h5>
                  <ul className="space-y-1.5 text-xs text-amber-950 list-disc list-inside">
                    {reviewResult.improvements?.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Close Audit
          </button>
          {reviewResult && (
            <button
              type="button"
              id="re-run-ai-review-btn"
              onClick={handleRunReview}
              className="flex items-center gap-2 rounded-lg bg-red-800 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-900 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Re-evaluate Form
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
