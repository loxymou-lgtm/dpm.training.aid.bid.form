import React from "react";
import { Sparkles } from "lucide-react";
import { DPMBidFormData } from "../../types";

interface Step4Props {
  formData: DPMBidFormData;
  onChange: (field: keyof DPMBidFormData, value: any) => void;
  onOpenAiAssist: (
    sectionType: "job_description" | "training_needs" | "reintegration_plan",
    sectionTitle: string,
    currentValue: string
  ) => void;
  validationErrors?: Record<string, boolean>;
}

export const Step4JobNeedsReintegration: React.FC<Step4Props> = ({
  formData,
  onChange,
  onOpenAiAssist,
  validationErrors = {},
}) => {
  const hasError = (field: string) => !!validationErrors[field];
  const fieldClass = (field: string) => `dpm-input ${hasError(field) ? "dpm-input-error" : ""}`;

  return (
    <div className="space-y-6">
      <div className="section-note rounded-sm">
        Provide an overview of the applicant's current duties, the identified organizational training need, and the planned return-of-service reintegration upon course completion.
      </div>

      <div className="space-y-5">
        {/* Current Job Description */}
        <div className="field flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-[#394b59]">
              Current Job Description & Functional Responsibilities <span className="text-[#a33]">*</span>
            </label>
            <button
              type="button"
              id="ai-assist-job-desc-btn"
              onClick={() =>
                onOpenAiAssist(
                  "job_description",
                  "Current Job Description",
                  formData.currentJobDescription
                )
              }
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1d5f91] hover:underline cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-[#c79a38]" />
              AI Draft
            </button>
          </div>
          <textarea
            id="current-job-description-input"
            rows={5}
            value={formData.currentJobDescription}
            onChange={(e) => onChange("currentJobDescription", e.target.value)}
            placeholder="Outline main duties, operational responsibilities, and analytical scope of current role..."
            className={fieldClass("currentJobDescription")}
            required
            aria-invalid={hasError("currentJobDescription")}
          />
          {hasError("currentJobDescription") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Training Needs Identification */}
        <div className="field flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-[#394b59]">
              Training Needs Identification & Performance Gaps <span className="text-[#a33]">*</span>
            </label>
            <button
              type="button"
              id="ai-assist-training-needs-btn"
              onClick={() =>
                onOpenAiAssist(
                  "training_needs",
                  "Training Needs Identification",
                  formData.trainingNeedsIdentification
                )
              }
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1d5f91] hover:underline cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-[#c79a38]" />
              AI Draft
            </button>
          </div>
          <textarea
            id="training-needs-input"
            rows={5}
            value={formData.trainingNeedsIdentification}
            onChange={(e) => onChange("trainingNeedsIdentification", e.target.value)}
            placeholder="Describe specific capability gaps and how this training satisfies departmental objectives..."
            className={fieldClass("trainingNeedsIdentification")}
            required
            aria-invalid={hasError("trainingNeedsIdentification")}
          />
          {hasError("trainingNeedsIdentification") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Reintegration Plan */}
        <div className="field flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-[#394b59]">
              Reintegration Plan & Knowledge Transfer <span className="text-[#a33]">*</span>
            </label>
            <button
              type="button"
              id="ai-assist-reintegration-btn"
              onClick={() =>
                onOpenAiAssist(
                  "reintegration_plan",
                  "Reintegration Plan",
                  formData.reintegrationPlan
                )
              }
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1d5f91] hover:underline cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-[#c79a38]" />
              AI Draft
            </button>
          </div>
          <textarea
            id="reintegration-plan-input"
            rows={5}
            value={formData.reintegrationPlan}
            onChange={(e) => onChange("reintegrationPlan", e.target.value)}
            placeholder="Explain how new skills will be applied, including mentoring and workplace improvements..."
            className={fieldClass("reintegrationPlan")}
            required
            aria-invalid={hasError("reintegrationPlan")}
          />
          {hasError("reintegrationPlan") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>
      </div>
    </div>
  );
};

