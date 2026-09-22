import { z } from 'zod';

type JsonObject = Record<string, unknown>;

export const MCP_ASPECT_RATIOS = [
  'auto',
  '16:9',
  '1:1',
  '9:16',
  '4:3',
  '3:2',
  '3:4',
  '5:4',
  '4:5',
  '1.91:1',
  'ig-post',
  'ig-portrait',
  'ig-story',
  'yt-banner',
  'yt-thumbnail',
  'yt-video',
  'custom',
] as const;

export const MCP_BACKGROUND_TYPES = [
  'solid',
  'gradient',
  'flow',
  'mist',
  'shadeshifter',
  'spectral',
  'animatedGradient',
  'linearSwatches',
  'wave',
  'mesh',
  'animatedMesh',
  'confetti',
  'radiant',
  'transparent',
  'image',
] as const;

export const MCP_FRAME_TYPES = [
  'frameless',
  'code-window',
  'safari-light',
  'safari-dark',
  'chrome-dark',
  'macbook',
  'macbookair13',
  'iphone',
  'iphone14pro',
  'iphone16',
  'iphone16-floating',
  'iphone17-dual-side',
  'samsung-s21',
  'tablet',
  'polaroid',
  'polaroid-dark',
  'instagram',
  'instagram-dark',
] as const;

export const MCP_CODE_LANGUAGES = [
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'html',
  'css',
  'json',
  'bash',
  'python',
  'sql',
  'go',
  'rust',
  'php',
  'yaml',
  'markdown',
] as const;

export const MCP_MOTION_PRESETS = [
  'pop-in',
  'slide-in-left',
  'slide-in-right',
  'slide-in-up',
  'slide-in-down',
  'fade-in',
  'drop-bounce',
  'flip-in',
  'blur-in',
  'typeahead',
  'text-rise',
  'text-pop',
  'text-blur',
  'text-wave',
  'pulse',
  'float',
  'spin',
  'wiggle',
  'blink',
  'heartbeat',
  'swing',
  'counter',
  'fade-out',
  'slide-out-left',
  'slide-out-right',
  'slide-out-down',
  'slide-out-up',
  'pop-out',
  'blur-out',
] as const;

const TEXT_ONLY_MOTIONS = new Set(['typeahead', 'text-rise', 'text-pop', 'text-blur', 'text-wave']);
const finiteNumber = z.number().finite();
const color = z.string().min(1).describe('CSS color; #RRGGBB is recommended.');
const layerTypeSchema = z.enum(['text', 'phosphor', 'element', 'shape']);
const animationEasingTypeSchema = z.enum([
  'ease-in-out',
  'linear',
  'ease-out',
  'ease-in',
  'spring',
]);

export const mcpEasingSchema = z
  .union([
    animationEasingTypeSchema,
    z.object({
      type: z.literal('cubic-bezier'),
      x1: finiteNumber.min(0).max(1),
      y1: finiteNumber.min(-0.6).max(1.6),
      x2: finiteNumber.min(0).max(1),
      y2: finiteNumber.min(-0.6).max(1.6),
    }),
  ])
  .describe('Built-in easing name or a custom cubic-bezier curve.');

export const mcpMotionPathSchema = z.object({
  type: z.enum(['linear', 'arc-up', 'arc-down', 's-curve']),
  curvature: finiteNumber.min(0).max(1),
  autoOrient: z.boolean().optional(),
});

export const mcpLayerKeyframeSchema = z
  .object({
    id: z.string().min(1),
    timeSec: finiteNumber.min(0),
    x: finiteNumber.optional(),
    y: finiteNumber.optional(),
    width: finiteNumber.positive().optional(),
    height: finiteNumber.positive().optional(),
    scale: finiteNumber.min(0.01).max(10).optional(),
    scaleX: finiteNumber.min(0.01).max(10).optional(),
    scaleY: finiteNumber.min(0.01).max(10).optional(),
    rotation: finiteNumber.optional(),
    pitch: finiteNumber.optional(),
    yaw: finiteNumber.optional(),
    opacity: finiteNumber.min(0).max(100).optional(),
    borderRadius: finiteNumber.min(0).optional(),
    fontSize: finiteNumber.min(1).max(1000).optional(),
    blur: finiteNumber.min(0).max(100).optional(),
    skewX: finiteNumber.optional(),
    skewY: finiteNumber.optional(),
    color: color.optional(),
    borderWidth: finiteNumber.min(0).optional(),
    borderColor: color.optional(),
    letterSpacing: finiteNumber.optional(),
    shadowOpacity: finiteNumber.min(0).max(100).optional(),
    shadowBlur: finiteNumber.min(0).optional(),
    shadowOffsetX: finiteNumber.optional(),
    shadowOffsetY: finiteNumber.optional(),
    easing: mcpEasingSchema.optional(),
  })
  .strict();

