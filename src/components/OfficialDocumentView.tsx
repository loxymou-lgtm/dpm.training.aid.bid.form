import React, { useState } from "react";
import {
  Printer,
  Download,
  Sparkles,
  Edit3,
  ArrowLeft,
  FileCheck,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { DPMBidFormData } from "../types";
import { generateDPMBidFormPDF } from "../utils/pdfGenerator";
// Import national emblem as a URL so the asset is fingerprinted and emitted, keeping bundle size small
import emblemUrl from "../../image/png-national-emblem.png?url";

interface OfficialDocumentViewProps {
  formData: DPMBidFormData;
  onEditSection: (stepId: number) => void;
  onTriggerPrint: () => void;
  onOpenAiReview: () => void;
}

export const OfficialDocumentView: React.FC<OfficialDocumentViewProps> = ({
  formData,
  onEditSection,
  onTriggerPrint,
  onOpenAiReview,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      // Small tick to allow UI to render spinner
      await new Promise((resolve) => setTimeout(resolve, 60));
      await generateDPMBidFormPDF(formData);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (error) {
      console.error("Failed to generate PDF document", error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Document Action Bar (Hidden on print) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditSection(1)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Wizard
          </button>
          <span className="text-xs text-slate-500 font-medium hidden md:inline">
            Official DPM Training Bid Document (A4 High-Fidelity Format)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={onOpenAiReview}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Audit with DPM AI
          </button>

          {/* jsPDF Export Action Button */}
          <button
            type="button"
            id="export-jspdf-btn"
            disabled={isExportingPdf}
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50 transition cursor-pointer"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
                <span>PDF Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Export PDF (jsPDF)</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="doc-view-print-btn"
            onClick={onTriggerPrint}
            className="flex items-center gap-1.5 rounded-lg bg-red-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-900 transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Form
          </button>
        </div>
      </div>

      {/* The Printable Official Document Sheet */}
      <div
        id="dpm-official-form-printable"
        className="mx-auto max-w-4xl bg-white p-8 sm:p-12 shadow-2xl rounded-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900 leading-relaxed"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        {/* Document Header */}
        <div className="text-center space-y-3 border-b-2 border-slate-900 pt-6 pb-8 mb-8 leading-[1.4]">
          {/* Dedicated Centered PNG Crest / Official Logo Container (60px–80px) */}
          <div className="mb-4 mt-1 flex items-center justify-center">
            <img
              src={emblemUrl}
              alt="National Emblem of Papua New Guinea"
              className="h-[72px] w-auto object-contain bg-transparent"
              loading="lazy"
            />
          </div>

          <div className="font-sans font-bold text-xs uppercase tracking-[0.2em] text-red-800">
            INDEPENDENT STATE OF PAPUA NEW GUINEA
          </div>
          <div className="font-sans font-extrabold text-sm uppercase tracking-widest text-slate-800">
            NATIONAL PUBLIC SERVICE
          </div>
          <div className="font-sans font-black text-2xl uppercase tracking-wider text-slate-950">
            DEPARTMENT OF PERSONNEL MANAGEMENT
          </div>
          <div className="font-sans font-bold text-sm sm:text-base uppercase tracking-wide text-red-900 pt-2 pb-1">
            DONOR FUNDED TRAINING AID BID FORM FOR PUBLIC SECTOR – ({formData.bidYear || "2026"})
          </div>
          <div className="font-sans font-bold text-xs uppercase tracking-normal text-slate-800">
            TRAINING PROGRAMME REQUESTED FOR INDIVIDUAL OFFICERS
          </div>
          <div className="font-sans text-xs italic text-slate-600 max-w-xl mx-auto leading-relaxed">
            Academic programmes, short/long courses and work attachments in Papua New Guinea and Overseas
          </div>
        </div>

        {/* Proposed Study Level & Course Title Box */}
        <div className="space-y-4 mb-6 border border-slate-900 p-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 border-b border-slate-300 pb-2">
            <span className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800 w-44 shrink-0">
              Proposed study level:
            </span>
            <span className="font-sans font-semibold text-xs text-slate-900 flex-1">
              {formData.proposedStudyLevel || "__________________________________________________"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 border-b border-slate-300 pb-2">
            <span className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800 w-44 shrink-0">
              Course title:
            </span>
            <span className="font-sans font-semibold text-xs text-slate-900 flex-1">
              {formData.courseTitle || "__________________________________________________"}
            </span>
          </div>

          {/* Family Name & Other Names Banner */}
          <div className="pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="border-b border-slate-900 pb-1">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-600">
                  FAMILY NAME
                </div>
                <div className="font-sans font-black text-sm text-slate-950 uppercase">
                  {formData.familyName || "_____________________"}
                </div>
              </div>
              <div className="border-b border-slate-900 pb-1">
                <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-600">
                  OTHER NAME(S)
                </div>
                <div className="font-sans font-bold text-sm text-slate-950">
                  {formData.otherNames || "_____________________"}
                </div>
              </div>
            </div>
            <div className="text-right text-[10px] font-sans italic text-slate-500 mt-1">
              Please print
            </div>
          </div>
        </div>

        {/* DPM Use Only Box */}
        <div className="border-2 border-dashed border-slate-700 bg-slate-50/50 p-3.5 mb-6 text-xs font-sans">
          <div className="font-bold uppercase tracking-wider text-slate-800 mb-2 underline">
            DPM use only
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-[11px] font-semibold text-slate-600">Sector category:</span>{" "}
              <span className="font-bold text-slate-900">
                {formData.dpmSectorCategory || "________________________________"}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-600">Prelim. Rank:</span>{" "}
              <span className="font-bold text-slate-900">
                {formData.dpmPreliminaryRank || "________________________________"}
              </span>
            </div>
          </div>
        </div>

        {/* Official Mandate Notice */}
        <div className="text-center font-sans font-black text-xs uppercase tracking-wide text-slate-900 border-y border-slate-900 py-1.5 mb-6">
          NOTE – ALL QUESTIONS MUST BE COMPLETED FULLY FOR SUCCESSFUL NOMINATION
        </div>

        {/* Sub-heading */}
        <div className="text-center font-sans text-xs italic text-slate-700 mb-6">
          Academic, short/long programmes or work attachments in Papua New Guinea and Overseas.
        </div>

        {/* SECTION 1 */}
        <div className="space-y-2 mb-5 text-xs">
          <div className="font-sans font-bold text-slate-950 flex items-start gap-2 min-w-0">
            <span>1.</span>
            <div className="flex-1 min-w-0 break-words [word-break:break-word]">
              <span className="uppercase">ORGANISATION:</span>{" "}
              <span className="font-normal">{formData.organisation || "__________________________________________________"}</span>
            </div>
          </div>
          <div className="font-sans font-bold text-slate-950 pl-4 flex items-start gap-2 min-w-0">
            <div className="flex-1 min-w-0 break-words [word-break:break-word]">
              <span className="uppercase">POSTAL ADDRESS:</span>{" "}
              <span className="font-normal">{formData.postalAddress || "__________________________________________________"}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2 */}
        <div className="mb-5 text-xs font-sans font-bold text-slate-950 flex items-start gap-2 min-w-0">
          <span>2.</span>
          <div className="flex-1 min-w-0 break-words [word-break:break-word]">
            <span className="uppercase">ORGANISATION SECTOR:</span>{" "}
            <span className="font-normal">{formData.organisationSector || "__________________________________________________"}</span>
          </div>
        </div>

        {/* SECTION 3 */}
        <div className="mb-5 text-xs font-sans font-bold text-slate-950 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
          <div className="md:col-span-7 flex items-start gap-2 min-w-0">
            <span>3.</span>
            <div className="min-w-0 flex-1 break-words [word-break:break-word]">
              <span className="uppercase">AID DONOR:</span>{" "}
              <span className="font-normal text-slate-900">{formData.aidDonor || "________________________________"}</span>
            </div>
          </div>
          <div className="md:col-span-5 min-w-0 break-words [word-break:break-word] md:pl-2">
            <span className="uppercase">VENUE:</span>{" "}
            <span className="font-normal text-slate-900">{formData.venue || "________________________________"}</span>
          </div>
        </div>

        {/* SECTION 4 */}
        <div className="mb-6 text-xs font-sans font-bold text-slate-950 flex flex-wrap items-baseline gap-2 border-b border-slate-200 pb-4 min-w-0 break-words [word-break:break-word]">
          <span>4.</span>
          <span className="uppercase">COURSE DURATION:</span>
          <span className="font-normal">
            Period <u>&nbsp;{formData.durationYears || "___"}&nbsp;</u> years{" "}
            <u>&nbsp;{formData.durationMonths || "___"}&nbsp;</u> months{" "}
            <u>&nbsp;{formData.durationWeeks || "___"}&nbsp;</u> weeks from:{" "}
            <u>&nbsp;{formData.durationFromDate || "……./……./20……"}&nbsp;</u> to{" "}
            <u>&nbsp;{formData.durationToDate || "……/…../20……"}&nbsp;</u>
          </span>
        </div>

        {/* SECTION 5 - PERSONAL PARTICULARS */}
        <div className="space-y-3 mb-6 text-xs border-b border-slate-200 pb-5">
          <div className="font-sans font-black text-slate-950 uppercase tracking-wider">
            5. PERSONAL PARTICULARS
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 font-sans">
            <div className="min-w-0 break-words [word-break:break-word]">
              <span className="font-bold">Nominee’s name:</span>{" "}
              <span className="font-semibold text-slate-900">{formData.familyName ? `${formData.familyName}, ${formData.otherNames}` : "________________________________"}</span>
            </div>
            <div className="min-w-0 break-words [word-break:break-word]">
              <span className="font-bold">Employee No:</span>{" "}
              <span>{formData.employeeNo || "____________________"}</span>
            </div>
            <div className="sm:col-span-2 min-w-0 break-words [word-break:break-word]">
              <span className="font-bold">Age:</span> <u>&nbsp;{formData.age || "………"}&nbsp;</u>&nbsp;&nbsp;&nbsp;&nbsp;
              <span className="font-bold">Gender :</span> <u>&nbsp;{formData.gender || "……….."}&nbsp;</u>&nbsp;&nbsp;&nbsp;&nbsp;
              <span className="font-bold">Date of Birth:</span> <u>&nbsp;{formData.dateOfBirth || "…/…../20……"}&nbsp;</u>&nbsp;&nbsp;&nbsp;&nbsp;
              <span className="font-bold">NID No.</span> <u>&nbsp;{formData.nidNo || "………………………………….."}&nbsp;</u>
            </div>
            <div className="min-w-0 break-words [word-break:break-word]">
              <span className="font-bold">Date of commencement on current job:</span>{" "}
              <span>{formData.dateCommencedCurrentJob || "……./……./20……"}</span>
            </div>
            <div className="min-w-0 break-words [word-break:break-word]">
              <span className="font-bold">Date of Permanency in Public Service:</span>{" "}
              <span>{formData.datePermanencyPublicService || "……./……./20……"}</span>
            </div>
            <div className="min-w-0 break-words [word-break:break-word]">
              <span className="font-bold">Substantive position:</span>{" "}
              <span>{formData.substantivePosition || "________________________________"}</span>
            </div>
            <div className="min-w-0 break-words [word-break:break-word]">
              <span className="font-bold">Acting Position:</span>{" "}
              <span>{formData.actingPosition || "________________________________"}</span>
            </div>
            <div className="sm:col-span-2 min-w-0 break-words [word-break:break-word]">
              <span className="font-bold">Residential / Contact Address:</span>{" "}
              <span className="font-normal text-slate-900 leading-relaxed">{formData.contactAddress || "__________________________________________________"}</span>
            </div>
            <div className="min-w-0 break-words [word-break:break-word]">
              <span className="font-bold">Telephone:</span>{" "}
              <span>{formData.telephone || "____________________"}</span>
            </div>
            <div className="min-w-0 break-words [word-break:break-word]">
              <span className="font-bold">Mobile:</span>{" "}
              <span>{formData.mobile || "____________________"}</span>
            </div>
            <div className="min-w-0 break-words [word-break:break-word]">
              <span className="font-bold">E-mail:</span>{" "}
              <span>{formData.email || "________________________________"}</span>
            </div>
            <div className="min-w-0 break-words [word-break:break-word]">
              <span className="font-bold">Province & District where working:</span>{" "}
              <span>{formData.provinceDistrictWorking || "________________________________"}</span>
            </div>
          </div>
        </div>

        {/* SECTION 6 - EMERGENCY CONTACT */}
        <div className="space-y-2 mb-6 text-xs border-b border-slate-200 pb-5">
          <div className="font-sans font-black text-slate-950 uppercase tracking-wider">
            6. EMERGENCY CONTACT
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-6 font-sans">
            <div>
              <span className="font-bold">Name:</span>{" "}
              <span>{formData.emergencyName || "________________________________"}</span>{" "}
              {formData.emergencyRelationship && <span className="text-slate-500 font-normal">({formData.emergencyRelationship})</span>}
            </div>
            <div>
              <span className="font-bold">Phone:</span>{" "}
              <span>{formData.emergencyPhone || "________________________________"}</span>
            </div>
            <div>
              <span className="font-bold">Address:</span>{" "}
              <span>{formData.emergencyAddress || "________________________________"}</span>
            </div>
            <div>
              <span className="font-bold">Email:</span>{" "}
              <span>{formData.emergencyEmail || "________________________________"}</span>
            </div>
          </div>
        </div>

        {/* SECTION 7 - SECONDARY EDUCATION */}
        <div className="space-y-3 mb-6 text-xs border-b border-slate-200 pb-5 font-sans">
          <div className="font-black text-slate-950 uppercase tracking-wider">
            7. SECONDARY EDUCATION
          </div>
          <div className="space-y-1 pl-2">
            <div className="font-bold text-slate-800">Highest qualification: Choose one</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3.5 w-3.5 border border-slate-900 text-center text-[10px] leading-3 font-bold">
                  {formData.secondaryQualificationType === "Grade Ten" ? "✓" : ""}
                </span>
                <span>Grade Ten</span>
                <span className="text-slate-500 italic text-[11px] ml-auto">Go to question 11</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3.5 w-3.5 border border-slate-900 text-center text-[10px] leading-3 font-bold">
                  {formData.secondaryQualificationType === "Grade Twelve or Above" ? "✓" : ""}
                </span>
                <span>Grade Twelve or Above</span>
                <span className="text-slate-500 italic text-[11px] ml-auto">Complete information below</span>
              </div>
            </div>
          </div>

          <div className="pt-2 pl-2 space-y-1.5">
            <div>
              <span className="font-bold">Highest grade completed at school:</span>{" "}
              <span>{formData.highestGradeCompleted || "________________________________"}</span>
            </div>
            <div>
              <span className="font-bold">Provincial High School attended when completing Grade 12:</span>{" "}
              <span>{formData.provincialHighSchoolAttended || "__________________________________________________"}</span>
            </div>
          </div>
        </div>

        {/* SECTION 8 - EDUCATIONAL QUALIFICATIONS TABLE */}
        <div className="space-y-3 mb-6 text-xs border-b border-slate-200 pb-5">
          <div className="font-sans font-black text-slate-950 uppercase tracking-wider">
            8. EDUCATIONAL QUALIFICATIONS
          </div>

          <table className="w-full border border-slate-900 text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-100 font-bold">
                <th className="border-r border-slate-900 p-2 w-1/4">Institution</th>
                <th className="border-r border-slate-900 p-2 w-16 text-center">Year</th>
                <th className="border-r border-slate-900 p-2 w-1/3">Courses</th>
                <th className="p-2">Qualifications</th>
              </tr>
            </thead>
            <tbody>
              {formData.qualifications.map((qual, i) => (
                <tr key={qual.id || i} className="border-b border-slate-400">
                  <td className="border-r border-slate-900 p-2">{qual.institution || "—"}</td>
                  <td className="border-r border-slate-900 p-2 text-center">{qual.year || "—"}</td>
                  <td className="border-r border-slate-900 p-2">{qual.courses || "—"}</td>
                  <td className="p-2">{qual.qualifications || "—"}</td>
                </tr>
              ))}
              {formData.qualifications.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400">
                    No tertiary qualifications listed
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SECTION 9 - CURRENT JOB DESCRIPTION */}
        <div className="space-y-2 mb-6 text-xs border-b border-slate-200 pb-5">
          <div className="font-sans font-black text-slate-950 uppercase tracking-wider">
            9. CURRENT JOB DESCRIPTION
          </div>
          <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-800 bg-slate-50/40 p-3 rounded border border-slate-200 min-h-[90px]">
            {formData.currentJobDescription || "(Not provided)"}
          </div>
        </div>

        {/* SECTION 10 - TRAINING NEEDS IDENTIFICATION */}
        <div className="space-y-2 mb-6 text-xs border-b border-slate-200 pb-5">
          <div className="font-sans font-black text-slate-950 uppercase tracking-wider">
            10. TRAINING NEEDS IDENTIFICATION
          </div>
          <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-800 bg-slate-50/40 p-3 rounded border border-slate-200 min-h-[90px]">
            {formData.trainingNeedsIdentification || "(Not provided)"}
          </div>
        </div>

        {/* SECTION 11 - REINTEGRATION PLAN */}
        <div className="space-y-2 mb-6 text-xs border-b border-slate-200 pb-5">
          <div className="font-sans font-black text-slate-950 uppercase tracking-wider">
            11. REINTEGRATION PLAN
          </div>
          <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-800 bg-slate-50/40 p-3 rounded border border-slate-200 min-h-[90px]">
            {formData.reintegrationPlan || "(Not provided)"}
          </div>
        </div>

        {/* SECTION 12 - DESCRIPTION OF PROPOSED PROGRAMME */}
        <div className="space-y-2 mb-6 text-xs border-b border-slate-200 pb-5">
          <div className="font-sans font-black text-slate-950 uppercase tracking-wider flex items-center justify-between">
            <span>12. DESCRIPTION OF PROPOSED PROGRAMME (attach course brochure if available)</span>
            {formData.courseBrochureFileName && (
              <span className="text-[10px] font-normal text-emerald-800 italic">
                [Attached: {formData.courseBrochureFileName}]
              </span>
            )}
          </div>
          <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-800 bg-slate-50/40 p-3 rounded border border-slate-200 min-h-[90px]">
            {formData.descriptionOfProposedProgramme || "(Not provided)"}
          </div>
        </div>

        {/* SECTION 13 - TARGETED POSITION UPON COMPLETION */}
        <div className="space-y-2 mb-6 text-xs border-b border-slate-200 pb-5">
          <div className="font-sans font-black text-slate-950 uppercase tracking-wider">
            13. TARGETED POSITION UPON COMPLETION OF PROGRAMME
          </div>
          <div className="font-sans font-semibold text-slate-900 bg-slate-50/40 p-3 rounded border border-slate-200">
            {formData.targetedPositionUponCompletion || "__________________________________________________"}
          </div>
        </div>

        {/* SECTION 14 - DETAILS OF ANY PROGRAMME (> 9 MONTHS) ATTENDED IN LAST 2 YEARS */}
        <div className="space-y-2 mb-6 text-xs border-b border-slate-200 pb-5">
          <div className="font-sans font-black text-slate-950 uppercase tracking-wider">
            14. DETAILS OF ANY PROGRAMME (over 9 months) ATTENDED BY THE NOMINEE IN THE LAST TWO YEARS (Overseas & In-country)
          </div>
          <div className="font-sans text-slate-800 bg-slate-50/40 p-3 rounded border border-slate-200 space-y-2">
            <p>{formData.priorProgrammeDetailsNote || "Nil. Nominee has not attended any long-term training exceeding 9 months in the last 24 months."}</p>
            {formData.programmesLastTwoYears?.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-200">
                {formData.programmesLastTwoYears.map((p, i) => (
                  <div key={p.id || i} className="text-[11px]">
                    • <strong>{p.courseTitle}</strong> at {p.institutionVenue} ({p.durationMonths} months, Year {p.yearAttended}) - Sponsored by: {p.sponsorDonor}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 15 - JUSTIFICATION OF NOMINATION */}
        <div className="space-y-4 mb-6 text-xs border-b border-slate-200 pb-5">
          <div className="font-sans font-black text-slate-950 uppercase tracking-wider">
            15. JUSTIFICATION OF NOMINATION
          </div>

          <div className="space-y-1.5">
            <div className="font-sans font-bold text-slate-900">(a) Identified relevant Key Result Areas.</div>
            <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-800 bg-slate-50/40 p-3 rounded border border-slate-200 min-h-[70px]">
              {formData.kraJustification || "(Not provided)"}
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="font-sans font-bold text-slate-900">(b) Identified Priority Job Group</div>
            <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-800 bg-slate-50/40 p-3 rounded border border-slate-200 min-h-[60px]">
              {formData.priorityJobGroupJustification || "(Not provided)"}
            </div>
          </div>
        </div>

        {/* SECTION 16 - ENDORSEMENT BY DEPARTMENTAL TRAINING COMMITTEE */}
        <div className="space-y-4 mb-6 text-xs border-b border-slate-200 pb-5">
          <div className="font-sans font-black text-slate-950 uppercase tracking-wider flex items-center justify-between">
            <span>16. ENDORSEMENT BY THE DEPARTMENTAL TRAINING COMMITTEE</span>
            <div className="flex items-center gap-6 text-xs font-bold font-sans">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3.5 w-3.5 border border-slate-900 text-center leading-3">
                  {formData.dtcEndorsement === "YES" ? "✓" : ""}
                </span>
                YES
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3.5 w-3.5 border border-slate-900 text-center leading-3">
                  {formData.dtcEndorsement === "NO" ? "✓" : ""}
                </span>
                NO
              </span>
            </div>
          </div>

          <div className="pt-2 font-sans space-y-2">
            <div className="font-bold text-slate-900 uppercase">
              PARTICULARS OF NOMINATING AUTHORITY
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div>
                  <span className="font-bold">Name:</span>{" "}
                  <span>{formData.dtcAuthorityName || "………………………………………………………………"}</span>
                </div>
                <div className="mt-2">
                  <span className="font-bold">Title:</span>{" "}
                  <span>{formData.dtcAuthorityTitle || "………………………………………………………………"}</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-700">
                  <span className="font-bold">Date:</span>{" "}
                  <span>
                    {formData.dtcSignatureDataUrl && formData.dtcEndorsementDate
                      ? formData.dtcEndorsementDate
                      : `……/……/${formData.bidYear || "2026"}`}
                  </span>
                </div>
              </div>

              <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 flex flex-col justify-between">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Signature:
                </div>
                <div className="h-14 flex items-center justify-center">
                  {formData.dtcSignatureDataUrl ? (
                    <img
                      src={formData.dtcSignatureDataUrl}
                      alt="DTC Signature"
                      className="max-h-12 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">
                      ………………………………………………………….
                    </span>
                  )}
                </div>
                {formData.dtcSignatureDataUrl && formData.dtcEndorsementDate && (
                  <div className="text-right text-[10px] text-emerald-700 font-bold">
                    ✓ Digital Signature Timestamp: {formData.dtcEndorsementDate}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 17 - SIGNATURE OF RESPECTIVE DEPARTMENTAL HEAD */}
        <div className="space-y-4 mb-6 text-xs border-b border-slate-200 pb-5 font-sans">
          <div className="font-black text-slate-950 uppercase tracking-wider">
            17. SIGNATURE OF THE RESPECTIVE DEPARTMENTAL HEAD.
          </div>
          <div className="text-[11px] text-slate-600 italic">
            Or personally nominated delegate whose ‘Authority to Sign’ is made known to the Department of Personnel Management.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-3">
              <div>
                <span className="font-bold">Name:</span>{" "}
                <span className="font-semibold">{formData.deptHeadName || "………………………………………………………………………………"}</span>
                <span className="block text-[10px] text-slate-400 italic">(Please print)</span>
              </div>

              <div>
                <span className="font-bold">Agency Head / Delegate:</span>{" "}
                <span className="font-semibold">{formData.deptHeadDesignation}</span>
                {formData.deptHeadDelegationEvidenceNote && (
                  <span className="block text-[10px] text-slate-600 mt-0.5">
                    (Evidence: {formData.deptHeadDelegationEvidenceNote})
                  </span>
                )}
                <span className="block text-[10px] text-slate-400 italic">(Note: If delegated, provide evidence of delegation)</span>
              </div>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50 flex flex-col justify-between">
              <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">
                Departmental Head Signature & Date:
              </div>
              <div className="h-14 flex items-center justify-center">
                {formData.deptHeadSignatureDataUrl ? (
                  <img
                    src={formData.deptHeadSignatureDataUrl}
                    alt="Dept Head Signature"
                    className="max-h-12 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-slate-400 italic text-[11px]">
                    Signature: ………………………………………
                  </span>
                )}
              </div>
              <div className="text-right text-[11px] font-bold text-slate-700 mt-1">
                Date:{" "}
                {formData.deptHeadSignatureDataUrl && formData.deptHeadSignDate
                  ? formData.deptHeadSignDate
                  : `……/……/${formData.bidYear || "2026"}`}
              </div>
            </div>
          </div>
        </div>

        {/* ACTION OFFICER PARTICULARS */}
        <div className="space-y-2 text-xs font-sans border-t-2 border-slate-900 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="font-bold">1. Action Officer:</span>{" "}
              <span>{formData.actionOfficerName || "…………………………………………………………."}</span>
            </div>
            <div>
              <span className="font-bold">2. Title:</span>{" "}
              <span>{formData.actionOfficerTitle || "…………………………………………………………."}</span>
            </div>
            <div>
              <span className="font-bold">3. Telephone No:</span>{" "}
              <span>{formData.actionOfficerTelephone || "……………………………………………"}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-300 pt-3 text-[11px] text-slate-500">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium tracking-wide uppercase text-slate-600">
              Department of Personnel Management (DPM)
            </span>
            <span className="tracking-[0.16em] uppercase text-slate-500">
              National Public Service • Training Aid Form {formData.bidYear || "2026"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
