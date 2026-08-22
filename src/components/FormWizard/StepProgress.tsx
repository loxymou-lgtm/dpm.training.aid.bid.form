import React from "react";
import { Check } from "lucide-react";

export interface StepItem {
  id: number;
  label: string;
}

export const WIZARD_STEPS: StepItem[] = [
  { id: 1, label: "Training" },
  { id: 2, label: "Applicant" },
  { id: 3, label: "Education" },
  { id: 4, label: "Training Need" },
  { id: 5, label: "Funding" },
  { id: 6, label: "Endorsement" },
  { id: 7, label: "Submit" },
];

interface StepProgressProps {
  currentStep: number;
  onSelectStep: (stepId: number) => void;
  completedSteps: number[];
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  onSelectStep,
  completedSteps,
}) => {
  return (
    <aside
      className="steps bg-white border border-[#d7dde3] rounded-lg p-3.5 shadow-xs"
      style={{ height: "max-content" }}
    >
      <div
        className="steps-title text-xs font-extrabold uppercase text-[#667583] tracking-wider px-2.5 pt-2 pb-3 border-b border-slate-100"
      >
        Application Sections
      </div>

      <div className="flex flex-col gap-1 mt-2">
        {WIZARD_STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);

          return (
            <button
              key={step.id}
              type="button"
              id={`wizard-step-btn-${step.id}`}
              onClick={() => onSelectStep(step.id)}
              className={`w-full flex items-center gap-2.5 py-2.5 px-2.5 rounded-md text-[13px] text-left transition cursor-pointer ${
                isActive
                  ? "bg-[#edf4f9] text-[#12385b] font-bold border-l-4 border-[#c79a38]"
                  : isCompleted
                  ? "text-[#24313d] hover:bg-[#f8fafc]"
                  : "text-[#5d6b77] hover:bg-[#f8fafc]"
              }`}
            >
              <div
                className={`w-[25px] h-[25px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition ${
                  isActive
                    ? "bg-[#12385b] text-white"
                    : isCompleted
                    ? "bg-[#1d5f91] text-white"
                    : "bg-[#e9edf1] text-[#5d6b77]"
                }`}
              >
                {isCompleted && !isActive ? (
                  <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                ) : (
                  step.id
                )}
              </div>
              <span className="truncate">{step.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

