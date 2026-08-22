import React from "react";
import { DPMBidFormData } from "../../types";

interface Step1Props {
  formData: DPMBidFormData;
  onChange: (field: keyof DPMBidFormData, value: any) => void;
  validationErrors?: Record<string, boolean>;
}

const COMMON_DONORS = [
  "Australia Awards (DFAT)",
  "Japan International Cooperation Agency (JICA)",
  "New Zealand Aid Programme (MFAT)",
  "Korea International Cooperation Agency (KOICA)",
  "China-PNG Bilateral Aid / MOFCOM",
  "Commonwealth Scholarship Commission",
  "United Nations Development Programme (UNDP)",
  "World Bank / ADB Capacity Trust",
  "European Union (EU) Technical Cooperation",
  "Internal Agency Self-Funded / Government of PNG",
];

const SECTOR_CATEGORIES = [
  "Administration / Governance",
  "Economic & Strategic Planning",
  "Infrastructure & Transport",
  "Law, Justice & National Security",
  "Social & Community Development (Health)",
  "Education, Research & Higher Learning",
  "Provincial & Local Level Governments",
  "Environment, Conservation & Climate Change",
  "Agriculture, Fisheries & Primary Industries",
];

export const Step1CourseInfo: React.FC<Step1Props> = ({
  formData,
  onChange,
  validationErrors = {},
}) => {
  const hasError = (field: string) => !!validationErrors[field];
  const fieldClass = (field: string) => `dpm-input ${hasError(field) ? "dpm-input-error" : ""}`;

  return (
    <div className="space-y-6">
      <div className="section-note rounded-sm">
        Tell us the basic details of the training request. Required fields are marked with <b className="text-red-700">*</b>.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 sm:gap-5">
        {/* Title of Training / Programme */}
        <div className="field md:col-span-2 flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Training title <span className="text-[#a33]">*</span>
          </label>
          <input
            id="training-title-input"
            type="text"
            value={formData.courseTitle}
            onChange={(e) => onChange("courseTitle", e.target.value)}
            placeholder="e.g. Master of Public Policy"
            className={fieldClass("courseTitle")}
            required
            aria-invalid={hasError("courseTitle")}
          />
          {hasError("courseTitle") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Training Provider */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Institution <span className="text-[#a33]">*</span>
          </label>
          <input
            id="training-provider-input"
            type="text"
            value={formData.trainingProvider || formData.venue || ""}
            onChange={(e) => {
              onChange("trainingProvider", e.target.value);
              if (!formData.venue) onChange("venue", e.target.value);
            }}
            placeholder="e.g. University of Papua New Guinea"
            className={fieldClass("trainingProvider")}
            required
            aria-invalid={hasError("trainingProvider")}
          />
          {hasError("trainingProvider") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Country / Location */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Country <span className="text-[#a33]">*</span>
          </label>
          <input
            id="training-location-input"
            type="text"
            value={formData.countryLocation || formData.venue || ""}
            onChange={(e) => {
              onChange("countryLocation", e.target.value);
              onChange("venue", e.target.value);
            }}
            placeholder="e.g. Port Moresby, Papua New Guinea"
            className={fieldClass("countryLocation")}
            required
            aria-invalid={hasError("countryLocation")}
          />
          {hasError("countryLocation") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Training Start Date */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Start date <span className="text-[#a33]">*</span>
          </label>
          <input
            id="training-start-date"
            type="date"
            value={formData.trainingStartDate || formData.durationFromDate || ""}
            onChange={(e) => {
              onChange("trainingStartDate", e.target.value);
              onChange("durationFromDate", e.target.value);
            }}
            className={fieldClass("trainingStartDate")}
            required
            aria-invalid={hasError("trainingStartDate")}
          />
          {hasError("trainingStartDate") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Training End Date */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            End date <span className="text-[#a33]">*</span>
          </label>
          <input
            id="training-end-date"
            type="date"
            value={formData.trainingEndDate || formData.durationToDate || ""}
            onChange={(e) => {
              onChange("trainingEndDate", e.target.value);
              onChange("durationToDate", e.target.value);
            }}
            className={fieldClass("trainingEndDate")}
            required
            aria-invalid={hasError("trainingEndDate")}
          />
          {hasError("trainingEndDate") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Mode of Delivery */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Delivery mode <span className="text-[#a33]">*</span>
          </label>
          <select
            id="mode-of-delivery-select"
            value={formData.modeOfDelivery || ""}
            onChange={(e) => onChange("modeOfDelivery", e.target.value as any)}
            className={hasError("modeOfDelivery") ? "dpm-select dpm-input-error" : "dpm-select"}
            required
            aria-invalid={hasError("modeOfDelivery")}
          >
            <option value="">Select</option>
            <option value="Face-to-face">Face-to-face</option>
            <option value="Online">Online</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        {/* Training Category */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Training type <span className="text-[#a33]">*</span>
          </label>
          <select
            id="training-category-select"
            value={formData.trainingCategory || ""}
            onChange={(e) => onChange("trainingCategory", e.target.value as any)}
            className={hasError("trainingCategory") ? "dpm-select dpm-input-error" : "dpm-select"}
            required
            aria-invalid={hasError("trainingCategory")}
          >
            <option value="">Select</option>
            <option value="Professional Development">Professional Development</option>
            <option value="Technical Training">Technical Training</option>
            <option value="Leadership and Management">Leadership and Management</option>
            <option value="Academic / Qualification">Academic / Qualification</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Nominating Organisation */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Department / agency <span className="text-[#a33]">*</span>
          </label>
          <input
            id="org-name-input"
            type="text"
            value={formData.organisation}
            onChange={(e) => onChange("organisation", e.target.value)}
            placeholder="e.g. Department of Finance"
            className={fieldClass("organisation")}
            required
            aria-invalid={hasError("organisation")}
          />
          {hasError("organisation") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Aid Donor Partner */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Funding source <span className="text-[#a33]">*</span>
          </label>
          <input
            list="aid-donors-list"
            id="aid-donor-input"
            type="text"
            value={formData.aidDonor}
            onChange={(e) => onChange("aidDonor", e.target.value)}
            placeholder="e.g. Australia Awards (DFAT)"
            className={fieldClass("aidDonor")}
            required
            aria-invalid={hasError("aidDonor")}
          />
          {hasError("aidDonor") && <span className="text-[11px] text-red-600">This field is required.</span>}
          <datalist id="aid-donors-list">
            {COMMON_DONORS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>

        {/* Brief Description of Training */}
        <div className="field md:col-span-2 flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Brief description
          </label>
          <textarea
            id="training-description-textarea"
            rows={4}
            value={formData.descriptionOfProposedProgramme}
            onChange={(e) => onChange("descriptionOfProposedProgramme", e.target.value)}
            placeholder="Short summary of the programme and its purpose"
            className="dpm-input"
          />
        </div>
      </div>
    </div>
  );
};
