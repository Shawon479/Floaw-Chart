import React from 'react';
import { HscPreset } from '../types';
import { HSC_PRESETS } from '../constants/presets';
import { X, BookOpen, Check } from 'lucide-react';

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: HscPreset) => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                HSC English Textbook Flowcharts
              </h3>
              <p className="text-xs text-slate-400">
                Official NCTB textbook passages formatted according to board standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Presets */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {HSC_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="p-3.5 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-xl flex flex-col justify-between transition-all group hover:bg-slate-950/90"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/50">
                    {preset.unit}
                  </span>
                  <span className="text-[10px] text-slate-500">6 boxes</span>
                </div>
                <h4 className="font-semibold text-sm text-slate-200 group-hover:text-blue-300 transition-colors">
                  {preset.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {preset.config.title}
                </p>
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono">Sample points:</span>
                  <div className="text-[11px] text-slate-300 italic line-clamp-2">
                    1. {preset.config.boxes[0]}
                    <br />
                    2. {preset.config.boxes[1]}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className="mt-3.5 w-full py-1.5 px-3 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Load this Flowchart
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
