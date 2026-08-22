import React from "react";
import { PenTool, FileCheck, Sparkles, Download, Send, Link2, Printer } from "lucide-react";
import { DPMBidFormData } from "../../types";

interface Step7Props {
  formData: DPMBidFormData;
  onChange: (field: keyof DPMBidFormData, value: any) => void;
  onOpenSignaturePad: (
    type: "dtc" | "deptHead",
    title: string,
    signeeName: string,
    signeeTitle: string
  ) => void;
  onSwitchToDocumentView: () => void;
  onTriggerPrint: () => void;
  onExportPdf?: () => void;
  onSubmitBid?: () => void;
  onOpenAiReview: () => void;
  onOpenShareLink?: () => void;
  isParticipantMode?: boolean;
  validationErrors?: Record<string, boolean>;
}

export const Step7DeptHeadActionOfficer: React.FC<Step7Props> = ({
  formData,
  onChange,
  onOpenSignaturePad,
  onSwitchToDocumentView,
  onTriggerPrint,
  onExportPdf,
  onSubmitBid,
  onOpenAiReview,
  onOpenShareLink,
  isParticipantMode = false,
  validationErrors = {},
}) => {
  const hasError = (field: string) => !!validationErrors[field];
  const fieldClass = (field: string) => `dpm-input ${hasError(field) ? "dpm-input-error" : ""}`;

  return (
    <div className="space-y-6">
      <div className="section-note rounded-sm">
        Authorized sign-off by the Substantive Departmental Head (or Gazetted Delegate) and recording of the departmental Action Officer contact particulars.
      </div>

      {/* Departmental Head Section */}
      <div className="space-y-4">
        <label className="text-[13px] font-bold text-[#12385b]">
          Departmental Head / Delegate Sign-off
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 sm:gap-5">
          <div className="field flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#394b59]">
              Departmental Head / Delegate Name <span className="text-[#a33]">*</span>
            </label>
            <input
              id="dept-head-name-input"
              type="text"
              value={formData.deptHeadName}
              onChange={(e) => onChange("deptHeadName", e.target.value)}
              placeholder="e.g. Koney Samuel"
              className={`${fieldClass("deptHeadName")} font-bold`}
              required
              aria-invalid={hasError("deptHeadName")}
            />
            {hasError("deptHeadName") && <span className="text-[11px] text-red-600">This field is required.</span>}
          </div>

          <div className="field flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#394b59]">
              Authority Capacity <span className="text-[#a33]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#24313d]">
                <input
                  type="radio"
                  name="deptHeadDesignation"
                  value="Agency Head"
                  checked={formData.deptHeadDesignation === "Agency Head"}
                  onChange={(e) => onChange("deptHeadDesignation", e.target.value as any)}
                  className="text-[#12385b] focus:ring-[#12385b]"
                />
                <span>Agency Head</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#24313d]">
                <input
                  type="radio"
                  name="deptHeadDesignation"
                  value="Delegate"
                  checked={formData.deptHeadDesignation === "Delegate"}
                  onChange={(e) => onChange("deptHeadDesignation", e.target.value as any)}
                  className="text-[#12385b] focus:ring-[#12385b]"
                />
                <span>Nominated Delegate</span>
              </label>
            </div>
          </div>

          {formData.deptHeadDesignation === "Delegate" && (
            <div className="field md:col-span-2 flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[#394b59]">
                Evidence of Delegation Note <span className="text-[#a33]">*</span>
              </label>
              <input
                id="delegation-evidence-note-input"
                type="text"
                value={formData.deptHeadDelegationEvidenceNote}
                onChange={(e) => onChange("deptHeadDelegationEvidenceNote", e.target.value)}
                placeholder="e.g. Gazetted Instrument of Delegation No. G104/2026 lodged with DPM"
                className="dpm-input"
              />
            </div>
          )}

          <div className="field flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#394b59]">
              Date of Sign-off <span className="text-[#a33]">*</span>
            </label>
            <input
              id="dept-head-sign-date-input"
              type="text"
              value={formData.deptHeadSignDate}
              onChange={(e) => onChange("deptHeadSignDate", e.target.value)}
              placeholder="DD/MM/YYYY"
              className="dpm-input"
            />
          </div>

          <div className="field flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#394b59]">
              Departmental Head Signature <span className="text-[#a33]">*</span>
            </label>
            {formData.deptHeadSignatureDataUrl ? (
              <div className="flex items-center justify-between border border-[#d7dde3] bg-[#f8fafc] p-2 rounded">
                <img
                  src={formData.deptHeadSignatureDataUrl}
                  alt="Agency Head Signature"
                  className="h-9 max-w-[160px] object-contain"
                />
                <button
                  type="button"
                  onClick={() =>
                    onOpenSignaturePad(
                      "deptHead",
                      "Departmental Head Digital Signature",
                      formData.deptHeadName,
                      formData.deptHeadDesignation
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
                id="open-dept-head-signature-pad-btn"
                onClick={() =>
                  onOpenSignaturePad(
                    "deptHead",
                    "Departmental Head Digital Signature",
                    formData.deptHeadName,
                    formData.deptHeadDesignation
                  )
                }
                className="dpm-btn-secondary inline-flex items-center justify-center gap-1.5 w-full cursor-pointer py-2.5 text-xs font-bold"
              >
                <PenTool className="h-3.5 w-3.5 text-[#12385b]" />
                Sign as Departmental Head
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Officer Details */}
      <div className="pt-4 border-t border-[#e2e8f0] space-y-4">
        <label className="text-[13px] font-bold text-[#12385b]">
          Departmental Training / HR Action Officer Particulars
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 sm:gap-5">
          <div className="field flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#394b59]">
              1. Action Officer Name <span className="text-[#a33]">*</span>
            </label>
            <input
              id="action-officer-name-input"
              type="text"
              value={formData.actionOfficerName}
              onChange={(e) => onChange("actionOfficerName", e.target.value)}
              placeholder="e.g. Theresa Bare"
              className="dpm-input"
            />
          </div>

          <div className="field flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#394b59]">
              2. Official Title / Designation <span className="text-[#a33]">*</span>
            </label>
            <input
              id="action-officer-title-input"
              type="text"
              value={formData.actionOfficerTitle}
              onChange={(e) => onChange("actionOfficerTitle", e.target.value)}
              placeholder="e.g. Manager - HR Development"
              className="dpm-input"
            />
          </div>

          <div className="field flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#394b59]">
              3. Telephone No <span className="text-[#a33]">*</span>
            </label>
            <input
              id="action-officer-telephone-input"
              type="text"
              value={formData.actionOfficerTelephone}
              onChange={(e) => onChange("actionOfficerTelephone", e.target.value)}
              placeholder="e.g. +675 301 1245"
              className="dpm-input"
            />
          </div>
        </div>
      </div>

      {/* Submission Actions Banner */}
      <div className="pt-5 border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f8fafc] p-4 rounded border border-[#d7dde3]">
        <div>
          <div className="text-xs font-bold text-[#12385b]">
            DPM Nomination Form Complete
          </div>
          <div className="text-[11px] text-[#667583]">
            {isParticipantMode
              ? "All required statutory sections have been recorded. You can now submit or print."
              : "Review document, perform AI audit check, or print/download for formal lodgement."}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onSubmitBid && (
            <button
              type="button"
              id="step7-submit-bid-btn"
              onClick={onSubmitBid}
              className="dpm-btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5 text-[#c79a38]" />
              Submit Form
            </button>
          )}

          {!isParticipantMode && onOpenShareLink && (
            <button
              type="button"
              id="step7-share-link-btn"
              onClick={onOpenShareLink}
              className="dpm-btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Link2 className="h-3.5 w-3.5 text-[#12385b]" />
              Share Link
            </button>
          )}

          {!isParticipantMode && (
            <button
              type="button"
              onClick={onOpenAiReview}
              className="dpm-btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#c79a38]" />
              Run Audit
            </button>
          )}

          <button
            type="button"
            onClick={onSwitchToDocumentView}
            className="dpm-btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <FileCheck className="h-3.5 w-3.5 text-[#12385b]" />
            Official View
          </button>

          {onExportPdf && (
            <button
              type="button"
              id="step7-export-pdf-btn"
              onClick={onExportPdf}
              className="dpm-btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-[#12385b]" />
              PDF
            </button>
          )}

          <button
            type="button"
            onClick={onTriggerPrint}
            className="dpm-btn-secondary text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5 text-[#12385b]" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

