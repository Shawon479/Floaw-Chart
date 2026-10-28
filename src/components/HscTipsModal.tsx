import React from 'react';
import { X, Award, CheckCircle, AlertTriangle, ArrowDown } from 'lucide-react';

interface HscTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HscTipsModal: React.FC<HscTipsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                How to Score Full Marks (5/5 or 10/10) in HSC Flow Chart
              </h3>
              <p className="text-xs text-slate-400">
                Bangladesh Board Examination Guidelines (English 1st Paper, Q. No. 2)
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-300">
          <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl space-y-1">
            <span className="font-semibold text-amber-300">Question Format:</span>
            <p className="text-slate-300">
              <em>"Based on your reading of the passage, make a short flow chart showing [Topic]. (No. 1 is done for you)"</em>
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
              <div className="font-bold text-blue-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                1. Compulsory Heading
              </div>
              <p className="text-slate-400">
                Write: <strong>"A flow-chart showing [topic as given in question] is given below:"</strong>. Underlining this heading with a pen is customary in Bangladesh board exams. Leaving it out loses marks.
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
              <div className="font-bold text-blue-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                2. Strict Parallel Grammatical Structure
              </div>
              <p className="text-slate-400">
                The first box given in your exam paper dictates the grammatical form for all remaining 5 boxes:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>If Box 1 begins with <strong>V-ing</strong> (e.g. <em>Placing husband's corpse</em>), make all other 5 boxes start with <strong>V-ing</strong> (<em>Setting out...</em>, <em>Encountering...</em>).</li>
                <li>If Box 1 begins with past tense (e.g. <em>Placed husband's corpse</em>), keep all boxes past tense.</li>
                <li>If Box 1 begins with <strong>To + Verb</strong> (<em>To restore life</em>), keep all boxes in the infinitive.</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
              <div className="font-bold text-blue-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                3. Never Write Full Sentences with Subject and Full Stop
              </div>
              <p className="text-slate-400">
                Flowcharts must contain <strong>short notes or phrases</strong> (around 6 to 12 words). Do not write <em>"She pleaded for her husband."</em> Instead, write <em>"pleaded for her husband's life"</em> or <em>"pleading for her husband's life"</em>. No period/full-stop is needed at the end!
              </p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
              <div className="font-bold text-blue-400 flex items-center gap-1.5">
                <ArrowDown className="w-4 h-4 text-blue-400" />
                4. Arrows and Enclosed Boxes Are Essential
              </div>
              <p className="text-slate-400">
                The flow chart is invalid without enclosing rectangles and directed connecting arrows. You can draw them vertically (1 ↓ 2 ↓ 3 ↓ 4 ↓ 5 ↓ 6) or horizontally (1 → 2 → 3 → 4 → 5 → 6).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
