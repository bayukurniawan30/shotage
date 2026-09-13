import type { AuthUser } from './auth.js';
import {
  DEFAULT_STUDIO_STATE,
  type StudioState,
  type TextLayer,
  type ShapeLayer,
} from '../types/studio.js';
import { compressGzipString, decompressGzipString } from '../utils/gzipCompression.js';
import { validateMcpStudioState } from './mcpDesignSchema.js';

type JsonObject = Record<string, unknown>;

export const MCP_DESIGN_PLACEHOLDER = '/mcp-design-placeholder.svg';

function cmsConfig() {
  const apiKey = process.env.MORPHIC_API_KEY?.trim();
  if (!apiKey) throw new Error('MORPHIC_API_KEY is required for design storage');
  return {
    base: (process.env.MORPHIC_API_URL || 'https://main-workspace.morphic-cms.com').replace(
      /\/$/,
      ''
    ),
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  };
}

function unwrap(item: any) {
  const entry = item?.entry || item?.data || item;
  return { entry, content: entry?.content || entry };
}

function isDeleted(entry: any) {
  return Boolean(entry?.deletedAt || entry?.deleted_at);
}

async function listEntries() {
  const { base, headers } = cmsConfig();
  const response = await fetch(
    `${base}/api/collections/shotage-shareables/entries?page=1&limit=1000`,
    { headers }
  );
  if (!response.ok) throw new Error(`Morphic returned HTTP ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload?.entries) ? payload.entries : Array.isArray(payload) ? payload : [];
}

export async function listOwnedDesigns(userId: string) {
  const entries = await listEntries();
  return entries.flatMap((item: any) => {
    const { entry, content } = unwrap(item);
    if (isDeleted(entry) || content?.user_id !== userId || !content?.identifier) return [];
    return [
      {
        id: String(entry.id),
        identifier: String(content.identifier),
        name: content.name || 'Untitled design',
        visibility: content.visibility === 'public' ? 'public' : 'private',
        reviewStatus:
          content.is_in_explore === 'yes'
            ? 'published'
            : content.is_in_review === 'yes'
              ? 'pending'
              : 'not_submitted',
        updatedAt: entry.updatedAt || entry.updated_at || null,
      },
    ];
  });
}

async function findOwnedEntry(userId: string, designId: string) {
  const entries = await listEntries();
  const item = entries.find((candidate: any) => {
    const { entry, content } = unwrap(candidate);
    return (
      !isDeleted(entry) &&
      content?.user_id === userId &&
      (String(entry?.id) === designId || content?.identifier === designId)
    );
  });
  if (!item) throw new Error('Design not found or it is not owned by this account.');
  return unwrap(item);
}

function plainObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function mergeSafe(base: JsonObject, patch: JsonObject): JsonObject {
  const result: JsonObject = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) continue;
    result[key] =
      plainObject(value) && plainObject(result[key])
        ? mergeSafe(result[key] as JsonObject, value)
        : value;
  }
  return result;
}

function validateState(value: JsonObject) {
  validateMcpStudioState(value);
  return JSON.stringify(value);
}

export function buildStudioState(partial: JsonObject, existing?: JsonObject): StudioState {
  const merged = mergeSafe((existing || DEFAULT_STUDIO_STATE) as unknown as JsonObject, partial);
  merged.isPlaying = false;
  merged.isExporting = false;
  merged.currentTimeSec = 0;
  merged.shareId = null;
  merged.shareIdentifier = null;
  merged.selectedTextLayerId = null;
  merged.selectedTextLayerIds = [];
  merged.selectedShapeId = null;
  merged.selectedShapeIds = [];
  merged.selectedPhosphorIconLayerId = null;
  merged.selectedPhosphorIconLayerIds = [];
  merged.selectedElementId = null;
  merged.selectedElementIds = [];
  merged.selectedLayerGroupId = null;
  merged.isPenDrawingMode = false;
  merged.isMultiSelectMode = false;
  validateState(merged);
  return merged as unknown as StudioState;
}

export function createTextLayer(
  input: Partial<TextLayer> & Pick<TextLayer, 'text'>,
  index: number
): TextLayer {
  return {
    fontFamily: 'Inter',
    fontSize: 48,
    fontWeight: '700',
    fontStyle: 'normal',
    color: '#ffffff',
    textAlign: 'center',
    x: 0,
    y: index * 64,
    shadow: false,
    opacity: 100,
    rotation: 0,
    pitch: 0,
    yaw: 0,
    skewX: 0,
    skewY: 0,
    scaleX: 1,
    scaleY: 1,
    position: 'above',
    visible: true,
    locked: false,
    ...input,
    id: input.id || `text-${crypto.randomUUID()}`,
    text: input.text,
  };
}

export function createShapeLayer(
  input: Partial<ShapeLayer> & Pick<ShapeLayer, 'shapeType'>,
  index: number
): ShapeLayer {
  return {
    color: '#ffffff',
    width: 180,
    height: 180,
    x: index * 32,
    y: index * 32,
    rotation: 0,
    opacity: 100,
    position: 'above',
    visible: true,
    locked: false,
    borderEnabled: false,
    borderColor: '#ffffff',
    borderWidth: 0,
    ...input,
    id: input.id || `shape-${crypto.randomUUID()}`,
    shapeType: input.shapeType,
  };
}

function publicResult(
  requestUrl: string,
  entryId: string | null,
  identifier: string,
  name: string,
  visibility: string
) {
  const origin = (process.env.APP_URL?.trim() || new URL(requestUrl).origin).replace(/\/$/, '');
  return {
    id: entryId,
    identifier,
    name,
    visibility,
    studioUrl: `${origin}/studio?s=${identifier}`,
  };
}

export async function getOwnedDesign(userId: string, designId: string, requestUrl: string) {
  const { entry, content } = await findOwnedEntry(userId, designId);
  const raw = await decompressGzipString(content.json_string);
  return {
    ...publicResult(
      requestUrl,
      String(entry.id),
      content.identifier,
      content.name || 'Untitled design',
      content.visibility || 'private'
    ),
    studioState: JSON.parse(raw) as JsonObject,
  };
}

export async function createOwnedDesign(
  user: AuthUser,
  name: string,
  partial: JsonObject,
  requestUrl: string
) {
  const { base, headers } = cmsConfig();
  const identifier = crypto.randomUUID();
  const state = buildStudioState(partial);
  const payload = {
    name: name.trim().slice(0, 120),
    publisher: user.name || user.email || 'Shotage user',
    identifier,
    json_string: await compressGzipString(validateState(state as unknown as JsonObject)),
    visibility: 'private',
    user_id: user.id,
    is_in_review: 'no',
    is_in_explore: 'no',
    thumbnail: MCP_DESIGN_PLACEHOLDER,
  };
  const response = await fetch(`${base}/api/collections/shotage-shareables/entries`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Morphic could not save the design (HTTP ${response.status}).`);
  const responseBody = await response.json().catch(() => ({}));
  const entryId = responseBody?.id || responseBody?.data?.id || responseBody?.entry?.id || null;
  return publicResult(
    requestUrl,
    entryId ? String(entryId) : null,
    identifier,
    payload.name,
    'private'
  );
}

