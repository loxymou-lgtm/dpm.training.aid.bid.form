import React from "react";
import { Sparkles, PenTool } from "lucide-react";
import { DPMBidFormData } from "../../types";

interface Step6Props {
  formData: DPMBidFormData;
  onChange: (field: keyof DPMBidFormData, value: any) => void;
  onOpenAiAssist: (
    sectionType: "kra_justification" | "priority_job_group",
    sectionTitle: string,
    currentValue: string
  ) => void;
  onOpenSignaturePad: (
    type: "dtc" | "deptHead",
    title: string,
    signeeName: string,
    signeeTitle: string
  ) => void;
  validationErrors?: Record<string, boolean>;
}

export const Step6JustificationDTC: React.FC<Step6Props> = ({
  formData,
  onChange,
  onOpenAiAssist,
  onOpenSignaturePad,
  validationErrors = {},
}) => {
  const hasError = (field: string) => !!validationErrors[field];
  const fieldClass = (field: string) => `dpm-input ${hasError(field) ? "dpm-input-error" : ""}`;

  return (
    <div className="space-y-6">
      <div className="section-note rounded-sm">
        Provide strategic justification aligned with MTDP IV, national priority job groups, and official endorsement by the Departmental Training Committee (DTC).
      </div>

      <div className="space-y-5">
        {/* Identified relevant Key Result Areas */}
        <div className="field flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-[#394b59]">
              (a) Identified Relevant Key Result Areas (KRAs) <span className="text-[#a33]">*</span>
            </label>
            <button
              type="button"
              id="ai-assist-kra-btn"
              onClick={() =>
                onOpenAiAssist(
                  "kra_justification",
                  "Key Result Areas (KRAs)",
                  formData.kraJustification
                )
              }
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1d5f91] hover:underline cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-[#c79a38]" />
              AI Draft (MTDP IV Alignment)
            </button>
          </div>
          <textarea
            id="kra-justification-input"
            rows={5}
            value={formData.kraJustification}
            onChange={(e) => onChange("kraJustification", e.target.value)}
            placeholder="Link nomination to Medium Term Development Plan IV, Vision 2050, and Sector KRAs..."
            className={fieldClass("kraJustification")}
            required
            aria-invalid={hasError("kraJustification")}
          />
          {hasError("kraJustification") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Identified Priority Job Group */}
        <div className="field flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-[#394b59]">
              (b) Identified Priority Job Group <span className="text-[#a33]">*</span>
            </label>
            <button
              type="button"
              id="ai-assist-job-group-btn"
              onClick={() =>
                onOpenAiAssist(
                  "priority_job_group",
                  "Priority Job Group Justification",
                  formData.priorityJobGroupJustification
                )
              }
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1d5f91] hover:underline cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-[#c79a38]" />
              AI Draft
            </button>
          </div>
          <textarea
            id="priority-job-group-input"
            rows={4}
            value={formData.priorityJobGroupJustification}
            onChange={(e) => onChange("priorityJobGroupJustification", e.target.value)}
            placeholder="Detail the critical skills deficit in this job group and institutional priority..."
            className={fieldClass("priorityJobGroupJustification")}
            required
            aria-invalid={hasError("priorityJobGroupJustification")}
          />
          {hasError("priorityJobGroupJustification") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* DTC Endorsement */}
        <div className="pt-4 border-t border-[#e2e8f0] space-y-4">
          <label className="text-[13px] font-bold text-[#12385b]">
            Departmental Training Committee (DTC) Endorsement
          </label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#24313d]">
              <input
                type="radio"
                name="dtcEndorsement"
                value="YES"
                checked={formData.dtcEndorsement === "YES"}
                onChange={(e) => onChange("dtcEndorsement", e.target.value as any)}
                className="text-[#12385b] focus:ring-[#12385b]"
              />
              <span>YES (Formally Endorsed by DTC)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#24313d]">
              <input
                type="radio"
                name="dtcEndorsement"
                value="NO"
                checked={formData.dtcEndorsement === "NO"}
                onChange={(e) => onChange("dtcEndorsement", e.target.value as any)}
                className="text-[#12385b] focus:ring-[#12385b]"
              />
              <span>NO (Not Endorsed)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 sm:gap-5 pt-2">
            <div className="field flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[#394b59]">
                Name of Nominating Authority (DTC Chair) <span className="text-[#a33]">*</span>
              </label>
              <input
                id="dtc-authority-name-input"
                type="text"
                value={formData.dtcAuthorityName}
                onChange={(e) => onChange("dtcAuthorityName", e.target.value)}
                placeholder="e.g. Dr. Kila Wari, MBE"
                className={fieldClass("dtcAuthorityName")}
                required
                aria-invalid={hasError("dtcAuthorityName")}
              />
              {hasError("dtcAuthorityName") && <span className="text-[11px] text-red-600">This field is required.</span>}
            </div>

            <div className="field flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[#394b59]">
                Official Designation / Title <span className="text-[#a33]">*</span>
              </label>
              <input
                id="dtc-authority-title-input"
                type="text"
                value={formData.dtcAuthorityTitle}
                onChange={(e) => onChange("dtcAuthorityTitle", e.target.value)}
                placeholder="e.g. Chairperson, DTC / Deputy Secretary"
                className={fieldClass("dtcAuthorityTitle")}
                required
                aria-invalid={hasError("dtcAuthorityTitle")}
              />
              {hasError("dtcAuthorityTitle") && <span className="text-[11px] text-red-600">This field is required.</span>}
            </div>

            <div className="field flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[#394b59]">Endorsement Date</label>
              <input
                id="dtc-endorsement-date-input"
                type="text"
                value={formData.dtcEndorsementDate}
                onChange={(e) => onChange("dtcEndorsementDate", e.target.value)}
                placeholder="DD/MM/YYYY"
                className="dpm-input"
              />
            </div>

            <div className="field flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[#394b59]">
                DTC Authority Digital Signature <span className="text-[#a33]">*</span>
              </label>
              {formData.dtcSignatureDataUrl ? (
                <div className="flex items-center justify-between border border-[#d7dde3] bg-[#f8fafc] p-2 rounded">
                  <img
                    src={formData.dtcSignatureDataUrl}
                    alt="DTC Signature"
                    className="h-9 max-w-[160px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onOpenSignaturePad(
                        "dtc",
                        "DTC Authority Digital Signature",
                        formData.dtcAuthorityName,
                        formData.dtcAuthorityTitle
                      )
                    }
                    className="text-xs font-bold text-[#1d5f91] hover:underline cursor-pointer"
                  >
                    Change Signature
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="open-dtc-signature-pad-btn"
                  onClick={() =>
                    onOpenSignaturePad(
                      "dtc",
                      "DTC Authority Digital Signature",
                      formData.dtcAuthorityName,
                      formData.dtcAuthorityTitle
                    )
                  }
                  className="dpm-btn-secondary inline-flex items-center justify-center gap-1.5 w-full cursor-pointer py-2.5 text-xs font-bold"
                >
                  <PenTool className="h-3.5 w-3.5 text-[#12385b]" />
                  Sign DTC Endorsement
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

