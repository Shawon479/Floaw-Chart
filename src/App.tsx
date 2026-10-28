import { useState, useEffect } from 'react';
import { FlowchartConfig, HscPreset } from './types';
import { DEFAULT_FLOWCHART } from './constants/presets';
import { FlowchartCanvas } from './components/FlowchartCanvas';
import { EditorSidebar } from './components/EditorSidebar';
import { AIGeneratorModal } from './components/AIGeneratorModal';
import { PresetModal } from './components/PresetModal';
import { HscTipsModal } from './components/HscTipsModal';
import { SpellCheckerModal } from './components/SpellCheckerModal';
import { SavedDraftsModal } from './components/SavedDraftsModal';
import { AIRulesModal } from './components/AIRulesModal';
import { exportAsPdf, exportAsPng } from './utils/exportUtils';
import { LocalCookieDb } from './utils/cookieStorage';
import { Analytics } from '@vercel/analytics/react';
import {
  FileDown,
  Image as ImageIcon,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Loader2,
  Edit3,
  Eye,
  GraduationCap,
  Search,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<FlowchartConfig>(() => {
    try {
      const saved = LocalCookieDb.loadActiveFlowchart();
      if (saved && Array.isArray(saved.boxes)) {
        saved.boxes = saved.boxes.map((b: string) =>
          b ? b.charAt(0).toUpperCase() + b.slice(1) : b
        );
        return saved;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_FLOWCHART;
  });

  const [zoom, setZoom] = useState<number>(100);
  const [mobileView, setMobileView] = useState<'preview' | 'editor'>('preview');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [isSpellModalOpen, setIsSpellModalOpen] = useState(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Auto-save to Local Cookie DB
  useEffect(() => {
    try {
      LocalCookieDb.saveActiveFlowchart(config);
    } catch {
      // Ignore
    }
  }, [config]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Rule fix handler
  const handleApplyRuleFixes = (fixedTitle: string, fixedBoxes: string[]) => {
    setConfig((c) => ({
      ...c,
      title: fixedTitle,
      boxes: fixedBoxes,
    }));
    showToast('Flowchart successfully harmonized to HSC Board Rules!');
  };

  // Export handlers
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      if (mobileView === 'editor') {
        setMobileView('preview');
        await new Promise((r) => setTimeout(r, 150));
      }

      const cleanTitle = (
        config.title
          .replace(/[^a-zA-Z0-9]/g, '_')
          .replace(/_+/g, '_')
          .slice(0, 35)
          .replace(/^_|_$/g, '')
      ) || 'HSC_Flowchart';

      const method = await exportAsPdf('flowchart-canvas', `${cleanTitle}.pdf`, true);
      showToast(
        method === 'print'
          ? 'PDF file could not be generated, so the print dialog was opened — choose "Save as PDF".'
          : 'PDF downloaded! Check your device Downloads folder.'
      );
    } catch (err: any) {
      console.error('PDF export failed:', err);
      showToast(err.message || 'Could not export PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportPng = async () => {
    setIsExportingPng(true);
    try {
      if (mobileView === 'editor') {
        setMobileView('preview');
        await new Promise((r) => setTimeout(r, 150));
      }

      const cleanTitle = (
        config.title
          .replace(/[^a-zA-Z0-9]/g, '_')
          .replace(/_+/g, '_')
          .slice(0, 35)
          .replace(/^_|_$/g, '')
      ) || 'HSC_Flowchart';

      await exportAsPng('flowchart-canvas', `${cleanTitle}.png`);
      showToast('PNG image downloaded! Check your device Downloads folder.');
    } catch (err: any) {
      console.error('PNG export failed:', err);
      showToast('Failed to export image.');
    } finally {
      setIsExportingPng(false);
    }
  };



  // Direct canvas inline updates
  const handleUpdateBoxText = (index: number, newText: string) => {
    const updated = [...config.boxes];
    const trimmed = newText.trim();
    const capitalized = trimmed
      ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
      : newText;
    updated[index] = capitalized;
    setConfig({ ...config, boxes: updated });
  };

  const handleUpdateTitle = (newTitle: string) => {
    setConfig({ ...config, title: newTitle });
  };

  const handleSelectPreset = (preset: HscPreset) => {
    setConfig({
      ...config,
      title: preset.config.title,
      boxes: preset.config.boxes,
    });
    showToast(`Loaded "${preset.title}" flowchart!`);
  };

  const handleApplyAi = (generated: { title: string; boxes: string[] }) => {
    setConfig({
      ...config,
      title: generated.title,
      boxes: generated.boxes,
    });
    showToast('AI-generated flowchart applied successfully!');
  };

  const handleResetToDefault = () => {
    setConfig(DEFAULT_FLOWCHART);
    showToast('Reset to original Behula Lakhinder flowchart.');
  };

  const handleApplyCorrections = (correctedTitle: string, correctedBoxes: string[]) => {
    setConfig({
      ...config,
      title: correctedTitle,
      boxes: correctedBoxes,
    });
    showToast('All spelling mistakes corrected successfully!');
  };

  const handleApplySingleCorrection = (boxIndex: number, wrongWord: string, suggestion: string) => {
    const escaped = wrongWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    if (boxIndex === -1) {
      setConfig({
        ...config,
        title: config.title.replace(regex, suggestion),
      });
    } else if (boxIndex >= 0 && boxIndex < config.boxes.length) {
      const updated = [...config.boxes];
      updated[boxIndex] = updated[boxIndex].replace(regex, suggestion);
      setConfig({ ...config, boxes: updated });
    }
    showToast(`Replaced "${wrongWord}" with "${suggestion}"`);
  };

  const handleLoadDraft = (draftConfig: FlowchartConfig, draftName: string) => {
    setConfig(draftConfig);
    showToast(`Loaded "${draftName}" from Cookie DB!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Main Navigation Bar */}
      <header className="no-print h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                Flow-chart maker
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  HSC
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Center / Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Audit Rules Button */}
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Audit flowchart against Bangladesh HSC Board Examination rules"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Audit Rules</span>
          </button>

          {/* Quick AI & Spellcheck */}
          <button
            onClick={() => setIsSpellModalOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Scan whole chart for wrong spelling using AI"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Scan Spelling</span>
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Generate using AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Generate</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          {/* Export Actions */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Export high quality PDF with print fallback"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleExportPng}
            disabled={isExportingPng}
            className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Download PNG Image"
          >
            {isExportingPng ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="hidden sm:inline">PNG Image</span>
          </button>
        </div>
      </header>

      {/* Mobile View Toggle */}
      <div className="no-print lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 w-full">
          <button
            onClick={() => setMobileView('preview')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileView === 'preview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Canvas
          </button>
          <button
            onClick={() => setMobileView('editor')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileView === 'editor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Editor & Colors
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Editor Sidebar + Right Flowchart Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={`no-print ${
            mobileView === 'editor' ? 'block w-full' : 'hidden'
          } lg:block lg:w-96 shrink-0 h-full z-20`}
        >
          <EditorSidebar
            config={config}
            onChange={setConfig}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
            onOpenTipsModal={() => setIsTipsModalOpen(true)}
            onOpenSpellModal={() => setIsSpellModalOpen(true)}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
            onResetToDefault={handleResetToDefault}
          />
        </div>

        {/* Right Canvas Preview Area */}
        <main
          className={`${
            mobileView === 'preview' ? 'flex' : 'hidden'
          } lg:flex flex-1 flex-col h-full bg-slate-950 overflow-y-auto relative p-3 sm:p-6 lg:p-8 items-center`}
        >
          {/* Canvas Floating Toolbar */}
          <div className="no-print w-full max-w-3xl mb-4 flex flex-col gap-2.5 text-xs text-slate-300">
            {/* Top Row: Presets & Equal Size Quick Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-xl backdrop-blur shadow-sm">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                  Quick HSC Lessons:
                </span>
                <button
                  onClick={handleResetToDefault}
                  className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-800/80 rounded-md text-xs font-medium cursor-pointer transition-colors"
                >
                  Behula (Default)
                </button>
                <button
                  onClick={() => setIsRulesModalOpen(true)}
                  className="px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-700/60 rounded-md text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
                  title="Check flowchart against Bangladesh HSC Board rules"
                >
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Audit Rules
                </button>
                <button
                  onClick={() => setIsSpellModalOpen(true)}
                  className="px-2.5 py-1 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 rounded-md text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Search className="w-3 h-3 text-indigo-400" />
                  Scan Spelling
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-0.5 rounded-lg ml-auto">
                <button
                  onClick={() => setZoom((z) => Math.max(50, z - 10))}
                  className="p-1 hover:text-slate-100 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1 w-9 text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(150, z + 10))}
                  className="p-1 hover:text-slate-100 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-1 hover:text-slate-100 cursor-pointer border-l border-slate-800 ml-0.5 pl-1"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Second Row: Box Size & Arrow Quick Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              {/* Equal Box Size Toggle and Height selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      boxStyle: {
                        ...c.boxStyle,
                        isUniformHeight: !c.boxStyle.isUniformHeight,
                      },
                    }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    (config.boxStyle.isUniformHeight ?? true)
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/80 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  All Boxes Equal Size
                </button>

                {(config.boxStyle.isUniformHeight ?? true) && (
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[11px]">
                    <span className="px-1.5 text-slate-500 font-mono">Height:</span>
                    {[
                      { label: '54px (Standard)', val: 54 },
                      { label: '64px (Spacious)', val: 64 },
                      { label: '76px (Tall)', val: 76 },
                    ].map((h) => (
                      <button
                        key={h.val}
                        onClick={() =>
                          setConfig((c) => ({
                            ...c,
                            boxStyle: {
                              ...c.boxStyle,
                              isUniformHeight: true,
                              uniformHeight: h.val,
                            },
                          }))
                        }
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          (config.boxStyle.uniformHeight || 54) === h.val
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {h.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Arrow Style Toggle */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[11px]">
                <span className="px-1.5 text-slate-500">Arrow:</span>
                <button
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      arrowStyle: {
                        ...c.arrowStyle,
                        type: 'slim',
                        thickness: 1.25,
                      },
                    }))
                  }
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    (config.arrowStyle.type || 'slim') === 'slim'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Slim (Screenshot)
                </button>
                <button
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      arrowStyle: {
                        ...c.arrowStyle,
                        type: 'triangle',
                        thickness: 1.5,
                      },
                    }))
                  }
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    config.arrowStyle.type === 'triangle'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Solid Arrow
                </button>
              </div>
            </div>
          </div>

          {/* Paper View Container with Realistic A4 Aspect and Drop Shadow */}
          <div
            className="zoom-wrapper w-full flex justify-center transition-transform origin-top pb-16"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <div className="w-full max-w-3xl bg-white shadow-2xl rounded-sm border border-slate-300/40 relative">
              <FlowchartCanvas
                config={config}
                onUpdateBoxText={handleUpdateBoxText}
                onUpdateTitle={handleUpdateTitle}
                isInteractive={true}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/40 text-slate-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-bounce font-medium">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <AIGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApply={handleApplyAi}
      />

      <PresetModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <HscTipsModal
        isOpen={isTipsModalOpen}
        onClose={() => setIsTipsModalOpen(false)}
      />

      <SpellCheckerModal
        isOpen={isSpellModalOpen}
        onClose={() => setIsSpellModalOpen(false)}
        config={config}
        onApplyCorrections={handleApplyCorrections}
        onApplySingleCorrection={handleApplySingleCorrection}
      />

      <SavedDraftsModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        currentConfig={config}
        onLoadDraft={handleLoadDraft}
      />

      <AIRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        config={config}
        onApplyFixes={handleApplyRuleFixes}
      />

      <Analytics />
    </div>
  );
}
