import React from "react";
import { Sparkles, Paperclip, Check, FileUp } from "lucide-react";
import { DPMBidFormData } from "../../types";

interface Step5Props {
  formData: DPMBidFormData;
  onChange: (field: keyof DPMBidFormData, value: any) => void;
  onOpenAiAssist: (
    sectionType: "programme_description",
    sectionTitle: string,
    currentValue: string
  ) => void;
  validationErrors?: Record<string, boolean>;
}

export const Step5ProgramTarget: React.FC<Step5Props> = ({
  formData,
  onChange,
  onOpenAiAssist,
  validationErrors = {},
}) => {
  const hasError = (field: string) => !!validationErrors[field];
  const fieldClass = (field: string) => `dpm-input ${hasError(field) ? "dpm-input-error" : ""}`;

  const handleBrochureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange("courseBrochureFileName", file.name);
    }
  };

  return (
    <div className="space-y-6">
      <div className="section-note rounded-sm">
        Provide full description of the proposed training program, syllabus structure, and the target role/position upon course completion.
      </div>

      <div className="space-y-5">
        {/* Description of Proposed Programme */}
        <div className="field flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-[#394b59]">
              Description of Proposed Programme & Course Syllabus <span className="text-[#a33]">*</span>
            </label>
            <button
              type="button"
              id="ai-assist-programme-desc-btn"
              onClick={() =>
                onOpenAiAssist(
                  "programme_description",
                  "Description of Proposed Programme",
                  formData.descriptionOfProposedProgramme
                )
              }
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1d5f91] hover:underline cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-[#c79a38]" />
              AI Draft
            </button>
          </div>
          <textarea
            id="proposed-programme-desc-input"
            rows={6}
            value={formData.descriptionOfProposedProgramme}
            onChange={(e) => onChange("descriptionOfProposedProgramme", e.target.value)}
            placeholder="Outline course modules, duration, thesis or practical attachment requirements..."
            className={fieldClass("descriptionOfProposedProgramme")}
            required
            aria-invalid={hasError("descriptionOfProposedProgramme")}
          />
          {hasError("descriptionOfProposedProgramme") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Brochure Attachment Box */}
        <div className="p-3.5 border border-[#d7dde3] bg-[#f8fafc] rounded flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Paperclip className="h-4 w-4 text-[#1d5f91]" />
            <div>
              <div className="text-xs font-bold text-[#24313d]">Course Brochure / Prospectus</div>
              <div className="text-[11px] text-[#667583]">
                {formData.courseBrochureFileName ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="h-3 w-3" /> Attached: {formData.courseBrochureFileName}
                  </span>
                ) : (
                  "Attach syllabus or course brochure if available"
                )}
              </div>
            </div>
          </div>
          <label
            htmlFor="course-brochure-file-input"
            className="dpm-btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <FileUp className="h-3.5 w-3.5" />
            {formData.courseBrochureFileName ? "Change File" : "Upload Brochure"}
            <input
              id="course-brochure-file-input"
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg"
              onChange={handleBrochureUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Targeted Position Upon Completion */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Targeted Position / Designation Upon Completion <span className="text-[#a33]">*</span>
          </label>
          <input
            id="targeted-position-input"
            type="text"
            value={formData.targetedPositionUponCompletion}
            onChange={(e) => onChange("targetedPositionUponCompletion", e.target.value)}
            placeholder="e.g. Principal Policy Officer / Director - Planning Division"
            className={fieldClass("targetedPositionUponCompletion")}
            required
            aria-invalid={hasError("targetedPositionUponCompletion")}
          />
          {hasError("targetedPositionUponCompletion") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>
      </div>
    </div>
  );
};

