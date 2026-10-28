import React, { useState } from 'react';
import {
  FlowchartConfig,
  FlowchartLayout,
  NumberFormat,
  FontFamily,
} from '../types';
import { COLOR_THEMES } from '../constants/presets';
import {
  Type,
  Palette,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Wand2,
  HelpCircle,
  RotateCcw,
  ClipboardPaste,
  Maximize2,
  ShieldCheck,
} from 'lucide-react';

interface EditorSidebarProps {
  config: FlowchartConfig;
  onChange: (updated: FlowchartConfig) => void;
  onOpenAiModal: () => void;
  onOpenPresetsModal: () => void;
  onOpenTipsModal: () => void;
  onOpenSpellModal?: () => void;
  onOpenRulesModal?: () => void;
  onResetToDefault: () => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  config,
  onChange,
  onOpenAiModal,
  onOpenPresetsModal,
  onOpenTipsModal,
  onOpenSpellModal,
  onOpenRulesModal,
  onResetToDefault,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'rules'>('content');
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');

  // Bulk paste handler
  const handleApplyBulkText = () => {
    if (!bulkInputText.trim()) return;
    const lines = bulkInputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((l) => {
        const cleaned = l.replace(/^(\d+[\.\)]|\([ivx\d]+\)|[①-⑩])\s*/i, '').trim();
        return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : '';
      })
      .filter((l) => l.length > 0);

