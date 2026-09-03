import polygonClipping, { MultiPolygon, Polygon, Ring, Pair } from 'polygon-clipping';
import { ShapeLayer } from '../types/studio';

/**
 * Converts a ShapeLayer into a 2D world-space polygon ring.
 */
export function getShapeWorldPolygon(shape: ShapeLayer): Polygon {
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
 * Computes the Boolean Union of multiple shape layers.
 * Returns a new ShapeLayer of shapeType 'custom-path' representing the fused silhouette.
 */
export function mergeShapeLayers(shapes: ShapeLayer[]): ShapeLayer | null {
  if (!shapes || shapes.length < 2) return null;

  // Primary shape provides style properties (colors, gradients, shadows, etc.)
  const primary = shapes[0];

  const polygons: Polygon[] = shapes.map((s) => getShapeWorldPolygon(s));

  let unionResult: MultiPolygon;
  try {
    unionResult = polygonClipping.union(polygons[0], ...polygons.slice(1));
  } catch (err) {
    console.error('Failed to compute shape union:', err);
    return null;
  }

  if (!unionResult || unionResult.length === 0) return null;

  // Calculate overall bounding box of the resulting MultiPolygon
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  unionResult.forEach((poly) => {
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

  unionResult.forEach((poly) => {
    poly.forEach((ring) => {
      if (ring.length === 0) return;
      const commands = ring.map(([wx, wy], idx) => {
        const lx = Math.round((wx - centerX) * 100) / 100;
        const ly = Math.round((wy - centerY) * 100) / 100;
        return `${idx === 0 ? 'M' : 'L'} ${lx} ${ly}`;
      });
      pathCommands.push(`${commands.join(' ')} Z`);
    });
  });

  const pathData = pathCommands.join(' ');
  const halfW = width / 2;
  const halfH = height / 2;
  const viewBox = `${-halfW} ${-halfH} ${width} ${height}`;

  const mergedShape: ShapeLayer = {
    ...primary,
    id: `shape-merged-${Date.now()}`,
    name: shapes.map((s) => s.name || s.shapeType).join(' + ') || 'Merged Shape',
    shapeType: 'custom-path',
    pathData,
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
