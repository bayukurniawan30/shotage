import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { PenNode } from '../types/studio';

interface PenDrawingOverlayProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onNodeCountChange?: (count: number) => void;
  finishRef?: React.MutableRefObject<((isClosed: boolean) => void) | null>;
  undoRef?: React.MutableRefObject<(() => void) | null>;
}

/**
 * Generate standard SVG path data from PenNode points with cubic Bezier curves
 */
export function generateSvgPathFromNodes(nodes: PenNode[], isClosed: boolean): string {
  if (!nodes || nodes.length === 0) return '';
  if (nodes.length === 1) return `M ${nodes[0].x} ${nodes[0].y}`;

  let d = `M ${nodes[0].x} ${nodes[0].y}`;

  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];

    if (prev.handleOut || curr.handleIn) {
      const cp1x = prev.handleOut ? prev.handleOut.x : prev.x;
      const cp1y = prev.handleOut ? prev.handleOut.y : prev.y;
      const cp2x = curr.handleIn ? curr.handleIn.x : curr.x;
      const cp2y = curr.handleIn ? curr.handleIn.y : curr.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    } else {
      d += ` L ${curr.x} ${curr.y}`;
    }
  }

  if (isClosed && nodes.length >= 3) {
    const last = nodes[nodes.length - 1];
    const first = nodes[0];
    if (last.handleOut || first.handleIn) {
      const cp1x = last.handleOut ? last.handleOut.x : last.x;
      const cp1y = last.handleOut ? last.handleOut.y : last.y;
      const cp2x = first.handleIn ? first.handleIn.x : first.x;
      const cp2y = first.handleIn ? first.handleIn.y : first.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${first.x} ${first.y} Z`;
    } else {
      d += ` Z`;
    }
  }

  return d;
}

export const PenDrawingOverlay: React.FC<PenDrawingOverlayProps> = ({
  onNodeCountChange,
  finishRef,
  undoRef,
}) => {
  const state = useStudioStore();
  const overlayRef = useRef<SVGSVGElement | null>(null);

  const [nodes, setNodes] = useState<PenNode[]>([]);
  const [activeNode, setActiveNode] = useState<PenNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [isNearStart, setIsNearStart] = useState(false);

  // Viewport zoom scale compensation
  const zoomScale = Math.max(0.2, (state.previewCanvasZoom || 100) / 100);
  const invZoom = 1 / zoomScale;

  // Convert client viewport coordinates to unscaled canvas local coordinates
  const getCanvasCoords = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!overlayRef.current) return { x: 0, y: 0 };
    const rect = overlayRef.current.getBoundingClientRect();
    const clientW = overlayRef.current.clientWidth || rect.width;
    const clientH = overlayRef.current.clientHeight || rect.height;

    // True scale ratio between screen pixels and local canvas layout pixels
    const scaleX = rect.width / clientW;
    const scaleY = rect.height / clientH;

    return {
      x: Math.round(((e.clientX - rect.left) / scaleX) * 10) / 10,
      y: Math.round(((e.clientY - rect.top) / scaleY) * 10) / 10,
    };
  }, []);

  // Complete drawing and add ShapeLayer to store
  const finishPath = useCallback(
    (isClosed: boolean) => {
      const currentNodes = [...nodes];
      if (activeNode) currentNodes.push(activeNode);

      if (currentNodes.length < 2) {
        state.setPenDrawingMode(false);
        return;
      }

      if (!overlayRef.current) {
        state.setPenDrawingMode(false);
        return;
      }

      const clientW = overlayRef.current.clientWidth || 800;
      const clientH = overlayRef.current.clientHeight || 600;

      // Calculate bounding box across all anchors and control handles
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      currentNodes.forEach((n) => {
        minX = Math.min(minX, n.x, n.handleIn?.x ?? n.x, n.handleOut?.x ?? n.x);
        minY = Math.min(minY, n.y, n.handleIn?.y ?? n.y, n.handleOut?.y ?? n.y);
        maxX = Math.max(maxX, n.x, n.handleIn?.x ?? n.x, n.handleOut?.x ?? n.x);
        maxY = Math.max(maxY, n.y, n.handleIn?.y ?? n.y, n.handleOut?.y ?? n.y);
      });

      const w = Math.max(30, Math.round(maxX - minX));
      const h = Math.max(30, Math.round(maxY - minY));
      const centerX = Math.round((minX + maxX) / 2);
      const centerY = Math.round((minY + maxY) / 2);

      // Position relative to canvas center
      const shapeRelX = Math.round(centerX - clientW / 2);
      const shapeRelY = Math.round(centerY - clientH / 2);

      // Normalize node coordinates so (centerX, centerY) becomes origin (0, 0)
      const centeredNodes: PenNode[] = currentNodes.map((n) => ({
        x: Math.round((n.x - centerX) * 10) / 10,
        y: Math.round((n.y - centerY) * 10) / 10,
        handleIn: n.handleIn
          ? {
              x: Math.round((n.handleIn.x - centerX) * 10) / 10,
              y: Math.round((n.handleIn.y - centerY) * 10) / 10,
            }
          : undefined,
        handleOut: n.handleOut
          ? {
              x: Math.round((n.handleOut.x - centerX) * 10) / 10,
              y: Math.round((n.handleOut.y - centerY) * 10) / 10,
            }
          : undefined,
      }));

      const pathData = generateSvgPathFromNodes(centeredNodes, isClosed);
      const viewBox = `${-w / 2} ${-h / 2} ${w} ${h}`;

      state.addShapeLayer('custom-path', {
        width: w,
        height: h,
        x: shapeRelX,
        y: shapeRelY,
        pathData,
        viewBox,
        color: '#a2d2ff',
        name: 'Custom Vector Shape',
      });

      state.setPenDrawingMode(false);
    },
    [nodes, activeNode, state]
  );

  // Undo last placed node
  const undoLastNode = useCallback(() => {
    setNodes((prev) => prev.slice(0, -1));
  }, []);

  // Expose finish and undo callbacks to parent toolbar
  useEffect(() => {
    if (finishRef) finishRef.current = finishPath;
    if (undoRef) undoRef.current = undoLastNode;
  }, [finishPath, undoLastNode, finishRef, undoRef]);

  // Sync node count with toolbar
  useEffect(() => {
    onNodeCountChange?.(nodes.length);
  }, [nodes.length, onNodeCountChange]);

  // Pointer Down: Start point or initiate curve drag
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const { x, y } = getCanvasCoords(e);

    // If near start point and have at least 3 points, close path!
    if (isNearStart && nodes.length >= 3) {
      finishPath(true);
      return;
    }

    // Set active node at current pointer location
    setActiveNode({ x, y });
    setIsDragging(true);
  };

  // Pointer Move: Update curve tangent handle if dragging, or update hover preview
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const { x, y } = getCanvasCoords(e);
    setHoverPos({ x, y });

    // Check distance to first point (compensated for zoom scale so screen radius is ~14px)
    if (nodes.length >= 3) {
      const first = nodes[0];
      const dist = Math.hypot(x - first.x, y - first.y);
      setIsNearStart(dist <= 14 * invZoom);
    } else {
      setIsNearStart(false);
    }

    // If dragging while creating a point, extend tangent handles
    if (isDragging && activeNode) {
      const dx = x - activeNode.x;
      const dy = y - activeNode.y;

      // HandleOut follows cursor; HandleIn mirrors symmetrically (Photoshop style)
      setActiveNode({
        ...activeNode,
        handleOut: { x: activeNode.x + dx, y: activeNode.y + dy },
        handleIn: { x: activeNode.x - dx, y: activeNode.y - dy },
      });
    }
  };

  // Pointer Up: Commit active node to path
  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !activeNode) return;
    e.preventDefault();
    e.stopPropagation();

    setNodes((prev) => [...prev, activeNode]);
    setActiveNode(null);
    setIsDragging(false);
  };

  // Keyboard Shortcuts: Enter to finish, Esc to cancel, Backspace/Delete to undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        state.setPenDrawingMode(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (nodes.length >= 2) {
          finishPath(nodes.length >= 3);
        } else {
          state.setPenDrawingMode(false);
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        undoLastNode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, finishPath, undoLastNode, state]);

  // Combined node list for rendering (includes active node during drag)
  const allNodes = activeNode ? [...nodes, activeNode] : nodes;
  const livePathStr = generateSvgPathFromNodes(allNodes, false);

  // Preview segment from last committed node to cursor when not dragging
  let previewSegmentStr = '';
  if (nodes.length > 0 && hoverPos && !isDragging) {
    const last = nodes[nodes.length - 1];
    const target = isNearStart && nodes.length >= 3 ? nodes[0] : hoverPos;

    if (last.handleOut) {
      const dx = target.x - last.x;
      const dy = target.y - last.y;
      const cp2x = target.x - dx * 0.25;
      const cp2y = target.y - dy * 0.25;
      previewSegmentStr = `M ${last.x} ${last.y} C ${last.handleOut.x} ${last.handleOut.y}, ${cp2x} ${cp2y}, ${target.x} ${target.y}`;
    } else {
      previewSegmentStr = `M ${last.x} ${last.y} L ${target.x} ${target.y}`;
    }
  }

  // Knob sizes scaled with invZoom so they stay constant on user screen
  const anchorHalf = 4 * invZoom;
  const anchorSize = 8 * invZoom;
  const knobRadius = 3.5 * invZoom;
  const strokeWidthMain = 2 * invZoom;
  const strokeWidthGuide = 1.5 * invZoom;
  const strokeWidthHandle = 1 * invZoom;

  return (
    <div className="absolute inset-0 z-[100] pointer-events-auto select-none overflow-visible">
      {/* SVG Drawing Canvas Overlay */}
      <svg
        ref={overlayRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`absolute inset-0 w-full h-full overflow-visible ${
          isNearStart ? 'cursor-pointer' : 'cursor-crosshair'
        }`}
        style={{ touchAction: 'none' }}
      >
        {/* Live SVG Path Silhouette (includes all committed nodes and active node during drag) */}
        {livePathStr && (
          <path
            d={livePathStr}
            fill="rgba(162, 210, 255, 0.12)"
            stroke="#a2d2ff"
            strokeWidth={strokeWidthMain}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Live curve segment highlight while dragging and sculpting curve */}
        {isDragging && nodes.length > 0 && activeNode && (() => {
          const prev = nodes[nodes.length - 1];
          const cp1x = prev.handleOut ? prev.handleOut.x : prev.x;
          const cp1y = prev.handleOut ? prev.handleOut.y : prev.y;
          const cp2x = activeNode.handleIn ? activeNode.handleIn.x : activeNode.x;
          const cp2y = activeNode.handleIn ? activeNode.handleIn.y : activeNode.y;
          const segD = `M ${prev.x} ${prev.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${activeNode.x} ${activeNode.y}`;
          return (
            <path
              d={segD}
              fill="none"
              stroke="#f472b6"
              strokeWidth={strokeWidthMain * 1.3}
              strokeLinecap="round"
              className="drop-shadow-[0_0_6px_rgba(244,114,182,0.8)]"
            />
          );
        })()}

        {/* Live Elastic Line to Cursor when hovering */}
        {previewSegmentStr && (
          <path
            d={previewSegmentStr}
            fill="none"
            stroke={isNearStart ? '#f472b6' : '#a2d2ff'}
            strokeWidth={strokeWidthGuide}
            strokeDasharray={`${4 * invZoom} ${4 * invZoom}`}
            className="animate-pulse"
          />
        )}

        {/* Tangent Control Handle Lines and Knobs for all nodes */}
        {allNodes.map((n, idx) => (
          <g key={`handles-${idx}`}>
            {/* Handle In line & knob */}
            {n.handleIn && (
              <>
                <line
                  x1={n.x}
                  y1={n.y}
                  x2={n.handleIn.x}
                  y2={n.handleIn.y}
                  stroke="#93c5fd"
                  strokeWidth={strokeWidthHandle}
                />
                <circle
                  cx={n.handleIn.x}
                  cy={n.handleIn.y}
                  r={knobRadius}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth={strokeWidthHandle * 1.5}
                />
              </>
            )}

            {/* Handle Out line & knob */}
            {n.handleOut && (
              <>
                <line
                  x1={n.x}
                  y1={n.y}
                  x2={n.handleOut.x}
                  y2={n.handleOut.y}
                  stroke="#93c5fd"
                  strokeWidth={strokeWidthHandle}
                />
                <circle
                  cx={n.handleOut.x}
                  cy={n.handleOut.y}
                  r={knobRadius}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth={strokeWidthHandle * 1.5}
                />
              </>
            )}
          </g>
        ))}

        {/* Anchor Points (Crisp Square Knobs) */}
        {allNodes.map((n, idx) => {
          const isFirst = idx === 0;
          return (
            <g key={`anchor-${idx}`}>
              {/* Highlight circle on initial point when hovering near to close path */}
              {isFirst && isNearStart && (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={12 * invZoom}
                  fill="rgba(244, 114, 182, 0.25)"
                  stroke="#f472b6"
                  strokeWidth={2 * invZoom}
                  className="animate-ping"
                />
              )}

              {/* Anchor Square Point */}
              <rect
                x={n.x - anchorHalf}
                y={n.y - anchorHalf}
                width={anchorSize}
                height={anchorSize}
                fill={isFirst && isNearStart ? '#f472b6' : '#ffffff'}
                stroke={isFirst ? '#3b82f6' : '#1d4ed8'}
                strokeWidth={1.5 * invZoom}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
