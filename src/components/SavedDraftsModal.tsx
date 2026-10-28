import React, { useState, useEffect } from 'react';
import { FlowchartConfig } from '../types';
import { LocalCookieDb, SavedDraft } from '../utils/cookieStorage';
import { Database, X, Plus, Trash2, Clock, Check, FolderOpen } from 'lucide-react';

interface SavedDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: FlowchartConfig;
  onLoadDraft: (config: FlowchartConfig, name: string) => void;
}

export const SavedDraftsModal: React.FC<SavedDraftsModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onLoadDraft,
}) => {
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [newDraftName, setNewDraftName] = useState('');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDrafts(LocalCookieDb.getAllDrafts());
      setNewDraftName('');
      setIsSavedRecently(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSnapshot = () => {
    const name = newDraftName.trim() || currentConfig.title.slice(0, 32);
    const updated = LocalCookieDb.saveDraftSnapshot(name, currentConfig);
    setDrafts(updated);
    setNewDraftName('');
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2500);
  };

  const handleDelete = (id: string) => {
    const updated = LocalCookieDb.deleteDraft(id);
    setDrafts(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                Local Cookie DB
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  No Server / 100% Offline
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Your flowcharts are permanently stored in your browser cookies and local storage.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* Quick Save Current Flowchart as a new snapshot */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Save Current Flowchart Snapshot:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDraftName}
                onChange={(e) => setNewDraftName(e.target.value)}
                placeholder="e.g. Behula Final Version / Mandela Notes"
                spellCheck={false}
                autoCorrect="off"
                autoComplete="off"
                data-gramm="false"
                className="flex-1 bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleSaveSnapshot}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm shrink-0"
              >
                {isSavedRecently ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Save Snapshot
                  </>
                )}
              </button>
            </div>
          </div>

          {/* List of saved snapshots */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Saved Snapshots ({drafts.length})
            </span>

            {drafts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No saved snapshots yet. Your current draft is automatically auto-saved in cookies!
              </div>
            ) : (
              <div className="space-y-2">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">
                        {draft.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {draft.config.title}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(draft.timestamp).toLocaleDateString()} {new Date(draft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{draft.config.boxes.length} boxes</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadDraft(draft.config, draft.name);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Load this flowchart"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Load
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(draft.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            Cookie DB storage quota: Persistent 365 days
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
