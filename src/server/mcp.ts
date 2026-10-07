import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';
import { GRADIENT_PRESETS } from '../utils/gradientPresets.js';
import { FLOW_PRESETS } from '../utils/flowPresets.js';
import type { McpPrincipal, McpScope } from './mcpAuth.js';
import { hasMcpScope } from './mcpAuth.js';
import {
  buildStudioState,
  createOwnedDesign,
  createShapeLayer,
  createTextLayer,
  getOwnedDesign,
  listOwnedDesigns,
  submitOwnedDesign,
  updateOwnedDesign,
} from './mcpDesigns.js';
import {
  MCP_ASPECT_RATIOS,
  MCP_BACKGROUND_TYPES,
  MCP_MOTION_PRESETS,
  MCP_MOTION_REFERENCE,
  MCP_FONT_REFERENCE,
  MCP_PATTERN_REFERENCE,
  MCP_SOCIAL_PLATFORMS,
  MCP_TECH_STACK_IDS,
  mcpShapeLayerInputSchema,
  mcpTextLayerInputSchema,
  studioPatchSchema,
  summarizeMcpStudioState,
  validateMcpStudioState,
} from './mcpDesignSchema.js';

function ok(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: value as Record<string, unknown>,
  };
}

function failed(error: unknown) {
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: error instanceof Error ? error.message : 'The Shotage operation failed.',
      },
    ],
  };
}

function requireScope(principal: McpPrincipal, scope: McpScope) {
  if (!hasMcpScope(principal.scopes, scope))
    throw new Error(`This connection needs the ${scope} scope.`);
}