export const mcpMockupKeyframeSchema = z
  .object({
    id: z.string().min(1),
    timeSec: finiteNumber.min(0),
    rotateX: finiteNumber,
    rotateY: finiteNumber,
    zoom: finiteNumber.min(1).max(500),
    offsetX: finiteNumber,
    offsetY: finiteNumber,
    slot2Zoom: finiteNumber.min(1).max(500).optional(),
    slot2OffsetX: finiteNumber.optional(),
    slot2OffsetY: finiteNumber.optional(),
    slot1Rotate: finiteNumber.optional(),
    slot2Rotate: finiteNumber.optional(),
    easing: mcpEasingSchema.optional(),
  })
  .strict();

export const mcpMotionBlockSchema = z
  .object({
    id: z.string().min(1),
    preset: z.enum(MCP_MOTION_PRESETS),
    startTimeSec: finiteNumber.min(0),
    durationSec: finiteNumber.positive(),
    easing: animationEasingTypeSchema.optional(),
    textUnit: z.enum(['character', 'word']).optional(),
    textOrder: z.enum(['forward', 'reverse', 'center', 'random']).optional(),
    staggerSec: finiteNumber.min(0).max(0.2).optional(),
  })
  .strict();

export const mcpMaskTargetSchema = z.object({
  type: z.enum(['text', 'phosphor', 'element', 'shape', 'group']),
  id: z.string().min(1),
});

export const mcpStageTransitionSchema = z.object({
  type: z.enum(['none', 'crossfade', 'slide-left', 'slide-right', 'zoom-fade']),
  durationSec: finiteNumber.min(0.1).max(1.5),
  easing: animationEasingTypeSchema,
});

const animatedLayerFields = {
  x: finiteNumber.optional(),
  y: finiteNumber.optional(),
  rotation: finiteNumber.optional(),
  pitch: finiteNumber.optional(),
  yaw: finiteNumber.optional(),
  skewX: finiteNumber.optional(),
  skewY: finiteNumber.optional(),
  opacity: finiteNumber.min(0).max(100).optional(),
  anchorX: finiteNumber.min(0).max(1).optional(),
  anchorY: finiteNumber.min(0).max(1).optional(),
  blur: finiteNumber.min(0).max(100).optional(),
  shadowOpacity: finiteNumber.min(0).max(100).optional(),
  shadowBlur: finiteNumber.min(0).optional(),
  shadowOffsetX: finiteNumber.optional(),
  shadowOffsetY: finiteNumber.optional(),
  motions: z.array(mcpMotionBlockSchema).max(30).optional(),
  keyframes: z.array(mcpLayerKeyframeSchema).max(100).optional(),
  motionPath: mcpMotionPathSchema.optional(),
};

export const mcpTextLayerInputSchema = z
  .object({
    id: z.string().min(1).optional(),
    text: z.string().min(1),
    fontFamily: z.string().min(1).optional(),
    fontSize: finiteNumber.min(6).max(400).optional(),
    fontWeight: z.enum(['300', '400', '500', '600', '700', '800', '900']).optional(),
    fontStyle: z.enum(['normal', 'italic']).optional(),
    color: color.optional(),
    gradient: z
      .object({ color1: color, color2: color, angle: finiteNumber.min(0).max(360) })
      .nullable()
      .optional(),
    textAlign: z.enum(['left', 'center', 'right']).optional(),
    scaleX: finiteNumber.min(0.1).max(10).optional(),
    scaleY: finiteNumber.min(0.1).max(10).optional(),
    letterSpacing: finiteNumber.optional(),
    shadow: z.boolean().optional(),
    position: z.enum(['above', 'underneath']).optional(),
    visible: z.boolean().optional(),
    locked: z.boolean().optional(),
    ...animatedLayerFields,
  })
  .strict();