    if (lines.length > 0) {
      onChange({
        ...config,
        boxes: lines,
      });
      setShowBulkPaste(false);
      setBulkInputText('');
    }
  };

  // Box helpers
  const handleBoxChange = (index: number, value: string) => {
    const updatedBoxes = [...config.boxes];
    updatedBoxes[index] = value;
    onChange({ ...config, boxes: updatedBoxes });
  };

  const handleAddBox = () => {
    onChange({
      ...config,
      boxes: [...config.boxes, 'New point description'],
    });
  };

  const handleDeleteBox = (index: number) => {
    if (config.boxes.length <= 2) return;
    const updatedBoxes = config.boxes.filter((_, i) => i !== index);
    onChange({ ...config, boxes: updatedBoxes });
  };

  const handleMoveBox = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.boxes.length) return;
    const updatedBoxes = [...config.boxes];
    const temp = updatedBoxes[index];
    updatedBoxes[index] = updatedBoxes[targetIndex];
    updatedBoxes[targetIndex] = temp;
    onChange({ ...config, boxes: updatedBoxes });
  };

  // Grammar & HSC Quick Formatter
  const applyGrammarTransform = (type: 'cleanNumbers' | 'lowercaseFirst' | 'capitalFirst') => {
    const updatedBoxes = config.boxes.map((text) => {
      let t = text.trim();
      if (type === 'cleanNumbers') {
        t = t.replace(/^(\d+[\.\)]|\([ivx\d]+\)|[①-⑩])\s*/i, '');
      }
      if (type === 'lowercaseFirst' && t.length > 0) {
        // Many HSC teachers prefer starting with lowercase if following number, or lowercase participle
        t = t.charAt(0).toLowerCase() + t.slice(1);
      }
      if (type === 'capitalFirst' && t.length > 0) {
        t = t.charAt(0).toUpperCase() + t.slice(1);
      }
      return t;
    });
    onChange({ ...config, boxes: updatedBoxes });
  };

  const applyColorTheme = (theme: (typeof COLOR_THEMES)[0]) => {
    onChange({
      ...config,
      titleStyle: {
        ...config.titleStyle,
        color: theme.titleColor,
      },
      numberStyle: {
        ...config.numberStyle,
        color: theme.numberColor,
      },
      boxStyle: {
        ...config.boxStyle,
        borderColor: theme.borderColor,
        backgroundColor: theme.boxBg,
        borderRadius: theme.borderRadius,
      },
      arrowStyle: {
        ...config.arrowStyle,
        color: theme.arrowColor,
      },
    });
  };

  return (
    <aside className="w-full lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 shadow-xl overflow-hidden">
      {/* Top Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'content'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Type className="w-4 h-4" />
          Content
        </button>
        <button
          onClick={() => setActiveTab('design')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'design'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Palette className="w-4 h-4" />
          Style & Color
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'rules'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          HSC Rules
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-slate-200 custom-scrollbar">
        {/* Quick Action Buttons on top of sidebar */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenAiModal}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Auto-Generate
          </button>
          <button
            onClick={onOpenPresetsModal}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            Textbook Presets
          </button>
        </div>

        {/* ----------------- TAB: CONTENT ----------------- */}
        {activeTab === 'content' && (
          <div className="space-y-5">
            {/* Title / Heading Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Heading / Title
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...config,
                      title: 'A flow-chart showing [topic] is given below:',
                    })
                  }
                  className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                >
                  Board template
                </button>
              </div>
              <textarea
                rows={2}
                value={config.title}
                onChange={(e) => onChange({ ...config, title: e.target.value })}
                placeholder="A flow-chart showing ... is given below:"
                spellCheck={false}
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="sentences"
                data-gramm="false"
                data-enable-grammarly="false"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400">
                In HSC English, the heading format <span className="text-blue-400 italic font-mono">"A flow-chart showing ... is given below:"</span> is universally expected by board examiners.
              </p>
            </div>

            {/* Quick Grammar / Formatter Tools */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  Quick Phrasing Formatters
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => applyGrammarTransform('cleanNumbers')}
                  title="Strip duplicate 1., 2. prefixes if copied from book"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Strip "1." from text
                </button>
                <button
                  onClick={() => applyGrammarTransform('lowercaseFirst')}
                  title="Make first letter lowercase"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded text-slate-300 border border-slate-700 cursor-pointer"
                >
                  lowercase first
                </button>
                <button
                  onClick={() => applyGrammarTransform('capitalFirst')}
                  title="Capitalize first letter"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Capitalize first
                </button>
                {onOpenSpellModal && (
                  <button
                    onClick={onOpenSpellModal}
                    title="Scan whole flowchart for wrong spelling using AI"
                    className="px-2 py-1 bg-indigo-950 hover:bg-indigo-900 text-[11px] rounded text-indigo-300 border border-indigo-700/70 cursor-pointer font-semibold shadow-xs"
                  >
                    🔍 Scan Spelling
                  </button>
                )}
              </div>
            </div>

            {/* Make All Boxes Equal Size */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  Make All Boxes Equal Size
                </span>
                <input
                  type="checkbox"
                  checked={config.boxStyle.isUniformHeight ?? true}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      boxStyle: {
                        ...config.boxStyle,
                        isUniformHeight: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
              </div>

              {(config.boxStyle.isUniformHeight ?? true) && (
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Equal Box Height:</span>
                    <span className="font-mono text-blue-400 font-bold">
                      {config.boxStyle.uniformHeight || 54}px
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Compact', val: 48 },
                      { label: 'Standard', val: 54 },
                      { label: 'Spacious', val: 64 },
                      { label: 'Tall', val: 76 },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...config,
                            boxStyle: {
                              ...config.boxStyle,
                              isUniformHeight: true,
                              uniformHeight: preset.val,
                            },
                          })
                        }
                        className={`py-1 text-[11px] rounded border transition-colors cursor-pointer ${
                          (config.boxStyle.uniformHeight || 54) === preset.val
                            ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Text Alignment:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...config,
                            boxStyle: { ...config.boxStyle, verticalAlign: 'center' },
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                          (config.boxStyle.verticalAlign || 'center') === 'center'
                            ? 'bg-blue-600 text-white font-medium'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        Centered
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...config,
                            boxStyle: { ...config.boxStyle, verticalAlign: 'top' },
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                          config.boxStyle.verticalAlign === 'top'
                            ? 'bg-blue-600 text-white font-medium'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        Top
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Paste Multiple Points at Once */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ClipboardPaste className="w-3.5 h-3.5 text-blue-400" />
                  Paste All 6 Points at Once
                </span>
                <button
                  type="button"
                  onClick={() => setShowBulkPaste(!showBulkPaste)}
                  className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                >
                  {showBulkPaste ? 'Close' : 'Quick Paste'}
                </button>
              </div>
              {showBulkPaste && (
                <div className="space-y-2 pt-1">
                  <textarea
                    rows={6}
                    value={bulkInputText}
                    onChange={(e) => setBulkInputText(e.target.value)}
                    placeholder={`Paste 6 lines here:\nplaced her husband's corpse on a banana raft\nset out on a hazardous journey\nshe encountered all dangers...`}
                    spellCheck={false}
                    autoCorrect="off"
                    autoComplete="off"
                    autoCapitalize="sentences"
                    data-gramm="false"
                    data-enable-grammarly="false"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkText}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                  >
                    Apply All 6 Lines to Flowchart
                  </button>
                </div>
              )}
            </div>

            {/* Boxes List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Flowchart Points ({config.boxes.length} boxes)
                </label>
                <span className="text-[11px] text-slate-500">Standard HSC has 6 boxes</span>
              </div>

              <div className="space-y-2.5">
                {config.boxes.map((box, index) => (
                  <div
                    key={index}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-2 group hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center shrink-0 pt-1 text-slate-400">
                      <span className="text-xs font-bold font-mono text-blue-400">
                        {index + 1}
                      </span>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <button
                          type="button"
                          onClick={() => handleMoveBox(index, 'up')}
                          disabled={index === 0}
                          className="p-0.5 hover:text-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveBox(index, 'down')}
                          disabled={index === config.boxes.length - 1}
                          className="p-0.5 hover:text-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={box}
                      onChange={(e) => handleBoxChange(index, e.target.value)}
                      placeholder={`Point ${index + 1}...`}
                      spellCheck={false}
                      autoCorrect="off"
                      autoComplete="off"
                      autoCapitalize="sentences"
                      data-gramm="false"
                      data-enable-grammarly="false"
                      className="flex-1 bg-transparent border-0 p-0 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-0 resize-none leading-snug"
                    />

                    <button
                      type="button"
                      onClick={() => handleDeleteBox(index)}
                      disabled={config.boxes.length <= 2}
                      className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-20 cursor-pointer shrink-0 transition-colors"
                      title="Delete this box"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddBox}
                className="w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-blue-500 hover:bg-blue-950/20 text-slate-300 hover:text-blue-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Another Box
              </button>
            </div>
          </div>
        )}

        {/* ----------------- TAB: DESIGN & COLOR ----------------- */}
        {activeTab === 'design' && (
          <div className="space-y-6">
            {/* Color Themes / Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                1-Click Color Themes
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => applyColorTheme(theme)}
                    className="p-2.5 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-1 group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: theme.titleColor }}
                      />
                      <span
                        className="w-3 h-3 rounded-sm border border-slate-600"
                        style={{ backgroundColor: theme.boxBg }}
                      />
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: theme.borderColor }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-200 group-hover:text-blue-300 truncate">
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Mode */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Layout Direction
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'vertical', label: 'Vertical (Screenshot)', desc: '1 ↓ 2 ↓ 3' },
                  { id: 'horizontal', label: 'Horizontal', desc: '1 → 2 → 3' },
                  { id: 'grid2', label: '2-Row Grid', desc: '3 x 2' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      onChange({ ...config, layout: item.id as FlowchartLayout })
                    }
                    className={`p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      config.layout === item.id
                        ? 'border-blue-500 bg-blue-950/40 text-blue-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title Styling */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Title Typography & Colors
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Title Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.titleStyle.color}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          titleStyle: { ...config.titleStyle, color: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.titleStyle.color}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          titleStyle: { ...config.titleStyle, color: e.target.value },
                        })
                      }
                      className="w-20 bg-slate-950 border border-slate-700 text-xs px-2 py-1 rounded font-mono"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">Font Family</span>
                  <select
                    value={config.titleStyle.fontFamily}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        titleStyle: {
                          ...config.titleStyle,
                          fontFamily: e.target.value as FontFamily,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-xs px-2 py-1.5 rounded text-slate-200 cursor-pointer"
                  >
                    <option value="sans">Clean Sans-Serif</option>
                    <option value="serif">Classic Times / Serif (Board style)</option>
                    <option value="bengali">Bengali Font Friendly</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.titleStyle.isBold}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        titleStyle: { ...config.titleStyle, isBold: e.target.checked },
                      })
                    }
                    className="rounded border-slate-700 text-blue-600 focus:ring-0"
                  />
                  Bold Text
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.titleStyle.isUnderlined}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        titleStyle: { ...config.titleStyle, isUnderlined: e.target.checked },
                      })
                    }
                    className="rounded border-slate-700 text-blue-600 focus:ring-0"
                  />
                  Underlined (Standard)
                </label>
              </div>
            </div>

            {/* Boxes Styling */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Box Borders & Shape
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Border Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.boxStyle.borderColor}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          boxStyle: { ...config.boxStyle, borderColor: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300">
                      {config.boxStyle.borderColor}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">Box Background</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.boxStyle.backgroundColor}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          boxStyle: { ...config.boxStyle, backgroundColor: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300">
                      {config.boxStyle.backgroundColor}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    Border Width ({config.boxStyle.borderWidth}px)
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.5"
                    value={config.boxStyle.borderWidth}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        boxStyle: {
                          ...config.boxStyle,
                          borderWidth: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    Corner Radius ({config.boxStyle.borderRadius}px)
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="16"
                    step="2"
                    value={config.boxStyle.borderRadius}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        boxStyle: {
                          ...config.boxStyle,
                          borderRadius: parseInt(e.target.value, 10),
                        },
                      })
                    }
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>Sharp (Exam)</span>
                    <span>Rounded</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">Box Padding</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'normal', 'relaxed'] as const).map((pad) => (
                    <button
                      key={pad}
                      onClick={() =>
                        onChange({
                          ...config,
                          boxStyle: { ...config.boxStyle, padding: pad },
                        })
                      }
                      className={`py-1.5 px-2 text-xs rounded border capitalize cursor-pointer ${
                        config.boxStyle.padding === pad
                          ? 'border-blue-500 bg-blue-950/40 text-blue-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      {pad}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Numbering Format & Colors */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Numbering Prefix
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Format</span>
                  <select
                    value={config.numberStyle.format}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        numberStyle: {
                          ...config.numberStyle,
                          format: e.target.value as NumberFormat,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-xs px-2 py-1.5 rounded text-slate-200 cursor-pointer"
                  >
                    <option value="numberDot">1. 2. 3. (Screenshot)</option>
                    <option value="parentheses">(1) (2) (3)</option>
                    <option value="roman">(i) (ii) (iii)</option>
                    <option value="circle">① ② ③</option>
                    <option value="step">Step 1, Step 2</option>
                    <option value="none">No Numbering</option>
                  </select>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">Number Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.numberStyle.color}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          numberStyle: { ...config.numberStyle, color: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.numberStyle.isBold}
                        onChange={(e) =>
                          onChange({
                            ...config,
                            numberStyle: {
                              ...config.numberStyle,
                              isBold: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-slate-700 text-blue-600 focus:ring-0"
                      />
                      Bold
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Connecting Arrows */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Arrow Connectors (↓)
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Arrow Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.arrowStyle.color}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          arrowStyle: { ...config.arrowStyle, color: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300">
                      {config.arrowStyle.color}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">Arrowhead Style</span>
                  <select
                    value={config.arrowStyle.type}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        arrowStyle: {
                          ...config.arrowStyle,
                          type: e.target.value as any,
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-xs px-2 py-1.5 rounded text-slate-200 cursor-pointer"
                  >
                    <option value="classic">Classic Open Arrow (Screenshot)</option>
                    <option value="triangle">Solid Triangle Arrow</option>
                    <option value="dashed">Dashed Line Arrow</option>
                    <option value="double">Double Line Arrow</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">
                  Arrow Spacing ({config.arrowStyle.length}px)
                </span>
                <input
                  type="range"
                  min="16"
                  max="48"
                  step="4"
                  value={config.arrowStyle.length}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      arrowStyle: {
                        ...config.arrowStyle,
                        length: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

            {/* Script Header Banner */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span>Formal Board Exam Script Header</span>
                <input
                  type="checkbox"
                  checked={config.paperStyle.showBoardHeader}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      paperStyle: {
                        ...config.paperStyle,
                        showBoardHeader: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-700 text-blue-600 focus:ring-0"
                />
              </label>

              {config.paperStyle.showBoardHeader && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                  <div>
                    <span className="text-[11px] text-slate-400">Exam Title</span>
                    <input
                      type="text"
                      value={config.paperStyle.boardHeaderText}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          paperStyle: {
                            ...config.paperStyle,
                            boardHeaderText: e.target.value,
                          },
                        })
                      }
                      spellCheck={false}
                      autoCorrect="off"
                      autoComplete="off"
                      data-gramm="false"
                      className="w-full bg-slate-900 border border-slate-700 text-xs px-2 py-1 rounded text-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400">Answer Label</span>
                    <input
                      type="text"
                      value={config.paperStyle.questionNumberText}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          paperStyle: {
                            ...config.paperStyle,
                            questionNumberText: e.target.value,
                          },
                        })
                      }
                      spellCheck={false}
                      autoCorrect="off"
                      autoComplete="off"
                      data-gramm="false"
                      className="w-full bg-slate-900 border border-slate-700 text-xs px-2 py-1 rounded text-slate-200 mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB: HSC BOARD RULES ----------------- */}
        {activeTab === 'rules' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-xl space-y-1.5">
              <div className="font-semibold text-blue-300 text-sm flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                NCTB Bangladesh Marking Criteria
              </div>
              <p className="text-slate-300 leading-relaxed">
                In HSC English 1st Paper Question No. 2, the Flow Chart carries 5 to 10 marks. Follow these rules to secure full marks:
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="font-semibold text-amber-300 mb-1">
                  Rule 1: Always Write the Title
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Start with: <code className="text-blue-400">"A flow-chart showing [topic] is given below:"</code>. Underline it with a pen or ruler. Skipping the title costs 1 mark.
                </p>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="font-semibold text-amber-300 mb-1">
                  Rule 2: Parallel Grammatical Structure
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Box 1 sets the grammatical pattern! If Box 1 starts with a present participle (<code className="text-emerald-400">V-ing</code> like <em>"Placing her husband's..."</em>), all other 5 boxes MUST start with <code className="text-emerald-400">V-ing</code>.
                </p>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="font-semibold text-amber-300 mb-1">
                  Rule 3: Short Phrases, Not Full Sentences
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Never write full grammatical sentences with subject and full-stop (e.g. avoid <em>"She placed the corpse on a raft."</em>). Use concise phrases (6–12 words).
                </p>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="font-semibold text-amber-300 mb-1">
                  Rule 4: Arrows and Numbering Are Mandatory
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Connecting arrows (<code className="text-slate-200">↓</code> or <code className="text-slate-200">→</code>) showing the sequential flow are strictly required. Each box must be numbered 1 to 6.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenRulesModal}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Launch AI Rules Auditor</span>
              </button>

              <button
                type="button"
                onClick={onOpenTipsModal}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                View Complete HSC Flowchart Guide
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Action */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs shrink-0">
        <button
          onClick={onResetToDefault}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Reset to default Behula flowchart"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Behula Sample
        </button>
        <span className="text-[11px] text-slate-500">Auto-saved locally</span>
      </div>
    </aside>
  );
};
