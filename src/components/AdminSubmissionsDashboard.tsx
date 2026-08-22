import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
  User,
  Award,
  FileText,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Edit3,
  Trash2,
  ExternalLink,
  Send,
  X,
  Layers,
  BarChart3,
  Link2,
  Share2,
  QrCode,
  Copy,
  Check,
  PlusCircle,
  TrendingUp,
  Inbox,
  Calendar,
  Users,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { DPMSubmissionRecord, SubmissionStatus, ParticipantInvitation, DPM_DESIGNATED_ADMINS } from "../types";
import { generateDPMBidFormPDF } from "../utils/pdfGenerator";
import { ShareParticipantLinkModal } from "./ShareParticipantLinkModal";
import { generateQrCodeSvg } from "../utils/qrCodeGenerator";

interface AdminSubmissionsDashboardProps {
  onBackToWizard: () => void;
  onOpenDocumentViewForData?: (data: any) => void;
}

export const AdminSubmissionsDashboard: React.FC<AdminSubmissionsDashboardProps> = ({
  onBackToWizard,
  onOpenDocumentViewForData,
}) => {
  const [mainTab, setMainTab] = useState<"registry" | "links" | "analytics" | "mailbox">("registry");
  const [submissions, setSubmissions] = useState<DPMSubmissionRecord[]>([]);
  const [invitations, setInvitations] = useState<ParticipantInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinksLoading, setIsLinksLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  
  // Selected Submission Modal
  const [selectedSubmission, setSelectedSubmission] = useState<DPMSubmissionRecord | null>(null);
  const [modalTab, setModalTab] = useState<"summary" | "ai_audit" | "email_log" | "admin_action">("summary");
  
  // Status update state
  const [newStatus, setNewStatus] = useState<SubmissionStatus>("Under Review");
  const [adminNotes, setAdminNotes] = useState("");
  const [dpmRanking, setDpmRanking] = useState("Priority 1 - High");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState("");
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendEmailAddress, setResendEmailAddress] = useState("");

  // Share link modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeQrModal, setActiveQrModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: "",
    title: "",
  });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/submissions");
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvitations = async () => {
    setIsLinksLoading(true);
    try {
      const response = await fetch("/api/invitations");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error("Failed to load invitations:", err);
    } finally {
      setIsLinksLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    fetchInvitations();
  }, []);

  useEffect(() => {
    if (!submissions.length) {
      setSelectedSubmission(null);
      return;
    }

    if (!selectedSubmission) {
      setSelectedSubmission(submissions[0]);
      return;
    }

    const stillExists = submissions.some((submission) => submission.id === selectedSubmission.id);
    if (!stillExists) {
      setSelectedSubmission(submissions[0]);
    }
  }, [submissions, selectedSubmission]);

  const handleSelectSubmission = (sub: DPMSubmissionRecord) => {
    setSelectedSubmission(sub);
    setNewStatus(sub.status);
    setAdminNotes(sub.adminNotes || "");
    setDpmRanking(sub.dpmRanking || "Priority 1 - High");
    setResendEmailAddress(sub.emailDelivery?.recipient || "admin@dpm.gov.pg");
    setModalTab("summary");
    setUpdateSuccessMsg("");
  };

  const handleSaveStatusUpdate = async () => {
    if (!selectedSubmission) return;
    setIsUpdatingStatus(true);
    setUpdateSuccessMsg("");
    try {
      const response = await fetch(`/api/admin/submissions/${selectedSubmission.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes,
          dpmRanking,
          reviewedBy: "DPM Senior Screening Panel",
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedSubmission(data.submission);
        setSubmissions((prev) =>
          prev.map((s) => (s.id === data.submission.id ? data.submission : s))
        );
        setUpdateSuccessMsg("Submission status and administrative notes updated successfully!");
        setTimeout(() => setUpdateSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleResendEmail = async () => {
    if (!selectedSubmission) return;
    setIsResendingEmail(true);
    try {
      const response = await fetch(`/api/admin/submissions/${selectedSubmission.id}/resend-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: resendEmailAddress,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const updated = {
          ...selectedSubmission,
          emailDelivery: data.emailDelivery,
        };
        setSelectedSubmission(updated);
        setSubmissions((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
        setUpdateSuccessMsg(`Email successfully re-dispatched to ${resendEmailAddress}`);
        setTimeout(() => setUpdateSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Failed to resend email:", err);
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this submission record from the registry?")) return;
    try {
      const response = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" });
      if (response.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
        if (selectedSubmission?.id === id) {
          setSelectedSubmission(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete submission:", err);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this participant invitation link?")) return;
    try {
      const response = await fetch(`/api/invitations/${id}`, { method: "DELETE" });
      if (response.ok) {
        setInvitations((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete invitation:", err);
    }
  };

  const handleCopyLink = (text: string, token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://dpm.gov.pg";
    const fullUrl = text.startsWith("http") ? text : `${origin}${text}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Filtered submissions list
  const filteredSubmissions = submissions.filter((sub) => {
    const query = (searchQuery || "").toLowerCase();
    const matchesSearch =
      !query ||
      (sub.referenceNumber || "").toLowerCase().includes(query) ||
      (sub.formData?.familyName || "").toLowerCase().includes(query) ||
      (sub.formData?.otherNames || "").toLowerCase().includes(query) ||
      (sub.formData?.organisation || "").toLowerCase().includes(query) ||
      (sub.formData?.courseTitle || "").toLowerCase().includes(query) ||
      (sub.formData?.aidDonor || "").toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "ALL" || (sub.status || "").toUpperCase() === statusFilter.toUpperCase();

    const matchesSector =
      sectorFilter === "ALL" ||
      (sub.formData?.organisationSector || "").toLowerCase().includes((sectorFilter || "").toLowerCase());

    return matchesSearch && matchesStatus && matchesSector;
  });

  // Calculate Metrics
  const totalBids = submissions.length;
  const avgScore = totalBids
    ? Math.round(
        submissions.reduce((acc, curr) => acc + (curr.aiAudit?.readiness_score || 0), 0) /
          totalBids
      )
    : 0;
  const endorsedBids = submissions.filter((s) => s.status === "DPM Endorsed" || s.status === "Approved").length;
  const activeInvitationsCount = invitations.filter((i) => i.status === "Active").length;
  const totalLinkAccesses = invitations.reduce((acc, curr) => acc + (curr.accessCount || 0), 0);

  // Sector breakdown aggregation
  const sectorCounts: { [key: string]: number } = {};
  submissions.forEach((s) => {
    const sec = s.formData?.organisationSector || "Uncategorized Sector";
    sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
  });

  // Donor breakdown aggregation
  const donorCounts: { [key: string]: number } = {};
  submissions.forEach((s) => {
    const d = s.formData?.aidDonor || "Other Donors";
    donorCounts[d] = (donorCounts[d] || 0) + 1;
  });

  // Study level breakdown aggregation
  const levelCounts: { [key: string]: number } = {};
  submissions.forEach((s) => {
    const lvl = s.formData?.proposedStudyLevel || "Other Levels";
    levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-md bg-red-800/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
              DPM Central Intake & Command Console
            </span>
            <span className="text-xs text-slate-300">Independent State of Papua New Guinea</span>
          </div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
            Public Service Training Aid Unified Dashboard
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Administrator all-in-one console: manage participant shareable links, review incoming departmental bid submissions, audit MTDP IV compliance, and track official email transmissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-700 to-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-red-600 hover:to-amber-600 transition cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-amber-300" />
            + Generate Participant Link
          </button>
          <button
            type="button"
            onClick={() => {
              fetchSubmissions();
              fetchInvitations();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 transition"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isLinksLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onBackToWizard}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow hover:bg-amber-400 transition"
          >
            <FileText className="h-4 w-4" />
            Nominee Form Wizard
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Submissions</span>
            <Layers className="h-4 w-4 text-red-800" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalBids}</p>
          <p className="text-[11px] text-slate-500">Registered in Central Intake</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Share Links</span>
            <Link2 className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700">{activeInvitationsCount}</p>
          <p className="text-[11px] text-slate-500">Issued for Nominees</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Link Accesses</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-900">{totalLinkAccesses}</p>
          <p className="text-[11px] text-slate-500">Nominee portal visits</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg AI Readiness</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{avgScore}%</p>
          <p className="text-[11px] text-slate-500">MTDP IV alignment score</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">DPM Endorsed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{endorsedBids}</p>
          <p className="text-[11px] text-slate-500">Vetted for Donor Allocation</p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setMainTab("registry")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            mainTab === "registry"
              ? "border-red-700 text-red-900 bg-red-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="h-4 w-4" />
          All Submissions Registry ({totalBids})
        </button>

        <button
          type="button"
          onClick={() => setMainTab("links")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            mainTab === "links"
              ? "border-red-700 text-red-900 bg-red-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Link2 className="h-4 w-4" />
          Participant Links & Invitations Hub ({invitations.length})
        </button>

        <button
          type="button"
          onClick={() => setMainTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            mainTab === "analytics"
              ? "border-red-700 text-red-900 bg-red-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Sector & Donor Analytics
        </button>

        <button
          type="button"
          onClick={() => setMainTab("mailbox")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            mainTab === "mailbox"
              ? "border-red-700 text-red-900 bg-red-50/50"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Inbox className="h-4 w-4" />
          Central Intake Mailbox ({submissions.filter((s) => s.emailDelivery?.sent).length})
        </button>
      </div>

      {/* TAB 1: ALL SUBMISSIONS REGISTRY */}
      {mainTab === "registry" && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nominee, agency, course, reference #..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Submitted">Submitted (New)</option>
                <option value="Under Review">Under Review</option>
                <option value="DPM Endorsed">DPM Endorsed</option>
                <option value="Approved">Approved</option>
                <option value="Flagged">Flagged / Incomplete</option>
                <option value="Rejected">Rejected</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 ml-2">
                <span>Sector:</span>
              </div>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="ALL">All Sectors</option>
                <option value="Economic">Economic & Finance</option>
                <option value="Governance">Governance & Policy</option>
                <option value="Health">Health & Social</option>
                <option value="Education">Education & Training</option>
                <option value="Justice">Law & Justice</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Provincial">Provincial Government</option>
              </select>
            </div>
          </div>

          {/* Submissions Registry Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-red-800 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Loading Central Intake Registry...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <FileText className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No submissions matching criteria</p>
                <p className="text-xs text-slate-400">Try adjusting your search terms or filter selections.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 px-4">Ref Number / Date</th>
                      <th className="py-3.5 px-4">Nominee & Organisation</th>
                      <th className="py-3.5 px-4">Target Course & Donor</th>
                      <th className="py-3.5 px-4 text-center">AI Readiness</th>
                      <th className="py-3.5 px-4">Status & Ranking</th>
                      <th className="py-3.5 px-4">Intake Delivery</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredSubmissions.map((sub) => {
                      const score = sub.aiAudit?.readiness_score || 0;
                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-slate-50/80 transition cursor-pointer"
                          onClick={() => handleSelectSubmission(sub)}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-red-900">{sub.referenceNumber}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(sub.timestamp).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {sub.formData?.familyName}, {sub.formData?.otherNames}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{sub.formData?.organisation}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 truncate max-w-[220px]">
                              {sub.formData?.courseTitle || "(Unspecified Course)"}
                            </div>
                            <div className="text-[10px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                              <Award className="h-3 w-3 text-amber-600 shrink-0" />
                              <span className="truncate max-w-[180px]">{sub.formData?.aidDonor}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Sparkles className="h-3 w-3 text-amber-500" />
                              {score}%
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                sub.status === "DPM Endorsed"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : sub.status === "Under Review"
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : sub.status === "Approved"
                                  ? "bg-blue-100 text-blue-900 border border-blue-300"
                                  : sub.status === "Flagged"
                                  ? "bg-rose-100 text-rose-900 border border-rose-300"
                                  : "bg-slate-100 text-slate-800 border border-slate-300"
                              }`}
                            >
                              {sub.status}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                              {sub.dpmRanking || "Pending Priority"}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {sub.emailDelivery?.sent ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  <span className="text-[10px] text-emerald-800 font-semibold truncate max-w-[130px]">
                                    {sub.emailDelivery.recipient}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                  <span className="text-[10px] text-slate-500">Pending</span>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleSelectSubmission(sub)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-900 transition"
                                title="Inspect Details & AI Audit"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => generateDPMBidFormPDF(sub.formData)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 transition"
                                title="Download Official PDF"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubmission(sub.id)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-700 transition"
                                title="Delete Record"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PARTICIPANT LINKS & INVITATION MANAGER */}
      {mainTab === "links" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-red-800" />
                Participant Shareable Links & Direct Access Tokens
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate and distribute pre-configured nomination links to nominees, agency HR coordinators, and Departmental Training Committees (DTCs).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 text-white text-xs font-bold shadow-md hover:from-red-900 hover:to-amber-800 transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4 text-amber-300" />
              + Create New Participant Link
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {isLinksLoading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-red-800 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Loading Participant Links...</p>
              </div>
            ) : invitations.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Link2 className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No participant links generated yet</p>
                <p className="text-xs text-slate-400">Create shareable links to allow nominees to complete forms online.</p>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="mt-3 px-4 py-2 rounded-xl bg-red-800 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="h-4 w-4" /> Create First Link
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 px-4">Token & Share Link</th>
                      <th className="py-3.5 px-4">Target Department / Nominee</th>
                      <th className="py-3.5 px-4">Donor & Level</th>
                      <th className="py-3.5 px-4 text-center">Visits</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {invitations.map((inv) => {
                      const origin = typeof window !== "undefined" ? window.location.origin : "https://dpm.gov.pg";
                      const directUrl = inv.shareableUrl.startsWith("http") ? inv.shareableUrl : `${origin}${inv.shareableUrl}`;
                      const isCopied = copiedToken === inv.token;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-red-900 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                                {inv.token}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[200px]">
                              Created: {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{inv.targetDepartment}</span>
                            </div>
                            {inv.targetNomineeName && (
                              <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                                <User className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{inv.targetNomineeName} ({inv.targetNomineeEmail || "No email"})</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 truncate max-w-[180px]">
                              {inv.targetDonor || "Open Sponsoring Partner"}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {inv.studyLevel || "All Levels"}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                              <Users className="h-3 w-3 text-slate-500" />
                              {inv.accessCount || 0}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                inv.status === "Completed"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : inv.status === "Active"
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-slate-100 text-slate-600 border border-slate-300"
                              }`}
                            >
                              {inv.status}
                            </span>
                            {inv.submissionReference && (
                              <div className="text-[10px] font-mono text-emerald-700 mt-0.5">
                                Lodged: {inv.submissionReference}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Copy Link */}
                              <button
                                type="button"
                                onClick={() => handleCopyLink(inv.shareableUrl, inv.token)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition font-bold"
                                title="Copy Participant Link"
                              >
                                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>

                              {/* View QR Code */}
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveQrModal({
                                    isOpen: true,
                                    url: directUrl,
                                    title: `${inv.targetDepartment} (${inv.token})`,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title="Scan QR Code"
                              >
                                <QrCode className="h-3.5 w-3.5" />
                              </button>

                              {/* Open link in new tab */}
                              <a
                                href={directUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition inline-flex items-center"
                                title="Test Participant View"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteInvitation(inv.id)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-700 transition"
                                title="Revoke Link"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SECTOR & DONOR ANALYTICS */}
      {mainTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sector Distribution */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-red-800" />
                Submissions by Public Service Sector
              </h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase">MTDP IV Categories</span>
            </div>

            <div className="space-y-3">
              {Object.entries(sectorCounts).map(([sectorName, count]) => {
                const percent = Math.round((count / (totalBids || 1)) * 100);
                return (
                  <div key={sectorName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="truncate max-w-[280px]">{sectorName}</span>
                      <span className="font-bold text-slate-900">{count} bids ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-red-800 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sponsoring Donor Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-600" />
                Bilateral Aid Donor Sponsorships
              </h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Partner Breakdown</span>
            </div>

            <div className="space-y-3">
              {Object.entries(donorCounts).map(([donorName, count]) => {
                const percent = Math.round((count / (totalBids || 1)) * 100);
                return (
                  <div key={donorName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="truncate max-w-[280px]">{donorName}</span>
                      <span className="font-bold text-slate-900">{count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-600 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Study Levels Distribution */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-700" />
                Proposed Study Level Breakdown
              </h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Qualifications</span>
            </div>

            <div className="space-y-3">
              {Object.entries(levelCounts).map(([lvlName, count]) => {
                const percent = Math.round((count / (totalBids || 1)) * 100);
                return (
                  <div key={lvlName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="truncate max-w-[280px]">{lvlName}</span>
                      <span className="font-bold text-slate-900">{count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statutory DPM Compliance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                DPM Statutory Compliance Summary
              </h3>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                GO 6 Audit
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span>DTC Committee Formal Endorsements Verified</span>
                <span className="font-bold text-emerald-800">100% Compliant</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span>2-Year Prior Sponsorship Rule Compliance</span>
                <span className="font-bold text-emerald-800">100% Passed</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <span>Agency Head Signature Authorizations</span>
                <span className="font-bold text-emerald-800">100% Attached</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CENTRAL INTAKE MAILBOX */}
      {mainTab === "mailbox" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200">
                  <Inbox className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    DPM Central Intake Official Dispatch Gateway
                  </h3>
                  <p className="text-xs text-slate-500">
                    Audit log of all automated notification dispatches and official signed PDF packages transmitted upon nomination submission.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                3 Official Receivers Active
              </span>
            </div>

            {/* Designated Administrators Bar */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Designated Intake Administrators (Dispatched to All 3 Upon Participant Submission):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DPM_DESIGNATED_ADMINS.map((admin, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-red-900">#{idx + 1} {admin.name}</span>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded border border-emerald-200">Active</span>
                    </div>
                    <p className="text-xs font-mono font-semibold text-slate-800 truncate">{admin.email}</p>
                    <p className="text-[10px] text-slate-500 truncate">{admin.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Subject / Reference</th>
                  <th className="py-3.5 px-4">Designated Admin Recipients</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Message ID</th>
                  <th className="py-3.5 px-4 text-center">Attachment</th>
                  <th className="py-3.5 px-4">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 truncate max-w-[260px]">
                        {s.emailDelivery?.subject || `Training Aid Submission - ${s.referenceNumber}`}
                      </div>
                      <div className="text-[10px] text-red-900 font-mono font-bold">
                        {s.referenceNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {DPM_DESIGNATED_ADMINS.map((adm, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="font-semibold text-slate-800">{adm.name}</span>
                            <span className="font-mono text-[10px] text-slate-500">({adm.email})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(s.emailDelivery?.sentAt || s.timestamp).toLocaleString("en-GB")}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                      {s.emailDelivery?.messageId || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Download className="h-3 w-3" /> Signed PDF
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Dispatched (All 3)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-900 via-red-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                  <ShieldCheck className="h-6 w-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded">
                      {selectedSubmission.referenceNumber}
                    </span>
                    <span className="text-xs text-red-200">
                      {new Date(selectedSubmission.timestamp).toLocaleString("en-GB")}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-0.5">
                    {selectedSubmission.formData?.familyName}, {selectedSubmission.formData?.otherNames} — {selectedSubmission.formData?.organisation}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 flex items-center gap-4 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setModalTab("summary")}
                className={`py-3 border-b-2 transition ${
                  modalTab === "summary" ? "border-red-800 text-red-900" : "border-transparent hover:text-slate-900"
                }`}
              >
                Bid Profile & Details
              </button>
              <button
                type="button"
                onClick={() => setModalTab("ai_audit")}
                className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                  modalTab === "ai_audit" ? "border-red-800 text-red-900" : "border-transparent hover:text-slate-900"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                AI Audit & MTDP IV Screening
              </button>
              <button
                type="button"
                onClick={() => setModalTab("email_log")}
                className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                  modalTab === "email_log" ? "border-red-800 text-red-900" : "border-transparent hover:text-slate-900"
                }`}
              >
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                Intake Dispatch Log
              </button>
              <button
                type="button"
                onClick={() => setModalTab("admin_action")}
                className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                  modalTab === "admin_action" ? "border-red-800 text-red-900" : "border-transparent hover:text-slate-900"
                }`}
              >
                <Edit3 className="h-3.5 w-3.5 text-amber-600" />
                DPM Decision & Ranking
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
              {updateSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {updateSuccessMsg}
                </div>
              )}

              {modalTab === "summary" && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <User className="h-4 w-4 text-red-800" /> Personal Particulars
                      </h4>
                      <p><strong>Employee No:</strong> {selectedSubmission.formData?.employeeNo || "N/A"}</p>
                      <p><strong>Substantive Position:</strong> {selectedSubmission.formData?.substantivePosition || "N/A"}</p>
                      <p><strong>Official Email:</strong> {selectedSubmission.formData?.email || "N/A"}</p>
                      <p><strong>Telephone / Mobile:</strong> {selectedSubmission.formData?.telephone} / {selectedSubmission.formData?.mobile}</p>
                      <p><strong>Years in Public Service:</strong> {selectedSubmission.formData?.datePermanencyPublicService || "Permanent"}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-amber-600" /> Proposed Training Programme
                      </h4>
                      <p><strong>Course Title:</strong> {selectedSubmission.formData?.courseTitle}</p>
                      <p><strong>Proposed Level:</strong> {selectedSubmission.formData?.proposedStudyLevel}</p>
                      <p><strong>Aid Donor Partner:</strong> {selectedSubmission.formData?.aidDonor}</p>
                      <p><strong>Training Venue:</strong> {selectedSubmission.formData?.venue}</p>
                      <p><strong>Duration:</strong> {selectedSubmission.formData?.durationYears} yrs, {selectedSubmission.formData?.durationMonths} mos ({selectedSubmission.formData?.durationFromDate} - {selectedSubmission.formData?.durationToDate})</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">Key Result Area & Reintegration Justifications</h4>
                    <div>
                      <span className="font-bold text-slate-700">KRA Strategic Justification:</span>
                      <p className="text-slate-600 mt-1">{selectedSubmission.formData?.kraJustification || "No justification provided."}</p>
                    </div>
                    <div className="pt-2">
                      <span className="font-bold text-slate-700">Departmental Reintegration Plan:</span>
                      <p className="text-slate-600 mt-1">{selectedSubmission.formData?.reintegrationPlan || "No reintegration plan provided."}</p>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === "ai_audit" && (
                <div className="space-y-6 text-xs">
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-amber-900 text-sm flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-600" /> Overall MTDP IV Readiness Score
                      </span>
                      <span className="text-lg font-black text-amber-900 bg-amber-200/70 px-3 py-1 rounded-xl">
                        {selectedSubmission.aiAudit?.readiness_score || 0}%
                      </span>
                    </div>
                    <p className="text-slate-700">{selectedSubmission.aiAudit?.summary}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900">DPM Statutory Compliance Checks</h4>
                    <div className="space-y-2">
                      {selectedSubmission.aiAudit?.dpm_compliance_checks?.map((chk, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">{chk.check}</span>
                            <p className="text-slate-500 text-[11px] mt-0.5">{chk.comment}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {chk.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {modalTab === "email_log" && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">Official Intake Notification Dispatch Log</h4>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] uppercase">
                        All 3 Receivers Dispatched
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {DPM_DESIGNATED_ADMINS.map((admin, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-red-900 uppercase">Receiver #{idx + 1}</span>
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              ✓ Delivered
                            </span>
                          </div>
                          <p className="font-bold text-slate-800">{admin.name}</p>
                          <p className="font-mono text-[11px] text-slate-500 truncate">{admin.email}</p>
                          <p className="text-[10px] text-slate-400 truncate">{admin.role}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200 space-y-1.5 text-slate-700">
                      <p><strong>Subject:</strong> {selectedSubmission.emailDelivery?.subject}</p>
                      <p><strong>Sent Timestamp:</strong> {selectedSubmission.emailDelivery?.sentAt ? new Date(selectedSubmission.emailDelivery.sentAt).toLocaleString("en-GB") : "N/A"}</p>
                      <p><strong>Transmission Message ID:</strong> <span className="font-mono">{selectedSubmission.emailDelivery?.messageId}</span></p>
                      <p><strong>Signed PDF Attached:</strong> {selectedSubmission.emailDelivery?.hasAttachment ? "Yes (Full 4-Page Official DPM Bid PDF)" : "No"}</p>
                      <p><strong>Delivery Note:</strong> {selectedSubmission.emailDelivery?.providerMessage || "Dispatched simultaneously to all 3 DPM Administrators"}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <label className="font-bold text-slate-700">Re-dispatch Email to Specified Address (or leave empty to re-send to all 3 admins):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="lmou@dpm.gov.pg, eileen.wahee@dpm.gov.pg, agnes.tamate@dpm.gov.pg"
                        value={resendEmailAddress}
                        onChange={(e) => setResendEmailAddress(e.target.value)}
                        className="text-xs rounded-xl border border-slate-300 px-3 py-2 w-full focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleResendEmail}
                        disabled={isResendingEmail}
                        className="px-4 py-2 bg-red-800 text-white rounded-xl font-bold text-xs hover:bg-red-900 transition flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="h-3.5 w-3.5 text-amber-200" />
                        {isResendingEmail ? "Sending..." : "Re-dispatch Notice"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === "admin_action" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Official DPM Review Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as SubmissionStatus)}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 bg-white"
                      >
                        <option value="Submitted">Submitted (Pending Initial Triage)</option>
                        <option value="Under Review">Under Review (Screening Committee)</option>
                        <option value="DPM Endorsed">DPM Endorsed (Recommended to Donor)</option>
                        <option value="Approved">Approved (Final Allocation)</option>
                        <option value="Flagged">Flagged (Action Officer Rectification Required)</option>
                        <option value="Rejected">Rejected (Ineligible)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">National Priority Ranking Tier</label>
                      <select
                        value={dpmRanking}
                        onChange={(e) => setDpmRanking(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-red-500 bg-white"
                      >
                        <option value="Priority 1 - High">Priority 1 - High (Tier-1 MTDP IV Priority)</option>
                        <option value="Priority 2 - Medium">Priority 2 - Medium (Standard Public Sector)</option>
                        <option value="Priority 3 - Low">Priority 3 - Low (Non-Critical Skill Shortage)</option>
                        <option value="Reserve Quota">Reserve Quota (Standby Candidate)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Screening Panel Remarks & Minutes</label>
                    <textarea
                      rows={4}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Enter screening committee recommendations, donor quota allocation notes, or conditions of endorsement..."
                      className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-red-500 bg-white"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveStatusUpdate}
                      disabled={isUpdatingStatus}
                      className="px-5 py-2.5 bg-gradient-to-r from-red-800 to-amber-700 text-white rounded-xl font-bold hover:from-red-900 hover:to-amber-800 transition shadow-md"
                    >
                      {isUpdatingStatus ? "Saving Decisions..." : "Save Official DPM Assessment"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (onOpenDocumentViewForData) {
                    onOpenDocumentViewForData(selectedSubmission.formData);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-red-800 hover:text-red-900"
              >
                <FileText className="h-4 w-4" /> Open Full Document View
              </button>

              <button
                type="button"
                onClick={() => generateDPMBidFormPDF(selectedSubmission.formData)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Download className="h-4 w-4" /> Download Official PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Participant Link Modal */}
      <ShareParticipantLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onInvitationCreated={(newInv) => {
          setInvitations((prev) => [newInv, ...prev]);
        }}
      />

      {/* Standalone QR Code Modal */}
      {activeQrModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <QrCode className="h-4 w-4 text-red-800" /> Mobile Scan Access
              </h3>
              <button
                type="button"
                onClick={() => setActiveQrModal({ isOpen: false, url: "", title: "" })}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">{activeQrModal.title}</p>

            <div
              className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: generateQrCodeSvg(activeQrModal.url, 180) }}
            />

            <p className="text-[11px] text-slate-400">
              Scan with phone camera to instantly fill the DPM Training Aid Bid Form.
            </p>

            <button
              type="button"
              onClick={() => setActiveQrModal({ isOpen: false, url: "", title: "" })}
              className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
