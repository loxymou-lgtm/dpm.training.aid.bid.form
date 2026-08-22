import React, { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Sparkles,
  FolderArchive,
  RotateCcw,
  LayoutTemplate,
  CheckCircle2,
  ChevronDown,
  Building2,
  UserCheck,
  Send,
  ShieldCheck,
  BadgeCheck,
  Link2,
} from "lucide-react";
import { sampleProfiles } from "../data/sampleProfiles";
import { DPMBidFormData } from "../types";

interface HeaderProps {
  currentMode: "wizard" | "document" | "admin";
  onModeChange: (mode: "wizard" | "document" | "admin") => void;
  onSelectSampleProfile: (profileData: DPMBidFormData) => void;
  onOpenAiReview: () => void;
  onOpenDrafts: () => void;
  onResetForm: () => void;
  onTriggerPrint: () => void;
  onExportPdf?: () => void;
  onSubmitBid?: () => void;
  onOpenShareLink?: () => void;
  onToggleAdminMode?: () => void;
  onSwitchToAdminView?: () => void;
  onAdminLogout?: () => void;
  isParticipantMode?: boolean;
  formData: DPMBidFormData;
  completionPercentage: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  onSelectSampleProfile,
  onOpenAiReview,
  onOpenDrafts,
  onResetForm,
  onTriggerPrint,
  onExportPdf,
  onSubmitBid,
  onOpenShareLink,
  onToggleAdminMode,
  onSwitchToAdminView,
  onAdminLogout,
  isParticipantMode = false,
  formData,
  completionPercentage,
}) => {
  const [isSampleDropdownOpen, setIsSampleDropdownOpen] = useState(false);

  const handleAdminModeToggle = () => {
    if (onSwitchToAdminView) {
      onSwitchToAdminView();
      return;
    }

    if (onToggleAdminMode) {
      onToggleAdminMode();
      return;
    }

    onModeChange("admin");
  };

  return (
    <header id="dpm-app-header" className="sticky top-0 z-40 print:hidden shadow-md">
      {/* 8px Gold Top Bar */}
      <div className="topbar" style={{ height: "8px", background: "var(--gold)" }} />

      {/* Main Header matching Prototype */}
      <div
        className="header-dpm px-4 sm:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#0e2a44]"
        style={{ background: "var(--navy)", color: "white" }}
      >
        <div className="flex items-center gap-4.5 w-full md:w-auto">
          <img
            src="/image/png-national-emblem.png"
            alt="PNG National Emblem"
            className="h-12 w-auto object-contain shrink-0 bg-transparent"
            style={{ display: "block" }}
          />
          <div className="brand">
            <small style={{ display: "block", fontSize: "11px", letterSpacing: "1.2px", opacity: 0.8, textTransform: "uppercase" }}>
              Government of Papua New Guinea
            </small>
            <h1 style={{ margin: "2px 0 0", fontSize: "20px", fontWeight: 700, letterSpacing: "-0.2px" }}>
              Department of Personnel Management
            </h1>
          </div>
        </div>

        {/* View Switcher & Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end w-full md:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg bg-[#0d2b47] p-1 border border-[#1b4b73]">
            <button
              type="button"
              id="view-mode-wizard-btn"
              onClick={() => onModeChange("wizard")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                currentMode === "wizard"
                  ? "bg-[#1d5f91] text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              <span>{isParticipantMode ? "Application Form" : "Wizard Form"}</span>
            </button>

            <button
              type="button"
              id="view-mode-document-btn"
              onClick={() => onModeChange("document")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                currentMode === "document"
                  ? "bg-[#1d5f91] text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Official Document</span>
            </button>

            {!isParticipantMode && (
              <button
                type="button"
                id="view-mode-admin-btn"
                onClick={handleAdminModeToggle}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  currentMode === "admin"
                    ? "bg-[#c79a38] text-[#12385b] font-extrabold shadow-xs"
                    : "text-slate-300 hover:text-[#c79a38]"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin Intake</span>
              </button>
            )}

            {!isParticipantMode && onAdminLogout && (
              <button
                type="button"
                onClick={onAdminLogout}
                className="flex items-center gap-1 rounded border border-[#1b4b73] bg-[#0d2b47] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:bg-[#153e66]"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[#c79a38]" />
                <span>Log out</span>
              </button>
            )}
          </div>

          {/* Load Sample Profile (Admin only) */}
          {!isParticipantMode && (
            <div className="relative">
              <button
                type="button"
                id="sample-profiles-dropdown-btn"
                onClick={() => setIsSampleDropdownOpen(!isSampleDropdownOpen)}
                className="flex items-center gap-1 rounded bg-[#0d2b47] px-2.5 py-1.5 text-xs font-semibold text-slate-200 border border-[#1b4b73] hover:bg-[#153e66] transition cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-[#c79a38]" />
                <span>Sample Data</span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>

              {isSampleDropdownOpen && (
                <div
                  id="sample-profiles-menu"
                  className="absolute right-0 mt-1.5 w-72 rounded-lg bg-[#0d2b47] border border-[#1b4b73] shadow-2xl p-1.5 z-50 animate-in fade-in text-slate-200"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#c79a38] border-b border-[#1b4b73]">
                    Select Public Service Profile
                  </div>
                  {sampleProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => {
                        onSelectSampleProfile(profile.data);
                        setIsSampleDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 rounded hover:bg-[#184872] transition text-xs"
                    >
                      <div className="font-bold text-white">{profile.label}</div>
                      <div className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
                        {profile.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Audit */}
          {!isParticipantMode && (
            <button
              type="button"
              id="open-ai-review-btn"
              onClick={onOpenAiReview}
              className="flex items-center gap-1 rounded bg-[#0d2b47] px-2.5 py-1.5 text-xs font-semibold text-slate-200 border border-[#1b4b73] hover:bg-[#153e66] transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#c79a38]" />
              <span className="hidden sm:inline">AI Audit</span>
            </button>
          )}

          {/* Share Link */}
          {!isParticipantMode && onOpenShareLink && (
            <button
              type="button"
              id="header-share-link-btn"
              onClick={onOpenShareLink}
              className="flex items-center gap-1 rounded bg-[#c79a38] text-[#12385b] px-3 py-1.5 text-xs font-extrabold shadow-sm hover:brightness-110 transition cursor-pointer"
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>Share Link</span>
            </button>
          )}

          {/* Export PDF */}
          {!isParticipantMode && onExportPdf && (
            <button
              type="button"
              id="header-export-pdf-btn"
              onClick={onExportPdf}
              className="flex items-center gap-1 rounded bg-[#1d5f91] px-2.5 py-1.5 text-xs font-bold text-white border border-[#267bb8] hover:bg-[#164f7b] transition cursor-pointer"
              title="Download PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>
          )}

          {/* Print */}
          {!isParticipantMode && (
            <button
              type="button"
              id="print-form-btn"
              onClick={onTriggerPrint}
              className="flex items-center gap-1 rounded bg-[#0d2b47] px-2.5 py-1.5 text-xs font-bold text-slate-200 border border-[#1b4b73] hover:bg-[#153e66] transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          )}

          {/* Submit */}
          {onSubmitBid && (
            <button
              type="button"
              id="header-submit-bid-btn"
              onClick={onSubmitBid}
              className="flex items-center gap-1.5 rounded bg-[#c79a38] text-[#12385b] px-3.5 py-1.5 text-xs font-extrabold shadow-sm hover:brightness-110 transition cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isParticipantMode ? "Submit Bid" : "Submit to DPM"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