export const mcpShapeLayerInputSchema = z
  .object({
    id: z.string().min(1).optional(),
    shapeType: z.enum([
      'square',
      'rectangle',
      'circle',
      'triangle',
      'hexagon',
      'quote',
      'coolshape',
      'custom-path',
    ]),
    pathData: z.string().optional(),
    unitPathData: z.string().optional(),
    viewBox: z.string().optional(),
    coolshapeType: z
      .enum([
        'star',
        'flower',
        'ellipse',
        'wheel',
        'moon',
        'misc',
        'triangle',
        'polygon',
        'rectangle',
        'number',
      ])
      .optional(),
    coolshapeIndex: finiteNumber.int().min(0).optional(),
    color: color.optional(),
    gradient: z
      .object({ color1: color, color2: color, angle: finiteNumber.min(0).max(360) })
      .nullable()
      .optional(),
    width: finiteNumber.positive().optional(),
    height: finiteNumber.positive().optional(),
    borderRadius: finiteNumber.min(0).optional(),
    borderEnabled: z.boolean().optional(),
    borderColor: color.optional(),
    borderWidth: finiteNumber.min(0).optional(),
    shadow: z.boolean().optional(),
    glassmorphism: z.boolean().optional(),
    glassmorphismBlur: finiteNumber.min(0).optional(),
    position: z.enum(['above', 'underneath']).optional(),
    visible: z.boolean().optional(),
    locked: z.boolean().optional(),
    maskTarget: mcpMaskTargetSchema.optional(),
    ...animatedLayerFields,
  })
  .strict();

const storedTextLayerSchema = mcpTextLayerInputSchema
  .extend({ id: z.string().min(1) })
  .passthrough();
const storedShapeLayerSchema = mcpShapeLayerInputSchema
  .extend({ id: z.string().min(1) })
  .passthrough();

const storedCanvasElementSchema = z
  .object({
    id: z.string().min(1),
    category: z.enum(['arrow', 'line', 'emoji']),
    elementId: z.string().min(1),
    src: z.string().min(1),
    color,
    width: finiteNumber.positive(),
    height: finiteNumber.positive(),
    position: z.enum(['above', 'underneath']),
    visible: z.boolean().optional(),
    locked: z.boolean().optional(),
    ...animatedLayerFields,
  })
  .passthrough();

const storedPhosphorLayerSchema = z
  .object({
    id: z.string().min(1),
    iconId: z.string().min(1),
    size: finiteNumber.positive(),
    color,
    position: z.enum(['above', 'underneath']),
    visible: z.boolean().optional(),
    locked: z.boolean().optional(),
    ...animatedLayerFields,
  })
  .passthrough();

const layerGroupSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    members: z.array(z.object({ type: layerTypeSchema, id: z.string().min(1) })).min(1),
    position: z.enum(['above', 'underneath']),
    originX: finiteNumber,
    originY: finiteNumber,
    x: finiteNumber,
    y: finiteNumber,
    width: finiteNumber.positive(),
    height: finiteNumber.positive(),
    scale: finiteNumber.min(0.01).max(10),
    rotation: finiteNumber,
    opacity: finiteNumber.min(0).max(100),
    anchorX: finiteNumber.min(0).max(1).optional(),
    anchorY: finiteNumber.min(0).max(1).optional(),
    blur: finiteNumber.min(0).max(100).optional(),
    visible: z.boolean().optional(),
    locked: z.boolean().optional(),
    motions: z.array(mcpMotionBlockSchema).max(30).optional(),
    keyframes: z.array(mcpLayerKeyframeSchema).max(100).optional(),
    motionPath: mcpMotionPathSchema.optional(),
  })
  .passthrough();

