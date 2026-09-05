import polygonClipping, { MultiPolygon, Polygon, Ring, Pair } from 'polygon-clipping';
import { ShapeLayer } from '../types/studio';

export type BooleanOperation = 'union' | 'subtract' | 'intersect' | 'exclude';

/**
 * Parses standard SVG path string into closed polygon rings with sampled Bezier curves.
 */
export function parseSvgPathToRings(pathData: string): Ring[] {
  const rings: Ring[] = [];
  let currentRing: Pair[] = [];

  // Match each SVG command letter followed by its coordinate arguments
  const commandRegex = /([a-df-z])([^a-df-z]*)/gi;
  let match: RegExpExecArray | null;

  let curX = 0;
  let curY = 0;
  let startX = 0;
  let startY = 0;
  let lastControlX = 0;
  let lastControlY = 0;
  let prevCmd = '';

  while ((match = commandRegex.exec(pathData)) !== null) {
    const cmd = match[1];
    const isRel = cmd === cmd.toLowerCase();
    const type = cmd.toUpperCase();
    const argStr = match[2].trim();

    // Parse all floating point numbers (handles scientific notation and negative numbers without spaces)
    const numRegex = /[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;
    const args: number[] = [];
    let numMatch: RegExpExecArray | null;
    while ((numMatch = numRegex.exec(argStr)) !== null) {
      args.push(parseFloat(numMatch[0]));
    }

    let i = 0;
    while (i < args.length || type === 'Z') {
      if (type === 'M') {
        const x = isRel ? curX + args[i] : args[i];
        const y = isRel ? curY + args[i + 1] : args[i + 1];
        i += 2;

        if (currentRing.length >= 3) {
          const first = currentRing[0];
          const last = currentRing[currentRing.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            currentRing.push([first[0], first[1]]);
          }
          rings.push(currentRing);
        }
        currentRing = [[x, y]];
        curX = x;
        curY = y;
        startX = x;
        startY = y;

        // Subsequent coordinate pairs for 'M' command are treated as implicit 'L' (SVG spec)
        while (i + 1 < args.length) {
          const lx = isRel ? curX + args[i] : args[i];
          const ly = isRel ? curY + args[i + 1] : args[i + 1];
          i += 2;
          currentRing.push([lx, ly]);
          curX = lx;
          curY = ly;
        }
      } else if (type === 'L') {
        while (i + 1 < args.length) {
          const x = isRel ? curX + args[i] : args[i];
          const y = isRel ? curY + args[i + 1] : args[i + 1];
          i += 2;
          currentRing.push([x, y]);
          curX = x;
          curY = y;
        }
      } else if (type === 'H') {
        while (i < args.length) {
          const x = isRel ? curX + args[i] : args[i];
          i += 1;
          currentRing.push([x, curY]);
          curX = x;
        }
      } else if (type === 'V') {
        while (i < args.length) {
          const y = isRel ? curY + args[i] : args[i];
          i += 1;
          currentRing.push([curX, y]);
          curY = y;
        }
      } else if (type === 'C') {
        while (i + 5 < args.length) {
          const cp1x = isRel ? curX + args[i] : args[i];
          const cp1y = isRel ? curY + args[i + 1] : args[i + 1];
          const cp2x = isRel ? curX + args[i + 2] : args[i + 2];
          const cp2y = isRel ? curY + args[i + 3] : args[i + 3];
          const endX = isRel ? curX + args[i + 4] : args[i + 4];
          const endY = isRel ? curY + args[i + 5] : args[i + 5];
          i += 6;

          const steps = 16;
          const x0 = curX;
          const y0 = curY;
          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const mt = 1 - t;
            const px =
              mt * mt * mt * x0 +
              3 * mt * mt * t * cp1x +
              3 * mt * t * t * cp2x +
              t * t * t * endX;
            const py =
              mt * mt * mt * y0 +
              3 * mt * mt * t * cp1y +
              3 * mt * t * t * cp2y +
              t * t * t * endY;
            currentRing.push([Math.round(px * 100) / 100, Math.round(py * 100) / 100]);
          }
          lastControlX = cp2x;
          lastControlY = cp2y;
          curX = endX;
          curY = endY;
        }
      } else if (type === 'S') {
        while (i + 3 < args.length) {
          let cp1x = curX;
          let cp1y = curY;
          if (prevCmd === 'C' || prevCmd === 'S') {
            cp1x = 2 * curX - lastControlX;
            cp1y = 2 * curY - lastControlY;
          }
          const cp2x = isRel ? curX + args[i] : args[i];
          const cp2y = isRel ? curY + args[i + 1] : args[i + 1];
          const endX = isRel ? curX + args[i + 2] : args[i + 2];
          const endY = isRel ? curY + args[i + 3] : args[i + 3];
          i += 4;

          const steps = 16;
          const x0 = curX;
          const y0 = curY;
          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const mt = 1 - t;
            const px =
              mt * mt * mt * x0 +
              3 * mt * mt * t * cp1x +
              3 * mt * t * t * cp2x +
              t * t * t * endX;
            const py =
              mt * mt * mt * y0 +
              3 * mt * mt * t * cp1y +
              3 * mt * t * t * cp2y +
              t * t * t * endY;
            currentRing.push([Math.round(px * 100) / 100, Math.round(py * 100) / 100]);
          }
          lastControlX = cp2x;
          lastControlY = cp2y;
          curX = endX;
          curY = endY;
          prevCmd = 'S';
        }
      } else if (type === 'Q') {
        while (i + 3 < args.length) {
          const cpx = isRel ? curX + args[i] : args[i];
          const cpy = isRel ? curY + args[i + 1] : args[i + 1];
          const endX = isRel ? curX + args[i + 2] : args[i + 2];
          const endY = isRel ? curY + args[i + 3] : args[i + 3];
          i += 4;

          const steps = 12;
          const x0 = curX;
          const y0 = curY;
          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const mt = 1 - t;
            const px = mt * mt * x0 + 2 * mt * t * cpx + t * t * endX;
            const py = mt * mt * y0 + 2 * mt * t * cpy + t * t * endY;
            currentRing.push([Math.round(px * 100) / 100, Math.round(py * 100) / 100]);
          }
          lastControlX = cpx;
          lastControlY = cpy;
          curX = endX;
          curY = endY;
        }
      } else if (type === 'T') {
        while (i + 1 < args.length) {
          let cpx = curX;
          let cpy = curY;
          if (prevCmd === 'Q' || prevCmd === 'T') {
            cpx = 2 * curX - lastControlX;
            cpy = 2 * curY - lastControlY;
          }
          const endX = isRel ? curX + args[i] : args[i];
          const endY = isRel ? curY + args[i + 1] : args[i + 1];
          i += 2;

          const steps = 12;
          const x0 = curX;
          const y0 = curY;
          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const mt = 1 - t;
            const px = mt * mt * x0 + 2 * mt * t * cpx + t * t * endX;
            const py = mt * mt * y0 + 2 * mt * t * cpy + t * t * endY;
            currentRing.push([Math.round(px * 100) / 100, Math.round(py * 100) / 100]);
          }
          lastControlX = cpx;
          lastControlY = cpy;
          curX = endX;
          curY = endY;
          prevCmd = 'T';
        }
      } else if (type === 'Z') {
        if (currentRing.length > 0) {
          const first = currentRing[0];
          const last = currentRing[currentRing.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            currentRing.push([first[0], first[1]]);
          }
          if (currentRing.length >= 3) {
            rings.push(currentRing);
          }
          currentRing = [];
        }
        curX = startX;
        curY = startY;
        break;
      } else {
        break;
      }
    }
    prevCmd = type;
  }

  if (currentRing.length >= 3) {
    const first = currentRing[0];
    const last = currentRing[currentRing.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      currentRing.push([first[0], first[1]]);
    }
    rings.push(currentRing);
  }

  return rings;
}

