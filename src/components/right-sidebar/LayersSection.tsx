import React, { useRef, useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import * as PhosphorIcons from '@phosphor-icons/react';
import { BooleanIcons } from './shared';

export const LayersSection: React.FC = () => {
  const state = useStudioStore();
  const layerDragSrcKey = useRef<string | null>(null);
  const layerDragOverKey = useRef<string | null>(null);
  const [layerDropIndicator, setLayerDropIndicator] = useState<string | null>(null);

  const buildRow = (
    type: 'text' | 'phosphor' | 'element' | 'shape',
    id: string,
    name: string,
    visible: boolean,
    locked: boolean,
    position: 'above' | 'underneath',
    selected: boolean,
    indicator: React.ReactNode
  ) => ({ key: `${type}-${id}`, type, id, name, visible, locked, position, selected, indicator });

  const allRows: ReturnType<typeof buildRow>[] = [];

  (state.textLayers || []).forEach((l) =>
    allRows.push(
      buildRow(
        'text',
        l.id,
        l.name || l.text || 'Text',
        l.visible !== false,
        l.locked === true,
        l.position || 'above',
        (state.selectedTextLayerIds || []).includes(l.id),
        <PhosphorIcons.TextTIcon className="w-3.5 h-3.5 text-pastel-blue shrink-0" />
      )
    )
  );

  (state.phosphorIconLayers || []).forEach((l) => {
    const IconComp = (PhosphorIcons as any)[l.iconId] || PhosphorIcons.SparkleIcon;
    allRows.push(
      buildRow(
        'phosphor',
        l.id,
        l.name || l.iconId || 'Icon',
        l.visible !== false,
        l.locked === true,
        l.position || 'above',
        (state.selectedPhosphorIconLayerIds || []).includes(l.id),
        <IconComp className="w-3.5 h-3.5 text-pastel-pink shrink-0" />
      )
    );
  });

  (state.canvasElements || []).forEach((el) => {
    const CatIcon =
      el.category === 'emoji'
        ? PhosphorIcons.SmileyIcon
        : el.category === 'line'
          ? PhosphorIcons.LineSegmentIcon
          : PhosphorIcons.ArrowRightIcon;
    allRows.push(
      buildRow(
        'element',
        el.id,
        el.name || (el.category === 'emoji' ? 'Emoji' : 'Element'),
        el.visible !== false,
        el.locked === true,
        el.position || 'above',
        (state.selectedElementIds || []).includes(el.id),
        <CatIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
      )
    );
  });

  (state.shapeLayers || []).forEach((s) => {
    const ShapeCatIcon =
      s.shapeType === 'circle'
        ? PhosphorIcons.CircleIcon
        : s.shapeType === 'triangle'
          ? PhosphorIcons.TriangleIcon
          : s.shapeType === 'hexagon'
            ? PhosphorIcons.HexagonIcon
            : s.shapeType === 'quote'
              ? (PhosphorIcons as any).Quotes ||
                PhosphorIcons.ChatCircleIcon ||
                PhosphorIcons.SquareIcon
              : s.shapeType === 'coolshape'
                ? (PhosphorIcons as any).SparkleIcon || PhosphorIcons.SquareIcon
                : s.shapeType === 'custom-path'
                  ? PhosphorIcons.IntersectIcon || PhosphorIcons.SquareIcon
                  : s.shapeType === 'rectangle'
                    ? PhosphorIcons.RectangleIcon
                    : PhosphorIcons.SquareIcon;
    allRows.push(
      buildRow(
        'shape',
        s.id,
        s.name || s.shapeType || 'Shape',
        s.visible !== false,
        s.locked === true,
        s.position || 'above',
        (state.selectedShapeIds || []).includes(s.id),
        <ShapeCatIcon className="w-3.5 h-3.5 text-pastel-green shrink-0" />
      )
    );
  });

  // Sort rows within each position group by layerOrder (index 0 = topmost)
  const layerOrder = state.layerOrder || [];
  const sortByOrder = (rows: typeof allRows) =>
    [...rows].sort((a, b) => {
      const ai = layerOrder.findIndex((e) => e.type === a.type && e.id === a.id);
      const bi = layerOrder.findIndex((e) => e.type === b.type && e.id === b.id);
      const ai2 = ai === -1 ? 9999 : ai;
      const bi2 = bi === -1 ? 9999 : bi;
      return ai2 - bi2;
    });

  const aboveRows = sortByOrder(allRows.filter((r) => r.position === 'above'));
  const underRows = sortByOrder(allRows.filter((r) => r.position === 'underneath'));

  const select = (row: (typeof allRows)[0], e?: React.MouseEvent) => {
    const isMulti = e?.shiftKey || e?.metaKey || e?.ctrlKey || state.isMultiSelectMode;
    if (isMulti) {
      if (row.type === 'text') state.toggleTextLayer(row.id);
      else if (row.type === 'phosphor') state.toggleSelectPhosphorIconLayer(row.id);
      else if (row.type === 'shape') state.toggleSelectShapeLayer(row.id);
      else state.toggleSelectCanvasElement(row.id);
    } else {
      if (row.type === 'text') state.selectTextLayer(row.id);
      else if (row.type === 'phosphor') state.selectPhosphorIconLayer(row.id);
      else if (row.type === 'shape') state.selectShapeLayer(row.id);
      else state.selectCanvasElement(row.id);
    }
  };

  const update = (row: (typeof allRows)[0], updates: Record<string, unknown>) => {
    if (row.type === 'text') state.updateTextLayer(row.id, updates as never);
    else if (row.type === 'phosphor') state.updatePhosphorIconLayer(row.id, updates as never);
    else if (row.type === 'shape') state.updateShapeLayer(row.id, updates as never);
    else state.updateCanvasElement(row.id, updates as never);
  };

  const handleDragStart = (key: string) => {
    layerDragSrcKey.current = key;
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (layerDragOverKey.current !== key) {
      layerDragOverKey.current = key;
      setLayerDropIndicator(key);
    }
  };

  const handleDrop = (targetRow: (typeof allRows)[0]) => {
    const srcKey = layerDragSrcKey.current;
    layerDragSrcKey.current = null;
    layerDragOverKey.current = null;
    setLayerDropIndicator(null);
    if (!srcKey || srcKey === targetRow.key) return;

    const srcRow = allRows.find((r) => r.key === srcKey);
    if (!srcRow || srcRow.position !== targetRow.position) return; // no cross-group drag

    // Build new layerOrder by moving src before target within the same group
    const order = [...layerOrder];
    const srcGlobalIdx = order.findIndex((e) => e.type === srcRow.type && e.id === srcRow.id);
    const tgtGlobalIdx = order.findIndex(
      (e) => e.type === targetRow.type && e.id === targetRow.id
    );

    if (srcGlobalIdx === -1 || tgtGlobalIdx === -1) return;

    // Detect drag direction before mutating the array
    const isDraggingDown = srcGlobalIdx < tgtGlobalIdx;

    // Remove src, then find target's new index and insert:
    //   dragging UP   → insert before target (target stays in place visually)
    //   dragging DOWN → insert after  target (src lands below target)
    const [removed] = order.splice(srcGlobalIdx, 1);
    const newTgtIdx = order.findIndex((e) => e.type === targetRow.type && e.id === targetRow.id);
    order.splice(isDraggingDown ? newTgtIdx + 1 : newTgtIdx, 0, removed);

    state.reorderLayers(order);
  };

  const handleDragEnd = () => {
    layerDragSrcKey.current = null;
    layerDragOverKey.current = null;
    setLayerDropIndicator(null);
  };

  const renderRow = (row: (typeof allRows)[0]) => (
    <div
      key={row.key}
      draggable
      onDragStart={() => handleDragStart(row.key)}
      onDragOver={(e) => handleDragOver(e, row.key)}
      onDrop={() => handleDrop(row)}
      onDragEnd={handleDragEnd}
      onClick={(e) => select(row, e)}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all cursor-pointer ${
        layerDropIndicator === row.key
          ? 'border-pastel-pink/70 bg-pastel-pink/5'
          : row.selected
            ? 'bg-[#a2d2ff]/10 border-[#a2d2ff]/40'
            : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
      } ${!row.visible ? 'opacity-40' : ''}`}
    >
      {/* Drag handle */}
      <PhosphorIcons.DotsSixVerticalIcon
        className="w-3 h-3 text-slate-600 hover:text-slate-400 shrink-0 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      />
      {row.indicator}
      <input
        value={row.name}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => update(row, { name: e.target.value })}
        className="flex-1 min-w-0 bg-transparent text-xs text-slate-200 focus:outline-none truncate"
        title="Rename layer"
      />
      {/* Above/Behind toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          update(row, { position: row.position === 'above' ? 'underneath' : 'above' });
        }}
        title={
          row.position === 'above'
            ? 'Above mockup — click to move behind'
            : 'Behind mockup — click to move above'
        }
        className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
          row.position === 'above'
            ? 'text-pastel-pink hover:bg-neutral-800'
            : 'text-slate-500 hover:bg-neutral-800'
        }`}
      >
        {row.position === 'above' ? (
          <PhosphorIcons.ArrowLineUpIcon className="w-3.5 h-3.5" />
        ) : (
          <PhosphorIcons.ArrowLineDownIcon className="w-3.5 h-3.5" />
        )}
      </button>
      {/* Visibility */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          update(row, { visible: !row.visible });
        }}
        title={row.visible ? 'Hide layer' : 'Show layer'}
        className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
          row.visible
            ? 'text-slate-400 hover:text-white hover:bg-neutral-800'
            : 'text-slate-600 hover:bg-neutral-800'
        }`}
      >
        {row.visible ? (
          <PhosphorIcons.EyeIcon className="w-3.5 h-3.5" />
        ) : (
          <PhosphorIcons.EyeSlashIcon className="w-3.5 h-3.5" />
        )}
      </button>
      {/* Lock */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          update(row, { locked: !row.locked });
        }}
        title={row.locked ? 'Unlock layer' : 'Lock layer'}
        className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
          row.locked
            ? 'text-amber-300 hover:bg-neutral-800'
            : 'text-slate-500 hover:text-white hover:bg-neutral-800'
        }`}
      >
        {row.locked ? (
          <PhosphorIcons.LockSimpleIcon className="w-3.5 h-3.5" />
        ) : (
          <PhosphorIcons.LockSimpleOpenIcon className="w-3.5 h-3.5" />
        )}
      </button>
      {/* Explode (Text with >1 non-space char) */}
      {row.type === 'text' && (() => {
        const textLayer = state.textLayers.find((l) => l.id === row.id);
        if (!textLayer || !textLayer.text) return null;
        const nonSpaceCount = Array.from(textLayer.text).filter((c) => c.trim().length > 0).length;
        if (nonSpaceCount <= 1) return null;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              state.explodeTextLayer(row.id);
            }}
            title={`Explode "${textLayer.text}" into ${nonSpaceCount} separate character layers (excluding spaces)`}
            className="p-1 rounded-md text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
          >
            <PhosphorIcons.Sparkle className="w-3.5 h-3.5" />
          </button>
        );
      })()}
      {/* Duplicate */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (row.type === 'text') state.duplicateTextLayer(row.id);
          else if (row.type === 'phosphor') state.duplicatePhosphorIconLayer(row.id);
          else if (row.type === 'shape') state.duplicateShapeLayer(row.id);
          else state.duplicateCanvasElement(row.id);
        }}
        title="Duplicate layer"
        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
      >
        <PhosphorIcons.CopyIcon className="w-3.5 h-3.5" />
      </button>
      {/* Delete */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (row.type === 'text') state.removeTextLayer(row.id);
          else if (row.type === 'phosphor') state.removePhosphorIconLayer(row.id);
          else if (row.type === 'shape') state.removeShapeLayer(row.id);
          else state.removeCanvasElement(row.id);
        }}
        title="Delete layer"
        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
      >
        <PhosphorIcons.TrashIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-950/60 p-4 space-y-3 shadow-sm">
      <div className="border-b border-neutral-800/80 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhosphorIcons.StackIcon className="w-4 h-4 text-pastel-pink" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Layers</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{allRows.length}</span>
      </div>

      {/* Multi-Shape Boolean Action Bar */}
      {(state.selectedShapeIds || []).length >= 2 && (
        <div className="p-2.5 rounded-lg bg-pastel-pink/10 border border-pastel-pink/30 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PhosphorIcons.IntersectIcon weight="duotone" className="w-3.5 h-3.5 text-pastel-pink" />
              <span className="text-[11px] text-slate-200 font-medium">
                {state.selectedShapeIds.length} shapes selected
              </span>
            </div>
            <span className="text-[9px] font-mono text-pastel-pink/80 uppercase">Boolean</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => state.booleanOperationOnShapes('union')}
              className="py-1 px-1 bg-neutral-900 hover:bg-pastel-pink hover:text-slate-950 border border-neutral-800 text-slate-300 rounded text-[10px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm active:scale-95"
              title="Union (Combine all)"
            >
              <BooleanIcons.Union className="w-3.5 h-3.5" />
              <span>Union</span>
            </button>
            <button
              type="button"
              onClick={() => state.booleanOperationOnShapes('subtract')}
              className="py-1 px-1 bg-neutral-900 hover:bg-pastel-pink hover:text-slate-950 border border-neutral-800 text-slate-300 rounded text-[10px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm active:scale-95"
              title="Subtract (Cut top out of bottom)"
            >
              <BooleanIcons.Subtract className="w-3.5 h-3.5" />
              <span>Subtract</span>
            </button>
            <button
              type="button"
              onClick={() => state.booleanOperationOnShapes('intersect')}
              className="py-1 px-1 bg-neutral-900 hover:bg-pastel-pink hover:text-slate-950 border border-neutral-800 text-slate-300 rounded text-[10px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm active:scale-95"
              title="Intersect (Keep overlap)"
            >
              <BooleanIcons.Intersect className="w-3.5 h-3.5" />
              <span>Intersect</span>
            </button>
            <button
              type="button"
              onClick={() => state.booleanOperationOnShapes('exclude')}
              className="py-1 px-1 bg-neutral-900 hover:bg-pastel-pink hover:text-slate-950 border border-neutral-800 text-slate-300 rounded text-[10px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm active:scale-95"
              title="Exclude (Cut out overlap)"
            >
              <BooleanIcons.Exclude className="w-3.5 h-3.5" />
              <span>Exclude</span>
            </button>
          </div>
        </div>
      )}

      {allRows.length === 0 ? (
        <p className="text-xs text-slate-500 py-2">
          No layers yet. Add text, icons, or elements from the canvas toolbar.
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar pr-1">
          {/* Above mockup group */}
          {aboveRows.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <PhosphorIcons.ArrowLineUpIcon className="w-3 h-3 text-pastel-pink/70" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Above Mockup
                </span>
                <span className="text-[10px] font-mono text-slate-600 ml-auto">
                  {aboveRows.length}
                </span>
              </div>
              <div className="space-y-1">{aboveRows.map(renderRow)}</div>
            </div>
          )}

          {/* Divider — mockup */}
          {aboveRows.length > 0 && underRows.length > 0 && (
            <div className="flex items-center gap-2 py-0.5 px-1">
              <div className="flex-1 border-t border-dashed border-neutral-700/60" />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">
                Mockup Frame
              </span>
              <div className="flex-1 border-t border-dashed border-neutral-700/60" />
            </div>
          )}

          {/* Behind mockup group */}
          {underRows.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <PhosphorIcons.ArrowLineDownIcon className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Behind Mockup
                </span>
                <span className="text-[10px] font-mono text-slate-600 ml-auto">
                  {underRows.length}
                </span>
              </div>
              <div className="space-y-1">{underRows.map(renderRow)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