export const studioPatchSchema = z
  .object({
    aspectRatio: z.enum(MCP_ASPECT_RATIOS).optional(),
    customWidth: finiteNumber.int().min(160).max(7680).optional(),
    customHeight: finiteNumber.int().min(160).max(7680).optional(),
    backgroundType: z.enum(MCP_BACKGROUND_TYPES).optional(),
    backgroundColor: color.optional(),
    gradient: z
      .object({ color1: color, color2: color, angle: finiteNumber.min(0).max(360) })
      .optional(),
    frameType: z.enum(MCP_FRAME_TYPES).optional(),
    layoutCount: z.union([z.literal(1), z.literal(2)]).optional(),
    codeSource: z.string().max(30_000).optional(),
    codeLanguage: z.enum(MCP_CODE_LANGUAGES).optional(),
    codeTheme: z.enum(['dark', 'light']).optional(),
    codeWindowStyle: z.enum(['macos', 'windows']).optional(),
    codeFilename: z.string().max(80).optional(),
    codeWindowWidth: finiteNumber.int().min(360).max(1400).optional(),
    codeWindowHeight: finiteNumber.int().min(100).max(1000).optional(),
    codeFontSize: finiteNumber.min(8).max(32).optional(),
    codeLineNumbers: z.boolean().optional(),
    codeWordWrap: z.boolean().optional(),
    isAnimationMode: z.boolean().optional(),
    durationSec: finiteNumber.min(1).max(60).optional(),
    animationEasing: animationEasingTypeSchema.optional(),
    motionBlurEnabled: z.boolean().optional(),
    motionBlurStrength: finiteNumber.min(0).max(100).optional(),
    mockupAnchorX: finiteNumber.min(0).max(1).optional(),
    mockupAnchorY: finiteNumber.min(0).max(1).optional(),
    slot2MockupAnchorX: finiteNumber.min(0).max(1).optional(),
    slot2MockupAnchorY: finiteNumber.min(0).max(1).optional(),
    mockupMotionPath: mcpMotionPathSchema.optional(),
    slot2MockupMotionPath: mcpMotionPathSchema.optional(),
    keyframes: z.array(mcpMockupKeyframeSchema).max(100).optional(),
    textLayers: z.array(storedTextLayerSchema).max(100).optional(),
    shapeLayers: z.array(storedShapeLayerSchema).max(100).optional(),
    canvasElements: z.array(storedCanvasElementSchema).max(100).optional(),
    phosphorIconLayers: z.array(storedPhosphorLayerSchema).max(100).optional(),
    layerGroups: z.array(layerGroupSchema).max(50).optional(),
    layerOrder: z
      .array(z.object({ type: layerTypeSchema, id: z.string().min(1) }))
      .max(400)
      .optional(),
    transitionOut: mcpStageTransitionSchema.optional(),
    stages: z.array(z.record(z.string(), z.unknown())).max(5).optional(),
    activeStageIndex: finiteNumber.int().min(0).max(4).optional(),
  })
  .catchall(z.unknown())
  .describe(
    'Partial Shotage StudioState. Objects merge deeply and arrays replace existing arrays. Validate advanced payloads before saving.'
  );

