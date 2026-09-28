# Desktop video export regression

This test uses macOS WKWebView, the same system rendering engine as Tauri. It
generates a local 12-second, 1920 × 1080 H.264 video, mounts the actual
`VideoCanvasScreen` component, and exercises the production export decoder and
capture helper. No account, API request, credit reservation, or user media is used.

Start a separate dev server without opening a browser:

```sh
TAURI_ENV_PLATFORM=macos pnpm exec vite --host 127.0.0.1 --port 5174
```

In another terminal (requires Xcode command-line tools):

```sh
xcrun swift scripts/test-desktop-video-export.swift http://127.0.0.1:5174
```

The temporary test window closes automatically. The command exits nonzero on any
pixel mismatch, decoding error, or timeout. JSON progress and the final result are
printed to the terminal. The page can also be opened in a browser for comparison.

The test checks both mockup slots at every timestamp in three places:

1. The decoded source frame.
2. The completed DOM snapshot.
3. The final MP4, decoded again after using Shotage's Annex B conversion and muxer.

Cases cover a first 12-second export, a second export at 2× density with 3D tilt,
and 60 fps export crossing a source-video loop boundary. The two slots use the same
video at different timestamps. A real black interval in the source must remain
black. Preview playback runs before each export to exercise the handoff.

The fixture is a controlled mockup layout, not the complete Studio UI. It does not
replace visual checks of every frame style, effect, or arbitrary uploaded codec.
No test files or generated videos are written to Downloads or uploaded anywhere.