export async function updateOwnedDesign(
  userId: string,
  designId: string,
  name: string | undefined,
  patch: JsonObject,
  requestUrl: string
) {
  const { base, headers } = cmsConfig();
  const { entry, content } = await findOwnedEntry(userId, designId);
  const current = JSON.parse(await decompressGzipString(content.json_string)) as JsonObject;
  const state = buildStudioState(patch, current);
  const payload = {
    ...content,
    name: name?.trim().slice(0, 120) || content.name,
    json_string: await compressGzipString(validateState(state as unknown as JsonObject)),
    user_id: userId,
    thumbnail: content.thumbnail || MCP_DESIGN_PLACEHOLDER,
  };
  const response = await fetch(`${base}/api/entries/${entry.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error(`Morphic could not update the design (HTTP ${response.status}).`);
  return publicResult(
    requestUrl,
    String(entry.id),
    content.identifier,
    payload.name,
    content.visibility || 'private'
  );
}

export async function submitOwnedDesign(userId: string, designId: string, requestUrl: string) {
  const { base, headers } = cmsConfig();
  const { entry, content } = await findOwnedEntry(userId, designId);
  const payload = {
    ...content,
    visibility: 'public',
    user_id: userId,
    is_in_review: 'yes',
    is_in_explore: 'no',
    thumbnail: content.thumbnail || MCP_DESIGN_PLACEHOLDER,
  };
  const response = await fetch(`${base}/api/entries/${entry.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error(`Morphic could not submit the design (HTTP ${response.status}).`);
  return {
    ...publicResult(requestUrl, String(entry.id), content.identifier, content.name, 'public'),
    reviewStatus: 'pending',
  };
}
