import React, { useState } from "react";
import {
  Link2,
  Copy,
  Check,
  QrCode,
  Mail,
  MessageSquare,
  Share2,
  Building,
  User,
  Award,
  Sparkles,
  ExternalLink,
  X,
  Send,
  Calendar,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { DPMBidFormData, ParticipantInvitation } from "../types";
import { generateQrCodeSvg } from "../utils/qrCodeGenerator";

interface ShareParticipantLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFormData?: DPMBidFormData;
  onInvitationCreated?: (invitation: ParticipantInvitation) => void;
}

export const ShareParticipantLinkModal: React.FC<ShareParticipantLinkModalProps> = ({
  isOpen,
  onClose,
  currentFormData,
  onInvitationCreated,
}) => {
  const [linkType, setLinkType] = useState<"open" | "department" | "personalized">("open");
  
  // Department preset
  const [department, setDepartment] = useState(currentFormData?.organisation || "Department of Finance");
  const [sector, setSector] = useState(currentFormData?.organisationSector || "Economic & Public Finance Sector");
  const [aidDonor, setAidDonor] = useState(currentFormData?.aidDonor || "Department of Foreign Affairs & Trade (DFAT) - Australia Awards");
  const [studyLevel, setStudyLevel] = useState(currentFormData?.proposedStudyLevel || "Masters Degree (Postgraduate)");
  const [trainingProvider, setTrainingProvider] = useState(currentFormData?.trainingProvider || "Australian National University");
  const [countryLocation, setCountryLocation] = useState(currentFormData?.countryLocation || "Canberra, Australia");
  const [trainingStartDate, setTrainingStartDate] = useState(currentFormData?.trainingStartDate || "");
  const [trainingEndDate, setTrainingEndDate] = useState(currentFormData?.trainingEndDate || "");
  const [modeOfDelivery, setModeOfDelivery] = useState(currentFormData?.modeOfDelivery || "Face-to-face");
  const [trainingCategory, setTrainingCategory] = useState(currentFormData?.trainingCategory || "Professional Development");
   
  // Nominee personalized preset
  const [nomineeName, setNomineeName] = useState(
    currentFormData?.familyName ? `${currentFormData.otherNames} ${currentFormData.familyName}`.trim() : ""
  );
  const [nomineeEmail, setNomineeEmail] = useState(currentFormData?.email || "");
  const [courseTitle, setCourseTitle] = useState(currentFormData?.courseTitle || "");
  const [expiryDays, setExpiryDays] = useState("45");
  const [customNotes, setCustomNotes] = useState("Nomination for PNG Public Service Bilateral Training Aid Programme.");

  const [generatedInvitation, setGeneratedInvitation] = useState<ParticipantInvitation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedType, setCopiedType] = useState<"link" | "email" | "sms" | null>(null);
  const [showQrPreview, setShowQrPreview] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://dpm.gov.pg";

  // Build real-time URL preview
  const getPreviewUrl = () => {
    if (generatedInvitation) {
      return `${origin}?invite=${generatedInvitation.token}`;
    }
    if (linkType === "open") {
      return `${origin}?mode=participant`;
    }
    const params = new URLSearchParams();
    params.set("mode", "participant");
    if (department) params.set("org", department);
    if (aidDonor) params.set("donor", aidDonor);
    if (studyLevel) params.set("level", studyLevel);
    if (nomineeName) params.set("nominee", nomineeName);
    if (nomineeEmail) params.set("email", nomineeEmail);
    if (courseTitle) params.set("course", courseTitle);
    if (trainingProvider) params.set("provider", trainingProvider);
    if (countryLocation) params.set("country", countryLocation);
    if (trainingStartDate) params.set("start", trainingStartDate);
    if (trainingEndDate) params.set("end", trainingEndDate);
    if (modeOfDelivery) params.set("deliveryMode", modeOfDelivery);
    if (trainingCategory) params.set("trainingType", trainingCategory);
    return `${origin}?${params.toString()}`;
  };

  const currentShareUrl = getPreviewUrl();

  const handleGenerateOfficialLink = async () => {
    setIsGenerating(true);
    try {
      const payload: any = {
        targetDepartment: department || "All Public Service Agencies",
        sectorCategory: sector,
        targetDonor: aidDonor,
        studyLevel,
        targetCourseTitle: courseTitle,
        targetNomineeName: nomineeName,
        targetNomineeEmail: nomineeEmail,
        notes: customNotes,
        expiresDays: Number(expiryDays) || 45,
        formDataOverride: {
          organisation: department,
          organisationSector: sector,
          aidDonor,
          proposedStudyLevel: studyLevel,
          courseTitle,
          trainingProvider,
          countryLocation,
          trainingStartDate,
          trainingEndDate,
          modeOfDelivery,
          trainingCategory,
          familyName: nomineeName ? nomineeName.split(" ").slice(-1)[0].toUpperCase() : "",
          otherNames: nomineeName ? nomineeName.split(" ").slice(0, -1).join(" ") : "",
          email: nomineeEmail,
        },
      };

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedInvitation(data.invitation);
        if (onInvitationCreated) {
          onInvitationCreated(data.invitation);
        }
      }
    } catch (err) {
      console.error("Failed to generate official invitation link:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, type: "link" | "email" | "sms") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2500);
  };

  const emailSubject = `Official Invitation: Complete DPM Training Aid Bid Form (${department || "PNG Public Service"})`;
  const emailBodyText = `Dear ${nomineeName || "Public Service Nominee"},

You have been officially nominated by ${department || "your Department"} to submit a Bilateral Training Aid Bid for the upcoming cycle under Department of Personnel Management (DPM) General Order 6.

Please use the secure online portal link below to review, complete, and submit your official DPM Training Aid Bid Form:

🔗 ACCESS YOUR NOMINATION FORM:
${currentShareUrl}

KEY NOMINATION DETAILS:
• Sponsoring Department: ${department || "Department of Personnel Management"}
• Proposed Aid Donor: ${aidDonor || "Open Sponsoring Partner"}
• Study Level: ${studyLevel || "Postgraduate / Professional"}
${courseTitle ? `• Target Course: ${courseTitle}\n` : ""}${generatedInvitation ? `• Official Invitation Ref: ${generatedInvitation.token}\n` : ""}
INSTRUCTIONS FOR NOMINEE:
1. Click the link above to open your statutory nomination wizard.
2. Verify all personal, educational, and service history particulars.
3. Provide comprehensive Key Result Area (KRA) and Reintegration Plan justifications.
4. Ensure approval from your Departmental Training Committee (DTC) and Agency Head.
5. Complete submission before the statutory intake deadline.

Department of Personnel Management
Workforce Development & Training Division
Central Government Offices, Waigani, Papua New Guinea`;

  const smsText = `PNG DPM Training Aid Bid Form: You are invited to complete your official nomination for ${department || "Public Service"}. Access form here: ${currentShareUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-800 via-red-900 to-amber-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
              <Share2 className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Participant Shareable Link Generator
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30">
                  DPM Portal
                </span>
              </h2>
              <p className="text-xs text-red-100/90 font-medium mt-0.5">
                Generate secure links for nominees and departmental action officers to access and fill the form
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Link Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Link Configuration Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setLinkType("open")}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                  linkType === "open"
                    ? "border-red-600 bg-red-50/70 text-red-900 ring-2 ring-red-500/20"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Link2 className="h-4 w-4 text-red-700" />
                  General Blank Link
                </div>
                <span className="text-[11px] text-slate-500 mt-1">
                  Open link for any public servant to complete a new bid form
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLinkType("department")}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                  linkType === "department"
                    ? "border-red-600 bg-red-50/70 text-red-900 ring-2 ring-red-500/20"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Building className="h-4 w-4 text-red-700" />
                  Department Link
                </div>
                <span className="text-[11px] text-slate-500 mt-1">
                  Pre-sets Agency, Sector, Aid Donor, and Study Level
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLinkType("personalized")}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                  linkType === "personalized"
                    ? "border-red-600 bg-red-50/70 text-red-900 ring-2 ring-red-500/20"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <User className="h-4 w-4 text-red-700" />
                  Personalized Nominee
                </div>
                <span className="text-[11px] text-slate-500 mt-1">
                  Customized with Nominee Name, Email, and Target Course
                </span>
              </button>
            </div>
          </div>

          {/* Form Fields for Department & Personalized Mode */}
          {linkType !== "open" && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department / Organisation
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Department of Finance"
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aid Donor Partner
                  </label>
                  <input
                    type="text"
                    value={aidDonor}
                    onChange={(e) => setAidDonor(e.target.value)}
                    placeholder="e.g., Australian Awards (DFAT), JICA"
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proposed Study Level
                  </label>
                  <select
                    value={studyLevel}
                    onChange={(e) => setStudyLevel(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                  >
                    <option value="Masters Degree (Postgraduate)">Masters Degree (Postgraduate)</option>
                    <option value="PhD (Doctorate)">PhD (Doctorate)</option>
                    <option value="Postgraduate Diploma">Postgraduate Diploma</option>
                    <option value="Bachelor Degree (Undergraduate)">Bachelor Degree (Undergraduate)</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Short Course / Executive Workshop">Short Course / Executive Workshop</option>
                    <option value="Professional Attachment">Professional Attachment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Public Service Sector
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                  >
                    <option value="Economic & Public Finance Sector">Economic & Public Finance Sector</option>
                    <option value="Central Policy, Planning & Governance Sector">Central Policy & Governance Sector</option>
                    <option value="Social Services, Health & Education Sector">Social Services, Health & Education</option>
                    <option value="Law & Justice, National Security Sector">Law & Justice / Security</option>
                    <option value="Transport & Infrastructure Sector">Transport & Infrastructure</option>
                    <option value="Provincial, District & Local-Level Government">Provincial & District Government</option>
                  </select>
                </div>
              </div>

              {linkType === "personalized" && (
                <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nominee Full Name
                    </label>
                    <input
                      type="text"
                      value={nomineeName}
                      onChange={(e) => setNomineeName(e.target.value)}
                      placeholder="e.g., Samuel Wari"
                      className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nominee Official Email
                    </label>
                    <input
                      type="email"
                      value={nomineeEmail}
                      onChange={(e) => setNomineeEmail(e.target.value)}
                      placeholder="e.g., samuel.wari@finance.gov.pg"
                      className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Course Title
                    </label>
                    <input
                      type="text"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="e.g., Master of Public Policy & Digital Governance"
                      className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Generate Official Invitation Reference Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleGenerateOfficialLink}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg text-xs font-bold hover:bg-red-900 transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  {isGenerating ? "Issuing Token..." : "Register Official Tracking Token"}
                </button>
              </div>
            </div>
          )}

          {/* Generated Link Display Box */}
          <div className="bg-slate-900 rounded-xl p-4 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-amber-400" />
                Participant Shareable Web Link
              </span>
              {generatedInvitation && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Tracked Token: {generatedInvitation.token}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentShareUrl}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-200 select-all focus:outline-none"
              />
              <button
                type="button"
                id="copy-participant-link-btn"
                onClick={() => handleCopy(currentShareUrl, "link")}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-lg text-xs font-extrabold transition cursor-pointer shrink-0 shadow-md"
              >
                {copiedType === "link" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-950" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Link
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Anyone with this link can directly open and submit the nomination form.</span>
              <a
                href={currentShareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-amber-300 hover:underline font-semibold"
              >
                Test Link <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Quick Sharing Options */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              One-Click Share Channels
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Copy Email Template */}
              <button
                type="button"
                onClick={() => handleCopy(emailBodyText, "email")}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-center cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-red-100 text-red-800 mb-1.5 group-hover:scale-105 transition">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Copy Email Invite</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {copiedType === "email" ? "Email Copied!" : "Formatted DPM instructions"}
                </span>
              </button>

              {/* Copy SMS / Chat Text */}
              <button
                type="button"
                onClick={() => handleCopy(smsText, "sms")}
                className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-center cursor-pointer group"
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 mb-1.5 group-hover:scale-105 transition">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Copy WhatsApp / SMS</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {copiedType === "sms" ? "Message Copied!" : "Quick mobile text"}
                </span>
              </button>

              {/* QR Code Scan Toggle */}
              <button
                type="button"
                onClick={() => setShowQrPreview(!showQrPreview)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition text-center cursor-pointer group ${
                  showQrPreview
                    ? "border-amber-600 bg-amber-50 text-amber-900"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 mb-1.5 group-hover:scale-105 transition">
                  <QrCode className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Mobile QR Code</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {showQrPreview ? "Hide QR Code" : "Scan on phone/tablet"}
                </span>
              </button>
            </div>
          </div>

          {/* QR Code Preview Card */}
          {showQrPreview && (
            <div className="bg-slate-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in duration-200">
              <div
                className="w-40 h-40 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: generateQrCodeSvg(currentShareUrl, 150) }}
              />
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                  <QrCode className="h-3.5 w-3.5 text-amber-700" />
                  Scan to Fill on Mobile / Tablet
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Instant Nominee Mobile Access
                </h4>
                <p className="text-xs text-slate-600">
                  Participants can scan this QR code with their mobile phone camera to immediately launch and fill the statutory form in any web browser.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <FileCheck className="h-4 w-4 text-slate-400" />
            All submissions sync to the DPM Central Intake Registry automatically.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
