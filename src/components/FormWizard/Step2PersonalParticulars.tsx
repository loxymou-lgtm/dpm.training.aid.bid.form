import React from "react";
import { DPMBidFormData } from "../../types";

interface Step2Props {
  formData: DPMBidFormData;
  onChange: (field: keyof DPMBidFormData, value: any) => void;
  validationErrors?: Record<string, boolean>;
}

const PNG_PROVINCES = [
  "National Capital District (Port Moresby)",
  "Central Province",
  "Gulf Province",
  "Western Province (Fly)",
  "Milne Bay Province",
  "Oro Province (Northern)",
  "Morobe Province (Lae)",
  "Madang Province",
  "East Sepik Province",
  "West Sepik Province (Sandaun)",
  "Eastern Highlands Province (Goroka)",
  "Simbu Province (Kundiawa)",
  "Western Highlands Province (Mt Hagen)",
  "Jiwaka Province",
  "Enga Province (Wabag)",
  "Southern Highlands Province (Mendi)",
  "Hela Province (Tari)",
  "Manus Province",
  "New Ireland Province (Kavieng)",
  "East New Britain Province (Kokopo/Rabaul)",
  "West New Britain Province (Kimbe)",
  "Autonomous Region of Bougainville (Buka)",
];

export const Step2PersonalParticulars: React.FC<Step2Props> = ({
  formData,
  onChange,
  validationErrors = {},
}) => {
  const hasError = (field: string) => !!validationErrors[field];
  const fieldClass = (field: string) => `dpm-input ${hasError(field) ? "dpm-input-error" : ""}`;

  return (
    <div className="space-y-6">
      <div className="section-note rounded-sm">
        Please enter your basic personal and employment details below.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 sm:gap-5">
        {/* Family Name */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Surname <span className="text-[#a33]">*</span>
          </label>
          <input
            id="personal-family-name"
            type="text"
            value={formData.familyName}
            onChange={(e) => onChange("familyName", e.target.value.toUpperCase())}
            placeholder="e.g. KOPANA"
            className={fieldClass("familyName")}
            required
            aria-invalid={hasError("familyName")}
          />
          {hasError("familyName") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Other Names */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Given names <span className="text-[#a33]">*</span>
          </label>
          <input
            id="personal-other-names"
            type="text"
            value={formData.otherNames}
            onChange={(e) => onChange("otherNames", e.target.value)}
            placeholder="e.g. Samuel Gari"
            className={fieldClass("otherNames")}
            required
            aria-invalid={hasError("otherNames")}
          />
          {hasError("otherNames") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Employee Number */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Employee no. <span className="text-[#a33]">*</span>
          </label>
          <input
            id="employee-no-input"
            type="text"
            value={formData.employeeNo}
            onChange={(e) => onChange("employeeNo", e.target.value)}
            placeholder="e.g. DNPM-884920"
            className={fieldClass("employeeNo")}
            required
            aria-invalid={hasError("employeeNo")}
          />
          {hasError("employeeNo") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* National ID (NID) */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            NID <span className="text-[#a33]">*</span>
          </label>
          <input
            id="nid-no-input"
            type="text"
            value={formData.nidNo}
            onChange={(e) => onChange("nidNo", e.target.value)}
            placeholder="PNG-NID-10492819"
            className="dpm-input"
          />
        </div>

        {/* Gender */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Gender <span className="text-[#a33]">*</span>
          </label>
          <select
            id="gender-select"
            value={formData.gender}
            onChange={(e) => onChange("gender", e.target.value as any)}
            className={hasError("gender") ? "dpm-select dpm-input-error" : "dpm-select"}
            required
            aria-invalid={hasError("gender")}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Date of Birth & Age */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Date of birth & age
          </label>
          <div className="grid grid-cols-3 gap-2">
            <input
              id="dob-input"
              type="text"
              value={formData.dateOfBirth}
              onChange={(e) => onChange("dateOfBirth", e.target.value)}
              placeholder="DD/MM/YYYY"
              className={`${fieldClass("dateOfBirth")} col-span-2`}
              required
              aria-invalid={hasError("dateOfBirth")}
            />
            <input
              id="age-input"
              type="number"
              min="18"
              max="65"
              value={formData.age}
              onChange={(e) => onChange("age", e.target.value)}
              placeholder="Age"
              className={fieldClass("age") + " text-center"}
            />
          </div>
        </div>

        {/* Substantive Position */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Current position <span className="text-[#a33]">*</span>
          </label>
          <input
            id="substantive-position-input"
            type="text"
            value={formData.substantivePosition}
            onChange={(e) => onChange("substantivePosition", e.target.value)}
            placeholder="e.g. Senior Policy Analyst"
            className={fieldClass("substantivePosition")}
            required
            aria-invalid={hasError("substantivePosition")}
          />
          {hasError("substantivePosition") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Acting Position */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Acting position
          </label>
          <input
            id="acting-position-input"
            type="text"
            value={formData.actingPosition}
            onChange={(e) => onChange("actingPosition", e.target.value)}
            placeholder="If applicable"
            className="dpm-input"
          />
        </div>

        {/* Date of Permanency */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Permanent date <span className="text-[#a33]">*</span>
          </label>
          <input
            id="permanency-date-input"
            type="text"
            value={formData.datePermanencyPublicService}
            onChange={(e) => onChange("datePermanencyPublicService", e.target.value)}
            placeholder="DD/MM/YYYY"
            className={fieldClass("datePermanencyPublicService")}
            required
            aria-invalid={hasError("datePermanencyPublicService")}
          />
          {hasError("datePermanencyPublicService") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Date Commenced Current Job */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Current job start date
          </label>
          <input
            id="commence-date-input"
            type="text"
            value={formData.dateCommencedCurrentJob}
            onChange={(e) => onChange("dateCommencedCurrentJob", e.target.value)}
            placeholder="DD/MM/YYYY"
            className="dpm-input"
          />
        </div>

        {/* Official Email */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Email <span className="text-[#a33]">*</span>
          </label>
          <input
            id="email-input"
            type="email"
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="e.g. name@department.gov.pg"
            className={fieldClass("email")}
            required
            aria-invalid={hasError("email")}
          />
          {hasError("email") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Mobile Phone */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Mobile <span className="text-[#a33]">*</span>
          </label>
          <input
            id="mobile-phone-input"
            type="text"
            value={formData.mobile}
            onChange={(e) => onChange("mobile", e.target.value)}
            placeholder="e.g. +675 7000 0000"
            className={fieldClass("mobile")}
            required
            aria-invalid={hasError("mobile")}
          />
          {hasError("mobile") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Province and District */}
        <div className="field md:col-span-2 flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Province / district <span className="text-[#a33]">*</span>
          </label>
          <input
            list="png-provinces-list"
            id="province-district-input"
            type="text"
            value={formData.provinceDistrictWorking}
            onChange={(e) => onChange("provinceDistrictWorking", e.target.value)}
            placeholder="e.g. National Capital District, Moresby North-West"
            className={fieldClass("provinceDistrictWorking")}
            required
            aria-invalid={hasError("provinceDistrictWorking")}
          />
          {hasError("provinceDistrictWorking") && <span className="text-[11px] text-red-600">This field is required.</span>}
          <datalist id="png-provinces-list">
            {PNG_PROVINCES.map((prov) => (
              <option key={prov} value={prov} />
            ))}
          </datalist>
        </div>

        {/* Residential / Postal Address */}
        <div className="field md:col-span-2 flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Contact address
          </label>
          <input
            id="contact-address-input"
            type="text"
            value={formData.contactAddress}
            onChange={(e) => onChange("contactAddress", e.target.value)}
            placeholder="Your residential or postal address"
            className="dpm-input"
          />
        </div>

        {/* Emergency Contact Sub-heading */}
        <div className="md:col-span-2 pt-2 border-t border-[#e2e8f0]">
          <h4 className="text-sm font-bold text-[#12385b]">Emergency contact</h4>
        </div>

        {/* Emergency Contact Name */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Contact name <span className="text-[#a33]">*</span>
          </label>
          <input
            id="emergency-name-input"
            type="text"
            value={formData.emergencyName}
            onChange={(e) => onChange("emergencyName", e.target.value)}
            placeholder="e.g. Grace Kopana"
            className={fieldClass("emergencyName")}
            required
            aria-invalid={hasError("emergencyName")}
          />
          {hasError("emergencyName") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Emergency Relationship */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Relationship
          </label>
          <input
            id="emergency-relationship-input"
            type="text"
            value={formData.emergencyRelationship}
            onChange={(e) => onChange("emergencyRelationship", e.target.value)}
            placeholder="Spouse / parent / sibling"
            className="dpm-input"
          />
        </div>

        {/* Emergency Phone */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Contact phone <span className="text-[#a33]">*</span>
          </label>
          <input
            id="emergency-phone-input"
            type="text"
            value={formData.emergencyPhone}
            onChange={(e) => onChange("emergencyPhone", e.target.value)}
            placeholder="e.g. +675 7000 0000"
            className={fieldClass("emergencyPhone")}
            required
            aria-invalid={hasError("emergencyPhone")}
          />
          {hasError("emergencyPhone") && <span className="text-[11px] text-red-600">This field is required.</span>}
        </div>

        {/* Emergency Email */}
        <div className="field flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Contact email
          </label>
          <input
            id="emergency-email-input"
            type="email"
            value={formData.emergencyEmail}
            onChange={(e) => onChange("emergencyEmail", e.target.value)}
            placeholder="grace@email.com"
            className="dpm-input"
          />
        </div>
      </div>
    </div>
  );
};

