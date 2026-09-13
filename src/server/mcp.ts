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
    { name: 'Shotage', version: '1.1.0' },
    {
      instructions:
        'Shotage MCP creates and edits saved designs; it does not control an open canvas. For advanced animation, first call get_design_reference, use stable unique IDs for layers/keyframes/motions, call validate_design, then create_design. Before update_design, call get_design and preserve complete arrays because array patches replace stored arrays. New designs are private until submit_design_to_explore is called.',
    }
  );

  server.registerTool(
    'get_design_reference',
    {
      title: 'Get Shotage design reference',
      description:
        'Returns the current Shotage design and motion authoring contract, including keyframes, easing, paths, anchors, text staggering, masks, groups, motion blur, and stage transitions. Call this before advanced creation or editing.',
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
              'Use the shapeLayers shortcut for creation. A shape can become a mask with maskTarget.',
            canvasElements:
              'Complete objects for emoji, line, and arrow layers; preserve src from get_design.',
            phosphorIconLayers: 'Complete independent Phosphor icon layer objects.',
            layerGroups: 'Groups reference existing layer IDs and can carry their own animation.',
            stages: 'Up to 5 stage snapshots. Put transitionOut on each outgoing stage.',
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
          .enum(['16:9', '1:1', '9:16', '4:3', '3:2', '3:4', '4:5', 'custom'])
          .optional(),
        backgroundType: z.enum(['solid', 'gradient', 'flow', 'transparent']).optional(),
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
