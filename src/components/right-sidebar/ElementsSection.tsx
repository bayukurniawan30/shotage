import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { Copy01, Trash01, ChevronDown } from '@untitledui/icons';
import * as PhosphorIcons from '@phosphor-icons/react';
import { Coolshape } from 'coolshapes-react';
import { Toggle } from '../Toggle';
import { ShapePreview, BooleanIcons } from './shared';
import { StepperSlider } from '../StepperSlider';
import { ShapeType, CoolshapeCategory } from '../../types/studio';
import {
  GRADIENT_PRESETS,
  parseColorAndAlpha,
  formatColorWithAlpha,
} from '../../utils/gradientPresets';

const COOLSHAPE_CATEGORIES: { id: CoolshapeCategory; label: string; count: number }[] = [
  { id: 'star', label: 'Star', count: 13 },
  { id: 'flower', label: 'Flower', count: 16 },
  { id: 'ellipse', label: 'Ellipse', count: 12 },
  { id: 'wheel', label: 'Wheel', count: 7 },
  { id: 'moon', label: 'Moon', count: 15 },
  { id: 'misc', label: 'Misc', count: 11 },
  { id: 'triangle', label: 'Triangle', count: 14 },
  { id: 'polygon', label: 'Polygon', count: 8 },
  { id: 'rectangle', label: 'Rectangle', count: 9 },
  { id: 'number', label: 'Number', count: 10 },
];

