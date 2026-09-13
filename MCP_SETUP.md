# Shotage MCP server

Shotage exposes a remote Streamable HTTP MCP server at:

```text
https://shotage.studio/mcp
```

It works with **saved designs only**. It does not connect to or control a Studio canvas that is already open in a browser. Create and update tools return a `/studio?s=<identifier>` URL that the user can open in Shotage.

## Tools

- `get_design_reference` — the current Studio design contract, motion capabilities, constraints, and gradient/Flow presets.
- `validate_design` — validates a proposed design without saving it and reports exact invalid property paths.
- `list_my_designs` — designs owned by the connected Shotage account.
- `get_design` — full editable state for one owned design.
- `create_design` — creates a private saved design.
- `update_design` — updates an owned saved design; object fields are merged and arrays are replaced.
- `submit_design_to_explore` — makes a design public and sends it to Morphic CMS for review.

There is intentionally no delete tool and no real-time canvas-control tool.

## Recommended agent workflow

For a motion design, an AI agent should:

1. Call `get_design_reference` instead of relying on an older remembered Shotage schema.
2. Give every layer, group, keyframe, and motion block a stable unique ID.
3. Compose the complete proposed Studio state. Keep all timing inside the design or stage `durationSec`.
4. Call `validate_design` and correct every reported path before saving.
5. Call `create_design`. For an edit, call `get_design` first, modify that returned state, validate the complete result, and then call `update_design`.
6. Return the resulting `studioUrl` so the user can review and refine the design in Shotage.

Object patches merge deeply, but arrays replace the corresponding stored array. An update containing `textLayers`, `shapeLayers`, `stages`, `keyframes`, `motions`, `members`, or `layerOrder` must therefore include the complete intended array, not only the changed item.

## Motion design fields

Shotage MCP supports the same saved motion features as Studio:

- Layer keyframes for position, dimensions, scale, rotation, 3D pitch/yaw, opacity, corner radius, font size, blur, skew, color, border, letter spacing, and shadow properties.
- Built-in easing (`ease-in-out`, `linear`, `ease-out`, `ease-in`, and `spring`) and per-segment custom cubic Bézier easing. Bézier `x1`/`x2` are `0–1`; `y1`/`y2` are `-0.6–1.6`.
- Motion paths (`linear`, `arc-up`, `arc-down`, and `s-curve`) with `curvature: 0–1` and optional `autoOrient`. Layer paths need at least two layer keyframes; `mockupMotionPath` and `slot2MockupMotionPath` use the top-level `keyframes` array and need at least two mockup keyframes.
- Normalized anchor points (`anchorX` and `anchorY`, each `0–1`) on mockups, layers, and groups.
- Global/stage motion blur through `motionBlurEnabled` and `motionBlurStrength: 0–100`.
- Motion preset blocks with `startTimeSec`, `durationSec`, and easing.
- Per-character or per-word text presets: `text-rise`, `text-pop`, `text-blur`, and `text-wave`, with `textUnit`, `textOrder`, and `staggerSec` (`0–0.2` seconds).
- Shape masks through `maskTarget`. The target must exist in the same stage, cannot be the mask shape itself, and can have only one mask.
- Layer groups whose members reference existing layers. A layer can belong to only one group; groups can carry keyframes, motion blocks, paths, anchors, scale, rotation, opacity, and blur.
- Up to five stages with `transitionOut` on each outgoing stage. Transitions are `none`, `crossfade`, `slide-left`, `slide-right`, or `zoom-fade`, with a duration of `0.1–1.5` seconds.

Example animated text layer:

```json
{
  "id": "headline",
  "text": "Meet the future",
  "fontSize": 72,
  "fontWeight": "800",
  "color": "#ffffff",
  "x": 0,
  "y": -320,
  "anchorX": 0.5,
  "anchorY": 0.5,
  "motions": [
    {
      "id": "headline-rise",
      "preset": "text-rise",
      "startTimeSec": 0.3,
      "durationSec": 1.2,
      "easing": "ease-out",
      "textUnit": "character",
      "textOrder": "forward",
      "staggerSec": 0.04
    }
  ],
  "keyframes": [
    {
      "id": "headline-start",
      "timeSec": 0,
      "opacity": 0,
      "y": -280,
      "easing": { "type": "cubic-bezier", "x1": 0.16, "y1": 1, "x2": 0.3, "y2": 1 }
    },
    { "id": "headline-settle", "timeSec": 1.2, "opacity": 100, "y": -320 }
  ]
}
```

Example curved shape movement:

```json
{
  "id": "accent-circle",
  "shapeType": "circle",
  "color": "#ffafcc",
  "width": 140,
  "height": 140,
  "x": -260,
  "y": 120,
  "motionPath": { "type": "arc-up", "curvature": 0.3, "autoOrient": false },
  "keyframes": [
    { "id": "accent-start", "timeSec": 2, "x": -260, "y": 120, "opacity": 0 },
    { "id": "accent-end", "timeSec": 3.2, "x": 260, "y": 120, "opacity": 100 }
  ]
}
```

Example mask and stage transition:

```json
{
  "shapeLayers": [
    {
      "id": "headline-mask",
      "shapeType": "rectangle",
      "color": "#ffffff",
      "width": 700,
      "height": 180,
      "x": 0,
      "y": -300,
      "maskTarget": { "type": "text", "id": "headline" }
    }
  ],
  "transitionOut": {
    "type": "crossfade",
    "durationSec": 0.6,
    "easing": "ease-in-out"
  }
}
```

## Authentication and storage

The MCP server is an OAuth 2.1 protected resource. It uses dynamic client registration, authorization code flow, PKCE S256, one-hour access tokens, and 30-day refresh tokens. The authorization screen uses the existing Neon Auth session, so Google, GitHub, and email magic-link users all connect through the same Shotage account.

The server derives `user_id` from the authenticated token. It never accepts a user ID from tool input. Morphic credentials remain server-side, and every read/update checks entry ownership.

## Production setup

1. Generate a random value of at least 32 characters for `MCP_TOKEN_SECRET`.
2. Set `MCP_ISSUER_URL=https://shotage.studio`.
3. Keep `APP_URL=https://shotage.studio`, `DATABASE_URL`, Neon Auth, and Morphic variables configured as normal.
4. Run `pnpm db:migrate` against the production database. Migration `0012_mcp_oauth.sql` adds OAuth clients, authorization codes, and refresh tokens.
5. Deploy, then connect the remote MCP URL `https://shotage.studio/mcp` from the MCP client.

Use a different `MCP_TOKEN_SECRET` for local/development and production. Changing the production secret invalidates existing MCP access tokens; users can reconnect to receive new tokens.

## Scopes

- `designs:read`
- `designs:write`
- `gradients:read`
- `explore:submit`

New designs are private even when all scopes are approved. Explore submission remains a separate tool action and the existing Morphic moderation workflow decides whether the design appears publicly.
