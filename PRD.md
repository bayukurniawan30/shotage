# Product Requirement Document (PRD): Shotage

## 1. Executive Summary

**Shotage** is a lightweight, client-side web application that allows users to transform plain screenshots into visually engaging, high-resolution social media graphics and device mockups. Users can customize frames, background styles (solid, gradient, custom image), aspect ratios, zoom/scaling, and 3D tilt/perspective effects, then export the finished product directly to PNG or JPG formats.

The application operates entirely on the client side for rendering and exports, ensuring ultra-fast feedback, low latency, and zero server-side rendering costs.

---

## 2. Target Audience & Core Use Cases

- **Software Engineers & Product Managers:** Showcasing app features, web interfaces, and open-source projects on GitHub, X (Twitter), or LinkedIn.
- **Content Creators & Marketers:** Crafting high-converting promotional assets, social media banners, and launch posts.
- **Designers:** Presenting UI/UX work with realistic browser frames and 3D device angles for portfolio showcases.

---

## 3. Core Feature Requirements

### A. Canvas Stage & Image Manipulation

- **Image Upload & Import:**
  - Support drag-and-drop or file upload picker.
  - Supported input formats: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`.
  - Clipboard support: Paste images directly (`Ctrl+V` / `Cmd+V`).
- **Zoom & Scaling:**
  - Adjustable zoom slider ranging from `50%` to `150%`.
  - Focal alignment controls (center, top, bottom).
- **Padding & Insets:**
  - Adjustable outer padding between the image frame and canvas edges (`0px` to `120px`).
- **Corner Radius & Shadows:**
  - Roundness adjustment slider (`0px` to `32px`).
  - Customizable shadow effects (Elevation Presets: None, Soft, Medium, Hard, Floating 3D).

### B. Frame & Device Mockups

- **Frameless Mode:** Direct image card with custom corners, borders, and shadows.
- **Browser Frames:**
  - **Safari Style:** Top address bar with classic window control dots (red, yellow, green) and editable URL string.
  - **Chrome / Dark Mode Style:** Sleek dark browser header bar with tab interface.
- **Device Frames:**
  - High-quality SVG/Canvas wrappers for **MacBook Pro**, **iPhone**, and **Generic Tablet**.

### C. Background Customization

- **Solid Colors:**
  - Color picker + curated preset color palettes.
- **Gradients:**
  - Curated linear and radial gradient presets.
  - Custom two-stop gradient editor with adjustable direction angle (`0°` to `360°`).
- **Background Images & Unsplash Integration:**
  - Option to upload custom background images.
  - Integration with Unsplash image library.
  - Adjustable background blur slider (`0px` to `20px`).
- **Transparent Background:**
  - Option to make canvas transparent (PNG export mode only).

### D. 3D Tilt & Perspective Controls

- **Pitch / Rotate X:** Vertical perspective tilt (`-30°` to `+30°`).
- **Yaw / Rotate Y:** Horizontal perspective tilt (`-30°` to `+30°`).
- **Perspective Depth:** Slider controlling overall 3D viewing distance/depth.

### E. Canvas Sizing & Multi-Format Export

- **Canvas Aspect Ratio Presets:**
  - Auto-fit (wraps snugly around image padding).
  - Twitter / X Post (16:9).
  - Instagram Square (1:1) & Story (9:16).
  - Dribbble Shot (4:3) & LinkedIn Graphic (1.91:1).
- **Export Options:**
  - Formats: `PNG` (with transparency option) and `JPEG` (with configurable quality).
  - Resolution Multipliers: `1x`, `2x` (Retina HD), and `3x` pixel density scaling.
  - Clipboard Copy: One-click "Copy Image to Clipboard" button.

---

## 4. Tech Stack & System Architecture

### Framework & Stack Selection

- **Package Manager:** **pnpm** for fast, disk-space efficient dependency management.
- **Code Formatting & Beautification:** **Prettier** for automated, consistent code beautifying across HTML, CSS, JS, and TS files.
- **Backend Framework:** **Hono.js** running on **Vercel Edge Functions**. Hono serves as an ultra-fast, minimal server shell responsible for routing, serving initial asset bundles, and providing edge API endpoints.
- **Frontend Framework:** **Inertia.js with React**. Inertia provides a monolithic developer experience without building a complex REST/GraphQL API layer. React drives the reactive canvas control state, preview stage, and UI elements.
- **Styling & UI Kit:** Use **Untitled UI with React** (https://www.untitledui.com/react). For icons, use https://www.untitledui.com/resources/icons
- **Hosting & Deployment:** **Vercel Platform**, utilizing Vercel Edge Runtime for instant cold starts and global edge deployment.

### Application Routes & Navigation

- **Homepage (`/`):** A clean, engaging marketing landing page introducing Shotage, featuring hero showcase visuals, feature highlights, and a primary CTA driving users to the editor.
- **Studio Page (`/studio`):** The primary creation environment and canvas editor workspace where users import, format, customize, tilt, and export their screenshots.

### System Architecture Explanation

The system architecture follows an **Edge-Delivered Single-Page Application (SPA) with Client-Side Rendering** design pattern:

1. **Edge Request Handling:**
   When a user requests the application, Hono executes on Vercel's nearest Edge location, rendering the base Inertia layout and instantly delivering the React single-page bundle to the browser.

2. **Client-Driven State Engine:**
   All image manipulations—including zoom, padding, gradients, 3D tilt calculations, and frame swapping—occur strictly in local browser memory via React state or a lightweight Zustand store. No image data is transferred to server storage during editing.

3. **In-Browser Image Processing & Canvas Export:**
   - **DOM-to-Canvas Conversion:** When exporting, an in-browser rasterizer (`html-to-image` or HTML5 Canvas 2D) captures the formatted DOM nodes (including CSS `transform` perspective matrices, shadows, and SVG frame overlays).
   - **HiDPI Scaling:** The exporter multiplies the canvas backing store resolution by the user's selected resolution scale factor (`2x` or `3x`) to render sharp, high-DPI output.
   - **Direct Browser Download:** The resulting canvas data is converted into a binary `Blob` URL directly in JavaScript, triggering a native browser file download without any backend rendering queues.

4. **Edge Image Proxying (CORS Handling):**
   When external background images (such as Unsplash photos) are requested, the browser routes the image through a Hono Edge proxy endpoint (`/api/proxy-image?url=...`). The Hono proxy fetches the remote asset, attaches `Access-Control-Allow-Origin: *` headers, and streams the image back to the browser. This prevents canvas "tainting" errors during the final PNG/JPG export.

---

## 5. Non-Functional & Technical Requirements

- **Performance:** Initial page load under 1.5 seconds on fast 4G networks; DOM-to-Canvas export completed under 1.0 second for standard 2x renders.
- **Privacy & Security:** Full client-side processing guarantees user screenshots remain strictly local and private.
- **Browser Compatibility:** Support modern evergreen browsers supporting CSS 3D Transforms and HTML5 Canvas API (Chrome, Safari, Firefox, Edge).
- **Responsive Workspace:** Desktop-optimized editing workspace with responsive collapsible controls for smaller laptop screens.
- **Command Execution Environment:** All shell/terminal commands must be executed using interactive zsh syntax: `zsh -i -c "command here"`.

---

## 6. Technical Risks & Mitigations

1. **Canvas Tainting via Cross-Origin Assets:**
   - _Risk:_ Loading background images from external domains blocks canvas exports due to browser CORS policies.
   - _Mitigation:_ Route all third-party image URLs through the Hono edge proxy API endpoint.
2. **CSS 3D Render Distortions during Export:**
   - _Risk:_ Heavy CSS `perspective` and `backdrop-filter` styles can sometimes drop out when converted to static canvas elements.
   - _Mitigation:_ Ensure SVG overlays and CSS transform matrices are evaluated using raw matrix math or optimized `html-to-image` configuration options before canvas rasterization.
