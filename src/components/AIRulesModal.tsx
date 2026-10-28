import React, { useState } from 'react';
import { FlowchartConfig } from '../types';
import { auditFlowchartRules } from '../utils/ruleChecker';
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Wand2,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

interface AIRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FlowchartConfig;
  onApplyFixes: (newTitle: string, newBoxes: string[]) => void;
}

export const AIRulesModal: React.FC<AIRulesModalProps> = ({
  isOpen,
  onClose,
  config,
  onApplyFixes,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!isOpen) return null;

  const report = auditFlowchartRules(config);
  const isFullMarks = report.overallScore === 100;

  const handleApplyImmediateFix = () => {
    onApplyFixes(report.fixedTitle, report.fixedBoxes);
    onClose();
  };

  const handleAiDeepFix = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/rules-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(60_000),
        body: JSON.stringify({
          title: config.title,
          boxes: config.boxes,
          targetGrammar: report.box1PatternLabel,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.fixedTitle && Array.isArray(data.fixedBoxes)) {
        onApplyFixes(data.fixedTitle, data.fixedBoxes);
        onClose();
        return;
      }
      throw new Error(data?.error || `AI rule fix failed (HTTP ${res.status}).`);
    } catch (e) {
      console.warn('AI deep fix unavailable, falling back to deterministic fix:', e);
    } finally {
      setIsAiLoading(false);
    }
    // Fallback to instant rule fixer
    handleApplyImmediateFix();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isFullMarks
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100">
                  HSC Exam Rules Auditor
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  NCTB English 1st
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audits against Bangladesh Board criteria (Question No. 2: Flow Chart)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-300">
          {/* Score Header Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isFullMarks
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                  isFullMarks ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {report.overallScore}%
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {isFullMarks
                    ? 'Exam Compliant — Full Marks Ready (5/5)'
                    : `${report.rules.length - report.passedCount} Rule Violations Found`}
                </div>
                <div className="text-xs text-slate-400">
                  Detected Box 1 pattern: <span className="text-blue-300 font-medium">{report.box1PatternLabel}</span>
                </div>
              </div>
            </div>

            {report.hasErrors && (
              <button
                type="button"
                onClick={handleApplyImmediateFix}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Fix All Rule Violations</span>
              </button>
            )}
          </div>

          {/* Rule Itemized Checklist */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
              Examination Checklist & Standards:
            </h4>
            {report.rules.map((rule) => {
              const isPass = rule.status === 'pass';
              const isWarn = rule.status === 'warning';
              return (
                <div
                  key={rule.ruleId}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isPass
                      ? 'bg-slate-950/60 border-slate-800/80'
                      : isWarn
                      ? 'bg-amber-950/20 border-amber-800/40'
                      : 'bg-red-950/20 border-red-800/40'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {isPass ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100 text-xs sm:text-sm">
                          {rule.ruleTitle}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            isPass
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : isWarn
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {rule.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {rule.description}
                      </p>
                      <p
                        className={`text-xs font-medium leading-relaxed ${
                          isPass ? 'text-slate-300' : 'text-amber-200'
                        }`}
                      >
                        {rule.details}
                      </p>
                      {rule.suggestion && (
                        <div className="text-[11px] text-blue-300 bg-blue-950/40 border border-blue-900/50 p-1.5 rounded mt-1">
                          Tip: {rule.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Proposed Fixes Dropdown */}
          {report.hasErrors && (
            <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full p-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white cursor-pointer bg-slate-900/40"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Preview One-Click Auto-Fix Adjustments</span>
                </div>
                {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showPreview && (
                <div className="p-3.5 border-t border-slate-800 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-1">Standardized Title:</span>
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono text-[11px]">
                      {report.fixedTitle}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block mb-1">Harmonized Boxes:</span>
                    <div className="space-y-1.5">
                      {report.fixedBoxes.map((b, i) => (
                        <div
                          key={i}
                          className="p-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 flex items-start gap-2"
                        >
                          <span className="text-blue-400 font-mono text-[10px] shrink-0 mt-0.5">[{i + 1}]</span>
                          <span className="text-xs">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            {isFullMarks
              ? 'Your flowchart strictly obeys all 5 NCTB rules.'
              : 'Click below to instantly conform your chart to board rules.'}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            >
              Close
            </button>

            {report.hasErrors ? (
              <>
                <button
                  type="button"
                  onClick={handleAiDeepFix}
                  disabled={isAiLoading}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  title="Use AI to rephrase and harmonize points"
                >
                  {isAiLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>AI Deep Fix</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyImmediateFix}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Fix All (1-Click)</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Looks Great!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