function issuePath(prefix: string, path: PropertyKey[]) {
  const suffix = path
    .map((part) => (typeof part === 'number' ? `[${part}]` : String(part)))
    .join('.')
    .replace(/\.\[/g, '[');
  return suffix ? `${prefix}${prefix ? '.' : ''}${suffix}` : prefix || 'studioState';
}

function collectIds(items: unknown, type: string, prefix: string, errors: string[]) {
  const ids = new Set<string>();
  if (!Array.isArray(items)) return ids;
  items.forEach((item, index) => {
    const id = typeof item === 'object' && item ? String((item as JsonObject).id || '') : '';
    if (!id) return;
    if (ids.has(id)) errors.push(`${prefix}.${type}[${index}].id duplicates "${id}".`);
    ids.add(id);
  });
  return ids;
}

function validateTimedLayer(
  layer: JsonObject,
  durationSec: number,
  path: string,
  isText: boolean,
  errors: string[],
  warnings: string[]
) {
  const keyframes = Array.isArray(layer.keyframes) ? (layer.keyframes as JsonObject[]) : [];
  const motions = Array.isArray(layer.motions) ? (layer.motions as JsonObject[]) : [];
  const keyframeIds = new Set<string>();
  const motionIds = new Set<string>();

  keyframes.forEach((keyframe, index) => {
    const id = String(keyframe.id || '');
    if (keyframeIds.has(id)) errors.push(`${path}.keyframes[${index}].id duplicates "${id}".`);
    keyframeIds.add(id);
    if (Number(keyframe.timeSec) > durationSec)
      errors.push(`${path}.keyframes[${index}].timeSec exceeds durationSec (${durationSec}).`);
  });
  motions.forEach((motion, index) => {
    const id = String(motion.id || '');
    if (motionIds.has(id)) errors.push(`${path}.motions[${index}].id duplicates "${id}".`);
    motionIds.add(id);
    const end = Number(motion.startTimeSec) + Number(motion.durationSec);
    if (end > durationSec + 0.0001)
      errors.push(`${path}.motions[${index}] ends at ${end}s, after durationSec (${durationSec}).`);
    if (!isText && TEXT_ONLY_MOTIONS.has(String(motion.preset)))
      errors.push(`${path}.motions[${index}].preset is text-only.`);
    if (
      isText &&
      !String(motion.preset).startsWith('text-') &&
      (motion.textUnit !== undefined ||
        motion.textOrder !== undefined ||
        motion.staggerSec !== undefined)
    )
      warnings.push(
        `${path}.motions[${index}] has text staggering options that this preset ignores.`
      );
  });

  if (layer.motionPath && keyframes.length < 2)
    errors.push(`${path}.motionPath requires at least two layer keyframes.`);
  if (
    layer.motionPath &&
    keyframes.length >= 2 &&
    keyframes.filter((keyframe) => keyframe.x !== undefined || keyframe.y !== undefined).length < 2
  )
    warnings.push(
      `${path}.motionPath has fewer than two explicit position keyframes; base position will be reused.`
    );
}

function validateCollections(
  value: JsonObject,
  inheritedDuration: number,
  prefix: string,
  errors: string[],
  warnings: string[]
) {
  const durationSec = Number(value.durationSec ?? inheritedDuration);
  const mockupKeyframes = Array.isArray(value.keyframes) ? (value.keyframes as JsonObject[]) : [];
  const mockupKeyframeIds = new Set<string>();
  mockupKeyframes.forEach((keyframe, index) => {
    const id = String(keyframe.id || '');
    if (mockupKeyframeIds.has(id))
      errors.push(`${prefix}.keyframes[${index}].id duplicates "${id}".`);
    mockupKeyframeIds.add(id);
    if (Number(keyframe.timeSec) > durationSec)
      errors.push(`${prefix}.keyframes[${index}].timeSec exceeds durationSec (${durationSec}).`);
  });
  if (value.mockupMotionPath && mockupKeyframes.length < 2)
    errors.push(`${prefix}.mockupMotionPath requires at least two mockup keyframes.`);
  if (value.slot2MockupMotionPath && mockupKeyframes.length < 2)
    errors.push(`${prefix}.slot2MockupMotionPath requires at least two mockup keyframes.`);

  const textIds = collectIds(value.textLayers, 'textLayers', prefix, errors);
  const phosphorIds = collectIds(value.phosphorIconLayers, 'phosphorIconLayers', prefix, errors);
  const elementIds = collectIds(value.canvasElements, 'canvasElements', prefix, errors);
  const shapeIds = collectIds(value.shapeLayers, 'shapeLayers', prefix, errors);
  const groupIds = collectIds(value.layerGroups, 'layerGroups', prefix, errors);
  const idsByType: Record<string, Set<string>> = {
    text: textIds,
    phosphor: phosphorIds,
    element: elementIds,
    shape: shapeIds,
    group: groupIds,
  };

  const validateLayers = (items: unknown, type: string, isText = false) => {
    if (!Array.isArray(items)) return;
    items.forEach((item, index) =>
      validateTimedLayer(
        item as JsonObject,
        durationSec,
        `${prefix}.${type}[${index}]`,
        isText,
        errors,
        warnings
      )
    );
  };
  validateLayers(value.textLayers, 'textLayers', true);
  validateLayers(value.phosphorIconLayers, 'phosphorIconLayers');
  validateLayers(value.canvasElements, 'canvasElements');
  validateLayers(value.shapeLayers, 'shapeLayers');
  validateLayers(value.layerGroups, 'layerGroups');

  if (Array.isArray(value.shapeLayers)) {
    const usedTargets = new Set<string>();
    (value.shapeLayers as JsonObject[]).forEach((shape, index) => {
      if (!shape.maskTarget || typeof shape.maskTarget !== 'object') return;
      const target = shape.maskTarget as JsonObject;
      const targetType = String(target.type);
      const targetId = String(target.id);
      const targetKey = `${targetType}:${targetId}`;
      if (!idsByType[targetType]?.has(targetId))
        errors.push(
          `${prefix}.shapeLayers[${index}].maskTarget references a missing ${targetKey}.`
        );
      if (targetType === 'shape' && targetId === shape.id)
        errors.push(`${prefix}.shapeLayers[${index}] cannot mask itself.`);
      if (usedTargets.has(targetKey))
        errors.push(
          `${prefix}.shapeLayers[${index}].maskTarget duplicates ${targetKey}; use one mask per target.`
        );
      usedTargets.add(targetKey);
    });
  }

  const groupedMembers = new Set<string>();
  if (Array.isArray(value.layerGroups)) {
    (value.layerGroups as JsonObject[]).forEach((group, groupIndex) => {
      const members = Array.isArray(group.members) ? (group.members as JsonObject[]) : [];
      members.forEach((member, memberIndex) => {
        const type = String(member.type);
        const id = String(member.id);
        const key = `${type}:${id}`;
        if (!idsByType[type]?.has(id))
          errors.push(
            `${prefix}.layerGroups[${groupIndex}].members[${memberIndex}] references missing ${key}.`
          );
        if (groupedMembers.has(key))
          errors.push(
            `${prefix}.layerGroups[${groupIndex}].members[${memberIndex}] repeats grouped layer ${key}.`
          );
        groupedMembers.add(key);
      });
    });
  }

  if (Array.isArray(value.layerOrder)) {
    (value.layerOrder as JsonObject[]).forEach((reference, index) => {
      const type = String(reference.type);
      const id = String(reference.id);
      if (!idsByType[type]?.has(id))
        errors.push(`${prefix}.layerOrder[${index}] references missing ${type}:${id}.`);
    });
  }
}

export interface McpDesignValidationResult {
  warnings: string[];
}

export function validateMcpStudioState(value: JsonObject): McpDesignValidationResult {
  const parsed = studioPatchSchema.safeParse(value);
  const errors = parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issuePath('studioState', issue.path)}: ${issue.message}`
      );
  const warnings: string[] = [];
  const durationSec = Number(value.durationSec ?? 10);

  if (parsed.success) {
    if (value.frameType === 'code-window' && value.layoutCount === 2)
      errors.push('studioState.layoutCount must be 1 when frameType is code-window.');
    validateCollections(value, durationSec, 'studioState', errors, warnings);
    if (Array.isArray(value.stages)) {
      (value.stages as JsonObject[]).forEach((stage, index) => {
        const stageResult = studioPatchSchema.safeParse(stage);
        if (!stageResult.success) {
          errors.push(
            ...stageResult.error.issues.map(
              (issue) =>
                `${issuePath(`studioState.stages[${index}]`, issue.path)}: ${issue.message}`
            )
          );
          return;
        }
        if (stage.frameType === 'code-window' && stage.layoutCount === 2)
          errors.push(
            `studioState.stages[${index}].layoutCount must be 1 when frameType is code-window.`
          );
        validateCollections(
          stage,
          Number(stage.durationSec ?? durationSec),
          `studioState.stages[${index}]`,
          errors,
          warnings
        );
      });
      const activeStageIndex = Number(value.activeStageIndex ?? 0);
      if (value.stages.length > 0 && activeStageIndex >= value.stages.length)
        errors.push('studioState.activeStageIndex must reference an existing stage.');
    }
  }

  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized) > 1_000_000)
    errors.push('Design JSON exceeds the 1 MB MCP limit.');
  if (errors.length) throw new Error(`Invalid Shotage design:\n- ${errors.join('\n- ')}`);
  return { warnings };
}

export function summarizeMcpStudioState(value: JsonObject, warnings: string[]) {
  return {
    valid: true,
    durationSec: Number(value.durationSec ?? 10),
    stages: Array.isArray(value.stages) ? value.stages.length : 0,
    layers: {
      text: Array.isArray(value.textLayers) ? value.textLayers.length : 0,
      phosphor: Array.isArray(value.phosphorIconLayers) ? value.phosphorIconLayers.length : 0,
      elements: Array.isArray(value.canvasElements) ? value.canvasElements.length : 0,
      shapes: Array.isArray(value.shapeLayers) ? value.shapeLayers.length : 0,
      groups: Array.isArray(value.layerGroups) ? value.layerGroups.length : 0,
    },
    warnings,
  };
}

export const MCP_MOTION_REFERENCE = {
  workflow: [
    'Call get_design_reference before authoring an advanced design.',
    'Use stable, unique IDs for every layer, group, keyframe, and motion block.',
    'Call validate_design with the complete proposed StudioState before create_design or update_design.',
    'For updates, call get_design first; arrays replace the stored arrays rather than merging by ID.',
  ],
  timing: {
    durationSec: '1-60 seconds per stage/design',
    layerKeyframes:
      'timeSec must be within durationSec; easing controls the segment starting at that keyframe.',
    motionBlocks: 'startTimeSec + durationSec must not exceed durationSec.',
    restraint: 'Prefer 2-4 purposeful keyframes or motion blocks per focal layer.',
  },
  easing: {
    presets: ['ease-in-out', 'linear', 'ease-out', 'ease-in', 'spring'],
    custom: { type: 'cubic-bezier', x1: '0-1', y1: '-0.6-1.6', x2: '0-1', y2: '-0.6-1.6' },
  },
  animatableLayerProperties: [
    'x',
    'y',
    'width',
    'height',
    'scale',
    'scaleX',
    'scaleY',
    'rotation',
    'pitch',
    'yaw',
    'opacity',
    'borderRadius',
    'fontSize',
    'blur',
    'skewX',
    'skewY',
    'color',
    'borderWidth',
    'borderColor',
    'letterSpacing',
    'shadowOpacity',
    'shadowBlur',
    'shadowOffsetX',
    'shadowOffsetY',
  ],
  motionPaths: {
    types: ['linear', 'arc-up', 'arc-down', 's-curve'],
    curvature: '0-1',
    autoOrient: 'Rotates the layer along the path tangent.',
    requirement:
      'At least two layer keyframes; include x/y on at least two for intentional movement.',
    mockupRequirement:
      'mockupMotionPath and slot2MockupMotionPath use the top-level mockup keyframes and require at least two.',
  },
  anchorPoints:
    'anchorX and anchorY use normalized 0-1 coordinates on mockups, layers, and groups.',
  sourceCodeFrames: {
    frameType: 'code-window',
    rule: 'Use layoutCount=1. Code frames inherit mockup transforms, keyframes, anchors, paths, and motion blur.',
    fields: {
      codeSource: 'Plain source text, maximum 30,000 characters.',
      codeLanguage: MCP_CODE_LANGUAGES,
      codeTheme: ['dark', 'light'],
      codeWindowStyle: ['macos', 'windows'],
      codeWindowWidth: '360-1400',
      codeWindowHeight: '100-1000',
      codeFontSize: '8-32',
      codeLineNumbers: 'boolean',
      codeWordWrap: 'boolean',
    },
  },
  motionBlur: 'Set motionBlurEnabled=true and motionBlurStrength=0-100 at Studio/stage level.',
  textAnimation: {
    presets: ['text-rise', 'text-pop', 'text-blur', 'text-wave'],
    textUnit: ['character', 'word'],
    textOrder: ['forward', 'reverse', 'center', 'random'],
    staggerSec: '0-0.2 seconds between units; 0.03-0.08 is usually readable.',
  },
  masks: {
    owner: 'A shape layer acts as the mask and is hidden as ordinary artwork.',
    target: { type: ['text', 'phosphor', 'element', 'shape', 'group'], id: 'existing target ID' },
    rules: [
      'The target must exist in the same stage.',
      'A target can have only one mask.',
      'A shape cannot mask itself.',
    ],
  },
  groups: {
    members: 'References to existing text, phosphor, element, or shape layers.',
    behavior:
      'Animate the group with keyframes, motions, motionPath, anchorX/Y, scale, rotation, opacity, and blur.',
    rule: 'A layer may belong to only one group.',
  },
  stageTransitions: {
    location: 'transitionOut on the outgoing stage snapshot',
    types: ['none', 'crossfade', 'slide-left', 'slide-right', 'zoom-fade'],
    durationSec: '0.1-1.5 seconds (UI recommends 0.2-1.5)',
    easing: ['ease-in-out', 'linear', 'ease-out', 'ease-in', 'spring'],
  },
} as const;
