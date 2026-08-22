import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { DPMBidFormData, EducationalQualification, PriorTrainingProgramme } from "../../types";

interface Step3Props {
  formData: DPMBidFormData;
  onChange: (field: keyof DPMBidFormData, value: any) => void;
  validationErrors?: Record<string, boolean>;
}

export const Step3EducationHistory: React.FC<Step3Props> = ({
  formData,
  onChange,
  validationErrors = {},
}) => {
  const hasError = (field: string) => !!validationErrors[field];
  const fieldClass = (field: string) => `dpm-input ${hasError(field) ? "dpm-input-error" : ""}`;

  const addQualificationRow = () => {
    const newRow: EducationalQualification = {
      id: `qual-${Date.now()}`,
      institution: "",
      year: "",
      courses: "",
      qualifications: "",
    };
    onChange("qualifications", [...formData.qualifications, newRow]);
  };

  const removeQualificationRow = (id: string) => {
    if (formData.qualifications.length <= 1) {
      onChange("qualifications", [
        { id: `qual-${Date.now()}`, institution: "", year: "", courses: "", qualifications: "" },
      ]);
      return;
    }
    onChange(
      "qualifications",
      formData.qualifications.filter((q) => q.id !== id)
    );
  };

  const updateQualificationRow = (id: string, field: keyof EducationalQualification, val: string) => {
    onChange(
      "qualifications",
      formData.qualifications.map((q) => (q.id === id ? { ...q, [field]: val } : q))
    );
  };

  const addPriorProgrammeRow = () => {
    const newProg: PriorTrainingProgramme = {
      id: `prior-${Date.now()}`,
      courseTitle: "",
      institutionVenue: "",
      durationMonths: "",
      yearAttended: "",
      sponsorDonor: "",
    };
    onChange("programmesLastTwoYears", [...(formData.programmesLastTwoYears || []), newProg]);
  };

  const removePriorProgrammeRow = (id: string) => {
    onChange(
      "programmesLastTwoYears",
      (formData.programmesLastTwoYears || []).filter((p) => p.id !== id)
    );
  };

  const updatePriorProgrammeRow = (id: string, field: keyof PriorTrainingProgramme, val: string) => {
    onChange(
      "programmesLastTwoYears",
      (formData.programmesLastTwoYears || []).map((p) =>
        p.id === id ? { ...p, [field]: val } : p
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="section-note rounded-sm">
        Provide secondary education credentials, tertiary qualifications, and any long-term training programmes attended over the past two years.
      </div>

      {/* Secondary Qualification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 sm:gap-5">
        <div className="field md:col-span-2 flex flex-col gap-1.5">
          <label className="text-[13px] font-bold text-[#394b59]">
            Highest Secondary Qualification Completed <span className="text-[#a33]">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <label
              className={`flex items-start gap-2.5 rounded border p-3 cursor-pointer transition ${
                formData.secondaryQualificationType === "Grade Ten"
                  ? "border-[#1d5f91] bg-[#edf4f9] ring-1 ring-[#1d5f91]"
                  : "border-[#d7dde3] bg-white hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="secondaryQualificationType"
                value="Grade Ten"
                checked={formData.secondaryQualificationType === "Grade Ten"}
                onChange={(e) => onChange("secondaryQualificationType", e.target.value as any)}
                className="mt-1 text-[#12385b] focus:ring-[#12385b]"
                required
                aria-invalid={hasError("secondaryQualificationType")}
              />
              <div>
                <div className="text-[13px] font-bold text-[#24313d]">Grade Ten (10)</div>
                <div className="text-[11px] text-[#667583]">Skip high school details if Grade 10 was your highest</div>
              </div>
            </label>

            <label
              className={`flex items-start gap-2.5 rounded border p-3 cursor-pointer transition ${
                formData.secondaryQualificationType === "Grade Twelve or Above"
                  ? "border-[#1d5f91] bg-[#edf4f9] ring-1 ring-[#1d5f91]"
                  : "border-[#d7dde3] bg-white hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="secondaryQualificationType"
                value="Grade Twelve or Above"
                checked={formData.secondaryQualificationType === "Grade Twelve or Above"}
                onChange={(e) => onChange("secondaryQualificationType", e.target.value as any)}
                className="mt-1 text-[#12385b] focus:ring-[#12385b]"
                required
                aria-invalid={hasError("secondaryQualificationType")}
              />
              <div>
                <div className="text-[13px] font-bold text-[#24313d]">Grade Twelve (12) or Above</div>
                <div className="text-[11px] text-[#667583]">Specify high school attended below</div>
              </div>
            </label>
          </div>
        </div>

        {formData.secondaryQualificationType === "Grade Twelve or Above" && (
          <>
            <div className="field flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[#394b59]">
                Highest Grade Completed at School <span className="text-[#a33]">*</span>
              </label>
              <input
                id="highest-grade-input"
                type="text"
                value={formData.highestGradeCompleted}
                onChange={(e) => onChange("highestGradeCompleted", e.target.value)}
                placeholder="e.g. Grade 12 (Higher School Certificate)"
                className={fieldClass("highestGradeCompleted")}
                required
                aria-invalid={hasError("highestGradeCompleted")}
              />
              {hasError("highestGradeCompleted") && <span className="text-[11px] text-red-600">This field is required.</span>}
            </div>

            <div className="field flex flex-col gap-1.5">
              <label className="text-[13px] font-bold text-[#394b59]">
                High School / National High School Attended <span className="text-[#a33]">*</span>
              </label>
              <input
                id="high-school-attended-input"
                type="text"
                value={formData.provincialHighSchoolAttended}
                onChange={(e) => onChange("provincialHighSchoolAttended", e.target.value)}
                placeholder="e.g. Sogeri National High School"
                className={fieldClass("provincialHighSchoolAttended")}
                required
                aria-invalid={hasError("provincialHighSchoolAttended")}
              />
              {hasError("provincialHighSchoolAttended") && <span className="text-[11px] text-red-600">This field is required.</span>}
            </div>
          </>
        )}
      </div>

      {/* Educational Qualifications Table */}
      <div className="pt-3 border-t border-[#e2e8f0]">
        <div className="flex items-center justify-between pb-2">
          <label className="text-[13px] font-bold text-[#12385b]">
            Educational Qualifications (Tertiary & Post-Secondary)
          </label>
          <button
            type="button"
            onClick={addQualificationRow}
            className="flex items-center gap-1 text-xs font-bold text-[#1d5f91] hover:underline cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Qualification
          </button>
        </div>

        <div className="overflow-x-auto border border-[#d7dde3] rounded-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f3f5f7] text-[#394b59] font-bold uppercase text-[10px] border-b border-[#d7dde3]">
              <tr>
                <th className="p-2.5">Institution</th>
                <th className="p-2.5 w-20">Year</th>
                <th className="p-2.5">Courses / Major</th>
                <th className="p-2.5">Qualification Obtained</th>
                <th className="p-2.5 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] bg-white">
              {formData.qualifications.map((row) => (
                <tr key={row.id}>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.institution}
                      onChange={(e) => updateQualificationRow(row.id, "institution", e.target.value)}
                      placeholder="e.g. UPNG / UNITECH"
                      className="w-full text-xs p-1.5 border border-[#d7dde3] rounded"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.year}
                      onChange={(e) => updateQualificationRow(row.id, "year", e.target.value)}
                      placeholder="e.g. 2019"
                      className="w-full text-xs p-1.5 text-center border border-[#d7dde3] rounded"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.courses}
                      onChange={(e) => updateQualificationRow(row.id, "courses", e.target.value)}
                      placeholder="e.g. Economics"
                      className="w-full text-xs p-1.5 border border-[#d7dde3] rounded"
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.qualifications}
                      onChange={(e) => updateQualificationRow(row.id, "qualifications", e.target.value)}
                      placeholder="e.g. Bachelor of Economics"
                      className="w-full text-xs p-1.5 border border-[#d7dde3] rounded"
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeQualificationRow(row.id)}
                      className="text-[#8898aa] hover:text-red-600 p-1 cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prior Programmes in Last 2 Years */}
      <div className="pt-3 border-t border-[#e2e8f0] space-y-3">
        <label className="text-[13px] font-bold text-[#12385b]">
          Prior Long-Term Programmes Attended (Exceeding 9 Months in Past 2 Years)
        </label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#24313d]">
            <input
              type="radio"
              name="hasAttendedProgrammeLastTwoYears"
              value="NO"
              checked={formData.hasAttendedProgrammeLastTwoYears === "NO"}
              onChange={(e) => onChange("hasAttendedProgrammeLastTwoYears", e.target.value as any)}
              className="text-[#12385b] focus:ring-[#12385b]"
            />
            <span>NO (Nil - Not attended course &gt; 9 months)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#24313d]">
            <input
              type="radio"
              name="hasAttendedProgrammeLastTwoYears"
              value="YES"
              checked={formData.hasAttendedProgrammeLastTwoYears === "YES"}
              onChange={(e) => onChange("hasAttendedProgrammeLastTwoYears", e.target.value as any)}
              className="text-[#12385b] focus:ring-[#12385b]"
            />
            <span>YES (Specify details)</span>
          </label>
        </div>

        {formData.hasAttendedProgrammeLastTwoYears === "YES" && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#394b59]">Prior Programmes List</span>
              <button
                type="button"
                onClick={addPriorProgrammeRow}
                className="text-xs font-bold text-[#1d5f91] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Row
              </button>
            </div>
            {(formData.programmesLastTwoYears || []).map((prog) => (
              <div key={prog.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#f8fafc] p-2.5 border border-[#d7dde3] rounded">
                <input
                  type="text"
                  value={prog.courseTitle}
                  onChange={(e) => updatePriorProgrammeRow(prog.id, "courseTitle", e.target.value)}
                  placeholder="Course Title"
                  className="dpm-input text-xs"
                />
                <input
                  type="text"
                  value={prog.institutionVenue}
                  onChange={(e) => updatePriorProgrammeRow(prog.id, "institutionVenue", e.target.value)}
                  placeholder="Institution / Venue"
                  className="dpm-input text-xs"
                />
                <input
                  type="text"
                  value={prog.durationMonths}
                  onChange={(e) => updatePriorProgrammeRow(prog.id, "durationMonths", e.target.value)}
                  placeholder="Duration (Months)"
                  className="dpm-input text-xs"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={prog.sponsorDonor}
                    onChange={(e) => updatePriorProgrammeRow(prog.id, "sponsorDonor", e.target.value)}
                    placeholder="Sponsor / Donor"
                    className="dpm-input text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removePriorProgrammeRow(prog.id)}
                    className="text-[#8898aa] hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