export const ElementsSection: React.FC = () => {
  const state = useStudioStore();
  const [shapeTab, setShapeTab] = useState<'basic' | 'coolshapes'>('coolshapes');
  const [activeCoolshapeCat, setActiveCoolshapeCat] = useState<CoolshapeCategory>('star');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [showAllShapeGradients, setShowAllShapeGradients] = useState(false);
  const [shapeActiveOption, setShapeActiveOption] = useState<
    'size' | 'position' | 'radius' | 'rotation' | 'skew' | 'opacityBlur'
  >('size');
  const [elementActiveOption, setElementActiveOption] = useState<
    'size' | 'position' | 'rotation' | 'opacityBlur'
  >('size');

  const elements = state.canvasElements || [];
  const selectedElement = elements.find((el) => el.id === state.selectedElementId);

  const createSvgDataUri = (svg: string): string => {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const arrowItems = Array.from({ length: 10 }).map((_, i) => ({
    id: `arrow-${i + 1}`,
    src: `/element/arrow/${i + 1}.svg`,
    label: `Arrow ${i + 1}`,
  }));

  const lineItems = [
    {
      id: 'line-straight',
      label: 'Straight Line',
      src: createSvgDataUri(
        `<svg width="100" height="20" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="8" width="100" height="4" rx="2" fill="black"/></svg>`
      ),
    },
    {
      id: 'line-perpendicular',
      label: 'Perpendicular Cross',
      src: createSvgDataUri(
        `<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="28" width="100" height="4" rx="2" fill="black"/><rect x="48" y="0" width="4" height="60" rx="2" fill="black"/></svg>`
      ),
    },
    {
      id: 'line-t-junction',
      label: 'T-Junction',
      src: createSvgDataUri(
        `<svg width="100" height="60" viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="100" height="4" rx="2" fill="black"/><rect x="48" y="0" width="4" height="60" rx="2" fill="black"/></svg>`
      ),
    },
    {
      id: 'line-dashed',
      label: 'Dashed Line',
      src: createSvgDataUri(
        `<svg width="100" height="20" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg"><line x1="4" y1="10" x2="96" y2="10" stroke="black" stroke-width="2" stroke-linecap="round" stroke-dasharray="12 10"/></svg>`
      ),
    },
    {
      id: 'line-dotted',
      label: 'Dotted Line',
      src: createSvgDataUri(
        `<svg width="100" height="20" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg"><line x1="6" y1="10" x2="94" y2="10" stroke="black" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 14"/></svg>`
      ),
    },
    {
      id: 'line-corner',
      label: 'Corner L-Line',
      src: createSvgDataUri(
        `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M 6 6 L 6 54 L 54 54" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      ),
    },
    {
      id: 'line-corner-dashed',
      label: 'Dashed Corner L',
      src: createSvgDataUri(
        `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M 6 6 L 6 54 L 54 54" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="9 7"/></svg>`
      ),
    },
    {
      id: 'line-corner-rounded',
      label: 'Rounded L',
      src: createSvgDataUri(
        `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M 6 6 L 6 40 A 14 14 0 0 0 20 54 L 54 54" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      ),
    },
    {
      id: 'line-corner-rounded-dashed',
      label: 'Dashed Rounded L',
      src: createSvgDataUri(
        `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M 6 6 L 6 40 A 14 14 0 0 0 20 54 L 54 54" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="9 7"/></svg>`
      ),
    },
  ];

  const createEmojiSvgDataUri = (char: string): string => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><text x="50%" y="55%" dominant-baseline="central" text-anchor="middle" font-size="75">${char}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  const emojiPresets = [
    // Smile & Kiss Face Family
    '😘',
    '😗',
    '😚',
    '😙',
    '🥰',
    '😍',
    '🤩',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '🤣',
    '😂',
    '🙂',
    '🙃',
    '😉',
    '😊',
    '😇',
    '😋',
    '😜',
    '🤪',
    '😝',
    '🤑',
    '🤗',
    '🤭',
    '🤫',
    '🤔',
    '😏',
    '🥳',
    '😎',
    '🤓',
    '🧐',
    '😌',
    '🤯',
    '🤠',
    '🥸',
    '😴',
    '🤤',
    '😍',
    // Hand & Gesture Family
    '👋',
    '🤚',
    '🖐️',
    '✋',
    '🖖',
    '👌',
    '🤌',
    '🤏',
    '✌️',
    '🤞',
    '🫰',
    '🤟',
    '🤘',
    '🤙',
    '🫱',
    '🫲',
    '🫳',
    '🫴',
    '👈',
    '👉',
    '👆',
    '🖕',
    '👇',
    '☝️',
    '🫵',
    '👍',
    '👎',
    '✊',
    '👊',
    '🤛',
    '🤜',
    '👏',
    '🙌',
    '🫶',
    '🤲',
    '🤝',
    '🙏',
    '✍️',
    '💅',
    '🤳',
    '💪',
    '🦾',
    '🦿',
    // Popular Reactions & Symbols
    '🔥',
    '🚀',
    '✨',
    '💡',
    '💖',
    '⭐',
    '🎉',
    '🎯',
    '⚡',
    '📌',
    '👍',
    '🙌',
    '👏',
    '👋',
    '💯',
    '🌟',
    '🎨',
    '💻',
    '📱',
    '🔒',
    '🛠️',
    '🔔',
    '💬',
    '👑',
    '🏆',
    '❤️',
    '🖤',
    '🤍',
    '🧡',
    '💛',
    '💚',
    '💙',
  ];

  const selectedShape = (state.shapeLayers || []).find((s) => s.id === state.selectedShapeId);
  const isUniform =
    selectedShape &&
    selectedShape.shapeType !== 'rectangle' &&
    selectedShape.shapeType !== 'custom-path';
  const supportsRadius =
    selectedShape &&
    (selectedShape.shapeType === 'square' || selectedShape.shapeType === 'rectangle');

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-4 shadow-sm">
      {/* Header */}
      <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhosphorIcons.CursorClick weight="duotone" className="w-4 h-4 text-pastel-pink" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Elements</h3>
        </div>
      </div>

      {/* Emojis Category Grid */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs items-center">
          <span className="font-semibold text-slate-300">Emojis (Click to Add)</span>
          <span className="text-[10px] font-mono text-amber-300">
            {elements.filter((el) => el.category === 'emoji').length} emojis
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5 p-2 bg-neutral-950 rounded-xl border border-neutral-800 max-h-36 overflow-y-auto no-scrollbar">
          {emojiPresets.map((char, idx) => (
            <button
              key={`${char}-${idx}`}
              type="button"
              title={`Add ${char}`}
              onClick={() =>
                state.addCanvasElement(`emoji-${idx}`, createEmojiSvgDataUri(char), 'emoji')
              }
              className="p-1.5 rounded-lg border bg-neutral-900/60 border-neutral-800/80 hover:border-amber-400/60 hover:bg-amber-400/10 transition-all flex items-center justify-center text-xl cursor-pointer group hover:scale-125 duration-150"
            >
              <span>{char}</span>
            </button>
          ))}
        </div>

        {/* Custom Emoji Input */}
        <div className="flex items-center gap-1.5 pt-1">
          <input
            type="text"
            value={customEmojiInput}
            onChange={(e) => setCustomEmojiInput(e.target.value)}
            placeholder="Type or paste any emoji (e.g. 🤩)"
            className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-pastel-pink"
          />
          <button
            type="button"
            disabled={!customEmojiInput.trim()}
            onClick={() => {
              const val = customEmojiInput.trim();
              if (val) {
                state.addCanvasElement(
                  `emoji-custom-${Date.now()}`,
                  createEmojiSvgDataUri(val),
                  'emoji'
                );
                setCustomEmojiInput('');
              }
            }}
            className="px-3 py-1.5 bg-pastel-pink/20 hover:bg-pastel-pink/30 text-pastel-pink border border-pastel-pink/40 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
          >
            Add
          </button>
        </div>
      </div>

      {/* Lines Category Grid */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs items-center">
          <span className="font-semibold text-slate-300">Lines (Click to Add)</span>
          <span className="text-[10px] font-mono text-[#a2d2ff]">
            {elements.filter((el) => el.category === 'line').length} lines
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-2 bg-neutral-950 rounded-xl border border-neutral-800">
          {lineItems.map((item) => (
            <button
              key={item.id}
              type="button"
              title={`Add ${item.label}`}
              onClick={() => state.addCanvasElement(item.id, item.src, 'line')}
              className="p-2 rounded-lg border bg-neutral-900/60 border-neutral-800/80 hover:border-pastel-blue/60 hover:bg-pastel-blue/10 transition-all flex flex-col items-center justify-center cursor-pointer group"
            >
              <div
                className="w-8 h-5 group-hover:scale-110 transition-transform"
                style={{
                  backgroundColor: '#a2d2ff',
                  WebkitMaskImage: `url("${item.src}")`,
                  maskImage: `url("${item.src}")`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                }}
              />
              <span className="text-[9px] font-medium mt-1 truncate max-w-full text-slate-400 group-hover:text-slate-200">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Arrows Category Grid */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs items-center">
          <span className="font-semibold text-slate-300">Arrows (Click to Add)</span>
          <span className="text-[10px] font-mono text-pastel-pink">
            {elements.filter((el) => el.category === 'arrow').length} arrows
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 p-2 bg-neutral-950 rounded-xl border border-neutral-800 max-h-36 overflow-y-auto no-scrollbar">
          {arrowItems.map((item) => (
            <button
              key={item.id}
              type="button"
              title={`Add ${item.label}`}
              onClick={() => state.addCanvasElement(item.id, item.src, 'arrow')}
              className="p-2 rounded-lg border bg-neutral-900/60 border-neutral-800/80 hover:border-pastel-pink/60 hover:bg-pastel-pink/10 transition-all flex flex-col items-center justify-center cursor-pointer group"
            >
              <div
                className="w-6 h-6 group-hover:scale-110 transition-transform"
                style={{
                  backgroundColor: '#a2d2ff',
                  WebkitMaskImage: `url(${item.src})`,
                  maskImage: `url(${item.src})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                }}
              />
              <span className="text-[9px] font-medium mt-1 truncate max-w-full text-slate-400 group-hover:text-slate-200">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Shapes Category Grid */}
      <div className="space-y-2.5">
        <div className="flex justify-between text-xs items-center">
          <span className="font-semibold text-slate-300">Shapes (Click to Add)</span>
          <span className="text-[10px] font-mono text-pastel-pink">
            {(state.shapeLayers || []).length} shapes
          </span>
        </div>

        {/* Vector Pen Tool Hero Button */}
        <button
          type="button"
          onClick={() => state.setPenDrawingMode(!state.isPenDrawingMode)}
          className={`w-full py-2 px-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
            state.isPenDrawingMode
              ? 'bg-pastel-pink text-slate-950 border-pastel-pink shadow-md shadow-pastel-pink/20 scale-[1.01]'
              : 'bg-gradient-to-r from-neutral-900 to-neutral-950 hover:from-neutral-850 hover:to-neutral-900 border-neutral-800 hover:border-neutral-700 text-white shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                state.isPenDrawingMode
                  ? 'bg-slate-950 text-pastel-pink shadow-xs'
                  : 'bg-pastel-pink/15 text-pastel-pink group-hover:scale-110'
              }`}
            >
              <PhosphorIcons.PenNib weight="fill" className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>Vector Pen Tool</span>
                <span
                  className={`text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded-full font-semibold ${
                    state.isPenDrawingMode
                      ? 'bg-slate-950 text-pastel-pink'
                      : 'bg-pastel-pink/20 text-pastel-pink'
                  }`}
                >
                  {state.isPenDrawingMode ? 'Active' : 'Draw'}
                </span>
              </div>
              <div
                className={`text-[10px] ${
                  state.isPenDrawingMode
                    ? 'text-slate-800 font-medium'
                    : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                {state.isPenDrawingMode
                  ? 'Drawing on canvas... (Click start or Enter to finish)'
                  : 'Click & drag custom Bézier curves'}
              </div>
            </div>
          </div>
          <PhosphorIcons.PencilSimpleLine
            className={`w-4 h-4 transition-transform ${
              state.isPenDrawingMode
                ? 'rotate-12 text-slate-950 font-bold'
                : 'text-slate-400 group-hover:text-pastel-pink'
            }`}
          />
        </button>

        {/* Tab switch between Basic Shapes and Coolshapes */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setShapeTab('basic')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              shapeTab === 'basic'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Basic
          </button>
          <button
            type="button"
            onClick={() => setShapeTab('coolshapes')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              shapeTab === 'coolshapes'
                ? 'bg-pastel-pink/20 text-pastel-pink border border-pastel-pink/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 animate-pulse" />
            <span>Coolshapes</span>
          </button>
        </div>

        {shapeTab === 'basic' ? (
          <div className="grid grid-cols-4 gap-1.5 p-2 bg-neutral-950 rounded-xl border border-neutral-800">
            {(
              [
                { id: 'square', label: 'Square' },
                { id: 'rectangle', label: 'Rectangle' },
                { id: 'circle', label: 'Circle' },
                { id: 'triangle', label: 'Triangle' },
                { id: 'hexagon', label: 'Hexagon' },
                { id: 'quote', label: 'Quote' },
              ] as { id: ShapeType; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                title={`Add ${item.label}`}
                onClick={() => state.addShapeLayer(item.id)}
                className="p-2 rounded-lg border bg-neutral-900/60 border-neutral-800/80 hover:border-pastel-blue/60 hover:bg-pastel-blue/10 transition-all flex flex-col items-center justify-center cursor-pointer group"
              >
                <ShapePreview
                  type={item.id}
                  className="w-6 h-6 group-hover:scale-110 transition-transform"
                />
                <span className="text-[9px] font-medium mt-1 truncate max-w-full text-slate-400 group-hover:text-slate-200">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2 p-2 bg-neutral-950 rounded-xl border border-neutral-800">
            {/* Category pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {COOLSHAPE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCoolshapeCat(cat.id)}
                  className={`px-2 py-1 text-[10px] font-medium rounded-md whitespace-nowrap transition-all cursor-pointer ${
                    activeCoolshapeCat === cat.id
                      ? 'bg-pastel-pink text-slate-950 font-bold shadow-sm'
                      : 'bg-neutral-900 text-slate-400 hover:text-slate-200 hover:bg-neutral-800'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>

            {/* Quick Random Action */}
            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
              <span className="capitalize">
                {activeCoolshapeCat} shapes (
                {COOLSHAPE_CATEGORIES.find((c) => c.id === activeCoolshapeCat)?.count})
              </span>
              <button
                type="button"
                onClick={() => {
                  const randomCat =
                    COOLSHAPE_CATEGORIES[Math.floor(Math.random() * COOLSHAPE_CATEGORIES.length)];
                  const randomIdx = Math.floor(Math.random() * randomCat.count);
                  state.addShapeLayer('coolshape', {
                    coolshapeType: randomCat.id,
                    coolshapeIndex: randomIdx,
                    name: `${randomCat.label} ${randomIdx + 1}`,
                  });
                }}
                className="text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <PhosphorIcons.Shuffle className="w-3 h-3" />
                Random
              </button>
            </div>

            {/* Coolshapes Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-52 overflow-y-auto no-scrollbar p-1">
              {Array.from({
                length: COOLSHAPE_CATEGORIES.find((c) => c.id === activeCoolshapeCat)?.count || 0,
              }).map((_, idx) => (
                <button
                  key={`${activeCoolshapeCat}-${idx}`}
                  type="button"
                  title={`Add ${activeCoolshapeCat} #${idx + 1}`}
                  onClick={() =>
                    state.addShapeLayer('coolshape', {
                      coolshapeType: activeCoolshapeCat,
                      coolshapeIndex: idx,
                      name: `${activeCoolshapeCat} ${idx + 1}`,
                    })
                  }
                  className="p-1.5 rounded-lg border bg-neutral-900/80 border-neutral-800/80 hover:border-pastel-pink/60 hover:bg-pastel-pink/10 transition-all flex flex-col items-center justify-center cursor-pointer group"
                >
                  <Coolshape
                    type={activeCoolshapeCat}
                    index={idx}
                    noise={true}
                    size={32}
                    className="w-7 h-7 group-hover:scale-115 transition-transform"
                  />
                  <span className="text-[9px] font-mono mt-1 text-slate-400 group-hover:text-slate-200">
                    #{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Canvas Elements List */}
      {elements.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-neutral-800/80">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Canvas Elements ({elements.length})
          </label>
          <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
            {elements.map((el, index) => {
              const isSelected = el.id === state.selectedElementId;
              return (
                <div
                  key={el.id}
                  onClick={() => state.selectCanvasElement(el.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-pastel-pink/15 border-pastel-pink text-white font-bold'
                      : 'bg-neutral-900/80 border-neutral-800 text-slate-300 hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {el.category === 'emoji' ? (
                      <img
                        src={el.src}
                        alt="Emoji"
                        className="w-5 h-5 shrink-0 object-contain pointer-events-none"
                      />
                    ) : (
                      <div
                        className="w-5 h-5 shrink-0"
                        style={{
                          backgroundColor: el.color || '#a2d2ff',
                          WebkitMaskImage: `url("${el.src}")`,
                          maskImage: `url("${el.src}")`,
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                        }}
                      />
                    )}
                    <span className="text-xs truncate">
                      {el.elementId} #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-slate-400">
                      {el.position === 'underneath' ? 'Behind' : 'Above'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        state.duplicateCanvasElement(el.id);
                      }}
                      title="Duplicate element"
                      className="p-1 hover:text-pastel-pink text-slate-400 transition-colors cursor-pointer"
                    >
                      <Copy01 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        state.removeCanvasElement(el.id);
                      }}
                      title="Delete element"
                      className="p-1 hover:text-red-400 text-slate-400 transition-colors cursor-pointer"
                    >
                      <Trash01 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shapes List */}
      {(state.shapeLayers || []).length > 0 && (
        <div className="space-y-2 pt-2 border-t border-neutral-800/80">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Shapes ({state.shapeLayers.length})
          </label>
          <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto no-scrollbar p-0.5">
            {state.shapeLayers.map((shape, index) => {
              const isSelected = shape.id === state.selectedShapeId;
              return (
                <div
                  key={shape.id}
                  onClick={() => state.selectShapeLayer(shape.id)}
                  className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-pastel-pink/15 border-pastel-pink text-white font-bold ring-1 ring-pastel-pink/50 shadow-sm'
                      : 'bg-neutral-900/80 border-neutral-800 text-slate-300 hover:border-neutral-700 hover:bg-neutral-800/60'
                  }`}
                >
                  {/* Position badge: Behind / Above */}
                  <span className="absolute top-1 left-1 text-[8px] font-mono px-1 py-0.2 rounded bg-neutral-950/80 border border-neutral-800 text-slate-400">
                    {shape.position === 'underneath' ? 'B' : 'A'}
                  </span>

                  {/* Actions on hover/selected: duplicate & delete */}
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950/90 rounded px-0.5 py-0.5 border border-neutral-800 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        state.duplicateShapeLayer(shape.id);
                      }}
                      title="Duplicate shape"
                      className="p-0.5 hover:text-pastel-pink text-slate-400 transition-colors cursor-pointer"
                    >
                      <Copy01 className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        state.removeShapeLayer(shape.id);
                      }}
                      title="Delete shape"
                      className="p-0.5 hover:text-red-400 text-slate-400 transition-colors cursor-pointer"
                    >
                      <Trash01 className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="my-1 flex items-center justify-center">
                    <ShapePreview
                      type={shape.shapeType}
                      color={shape.color}
                      className="w-6 h-6 shrink-0"
                      coolshapeType={shape.coolshapeType}
                      coolshapeIndex={shape.coolshapeIndex}
                      coolshapeNoise={shape.coolshapeNoise}
                    />
                  </div>

                  <span className="text-[10px] truncate max-w-full capitalize leading-tight">
                    {shape.shapeType === 'coolshape'
                      ? shape.coolshapeType || 'Cool'
                      : shape.shapeType}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    #
                    {shape.shapeType === 'coolshape' && shape.coolshapeIndex !== undefined
                      ? shape.coolshapeIndex + 1
                      : index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Shape Boolean Operations */}
      {(state.selectedShapeIds || []).length >= 2 && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-pastel-pink/15 via-purple-500/10 to-pastel-blue/15 border border-pastel-pink/30 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <PhosphorIcons.IntersectIcon weight="duotone" className="w-4 h-4 text-pastel-pink" />
              {state.selectedShapeIds.length} Shapes Selected
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Fuse, punch out, or intersect overlapping shapes into a single vector path:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => state.booleanOperationOnShapes('union')}
              className="p-2 rounded-lg bg-neutral-900/90 hover:bg-pastel-pink hover:text-slate-950 border border-neutral-800 hover:border-pastel-pink text-slate-200 transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer group shadow-sm active:scale-[0.98]"
              title="Union: Combine all selected shapes into one unified silhouette"
            >
              <span className="w-6 h-6 rounded-md bg-neutral-800 group-hover:bg-slate-950/20 flex items-center justify-center text-pastel-pink group-hover:text-slate-950 shrink-0">
                <BooleanIcons.Union className="w-3.5 h-3.5" />
              </span>
              <div className="text-left leading-tight">
                <span className="block font-bold text-[11px]">Union</span>
                <span className="text-[9px] opacity-70">Combine</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => state.booleanOperationOnShapes('subtract')}
              className="p-2 rounded-lg bg-neutral-900/90 hover:bg-pastel-pink hover:text-slate-950 border border-neutral-800 hover:border-pastel-pink text-slate-200 transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer group shadow-sm active:scale-[0.98]"
              title="Subtract: Cut the top shape(s) out of the bottom shape"
            >
              <span className="w-6 h-6 rounded-md bg-neutral-800 group-hover:bg-slate-950/20 flex items-center justify-center text-pastel-pink group-hover:text-slate-950 shrink-0">
                <BooleanIcons.Subtract className="w-3.5 h-3.5" />
              </span>
              <div className="text-left leading-tight">
                <span className="block font-bold text-[11px]">Subtract</span>
                <span className="text-[9px] opacity-70">Cut Out</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => state.booleanOperationOnShapes('intersect')}
              className="p-2 rounded-lg bg-neutral-900/90 hover:bg-pastel-pink hover:text-slate-950 border border-neutral-800 hover:border-pastel-pink text-slate-200 transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer group shadow-sm active:scale-[0.98]"
              title="Intersect: Keep only the overlapping region"
            >
              <span className="w-6 h-6 rounded-md bg-neutral-800 group-hover:bg-slate-950/20 flex items-center justify-center text-pastel-pink group-hover:text-slate-950 shrink-0">
                <BooleanIcons.Intersect className="w-3.5 h-3.5" />
              </span>
              <div className="text-left leading-tight">
                <span className="block font-bold text-[11px]">Intersect</span>
                <span className="text-[9px] opacity-70">Overlap</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => state.booleanOperationOnShapes('exclude')}
              className="p-2 rounded-lg bg-neutral-900/90 hover:bg-pastel-pink hover:text-slate-950 border border-neutral-800 hover:border-pastel-pink text-slate-200 transition-all flex items-center gap-2 text-xs font-semibold cursor-pointer group shadow-sm active:scale-[0.98]"
              title="Exclude: Keep non-overlapping parts and cut out the overlap (XOR)"
            >
              <span className="w-6 h-6 rounded-md bg-neutral-800 group-hover:bg-slate-950/20 flex items-center justify-center text-pastel-pink group-hover:text-slate-950 shrink-0">
                <BooleanIcons.Exclude className="w-3.5 h-3.5" />
              </span>
              <div className="text-left leading-tight">
                <span className="block font-bold text-[11px]">Exclude</span>
                <span className="text-[9px] opacity-70">Cut Overlap</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Selected Shape Editor */}
      {selectedShape && (
        <div className="space-y-4 pt-3 border-t border-neutral-800/80 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="capitalize">
              Editing:{' '}
              {selectedShape.shapeType === 'coolshape'
                ? `Coolshape (${selectedShape.coolshapeType || 'star'})`
                : selectedShape.shapeType === 'custom-path'
                  ? 'Merged Vector Shape'
                  : selectedShape.shapeType}
            </span>
            <button
              type="button"
              onClick={() => state.selectShapeLayer(null)}
              className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Deselect
            </button>
          </div>

          {/* Coolshape Specific Controls */}
          {selectedShape.shapeType === 'coolshape' && (
            <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-tr from-pink-500 to-cyan-400" />
                  Coolshape
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-pastel-pink/15 text-pastel-pink border border-pastel-pink/30 capitalize">
                  {selectedShape.coolshapeType || 'star'} #{(selectedShape.coolshapeIndex ?? 0) + 1}
                </span>
              </div>

              {/* Noise / Grain toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                <span className="text-[11px] font-medium text-slate-400">
                  Grain / Noise Texture
                </span>
                <button
                  type="button"
                  onClick={() =>
                    state.updateShapeLayer(selectedShape.id, {
                      coolshapeNoise: selectedShape.coolshapeNoise === false ? true : false,
                    })
                  }
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    selectedShape.coolshapeNoise !== false ? 'bg-pastel-pink' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      selectedShape.coolshapeNoise !== false ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Shape Color */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-semibold text-slate-300">Color</label>
              {selectedShape.shapeType === 'coolshape' && (
                <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Disabled (Built-in colors)
                </span>
              )}
            </div>
            <div
              className={
                selectedShape.shapeType === 'coolshape'
                  ? 'opacity-40 pointer-events-none select-none filter grayscale'
                  : ''
              }
            >
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {[
                  '#ffffff',
                  '#000000',
                  '#ffafcc',
                  '#a2d2ff',
                  '#cdb4db',
                  '#fef08a',
                  '#4ade80',
                  '#f87171',
                  '#38bdf8',
                ].map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      state.updateShapeLayer(selectedShape.id, { color: c, gradient: null })
                    }
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                      !selectedShape.gradient && selectedShape.color === c
                        ? 'border-white scale-110 shadow-md ring-2 ring-pastel-pink/50'
                        : 'border-slate-700/60 hover:scale-105'
                    }`}
                  />
                ))}
                <input
                  type="color"
                  value={selectedShape.color || '#a2d2ff'}
                  onChange={(e) =>
                    state.updateShapeLayer(selectedShape.id, {
                      color: e.target.value,
                      gradient: null,
                    })
                  }
                  className="w-6 h-6 rounded-full border border-slate-700 bg-transparent cursor-pointer p-0"
                  title="Custom Color"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedShape.color || '#a2d2ff'}
                  onChange={(e) =>
                    state.updateShapeLayer(selectedShape.id, {
                      color: e.target.value,
                      gradient: null,
                    })
                  }
                  placeholder="#a2d2ff"
                  className="w-full bg-neutral-900 border border-neutral-800 text-xs font-mono rounded-lg px-2.5 py-1 text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Gradient Shape */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-slate-300">
                Gradient Fill
              </label>
              {selectedShape.shapeType === 'coolshape' ? (
                <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Disabled (Built-in gradient)
                </span>
              ) : (
                <button
                  onClick={() =>
                    state.updateShapeLayer(selectedShape.id, {
                      gradient: selectedShape.gradient
                        ? null
                        : { color1: '#ffafcc', color2: '#a2d2ff', angle: 135 },
                    })
                  }
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    selectedShape.gradient ? 'bg-pastel-pink' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                      selectedShape.gradient ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              )}
            </div>

            {selectedShape.gradient && selectedShape.shapeType !== 'coolshape' && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    Presets ({GRADIENT_PRESETS.length})
                  </span>
                  {showAllShapeGradients && (
                    <button
                      type="button"
                      onClick={() => setShowAllShapeGradients(false)}
                      className="text-[11px] text-pastel-pink hover:text-pastel-pinkLight font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Collapse presets"
                    >
                      <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
                    </button>
                  )}
                </div>

                <div
                  className={`grid grid-cols-4 gap-2 ${
                    showAllShapeGradients ? 'max-h-56 overflow-y-auto no-scrollbar p-1.5' : 'p-1'
                  }`}
                >
                  {(!showAllShapeGradients ? GRADIENT_PRESETS.slice(0, 3) : GRADIENT_PRESETS).map(
                    (g) => {
                      const isSelected =
                        selectedShape.gradient?.color1.toLowerCase() === g.c1.toLowerCase() &&
                        selectedShape.gradient?.color2.toLowerCase() === g.c2.toLowerCase();
                      return (
                        <button
                          key={g.name}
                          onClick={() =>
                            state.updateShapeLayer(selectedShape.id, {
                              gradient: {
                                ...selectedShape.gradient!,
                                color1: g.c1,
                                color2: g.c2,
                              },
                            })
                          }
                          title={g.name}
                          className={`h-8 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-white ring-2 ring-pastel-pink scale-105'
                              : 'border-slate-700/80 hover:scale-105'
                          }`}
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${g.c1}, ${g.c2})`,
                          }}
                        />
                      );
                    }
                  )}

                  {!showAllShapeGradients && GRADIENT_PRESETS.length > 3 && (
                    <div className="relative h-8">
                      <div className="absolute inset-0 rounded-lg bg-neutral-900/90 border border-neutral-700 translate-x-1.5 translate-y-1 rotate-6 shadow-md" />
                      <button
                        type="button"
                        onClick={() => setShowAllShapeGradients(true)}
                        title={`Show all ${GRADIENT_PRESETS.length} gradients`}
                        className="relative z-10 w-full h-full rounded-lg border border-slate-700 shadow-md flex items-center justify-center cursor-pointer transition-colors hover:border-pastel-pink overflow-hidden"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${GRADIENT_PRESETS[3].c1}, ${GRADIENT_PRESETS[3].c2})`,
                        }}
                      >
                        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center gap-0.5 text-white">
                          <span className="text-[10px] font-bold tracking-tight">
                            +{GRADIENT_PRESETS.length - 3}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-pastel-pink" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Color 1 */}
                  <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400">Color 1</span>
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseColorAndAlpha(selectedShape.gradient!.color1);
                          state.updateShapeLayer(selectedShape.id, {
                            gradient: {
                              ...selectedShape.gradient!,
                              color1:
                                parsed.alpha === 0
                                  ? formatColorWithAlpha(parsed.hex, 100)
                                  : 'transparent',
                            },
                          });
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          parseColorAndAlpha(selectedShape.gradient.color1).alpha === 0
                            ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink font-bold'
                            : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle transparent"
                      >
                        {parseColorAndAlpha(selectedShape.gradient.color1).alpha === 0
                          ? 'Transparent'
                          : 'Make Clear'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="relative w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,#262626_25%,transparent_25%),linear-gradient(-45deg,#262626_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#262626_75%),linear-gradient(-45deg,transparent_75%,#262626_75%)] bg-[size:6px_6px] bg-[position:0_0,0_3px,3px_-3px,-3px_0]" />
                        <div
                          className="absolute inset-0"
                          style={{ backgroundColor: selectedShape.gradient.color1 }}
                        />
                        <input
                          type="color"
                          value={parseColorAndAlpha(selectedShape.gradient.color1).hex}
                          onChange={(e) => {
                            const currentAlpha = parseColorAndAlpha(
                              selectedShape.gradient!.color1
                            ).alpha;
                            state.updateShapeLayer(selectedShape.id, {
                              gradient: {
                                ...selectedShape.gradient!,
                                color1: formatColorWithAlpha(
                                  e.target.value,
                                  currentAlpha === 0 ? 100 : currentAlpha
                                ),
                              },
                            });
                          }}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={selectedShape.gradient.color1}
                        onChange={(e) =>
                          state.updateShapeLayer(selectedShape.id, {
                            gradient: {
                              ...selectedShape.gradient!,
                              color1: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono rounded px-1.5 py-0.5 text-slate-200"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5 text-slate-400">
                        <span>Opacity</span>
                        <span className="font-mono font-medium">
                          {parseColorAndAlpha(selectedShape.gradient.color1).alpha}%
                        </span>
                      </div>
                      <StepperSlider
                        min={0}
                        max={100}
                        step={1}
                        value={parseColorAndAlpha(selectedShape.gradient.color1).alpha}
                        onChange={(val) => {
                          const hex = parseColorAndAlpha(selectedShape.gradient!.color1).hex;
                          state.updateShapeLayer(selectedShape.id, {
                            gradient: {
                              ...selectedShape.gradient!,
                              color1: formatColorWithAlpha(hex, val),
                            },
                          });
                        }}
                        accentColor="#ffafcc"
                      />
                    </div>
                  </div>

                  {/* Color 2 */}
                  <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400">Color 2</span>
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseColorAndAlpha(selectedShape.gradient!.color2);
                          state.updateShapeLayer(selectedShape.id, {
                            gradient: {
                              ...selectedShape.gradient!,
                              color2:
                                parsed.alpha === 0
                                  ? formatColorWithAlpha(parsed.hex, 100)
                                  : 'transparent',
                            },
                          });
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          parseColorAndAlpha(selectedShape.gradient.color2).alpha === 0
                            ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink font-bold'
                            : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle transparent"
                      >
                        {parseColorAndAlpha(selectedShape.gradient.color2).alpha === 0
                          ? 'Transparent'
                          : 'Make Clear'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="relative w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,#262626_25%,transparent_25%),linear-gradient(-45deg,#262626_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#262626_75%),linear-gradient(-45deg,transparent_75%,#262626_75%)] bg-[size:6px_6px] bg-[position:0_0,0_3px,3px_-3px,-3px_0]" />
                        <div
                          className="absolute inset-0"
                          style={{ backgroundColor: selectedShape.gradient.color2 }}
                        />
                        <input
                          type="color"
                          value={parseColorAndAlpha(selectedShape.gradient.color2).hex}
                          onChange={(e) => {
                            const currentAlpha = parseColorAndAlpha(
                              selectedShape.gradient!.color2
                            ).alpha;
                            state.updateShapeLayer(selectedShape.id, {
                              gradient: {
                                ...selectedShape.gradient!,
                                color2: formatColorWithAlpha(
                                  e.target.value,
                                  currentAlpha === 0 ? 100 : currentAlpha
                                ),
                              },
                            });
                          }}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={selectedShape.gradient.color2}
                        onChange={(e) =>
                          state.updateShapeLayer(selectedShape.id, {
                            gradient: {
                              ...selectedShape.gradient!,
                              color2: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono rounded px-1.5 py-0.5 text-slate-200"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5 text-slate-400">
                        <span>Opacity</span>
                        <span className="font-mono font-medium">
                          {parseColorAndAlpha(selectedShape.gradient.color2).alpha}%
                        </span>
                      </div>
                      <StepperSlider
                        min={0}
                        max={100}
                        step={1}
                        value={parseColorAndAlpha(selectedShape.gradient.color2).alpha}
                        onChange={(val) => {
                          const hex = parseColorAndAlpha(selectedShape.gradient!.color2).hex;
                          state.updateShapeLayer(selectedShape.id, {
                            gradient: {
                              ...selectedShape.gradient!,
                              color2: formatColorWithAlpha(hex, val),
                            },
                          });
                        }}
                        accentColor="#ffafcc"
                      />
                    </div>
                  </div>
                </div>

                {/* Gradient Angle */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Angle</span>
                    <span className="font-mono text-slate-400">
                      {selectedShape.gradient.angle}°
                    </span>
                  </div>
                  <StepperSlider
                    min={0}
                    max={360}
                    step={1}
                    value={selectedShape.gradient.angle}
                    onChange={(val) =>
                      state.updateShapeLayer(selectedShape.id, {
                        gradient: {
                          ...selectedShape.gradient!,
                          angle: val,
                        },
                      })
                    }
                    accentColor="#ffafcc"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Image Fill (Clip Shape) */}
          {selectedShape.shapeType !== 'coolshape' && (
            <>
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Image Fill (Clip Shape)
                </label>

                {selectedShape.bgImage ? (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg border border-slate-700 overflow-hidden shrink-0">
                      <img
                        src={selectedShape.bgImage}
                        alt="Shape fill"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-mono text-slate-500">
                        Image fill applied
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <label className="flex-1 flex items-center justify-center py-1 px-2 bg-neutral-950 border border-neutral-800 hover:border-pastel-pink rounded-lg text-[10px] font-semibold text-slate-300 cursor-pointer transition-colors">
                          Replace
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  state.updateShapeLayer(selectedShape.id, {
                                    bgImage: ev.target.result as string,
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        <button
                          onClick={() =>
                            state.updateShapeLayer(selectedShape.id, { bgImage: null })
                          }
                          className="py-1 px-2 bg-neutral-950 border border-neutral-800 hover:border-red-400 hover:text-red-400 rounded-lg text-[10px] font-semibold text-slate-400 cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center p-2.5 border-2 border-dashed border-neutral-700 hover:border-pastel-pink rounded-xl cursor-pointer bg-neutral-950/80 hover:bg-neutral-800/80 transition-all text-center">
                    <span className="text-xs font-medium text-slate-300">
                      Upload image to clip into shape
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            state.updateShapeLayer(selectedShape.id, {
                              bgImage: ev.target.result as string,
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Image Fill Adjustments */}
              {selectedShape.bgImage && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Zoom</span>
                      <span className="font-mono text-slate-400">
                        {selectedShape.bgImageZoom ?? 100}%
                      </span>
                    </div>
                    <StepperSlider
                      min={10}
                      max={400}
                      step={1}
                      value={selectedShape.bgImageZoom ?? 100}
                      onChange={(val) =>
                        state.updateShapeLayer(selectedShape.id, {
                          bgImageZoom: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Offset X</span>
                        <span className="font-mono text-slate-400">
                          {selectedShape.bgImageOffsetX || 0}px
                        </span>
                      </div>
                      <StepperSlider
                        min={-300}
                        max={300}
                        step={1}
                        value={selectedShape.bgImageOffsetX || 0}
                        onChange={(val) =>
                          state.updateShapeLayer(selectedShape.id, {
                            bgImageOffsetX: val,
                          })
                        }
                        accentColor="#ffafcc"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Offset Y</span>
                        <span className="font-mono text-slate-400">
                          {selectedShape.bgImageOffsetY || 0}px
                        </span>
                      </div>
                      <StepperSlider
                        min={-300}
                        max={300}
                        step={1}
                        value={selectedShape.bgImageOffsetY || 0}
                        onChange={(val) =>
                          state.updateShapeLayer(selectedShape.id, {
                            bgImageOffsetY: val,
                          })
                        }
                        accentColor="#ffafcc"
                      />
                    </div>
                  </div>

                  {/* Pattern Repeat */}
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                      Pattern Repeat
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                      <button
                        type="button"
                        onClick={() =>
                          state.updateShapeLayer(selectedShape.id, { bgImageRepeat: false })
                        }
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          !selectedShape.bgImageRepeat
                            ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                            : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                        }`}
                      >
                        No Repeat (Single)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          state.updateShapeLayer(selectedShape.id, { bgImageRepeat: true })
                        }
                        className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          selectedShape.bgImageRepeat
                            ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                            : 'bg-transparent border-transparent text-slate-400 hover:text-white'
                        }`}
                      >
                        Repeat (Tile)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Shape Transform & Adjustment Circle Buttons */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Transform & Adjustments
              </span>
              <span className="text-[10px] text-pastel-pink font-semibold capitalize">
                {shapeActiveOption === 'opacityBlur'
                  ? 'Opacity & Blur'
                  : shapeActiveOption === 'radius'
                    ? 'Border Radius'
                    : shapeActiveOption}
              </span>
            </div>

            {/* Circle Buttons Row with Tooltips */}
            <div className="flex items-center gap-1.5 py-1 flex-wrap">
              {[
                {
                  id: 'size',
                  label: 'Size',
                  tooltip: 'Size & Dimensions',
                  icon: (
                    <PhosphorIcons.BoundingBoxIcon
                      weight={shapeActiveOption === 'size' ? 'fill' : 'bold'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'position',
                  label: 'Position',
                  tooltip: 'Position (X / Y)',
                  icon: (
                    <PhosphorIcons.ArrowsOutCardinalIcon
                      weight={shapeActiveOption === 'position' ? 'bold' : 'regular'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                ...(supportsRadius
                  ? [
                      {
                        id: 'radius',
                        label: 'Border Radius',
                        tooltip: 'Border Radius',
                        icon: (
                          <PhosphorIcons.CornersOutIcon
                            weight={shapeActiveOption === 'radius' ? 'fill' : 'bold'}
                            className="w-3.5 h-3.5"
                          />
                        ),
                      },
                    ]
                  : []),
                {
                  id: 'rotation',
                  label: 'Rotation & 3D Tilt',
                  tooltip: 'Rotation, Pitch & Yaw',
                  icon: (
                    <PhosphorIcons.ArrowsClockwiseIcon
                      weight={shapeActiveOption === 'rotation' ? 'bold' : 'regular'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'skew',
                  label: 'Skew',
                  tooltip: 'Skew Distortion (X / Y)',
                  icon: (
                    <PhosphorIcons.ParallelogramIcon
                      weight={shapeActiveOption === 'skew' ? 'fill' : 'bold'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'opacityBlur',
                  label: 'Opacity & Blur',
                  tooltip: 'Opacity & Blur',
                  icon: (
                    <PhosphorIcons.DropIcon
                      weight={shapeActiveOption === 'opacityBlur' ? 'fill' : 'bold'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
              ].map((btn) => {
                const isActive = shapeActiveOption === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setShapeActiveOption(btn.id as any)}
                    title={btn.tooltip}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                      isActive
                        ? 'animate-border shadow-md shadow-pink-300/30 scale-105 text-pastel-pink'
                        : 'bg-neutral-900 text-slate-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {btn.icon}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Slider Container with smooth transition */}
            <div className="pt-1 space-y-3 animate-in fade-in duration-150">
              {/* Option: Size */}
              {shapeActiveOption === 'size' &&
                (isUniform ? (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Size</span>
                      <span className="font-mono text-slate-400">
                        {selectedShape.width || 120}px
                      </span>
                    </div>
                    <StepperSlider
                      min={10}
                      max={400}
                      step={1}
                      value={selectedShape.width || 120}
                      onChange={(v) => {
                        state.updateShapeLayer(selectedShape.id, { width: v, height: v });
                      }}
                      accentColor="#ffafcc"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Width</span>
                        <span className="font-mono text-slate-400">
                          {selectedShape.width || 160}px
                        </span>
                      </div>
                      <StepperSlider
                        min={10}
                        max={600}
                        step={1}
                        value={selectedShape.width || 160}
                        onChange={(val) =>
                          state.updateShapeLayer(selectedShape.id, {
                            width: val,
                          })
                        }
                        accentColor="#ffafcc"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Height</span>
                        <span className="font-mono text-slate-400">
                          {selectedShape.height || 100}px
                        </span>
                      </div>
                      <StepperSlider
                        min={10}
                        max={600}
                        step={1}
                        value={selectedShape.height || 100}
                        onChange={(val) =>
                          state.updateShapeLayer(selectedShape.id, {
                            height: val,
                          })
                        }
                        accentColor="#ffafcc"
                      />
                    </div>
                  </div>
                ))}

              {/* Option: Position */}
              {shapeActiveOption === 'position' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Position X</span>
                      <span className="font-mono text-slate-400">{selectedShape.x || 0}px</span>
                    </div>
                    <StepperSlider
                      min={-400}
                      max={400}
                      step={1}
                      value={selectedShape.x || 0}
                      onChange={(val) =>
                        state.updateShapeLayer(selectedShape.id, {
                          x: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Position Y</span>
                      <span className="font-mono text-slate-400">{selectedShape.y || 0}px</span>
                    </div>
                    <StepperSlider
                      min={-400}
                      max={400}
                      step={1}
                      value={selectedShape.y || 0}
                      onChange={(val) =>
                        state.updateShapeLayer(selectedShape.id, {
                          y: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>
                </div>
              )}

              {/* Option: Border Radius */}
              {shapeActiveOption === 'radius' && supportsRadius && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Border Radius</span>
                    <span className="font-mono text-slate-400">
                      {selectedShape.borderRadius ?? 8}px
                    </span>
                  </div>
                  <StepperSlider
                    min={0}
                    max={200}
                    step={1}
                    value={selectedShape.borderRadius ?? 8}
                    onChange={(val) =>
                      state.updateShapeLayer(selectedShape.id, {
                        borderRadius: val,
                      })
                    }
                    accentColor="#ffafcc"
                  />
                </div>
              )}

              {/* Option: Rotation & 3D Tilt */}
              {shapeActiveOption === 'rotation' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Rotation</span>
                      <span className="font-mono text-slate-400">
                        {selectedShape.rotation || 0}°
                      </span>
                    </div>
                    <StepperSlider
                      min={-180}
                      max={180}
                      step={1}
                      value={selectedShape.rotation || 0}
                      onChange={(val) =>
                        state.updateShapeLayer(selectedShape.id, {
                          rotation: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Pitch (Rotate X)</span>
                        <span className="font-mono text-slate-400">
                          {selectedShape.pitch || 0}°
                        </span>
                      </div>
                      <StepperSlider
                        min={-30}
                        max={30}
                        step={1}
                        value={selectedShape.pitch || 0}
                        onChange={(val) =>
                          state.updateShapeLayer(selectedShape.id, {
                            pitch: val,
                          })
                        }
                        accentColor="#ffafcc"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-300">Yaw (Rotate Y)</span>
                        <span className="font-mono text-slate-400">{selectedShape.yaw || 0}°</span>
                      </div>
                      <StepperSlider
                        min={-30}
                        max={30}
                        step={1}
                        value={selectedShape.yaw || 0}
                        onChange={(val) =>
                          state.updateShapeLayer(selectedShape.id, {
                            yaw: val,
                          })
                        }
                        accentColor="#ffafcc"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Option: Skew */}
              {shapeActiveOption === 'skew' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Skew X</span>
                      <span className="font-mono text-slate-400">{selectedShape.skewX || 0}°</span>
                    </div>
                    <StepperSlider
                      min={-60}
                      max={60}
                      step={1}
                      value={selectedShape.skewX || 0}
                      onChange={(val) =>
                        state.updateShapeLayer(selectedShape.id, {
                          skewX: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Skew Y</span>
                      <span className="font-mono text-slate-400">{selectedShape.skewY || 0}°</span>
                    </div>
                    <StepperSlider
                      min={-60}
                      max={60}
                      step={1}
                      value={selectedShape.skewY || 0}
                      onChange={(val) =>
                        state.updateShapeLayer(selectedShape.id, {
                          skewY: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>
                </div>
              )}

              {/* Option: Opacity & Blur */}
              {shapeActiveOption === 'opacityBlur' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Opacity</span>
                      <span className="font-mono text-slate-400">
                        {selectedShape.opacity ?? 100}%
                      </span>
                    </div>
                    <StepperSlider
                      min={10}
                      max={100}
                      step={1}
                      value={selectedShape.opacity ?? 100}
                      onChange={(val) =>
                        state.updateShapeLayer(selectedShape.id, {
                          opacity: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Blur</span>
                      <span className="font-mono text-slate-400">{selectedShape.blur ?? 0}px</span>
                    </div>
                    <StepperSlider
                      min={0}
                      max={40}
                      step={1}
                      value={selectedShape.blur ?? 0}
                      onChange={(val) =>
                        state.updateShapeLayer(selectedShape.id, {
                          blur: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Drop Shadow Toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="text-[11px] font-semibold text-slate-300">Drop Shadow</label>
            <Toggle
              isSelected={!!selectedShape.shadow}
              onChange={(checked) => state.updateShapeLayer(selectedShape.id, { shadow: checked })}
              size="sm"
            />
          </div>

          {/* Glassmorphic Option */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-slate-300">Glassmorphic</label>
                {selectedShape.shapeType === 'coolshape' && (
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Disabled
                  </span>
                )}
              </div>
              <Toggle
                isSelected={
                  selectedShape.shapeType !== 'coolshape' && !!selectedShape.glassmorphism
                }
                isDisabled={selectedShape.shapeType === 'coolshape'}
                onChange={(checked) => {
                  if (selectedShape.shapeType === 'coolshape') return;
                  state.updateShapeLayer(selectedShape.id, {
                    glassmorphism: checked,
                    ...(checked && (selectedShape.opacity ?? 100) === 100 ? { opacity: 50 } : {}),
                  });
                }}
                size="sm"
              />
            </div>

            {selectedShape.shapeType !== 'coolshape' && selectedShape.glassmorphism && (
              <div className="space-y-3 pl-2.5 border-l-2 border-pastel-pink/40 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Glass Blur Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">Glass Blur</span>
                    <span className="font-mono text-slate-400">
                      {selectedShape.glassmorphismBlur ?? 16}px
                    </span>
                  </div>
                  <StepperSlider
                    min={4}
                    max={50}
                    step={1}
                    value={selectedShape.glassmorphismBlur ?? 16}
                    onChange={(val) =>
                      state.updateShapeLayer(selectedShape.id, {
                        glassmorphismBlur: val,
                      })
                    }
                    accentColor="#ffafcc"
                  />
                </div>

                {/* Frosted Border Highlight Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    Frosted Border Highlight
                  </span>
                  <Toggle
                    isSelected={selectedShape.glassmorphismBorder !== false}
                    onChange={(checked) =>
                      state.updateShapeLayer(selectedShape.id, {
                        glassmorphismBorder: checked,
                      })
                    }
                    size="sm"
                  />
                </div>

                {/* Quick Glass Presets */}
                <div>
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Glass Presets
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        state.updateShapeLayer(selectedShape.id, {
                          color: 'rgba(255, 255, 255, 0.25)',
                          gradient: null,
                          opacity: 70,
                          glassmorphismBlur: 20,
                          glassmorphismBorder: true,
                        })
                      }
                      className="py-1 px-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-[10px] font-semibold text-slate-200 text-center transition-all cursor-pointer hover:border-pastel-pink"
                    >
                      Frosted White
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        state.updateShapeLayer(selectedShape.id, {
                          color: 'rgba(15, 23, 42, 0.45)',
                          gradient: null,
                          opacity: 80,
                          glassmorphismBlur: 24,
                          glassmorphismBorder: true,
                        })
                      }
                      className="py-1 px-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-[10px] font-semibold text-slate-200 text-center transition-all cursor-pointer hover:border-pastel-pink"
                    >
                      Smoky Dark
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        state.updateShapeLayer(selectedShape.id, {
                          color: 'rgba(255, 255, 255, 0.08)',
                          gradient: null,
                          opacity: 40,
                          glassmorphismBlur: 32,
                          glassmorphismBorder: true,
                        })
                      }
                      className="py-1 px-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-[10px] font-semibold text-slate-200 text-center transition-all cursor-pointer hover:border-pastel-pink"
                    >
                      Crystal Clear
                    </button>
                  </div>
                </div>

                {/* Note: Canvas handles hidden for pristine glass rendering */}
                <div className="flex items-start gap-1.5 p-2 rounded-lg bg-neutral-900/90 border border-neutral-800 text-[11px] text-slate-400 leading-snug">
                  <PhosphorIcons.InfoIcon className="w-3.5 h-3.5 text-pastel-pink shrink-0 mt-0.5" />
                  <span>
                    When Glassmorphic is enabled, on-canvas delete, rotate, and resize handles are
                    hidden. Use sidebar controls to adjust or delete this shape.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Layering Depth */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Layering Depth
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => state.updateShapeLayer(selectedShape.id, { position: 'above' })}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  (selectedShape.position || 'above') === 'above'
                    ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                    : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                }`}
              >
                Above Mockup
              </button>
              <button
                type="button"
                onClick={() => state.updateShapeLayer(selectedShape.id, { position: 'underneath' })}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  selectedShape.position === 'underneath'
                    ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                    : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                }`}
              >
                Behind Mockup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Element Editor */}
      {selectedElement && (
        <div className="space-y-4 pt-3 border-t border-neutral-800/80 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Editing: {selectedElement.elementId}</span>
            <button
              type="button"
              onClick={() => state.selectCanvasElement(null)}
              className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Deselect
            </button>
          </div>

          {/* Element Color (Only for non-emoji vector elements) */}
          {selectedElement.category !== 'emoji' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Element Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedElement.color || '#a2d2ff'}
                  onChange={(e) =>
                    state.updateCanvasElement(selectedElement.id, { color: e.target.value })
                  }
                  className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={selectedElement.color || '#a2d2ff'}
                  onChange={(e) =>
                    state.updateCanvasElement(selectedElement.id, { color: e.target.value })
                  }
                  className="flex-1 bg-neutral-900 border border-neutral-800 text-xs font-mono rounded-lg px-2.5 py-1 text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Element Transform & Adjustment Circle Buttons */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Transform & Adjustments
              </span>
              <span className="text-[10px] text-pastel-pink font-semibold capitalize">
                {elementActiveOption === 'opacityBlur'
                  ? 'Opacity & Blur'
                  : elementActiveOption === 'rotation'
                    ? 'Rotation & Flip'
                    : elementActiveOption}
              </span>
            </div>

            {/* Circle Buttons Row with Tooltips */}
            <div className="flex items-center gap-1.5 py-1 flex-wrap">
              {[
                {
                  id: 'size',
                  label: 'Size',
                  tooltip: 'Size (Width & Height)',
                  icon: (
                    <PhosphorIcons.BoundingBoxIcon
                      weight={elementActiveOption === 'size' ? 'fill' : 'bold'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'position',
                  label: 'Position',
                  tooltip: 'Position (X / Y)',
                  icon: (
                    <PhosphorIcons.ArrowsOutCardinalIcon
                      weight={elementActiveOption === 'position' ? 'bold' : 'regular'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'rotation',
                  label: 'Rotation & Flip',
                  tooltip: 'Rotation & Flip Axis',
                  icon: (
                    <PhosphorIcons.ArrowsClockwiseIcon
                      weight={elementActiveOption === 'rotation' ? 'bold' : 'regular'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
                {
                  id: 'opacityBlur',
                  label: 'Opacity & Blur',
                  tooltip: 'Opacity & Blur',
                  icon: (
                    <PhosphorIcons.DropIcon
                      weight={elementActiveOption === 'opacityBlur' ? 'fill' : 'bold'}
                      className="w-3.5 h-3.5"
                    />
                  ),
                },
              ].map((btn) => {
                const isActive = elementActiveOption === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setElementActiveOption(btn.id as any)}
                    title={btn.tooltip}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                      isActive
                        ? 'animate-border shadow-md shadow-pink-300/30 scale-105 text-pastel-pink'
                        : 'bg-neutral-900 text-slate-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {btn.icon}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Slider Container with smooth transition */}
            <div className="pt-1 space-y-3 animate-in fade-in duration-150">
              {/* Option: Size */}
              {elementActiveOption === 'size' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Width</span>
                      <span className="font-mono text-slate-400">
                        {selectedElement.width || 90}px
                      </span>
                    </div>
                    <StepperSlider
                      min={20}
                      max={800}
                      step={1}
                      value={selectedElement.width || 90}
                      onChange={(val) =>
                        state.updateCanvasElement(selectedElement.id, {
                          width: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Height</span>
                      <span className="font-mono text-slate-400">
                        {selectedElement.height || 90}px
                      </span>
                    </div>
                    <StepperSlider
                      min={20}
                      max={800}
                      step={1}
                      value={selectedElement.height || 90}
                      onChange={(val) =>
                        state.updateCanvasElement(selectedElement.id, {
                          height: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>
                </div>
              )}

              {/* Option: Position */}
              {elementActiveOption === 'position' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Position X</span>
                      <span className="font-mono text-slate-400">{selectedElement.x || 0}px</span>
                    </div>
                    <StepperSlider
                      min={-400}
                      max={400}
                      step={1}
                      value={selectedElement.x || 0}
                      onChange={(val) =>
                        state.updateCanvasElement(selectedElement.id, {
                          x: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Position Y</span>
                      <span className="font-mono text-slate-400">{selectedElement.y || 0}px</span>
                    </div>
                    <StepperSlider
                      min={-400}
                      max={400}
                      step={1}
                      value={selectedElement.y || 0}
                      onChange={(val) =>
                        state.updateCanvasElement(selectedElement.id, {
                          y: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>
                </div>
              )}

              {/* Option: Rotation & Flip */}
              {elementActiveOption === 'rotation' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Rotation</span>
                      <span className="font-mono text-slate-400">
                        {selectedElement.rotation || 0}°
                      </span>
                    </div>
                    <StepperSlider
                      min={-180}
                      max={180}
                      step={1}
                      value={selectedElement.rotation || 0}
                      onChange={(val) =>
                        state.updateCanvasElement(selectedElement.id, {
                          rotation: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                      Flip Axis
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          state.updateCanvasElement(selectedElement.id, {
                            flipX: !selectedElement.flipX,
                          })
                        }
                        className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          selectedElement.flipX
                            ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                            : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <PhosphorIcons.FlipHorizontalIcon className="w-3.5 h-3.5" />
                        <span>Flip Horizontal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          state.updateCanvasElement(selectedElement.id, {
                            flipY: !selectedElement.flipY,
                          })
                        }
                        className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          selectedElement.flipY
                            ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                            : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <PhosphorIcons.FlipVerticalIcon className="w-3.5 h-3.5" />
                        <span>Flip Vertical</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Option: Opacity & Blur */}
              {elementActiveOption === 'opacityBlur' && (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Opacity</span>
                      <span className="font-mono text-slate-400">
                        {selectedElement.opacity ?? 100}%
                      </span>
                    </div>
                    <StepperSlider
                      min={10}
                      max={100}
                      step={1}
                      value={selectedElement.opacity ?? 100}
                      onChange={(val) =>
                        state.updateCanvasElement(selectedElement.id, {
                          opacity: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-300">Blur</span>
                      <span className="font-mono text-slate-400">
                        {selectedElement.blur ?? 0}px
                      </span>
                    </div>
                    <StepperSlider
                      min={0}
                      max={40}
                      step={1}
                      value={selectedElement.blur ?? 0}
                      onChange={(val) =>
                        state.updateCanvasElement(selectedElement.id, {
                          blur: val,
                        })
                      }
                      accentColor="#ffafcc"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Drop Shadow Toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="text-[11px] font-semibold text-slate-300">Drop Shadow</label>
            <Toggle
              isSelected={!!selectedElement.shadow}
              onChange={(checked) =>
                state.updateCanvasElement(selectedElement.id, { shadow: checked })
              }
              size="sm"
            />
          </div>

          {/* Layering Depth */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Layering Depth
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => state.updateCanvasElement(selectedElement.id, { position: 'above' })}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  (selectedElement.position || 'above') === 'above'
                    ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                    : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                }`}
              >
                Above Mockup
              </button>
              <button
                type="button"
                onClick={() =>
                  state.updateCanvasElement(selectedElement.id, { position: 'underneath' })
                }
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  selectedElement.position === 'underneath'
                    ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink'
                    : 'bg-neutral-950 border-neutral-800 text-slate-400 hover:text-white'
                }`}
              >
                Behind Mockup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
