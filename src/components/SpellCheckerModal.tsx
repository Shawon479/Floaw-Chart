import React, { useEffect, useState } from 'react';
import { FlowchartConfig } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  Loader2,
  Wand2,
  RefreshCw,
  Search,
} from 'lucide-react';

export interface SpellError {
  location: string;
  boxIndex: number; // -1 for Title, 0+ for boxes
  wrongWord: string;
  suggestion: string;
  reason?: string;
}

export interface SpellCheckResult {
  hasErrors: boolean;
  errors: SpellError[];
  correctedTitle: string;
  correctedBoxes: string[];
}

interface SpellCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FlowchartConfig;
  onApplyCorrections: (correctedTitle: string, correctedBoxes: string[]) => void;
  onApplySingleCorrection: (boxIndex: number, wrongWord: string, suggestion: string) => void;
}

// Common dictionary of typical English and textbook typos for instant offline accuracy
const COMMON_TYPOS: Record<string, string> = {
  husbnd: 'husband',
  banan: 'banana',
  hazadous: 'hazardous',
  hazerdous: 'hazardous',
  temptashun: 'temptation',
  temptatn: 'temptation',
  abod: 'abode',
  pleadid: 'pleaded',
  worshp: 'worship',
  sacrifise: 'sacrifice',
  restor: 'restore',
  restord: 'restored',
  journly: 'journey',
  journy: 'journey',
  danjers: 'dangers',
  encountred: 'encountered',
  succeds: 'succeeds',
  succeded: 'succeeded',
  promisd: 'promised',
  democrasy: 'democracy',
  apartid: 'apartheid',
  prisn: 'prison',
  beatch: 'beach',
  sunris: 'sunrise',
  sunst: 'sunset',
  turism: 'tourism',
  empowr: 'empower',
  empowrment: 'empowerment',
  traffick: 'traffic',
  polce: 'police',
  challange: 'challenge',
  challanges: 'challenges',
  enviornment: 'environment',
  enviroment: 'environment',
  biodiversiti: 'biodiversity',
  recieve: 'receive',
  receiv: 'receive',
  seperate: 'separate',
  definately: 'definitely',
  occured: 'occurred',
  goverment: 'government',
  acheive: 'achieve',
  acheived: 'achieved',
  untill: 'until',
  wierd: 'weird',
  beleive: 'believe',
  beleived: 'believed',
  calender: 'calendar',
  collegue: 'colleague',
  embarass: 'embarrass',
  forein: 'foreign',
  independant: 'independent',
  knowlege: 'knowledge',
  mispell: 'misspell',
  neccessary: 'necessary',
  necesary: 'necessary',
  noticable: 'noticeable',
  paralel: 'parallel',
  persue: 'pursue',
  priviledge: 'privilege',
  recommand: 'recommend',
  suprise: 'surprise',
  writen: 'written',
  writting: 'writing',
  begining: 'beginning',
  commited: 'committed',
  decison: 'decision',
  develope: 'develop',
  existance: 'existence',
  grammer: 'grammar',
  happend: 'happened',
  truely: 'truly',
  unfortunatly: 'unfortunately',
  diferent: 'different',
  diffrent: 'different',
  importent: 'important',
  peaple: 'people',
  poeple: 'people',
  countri: 'country',
  educaton: 'education',
  activites: 'activities',
  beutiful: 'beautiful',
  villadge: 'village',
  strugle: 'struggle',
  leadre: 'leader',
  histori: 'history',
  traditon: 'tradition',
  resturd: 'restored',
  lif: 'life',
  beening: 'being',
  reache: 'reach',
  reacht: 'reached',
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function localDictionaryCheck(title: string, boxes: string[]): SpellCheckResult {
  const errors: SpellError[] = [];
  let correctedTitle = title;
  const correctedBoxes = [...boxes];

  const checkText = (text: string, location: string, boxIndex: number) => {
    // Split text into words while keeping boundaries
    const words = text.match(/\b[a-zA-Z']+\b/g) || [];
    for (const w of words) {
      const lower = w.toLowerCase().trim();
      const replacement = COMMON_TYPOS[lower];

      if (!replacement || replacement.toLowerCase() === lower) continue;

      const formattedRepl =
        w.charAt(0) === w.charAt(0).toUpperCase()
          ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
          : replacement;

      // Avoid adding duplicate error for the same word in the same box
      if (!errors.some((e) => e.boxIndex === boxIndex && e.wrongWord.toLowerCase() === lower)) {
        errors.push({
          location,
          boxIndex,
          wrongWord: w,
          suggestion: formattedRepl,
          reason: 'Spelling mistake',
        });
      }
    }
  };

  checkText(title, 'Title', -1);
  for (const err of errors.filter((e) => e.boxIndex === -1)) {
    correctedTitle = correctedTitle.replace(
      new RegExp(`\\b${escapeRegExp(err.wrongWord)}\\b`, 'g'),
      err.suggestion
    );
  }

  boxes.forEach((box, idx) => {
    checkText(box, `Box ${idx + 1}`, idx);
    let fixedBox = box;
    for (const err of errors.filter((e) => e.boxIndex === idx)) {
      fixedBox = fixedBox.replace(
        new RegExp(`\\b${escapeRegExp(err.wrongWord)}\\b`, 'g'),
        err.suggestion
      );
    }
    correctedBoxes[idx] = fixedBox;
  });

  return {
    hasErrors: errors.length > 0,
    errors,
    correctedTitle,
    correctedBoxes,
  };
}

export const SpellCheckerModal: React.FC<SpellCheckerModalProps> = ({
  isOpen,
  onClose,
  config,
  onApplyCorrections,
  onApplySingleCorrection,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<SpellCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Never show a stale scan from a previous chart when the modal is reopened.
  useEffect(() => {
    if (!isOpen) return;
    setScanResult(null);
    setErrorMsg(null);
    setIsScanning(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScanChart = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    setScanResult(null);

    // Offline dictionary always runs, so a flaky network can never hide obvious typos.
    const localResult = localDictionaryCheck(config.title, config.boxes);
    let aiResult: SpellCheckResult | null = null;

    try {
      const response = await fetch('/api/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(60_000),
        body: JSON.stringify({
          title: config.title,
          boxes: config.boxes,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `AI scan failed (HTTP ${response.status}).`);
      }

      if (!data || !Array.isArray(data.errors)) {
        throw new Error('The AI service returned an unexpected spell-check response.');
      }

      aiResult = {
        hasErrors: data.errors.length > 0,
        errors: data.errors,
        correctedTitle: data.correctedTitle || config.title,
        correctedBoxes: Array.isArray(data.correctedBoxes) ? data.correctedBoxes : [...config.boxes],
      };
    } catch (err: any) {
      console.warn('AI spell check unavailable, using offline dictionary:', err);
      setErrorMsg(
        `AI scanner is unavailable right now, so the offline dictionary was used instead. ${
          err?.name === 'TimeoutError' ? 'The AI request timed out.' : ''
        }`.trim()
      );
    }

    let parsedResult: SpellCheckResult;

    if (!aiResult) {
      parsedResult = localResult;
    } else {
      parsedResult = aiResult;

      // Merge offline dictionary findings that the AI missed.
      const existingKeys = new Set(
        parsedResult.errors.map((e) => `${e.boxIndex}:${e.wrongWord.toLowerCase()}`)
      );

      for (const localError of localResult.errors) {
        const key = `${localError.boxIndex}:${localError.wrongWord.toLowerCase()}`;
        if (existingKeys.has(key)) continue;
        parsedResult.errors.push(localError);
        existingKeys.add(key);
      }

      let correctedTitle = parsedResult.correctedTitle || config.title;
      const correctedBoxes =
        Array.isArray(parsedResult.correctedBoxes) &&
        parsedResult.correctedBoxes.length === config.boxes.length
          ? [...parsedResult.correctedBoxes]
          : [...config.boxes];

      for (const issue of parsedResult.errors) {
        if (!issue.wrongWord || !issue.suggestion) continue;
        const escaped = issue.wrongWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

        if (issue.boxIndex === -1) {
          correctedTitle = correctedTitle.replace(regex, issue.suggestion);
        } else if (issue.boxIndex >= 0 && issue.boxIndex < correctedBoxes.length) {
          correctedBoxes[issue.boxIndex] = correctedBoxes[issue.boxIndex].replace(
            regex,
            issue.suggestion
          );
        }
      }

      parsedResult.correctedTitle = correctedTitle;
      parsedResult.correctedBoxes = correctedBoxes;
      parsedResult.hasErrors = parsedResult.errors.length > 0;
    }

    setScanResult(parsedResult);
    setIsScanning(false);
  };

  const handleFixAll = () => {
    if (scanResult) {
      onApplyCorrections(scanResult.correctedTitle, scanResult.correctedBoxes);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                AI Spelling Corrector
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  Smart Scanner
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Scan your whole flowchart to locate and fix typos & wrong spelling
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
          {!scanResult && !isScanning && (
            <div className="text-center py-6 px-4 space-y-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-200">
                  Ready to scan {config.boxes.length} boxes & title
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  AI will analyze every word against standard English dictionary and exam standards to highlight wrong spellings.
                </p>
              </div>
              <button
                type="button"
                onClick={handleScanChart}
                className="mt-2 py-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                Scan Whole Flowchart
              </button>
            </div>
          )}

          {isScanning && (
            <div className="text-center py-10 space-y-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-medium">
                Scanning chart for misspelled words using AI...
              </p>
              <p className="text-[11px] text-slate-500">
                Checking vocabulary, prefixes, and exam phrasings
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {scanResult && (
            <div className="space-y-4">
              {scanResult.hasErrors && scanResult.errors.length > 0 ? (
                <>
                  <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-amber-300">
                      <AlertTriangle className="w-4 h-4" />
                      <span>
                        Found <strong>{scanResult.errors.length}</strong> spelling issue{scanResult.errors.length > 1 ? 's' : ''}:
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFixAll}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      Fix All Mistakes
                    </button>
                  </div>

                  <div className="space-y-2">
                    {scanResult.errors.map((err, index) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded text-[10px] border border-blue-900/50">
                              {err.location}
                            </span>
                            <span className="line-through text-rose-400 font-mono">
                              "{err.wrongWord}"
                            </span>
                            <span className="text-slate-400 font-bold">➔</span>
                            <span className="text-emerald-400 font-bold font-mono">
                              "{err.suggestion}"
                            </span>
                          </div>
                          {err.reason && (
                            <p className="text-[11px] text-slate-400">{err.reason}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onApplySingleCorrection(err.boxIndex, err.wrongWord, err.suggestion);
                            setScanResult({
                              ...scanResult,
                              errors: scanResult.errors.filter((_, i) => i !== index),
                              hasErrors: scanResult.errors.length > 1,
                            });
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-md text-xs font-medium cursor-pointer shrink-0 transition-colors"
                        >
                          Fix Word
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-2 bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-300">
                    All Words Spelled Correctly!
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No spelling mistakes detected in your title or flowchart boxes.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          {scanResult ? (
            <button
              type="button"
              onClick={handleScanChart}
              disabled={isScanning}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-scan Chart
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">
              Scans all boxes and heading instantly
            </span>
          )}
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
