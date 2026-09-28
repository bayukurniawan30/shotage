import type { StudioState } from '../types/studio';
import {
  createProjectFile,
  MAX_PROJECT_BYTES,
  parseProjectFile,
  type StudioProjectFile,
} from './projectFile';
import { isDesktopApp } from './runtime';

export async function openProjectOnDevice(): Promise<{
  path: string;
  project: StudioProjectFile;
} | null> {
  if (!isDesktopApp()) throw new Error('Native project opening is available in Shotage Desktop.');
  const [{ open }, { readTextFile, stat }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/plugin-fs'),
  ]);
  const path = await open({
    multiple: false,
    directory: false,
    filters: [{ name: 'Shotage project', extensions: ['shotage', 'json'] }],
  });
  if (!path || Array.isArray(path)) return null;
  if ((await stat(path)).size > MAX_PROJECT_BYTES) {
    throw new Error('This project is too large to open (maximum 100 MB).');
  }
  const project = parseProjectFile(await readTextFile(path));
  return { path, project };
}

export async function saveProjectOnDevice(
  state: StudioState,
  previous?: { path: string; createdAt: string } | null,
  saveAs = false
): Promise<{ path: string; createdAt: string } | null> {
  if (!isDesktopApp()) throw new Error('Native project saving is available in Shotage Desktop.');
  const [{ save }, { writeTextFile }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/plugin-fs'),
  ]);
  const path =
    !saveAs && previous?.path
      ? previous.path
      : await save({
          defaultPath: previous?.path || 'Shotage Design.shotage',
          filters: [{ name: 'Shotage project', extensions: ['shotage'] }],
        });
  if (!path) return null;
  const project = createProjectFile(state, previous?.createdAt);
  await writeTextFile(path, JSON.stringify(project));
  return { path, createdAt: project.createdAt };
}

export async function saveExportToDevice(content: Blob, filename: string): Promise<boolean> {
  if (!isDesktopApp()) {
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2_000);
    return true;
  }

  const [{ save }, { writeFile }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/plugin-fs'),
  ]);

  const extension = filename.split('.').pop() || 'png';
  const path = await save({
    defaultPath: filename,
    filters: [{ name: `${extension.toUpperCase()} export`, extensions: [extension] }],
  });
  if (!path) return false;
  await writeFile(path, new Uint8Array(await content.arrayBuffer()));
  return true;
}

export async function openExternalUrl(url: string): Promise<void> {
  const parsed = new URL(url, window.location.href);
  if (!['https:', 'mailto:'].includes(parsed.protocol)) {
    throw new Error('This link cannot be opened externally.');
  }
  if (isDesktopApp()) {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(parsed.href);
  } else {
    window.location.assign(parsed.href);
  }
}
