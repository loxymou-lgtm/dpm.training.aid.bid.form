import React, { useState } from "react";
import { Sparkles, Loader2, Check, RefreshCw, X, FileText, ArrowRight } from "lucide-react";
import { DPMBidFormData } from "../types";

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionType: "job_description" | "training_needs" | "reintegration_plan" | "programme_description" | "kra_justification" | "priority_job_group";
  sectionTitle: string;
  nomineeData?: DPMBidFormData;
  formData?: DPMBidFormData;
  currentValue: string;
  onApplyText?: (newText: string) => void;
  onApplyGeneratedText?: (newText: string) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  sectionType,
  sectionTitle,
  nomineeData,
  formData,
  currentValue,
  onApplyText,
  onApplyGeneratedText,
}) => {
  const activeData = nomineeData || formData;
  const [userNotes, setUserNotes] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/ai/draft-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType,
          nomineeData: {
            family_name: activeData?.familyName || "",
            other_names: activeData?.otherNames || "",
            organisation: activeData?.organisation || "",
            organisation_sector: activeData?.organisationSector || "",
            substantive_position: activeData?.substantivePosition || "",
            acting_position: activeData?.actingPosition || "",
            course_title: activeData?.courseTitle || "",
            study_level: activeData?.proposedStudyLevel || "",
            aid_donor: activeData?.aidDonor || "",
            target_position: activeData?.targetedPositionUponCompletion || "",
          },
          userNotes: userNotes || currentValue,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setGeneratedText(data.result || "");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Unable to draft section with AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedText.trim()) {
      if (onApplyGeneratedText) {
        onApplyGeneratedText(generatedText);
      } else if (onApplyText) {
        onApplyText(generatedText);
      }
      onClose();
    }
  };

  return (
    <div
      id="ai-assistant-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div
        id="ai-assistant-modal-card"
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                DPM AI Drafting Assistant
              </h3>
              <p className="text-xs text-slate-500">
                Drafting: <span className="font-semibold text-slate-700">{sectionTitle}</span>
              </p>
            </div>
          </div>
          <button
            id="close-ai-assistant-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Nominee Summary Context Pill */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Context Pulled From Your Form:
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-slate-600">
              <div><span className="text-slate-400">Nominee:</span> {nomineeData.familyName ? `${nomineeData.familyName}, ${nomineeData.otherNames}` : "(Not filled yet)"}</div>
              <div><span className="text-slate-400">Position:</span> {nomineeData.substantivePosition || "(Not filled yet)"}</div>
              <div><span className="text-slate-400">Organisation:</span> {nomineeData.organisation || "(Not filled yet)"}</div>
              <div><span className="text-slate-400">Target Course:</span> {nomineeData.courseTitle || "(Not filled yet)"}</div>
            </div>
          </div>

          {/* User Specific Guidance Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Additional Details or Key Points (Optional)
            </label>
            <textarea
              id="ai-notes-input"
              rows={2}
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="e.g. Include mention of MTDP IV alignment, provincial training transfer, or specific software/methods..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Generate Button */}
          <div className="flex justify-start">
            <button
              type="button"
              id="generate-ai-draft-btn"
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PNG Public Service Draft...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {generatedText ? "Regenerate Draft" : "Draft Official Statement"}
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Output text area */}
          {generatedText && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Generated DPM Compliant Narrative
                </span>
                <span className="text-[10px] text-slate-400">You can edit the text directly before applying</span>
              </div>
              <textarea
                id="ai-generated-output"
                rows={7}
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-amber-50/20 p-3.5 text-xs leading-relaxed text-slate-800 font-sans focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600 shadow-inner"
              />
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
            Close
          </button>
          {generatedText && (
            <button
              type="button"
              id="apply-ai-draft-to-form-btn"
              onClick={handleApply}
              className="flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
            >
              <Check className="h-4 w-4" />
              Apply to Form Field
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
