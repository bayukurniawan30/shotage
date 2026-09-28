export function getExtrudedShapeGeometry(
  width: number,
  height: number,
  depth: number,
  cornerSoftness = 0
) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const projectedDepth = Math.max(
    0,
    Math.min(depth, Math.min(safeWidth, safeHeight) * 0.45)
  );
  // Keep the front face's original aspect ratio as depth takes up space
  // inside the layer bounds (square stays square, rectangle stays rectangular).
  const verticalDepth = projectedDepth * (safeHeight / safeWidth);
  const frontWidth = safeWidth - projectedDepth;
  const frontHeight = safeHeight - verticalDepth;
  const radius = Math.max(0, Math.min(cornerSoftness, frontWidth / 2, frontHeight / 2));
  // Match the mockup slab with overlapping rounded copies of the front.
  // A slice per pixel keeps the curved side wall connected at every corner.
  const sliceCount = Math.ceil(Math.max(projectedDepth, verticalDepth));

  return {
    width: safeWidth,
    height: safeHeight,
    projectedDepth,
    verticalDepth,
    radius,
    front: { x: 0, y: 0, width: frontWidth, height: frontHeight },
    sliceCount,
  };
}
