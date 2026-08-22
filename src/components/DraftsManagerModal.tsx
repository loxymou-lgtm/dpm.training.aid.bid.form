import React, { useState, useEffect } from "react";
import { FolderArchive, Download, Upload, Trash2, Plus, Check, Clock, FileText, X } from "lucide-react";
import { DPMBidFormData } from "../types";
import { initialEmptyBidForm } from "../data/sampleProfiles";

interface DraftItem {
  id: string;
  title: string;
  nomineeName: string;
  courseTitle: string;
  lastUpdated: string;
  data: DPMBidFormData;
}

interface DraftsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFormData: DPMBidFormData;
  onLoadDraft: (draft: DPMBidFormData) => void;
}

const STORAGE_KEY = "PNG_DPM_TRAINING_BIDS_DRAFTS";

export const DraftsManagerModal: React.FC<DraftsManagerModalProps> = ({
  isOpen,
  onClose,
  currentFormData,
  onLoadDraft,
}) => {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [draftTitleInput, setDraftTitleInput] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadSavedDrafts();
      const defaultTitle = currentFormData.familyName
        ? `${currentFormData.familyName} - ${currentFormData.courseTitle || "Training Bid"}`
        : `Bid Draft (${new Date().toLocaleDateString()})`;
      setDraftTitleInput(defaultTitle);
    }
  }, [isOpen, currentFormData]);

  const loadSavedDrafts = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setDrafts(JSON.parse(raw));
      } else {
        setDrafts([]);
      }
    } catch (e) {
      console.error(e);
      setDrafts([]);
    }
  };

  const saveCurrentAsNewDraft = () => {
    const newId = `draft-${Date.now()}`;
    const newDraft: DraftItem = {
      id: newId,
      title: draftTitleInput.trim() || `Bid Draft (${new Date().toLocaleDateString()})`,
      nomineeName: `${currentFormData.familyName || "Unnamed"} ${currentFormData.otherNames || ""}`.trim(),
      courseTitle: currentFormData.courseTitle || "Untitled Course",
      lastUpdated: new Date().toISOString(),
      data: { ...currentFormData, id: newId, savedTitle: draftTitleInput },
    };

    const updated = [newDraft, ...drafts.filter((d) => d.id !== newId)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDrafts(updated);
    setSaveMessage("Draft saved successfully to local storage!");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleDeleteDraft = (id: string) => {
    const updated = drafts.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setDrafts(updated);
  };

  const handleExportJSON = (draftData: DPMBidFormData, fileName?: string) => {
    const name = (fileName || draftData.familyName || "PNG_DPM_Training_Bid")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const blob = new Blob([JSON.stringify(draftData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}_Bid_${draftData.bidYear || "2026"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === "object") {
          onLoadDraft({ ...initialEmptyBidForm, ...parsed });
          onClose();
        }
      } catch (err) {
        alert("Invalid JSON file format. Please upload a valid DPM Training Bid export.");
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div
      id="drafts-manager-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div
        id="drafts-manager-modal-card"
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white shadow-sm">
              <FolderArchive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Bid Drafts & Backup Manager
              </h3>
              <p className="text-xs text-slate-500">
                Save nominations locally or backup/restore JSON files
              </p>
            </div>
          </div>
          <button
            id="close-drafts-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Save Active Bid Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Save Current Nomination as Draft
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="save-draft-title-input"
                type="text"
                value={draftTitleInput}
                onChange={(e) => setDraftTitleInput(e.target.value)}
                placeholder="Draft Title / Reference..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
              <button
                type="button"
                id="save-draft-btn"
                onClick={saveCurrentAsNewDraft}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-red-800 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-900 transition"
              >
                <Plus className="h-4 w-4" />
                Save Draft
              </button>
            </div>
            {saveMessage && (
              <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                {saveMessage}
              </p>
            )}
          </div>

          {/* Saved Drafts List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Saved Nominations ({drafts.length})
              </h4>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="import-draft-json"
                  className="flex items-center gap-1 cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Upload className="h-3 w-3" />
                  Import JSON
                  <input
                    id="import-draft-json"
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  id="export-active-json-btn"
                  onClick={() => handleExportJSON(currentFormData)}
                  className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Download className="h-3 w-3" />
                  Export Active JSON
                </button>
              </div>
            </div>

            {drafts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 space-y-1">
                <FileText className="mx-auto h-8 w-8 opacity-40 mb-2" />
                <p className="text-xs font-medium">No saved drafts yet.</p>
                <p className="text-[11px] text-slate-400">Save the current form above or load a sample nominee profile.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {drafts.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:border-slate-300 transition gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-800">{d.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                        <span>Nominee: <strong className="text-slate-700">{d.nomineeName || "N/A"}</strong></span>
                        <span>•</span>
                        <span>{d.courseTitle}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="h-3 w-3" />
                          {new Date(d.lastUpdated).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadDraft(d.data);
                          onClose();
                        }}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportJSON(d.data, d.title)}
                        title="Download JSON"
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(d.id)}
                        title="Delete Draft"
                        className="rounded-lg border border-slate-200 p-1.5 text-red-600 hover:bg-red-50 transition"
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

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