function createServer(principal: McpPrincipal, requestUrl: string) {
  const server = new McpServer(
    { name: 'Shotage', version: '1.2.0' },
    {
      instructions:
        'Shotage MCP creates and edits saved designs; it does not control an open canvas. First call get_design_reference for supported motion, fonts, patterns, social layers, tech stacks, and guides. Use stable unique IDs for layers/keyframes/motions/guides, call validate_design, then create_design. Before update_design, call get_design and preserve complete arrays because array patches replace stored arrays. Guides are editor-only, not exported artwork. New designs are private until submit_design_to_explore is called.',
    }
  );

  server.registerTool(
    'get_design_reference',
    {
      title: 'Get Shotage design reference',
      description:
        'Returns the current Shotage design and motion authoring contract, including fonts, patterns, social layers, tech stacks, guides, keyframes, image-fill pan/zoom, easing, paths, anchors, text staggering, masks, groups, motion blur, and stage transitions. Call this before creation or editing.',
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      try {
        requireScope(principal, 'gradients:read');
        return ok({
          supportedFields: {
            aspectRatio: MCP_ASPECT_RATIOS,
            backgroundType: MCP_BACKGROUND_TYPES,
            backgroundColor: '#RRGGBB',
            gradient: { color1: '#RRGGBB', color2: '#RRGGBB', angle: '0-360' },
            customGradient: {
              backgroundType: 'customGradient',
              angle: '0-360 degrees (90 runs left to right)',
              stops: [
                { color: '#ffafcc', position: 0 },
                { color: '#cdb4db', position: 50 },
                { color: '#a2d2ff', position: 100 },
              ],
              rule: 'Independent of curated gradient. Supply 2 or 3 complete stops ordered by position (0-100%). Two stops default to left/right, three to left/center/right; adjust positions to control blend widths. Equal positions create a hard edge. Set customGradient on the root and each relevant stage snapshot.',
            },
            photoPrint: {
              frameType: 'photo-print',
              settingsField: 'photoPrint',
              example: { variant: 'captioned', paperColor: '#fffefa', borderWidth: 12, caption: 'Made with Shotage', date: '' },
              variants: ['clean', 'captioned', 'gallery'],
              borderWidth: '0-80px; suggested 12 for clean/captioned, 28 for gallery',
              rule: 'Use existing mockup image/video fields and transforms. Clean hides caption/date; captioned and gallery show optional caption (max 500 characters) and date/label (max 100). Preserve complete photoPrint settings in stage snapshots.',
            },
            mockupFit: {
              rule: 'Fit to canvas is an editor-only action for frameType=frameless and layoutCount=1. There is no fit flag. To author the same result use centered offsetX/offsetY=0, alignment=center, anchor 0.5/0.5, zero rotateX/rotateY/skewX/skewY/slot1Rotate and an appropriate zoom. Contain the entire mockup without cropping; one pair of edges touches the canvas, with empty space on the other axis if aspect ratios differ.',
            },
            animation: {
              isAnimationMode: 'boolean',
              durationSec: '1-60',
              motionBlurEnabled: 'boolean',
              motionBlurStrength: '0-100',
              motionPresets: MCP_MOTION_PRESETS,
            },
            textLayers:
              'Use the textLayers shortcut for creation, or complete text layer objects in studioState.',
            shapeLayers:
              'Use the shapeLayers shortcut for creation. A custom-path with pathClosed=false renders as an open line using color and strokeWidth (round caps and joins); open lines cannot be masks or used in Boolean shape operations. square-3d and rectangle-3d render as extruded boxes; depth controls extrusion (default 10px) and borderRadius controls corner softness (default 20px). New shapes default to zero rotation, pitch, yaw and skew. Basic and closed custom-path shapes can become masks with maskTarget; Coolshapes and 3D shapes cannot.',
            canvasElements:
              'Complete objects for emoji, line, and arrow layers; preserve src from get_design.',
            phosphorIconLayers: 'Complete independent Phosphor icon layer objects.',
            layerGroups: 'Groups reference existing layer IDs and can carry their own animation.',
            stages: 'Up to 5 stage snapshots. Put transitionOut on each outgoing stage.',
            socialMedia: {
              location:
                'textLayers; use socialPlatform for a social handle layer, not canvasElements.',
              platforms: MCP_SOCIAL_PLATFORMS,
              fields: [
                'socialPlatform',
                'socialStyle',
                'iconColor',
                'iconSize',
                'fontSize',
                'x',
                'y',
              ],
              styles: ['default', 'badge-light', 'badge-dark', 'glass-dark', 'glass-light'],
              iconSize: '10-60px',
            },
            techStackConfig: {
              selectedIcons: MCP_TECH_STACK_IDS,
              enabled: 'boolean',
              size: '16-64px',
              gap: '4-36px',
              style: ['row', 'column'],
              position: [
                'top-left',
                'top-center',
                'top-right',
                'center-left',
                'center',
                'center-right',
                'bottom-left',
                'bottom-center',
                'bottom-right',
              ],
              badgeStyle: [
                'plain',
                'glass-dark',
                'glass-light',
                'glass-frosted',
                'glass-smoky',
                'glass-crystal',
                'badge-dark',
                'badge-light',
              ],
              xOffset: '-200 to 200px',
              yOffset: '-200 to 200px',
            },
            fonts: {
              choices: MCP_FONT_REFERENCE,
              fontSize: '6-500px; Studio size control starts at 12px',
              fontFamily: 'Use the font name, e.g. Croissant One.',
            },
            patterns: {
              choices: MCP_PATTERN_REFERENCE,
              fields: ['bgPatternEnabled', 'bgPatternPreset', 'bgPatternColor', 'bgPatternOpacity'],
              opacity: '0-100',
            },
            guides: {
              rulersVisible: 'boolean',
              canvasGuides: [
                {
                  id: 'unique ID',
                  axis: 'horizontal | vertical',
                  position: '0-1 fraction of artboard height/width from top/left',
                },
              ],
              rule: 'Editor-only alignment aids; not rendered in image/video exports. Arrays replace existing guides.',
            },
          },
          motion: MCP_MOTION_REFERENCE,
          gradientPresets: GRADIENT_PRESETS.map(({ name, c1, c2 }) => ({
            name,
            color1: c1,
            color2: c2,
          })),
          flowPresets: FLOW_PRESETS,
        });
      } catch (error) {
        return failed(error);
      }
    }
  );

  server.registerTool(
    'validate_design',
    {
      title: 'Validate a Shotage design',
      description:
        'Validates and normalizes a proposed StudioState without saving it. Returns precise paths for invalid motion timing, easing, paths, masks, groups, references, transitions, or layer fields. Use the complete proposed state for reliable reference validation.',
      inputSchema: { studioState: studioPatchSchema },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ studioState }) => {
      try {
        requireScope(principal, 'designs:write');
        const normalized = buildStudioState(studioState as Record<string, unknown>);
        const { warnings } = validateMcpStudioState(
          normalized as unknown as Record<string, unknown>
        );
        return ok(
          summarizeMcpStudioState(normalized as unknown as Record<string, unknown>, warnings)
        );
      } catch (error) {
        return failed(error);
      }
    }
  );

  server.registerTool(
    'list_my_designs',
    {
      title: 'List my Shotage designs',
      description: 'Lists saved designs owned by the connected Shotage account.',
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async () => {
      try {
        requireScope(principal, 'designs:read');
        return ok({ designs: await listOwnedDesigns(principal.user.id) });
      } catch (error) {
        return failed(error);
      }
    }
  );

  server.registerTool(
    'get_design',
    {
      title: 'Get a Shotage design',
      description:
        'Gets the editable StudioState for one saved design owned by the connected account.',
      inputSchema: {
        designId: z
          .string()
          .min(1)
          .describe('Morphic entry ID or Shotage design identifier from list_my_designs.'),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ designId }) => {
      try {
        requireScope(principal, 'designs:read');
        return ok(await getOwnedDesign(principal.user.id, designId, requestUrl));
      } catch (error) {
        return failed(error);
      }
    }
  );

  server.registerTool(
    'create_design',
    {
      title: 'Create a saved Shotage design',
      description:
        'Creates a private saved design and returns a Studio link. For motion designs, call get_design_reference and validate_design first. Quick text/shape layers support keyframes, motion presets, paths, anchors, custom easing, text staggering, and masks. This does not control an open browser canvas.',
      inputSchema: {
        name: z.string().min(1).max(120),
        aspectRatio: z
          .enum(['16:9', '1:1', 'app-icon', '9:16', '4:3', '3:2', '3:4', '4:5', 'custom'])
          .optional(),
        backgroundType: z.enum(MCP_BACKGROUND_TYPES).optional(),
        customGradient: studioPatchSchema.shape.customGradient,
        backgroundColor: z.string().optional(),
        gradient: z
          .object({
            color1: z.string(),
            color2: z.string(),
            angle: z.number().min(0).max(360).optional(),
          })
          .optional(),
        flowPreset: z.string().optional(),
        textLayers: z.array(mcpTextLayerInputSchema).max(30).optional(),
        shapeLayers: z.array(mcpShapeLayerInputSchema).max(30).optional(),
        durationSec: z.number().min(1).max(60).optional(),
        isAnimationMode: z.boolean().optional(),
        studioState: studioPatchSchema.optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ name, textLayers, shapeLayers, studioState, ...quick }) => {
      try {
        requireScope(principal, 'designs:write');
        const texts = textLayers?.map((layer, index) => createTextLayer(layer, index));
        const shapes = shapeLayers?.map((layer, index) => createShapeLayer(layer, index));
        const partial = { ...quick, ...studioState } as Record<string, unknown>;
        if (texts) partial.textLayers = texts;
        if (shapes) partial.shapeLayers = shapes;
        if (texts || shapes)
          partial.layerOrder = [
            ...(texts || []).map((layer) => ({ type: 'text', id: layer.id })),
            ...(shapes || []).map((layer) => ({ type: 'shape', id: layer.id })),
          ];
        return ok(await createOwnedDesign(principal.user, name, partial, requestUrl));
      } catch (error) {
        return failed(error);
      }
    }
  );

  server.registerTool(
    'update_design',
    {
      title: 'Update a saved Shotage design',
      description:
        'Applies a deep object patch to an owned design and returns its Studio link. Call get_design first and validate the proposed result. Arrays are replaced in full, including stages, layers, keyframes, motions, group members, and layerOrder.',
      inputSchema: {
        designId: z.string().min(1),
        name: z.string().min(1).max(120).optional(),
        patch: studioPatchSchema,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ designId, name, patch }) => {
      try {
        requireScope(principal, 'designs:write');
        return ok(await updateOwnedDesign(principal.user.id, designId, name, patch, requestUrl));
      } catch (error) {
        return failed(error);
      }
    }
  );

  server.registerTool(
    'submit_design_to_explore',
    {
      title: 'Submit a design to Explore',
      description:
        'Makes an owned design public and submits it to Morphic CMS for creator review before it can appear in Explore.',
      inputSchema: { designId: z.string().min(1) },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ designId }) => {
      try {
        requireScope(principal, 'explore:submit');
        return ok(await submitOwnedDesign(principal.user.id, designId, requestUrl));
      } catch (error) {
        return failed(error);
      }
    }
  );
  return server;
}

export async function handleMcpRequest(request: Request, principal: McpPrincipal) {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createServer(principal, request.url);
  await server.connect(transport);
  return transport.handleRequest(request, {
    authInfo: {
      token: request.headers.get('authorization')?.slice(7) || '',
      clientId: principal.clientId,
      scopes: principal.scopes,
    },
  });
}
