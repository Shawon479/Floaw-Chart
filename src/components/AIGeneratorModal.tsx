import React, { useEffect, useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (generated: { title: string; boxes: string[] }) => void;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [topic, setTopic] = useState('');
  const [passage, setPassage] = useState('');
  const [style, setStyle] = useState('Participle/Gerund phrase (starting with V-ing)');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    title: string;
    boxes: string[];
    grammarTip?: string;
  } | null>(null);

  // Start each session with a clean form instead of the previous result.
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setResult(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim() && !passage.trim()) {
      setError('Please provide a topic name or paste a textbook passage.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-flowchart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(70_000),
        body: JSON.stringify({
          topic: topic.trim(),
          passage: passage.trim(),
          grammaticalStyle: style,
          boxCount: 6,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || `AI request failed (HTTP ${response.status}). Please try again.`
        );
      }

      if (!data || !Array.isArray(data.boxes) || data.boxes.length === 0) {
        throw new Error('The AI service returned an unusable flowchart. Please try again.');
      }

      setResult({
        title: data.title || `A flow-chart showing ${topic} is given below:`,
        boxes: data.boxes.slice(0, 6),
        grammarTip: data.grammarTip || 'Generated with the AI API.',
      });
    } catch (err: any) {
      const message =
        err?.name === 'TimeoutError'
          ? 'The AI service took too long to respond. Please try again.'
          : err?.message || 'Could not reach the AI service. Please try again.';
      setError(message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyResult = () => {
    if (result) {
      onApply({
        title: result.title,
        boxes: result.boxes,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                Flow-chart Generator
              </h3>
              <p className="text-xs text-slate-400">
                Instantly create 6 points following standard rules
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!result ? (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Flowchart Topic / Lesson
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. How Behula restored Lakhinder's life / Nelson Mandela / Kuakata beach"
                  spellCheck={false}
                  autoCorrect="off"
                  autoComplete="off"
                  data-gramm="false"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Textbook Passage or Exam Question (Optional)
                </label>
                <textarea
                  rows={4}
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                  placeholder="Paste textbook paragraph or exam question here for exact context extraction..."
                  spellCheck={false}
                  autoCorrect="off"
                  autoComplete="off"
                  data-gramm="false"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  NCTB Grammatical Pattern
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 cursor-pointer"
                >
                  <option value="Participle/Gerund phrase (starting with V-ing)">
                    Present Participle / Gerund: "V-ing..." (Highest Board recommendation)
                  </option>
                  <option value="Past tense verb (e.g. placed..., set out...)">
                    Past Tense Verbs: "placed...", "set out..." (Screenshot format)
                  </option>
                  <option value="Infinitive phrase (To + Base verb)">
                    Infinitive: "To place...", "To set out..."
                  </option>
                  <option value="Noun phrase or Prepositional phrase">
                    Noun / Prepositional phrase: "By placing...", "During journey..."
                  </option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Generated Board-Standard Flowchart
                </span>
                <button
                  onClick={() => setResult(null)}
                  className="text-xs text-blue-400 hover:underline cursor-pointer"
                >
                  Regenerate / Edit Topic
                </button>
              </div>

              {/* Title preview */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Title Format
                </span>
                <p className="text-sm font-semibold text-blue-400 underline">
                  {result.title}
                </p>
              </div>

              {/* Boxes preview */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  6 Points Preview
                </span>
                {result.boxes.map((box, index) => (
                  <div
                    key={index}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-baseline gap-2 text-xs"
                  >
                    <span className="font-bold text-blue-400 font-mono">
                      {index + 1}.
                    </span>
                    <span className="text-slate-200">{box}</span>
                  </div>
                ))}
              </div>

              {result.grammarTip && (
                <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  {result.grammarTip}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
          {!result ? (
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Flowchart
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleApplyResult}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Apply to Canvas
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