/**
 * Converts a ShapeLayer into a 2D world-space polygon or multi-polygon.
 */
export function getShapeWorldPolygon(shape: ShapeLayer): Polygon | MultiPolygon {
  const hw = (shape.width || 100) / 2;
  const hh = (shape.height || 100) / 2;
  const localPoints: Pair[] = [];

  switch (shape.shapeType) {
    case 'circle': {
      const segments = 32;
      for (let i = 0; i < segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        localPoints.push([hw * Math.cos(theta), hh * Math.sin(theta)]);
      }
      break;
    }

    case 'triangle': {
      localPoints.push([0, -hh]);
      localPoints.push([hw, hh]);
      localPoints.push([-hw, hh]);
      break;
    }

    case 'hexagon': {
      localPoints.push([-0.5 * hw, -hh]);
      localPoints.push([0.5 * hw, -hh]);
      localPoints.push([hw, 0]);
      localPoints.push([0.5 * hw, hh]);
      localPoints.push([-0.5 * hw, hh]);
      localPoints.push([-hw, 0]);
      break;
    }

    case 'custom-path':
    case 'quote': {
      const pathStr =
        shape.shapeType === 'quote'
          ? "M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"
          : shape.pathData;

      if (pathStr) {
        const rawRings = parseSvgPathToRings(pathStr);
        if (rawRings.length > 0) {
          let vbMinX = 0;
          let vbMinY = 0;
          let vbW = 0;
          let vbH = 0;

          if (shape.shapeType === 'quote') {
            vbMinX = 0;
            vbMinY = 0;
            vbW = 24;
            vbH = 24;
          } else if (shape.viewBox) {
            const parts = shape.viewBox.trim().split(/[\s,]+/).map(Number);
            if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
              [vbMinX, vbMinY, vbW, vbH] = parts;
            }
          }

          // Fallback: Compute bounding box from sampled points if no valid viewBox
          if (vbW === 0 || vbH === 0) {
            let pMinX = Infinity;
            let pMaxX = -Infinity;
            let pMinY = Infinity;
            let pMaxY = -Infinity;
            rawRings.forEach((ring) => {
              ring.forEach(([px, py]) => {
                if (px < pMinX) pMinX = px;
                if (px > pMaxX) pMaxX = px;
                if (py < pMinY) pMinY = py;
                if (py > pMaxY) pMaxY = py;
              });
            });
            vbMinX = pMinX;
            vbMinY = pMinY;
            vbW = Math.max(1, pMaxX - pMinX);
            vbH = Math.max(1, pMaxY - pMinY);
          }

          const scaleX = (shape.width || vbW) / vbW;
          const scaleY = (shape.height || vbH) / vbH;
          const vbCenterX = vbMinX + vbW / 2;
          const vbCenterY = vbMinY + vbH / 2;

          const angleRad = ((shape.rotation || 0) * Math.PI) / 180;
          const cos = Math.cos(angleRad);
          const sin = Math.sin(angleRad);

          const worldRings: Ring[] = rawRings.map((ring) => {
            const transformedRing: Pair[] = ring.map(([px, py]) => {
              const lx = (px - vbCenterX) * scaleX;
              const ly = (py - vbCenterY) * scaleY;
              const rx = lx * cos - ly * sin;
              const ry = lx * sin + ly * cos;
              return [
                Math.round((shape.x + rx) * 100) / 100,
                Math.round((shape.y + ry) * 100) / 100,
              ];
            });

            // Ensure ring is closed
            if (transformedRing.length > 0) {
              const first = transformedRing[0];
              const last = transformedRing[transformedRing.length - 1];
              if (first[0] !== last[0] || first[1] !== last[1]) {
                transformedRing.push([first[0], first[1]]);
              }
            }
            return transformedRing;
          });

          if (worldRings.length === 1) {
            return [worldRings[0]];
          }
          return worldRings.map((r) => [r]) as MultiPolygon;
        }
      }
      break;
    }

    case 'rectangle':
    case 'square':
    default: {
      const radius = Math.min(shape.borderRadius ?? 0, hw, hh);
      if (radius > 1) {
        // Approximated rounded corners with 4 segments per quadrant
        const cornerSegments = 4;
        const addArc = (cx: number, cy: number, startAngle: number) => {
          for (let i = 0; i <= cornerSegments; i++) {
            const angle = startAngle + (i / cornerSegments) * (Math.PI / 2);
            localPoints.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
          }
        };
        // Top-right
        addArc(hw - radius, -hh + radius, -Math.PI / 2);
        // Bottom-right
        addArc(hw - radius, hh - radius, 0);
        // Bottom-left
        addArc(-hw + radius, hh - radius, Math.PI / 2);
        // Top-left
        addArc(-hw + radius, -hh + radius, Math.PI);
      } else {
        localPoints.push([-hw, -hh]);
        localPoints.push([hw, -hh]);
        localPoints.push([hw, hh]);
        localPoints.push([-hw, hh]);
      }
      break;
    }
  }

  // Transform local points to world coordinates by rotation and center position (shape.x, shape.y)
  const angleRad = ((shape.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const worldRing: Ring = localPoints.map(([lx, ly]) => {
    const rx = lx * cos - ly * sin;
    const ry = lx * sin + ly * cos;
    return [Math.round((shape.x + rx) * 100) / 100, Math.round((shape.y + ry) * 100) / 100];
  });

  // Ensure polygon ring is explicitly closed
  if (worldRing.length > 0) {
    const first = worldRing[0];
    const last = worldRing[worldRing.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      worldRing.push([first[0], first[1]]);
    }
  }

  return [worldRing];
}

/**
 * Computes Boolean Operations (Union, Subtract, Intersect, Exclude) on multiple shape layers.
 * Returns a new ShapeLayer of shapeType 'custom-path'.
 */
export function booleanOperationOnShapes(
  shapes: ShapeLayer[],
  operation: BooleanOperation = 'union'
): ShapeLayer | null {
  if (!shapes || shapes.length < 2) return null;
  if (shapes.some((s) => s.shapeType === 'custom-path')) return null;

  // For subtract: shapes[0] is subject (base layer), shapes[1..N] are cutters.
  // For other operations: shapes[0] is the primary styling layer.
  const primary = shapes[0];

  const polygons: (Polygon | MultiPolygon)[] = shapes.map((s) => getShapeWorldPolygon(s));

  let opResult: MultiPolygon;
  try {
    switch (operation) {
      case 'subtract':
        opResult = polygonClipping.difference(polygons[0], ...polygons.slice(1));
        break;
      case 'intersect':
        opResult = polygonClipping.intersection(polygons[0], ...polygons.slice(1));
        break;
      case 'exclude':
        opResult = polygonClipping.xor(polygons[0], ...polygons.slice(1));
        break;
      case 'union':
      default:
        opResult = polygonClipping.union(polygons[0], ...polygons.slice(1));
        break;
    }
  } catch (err) {
    console.error(`Failed to compute boolean operation ${operation}:`, err);
    return null;
  }

  if (!opResult || opResult.length === 0) return null;

  // Calculate overall bounding box of the resulting MultiPolygon
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  opResult.forEach((poly) => {
    poly.forEach((ring) => {
      ring.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    });
  });

  if (!isFinite(minX) || !isFinite(maxX)) return null;

  const width = Math.max(10, Math.round(maxX - minX));
  const height = Math.max(10, Math.round(maxY - minY));
  const centerX = Math.round((minX + maxX) / 2);
  const centerY = Math.round((minY + maxY) / 2);

  // Convert all rings into SVG path commands centered at (0, 0)
  const pathCommands: string[] = [];
  const unitCommands: string[] = [];

  opResult.forEach((poly) => {
    poly.forEach((ring) => {
      if (ring.length === 0) return;
      const commands = ring.map(([wx, wy], idx) => {
        const lx = Math.round((wx - centerX) * 100) / 100;
        const ly = Math.round((wy - centerY) * 100) / 100;
        return `${idx === 0 ? 'M' : 'L'} ${lx} ${ly}`;
      });
      pathCommands.push(`${commands.join(' ')} Z`);

      const uCmds = ring.map(([wx, wy], idx) => {
        const ux = Math.round(((wx - minX) / width) * 10000) / 10000;
        const uy = Math.round(((wy - minY) / height) * 10000) / 10000;
        return `${idx === 0 ? 'M' : 'L'} ${ux} ${uy}`;
      });
      unitCommands.push(`${uCmds.join(' ')} Z`);
    });
  });

  const pathData = pathCommands.join(' ');
  const unitPathData = unitCommands.join(' ');
  const halfW = width / 2;
  const halfH = height / 2;
  const viewBox = `${-halfW} ${-halfH} ${width} ${height}`;

  const opLabels: Record<BooleanOperation, string> = {
    union: 'Union',
    subtract: 'Subtract',
    intersect: 'Intersect',
    exclude: 'Exclude',
  };

  const mergedShape: ShapeLayer = {
    ...primary,
    id: `shape-boolean-${Date.now()}`,
    name: `${opLabels[operation]} (${shapes.map((s) => s.name || s.shapeType).join(' & ')})`,
    shapeType: 'custom-path',
    pathData,
    unitPathData,
    viewBox,
    width,
    height,
    x: centerX,
    y: centerY,
    rotation: 0,
    borderRadius: 0,
  };

  return mergedShape;
}

/**
 * Backwards compatibility helper for Boolean Union.
 */
export const mergeShapeLayers = (shapes: ShapeLayer[]) => booleanOperationOnShapes(shapes, 'union');
