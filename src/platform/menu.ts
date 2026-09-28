import { isDesktopApp } from './runtime';

export interface DesktopMenuActions {
  newProject: () => void;
  openProject: () => void;
  saveProject: () => void;
  saveProjectAs: () => void;
  exportDesign: () => void;
  undo: () => void;
  redo: () => void;
}

let currentActions: DesktopMenuActions | null = null;
let installation: Promise<void> | null = null;

export function setDesktopMenuActions(actions: DesktopMenuActions): void {
  if (!isDesktopApp()) return;
  currentActions = actions;
  if (installation) return;
  installation = installMenu().catch((error) => {
    installation = null;
    console.error('Could not install the Shotage desktop menu:', error);
  });
}

async function installMenu(): Promise<void> {
  const { Menu } = await import('@tauri-apps/api/menu');
  const { getVersion } = await import('@tauri-apps/api/app');
  const version = await getVersion();
  const menu = await Menu.new({
    items: [
      {
        text: 'Shotage',
        items: [
          { item: { About: { name: 'Shotage Studio', version } } },
          {
            text: 'Check for Updates…',
            action: () => window.dispatchEvent(new Event('shotage:check-for-updates')),
          },
          { item: 'Separator' },
          { item: 'Quit' },
        ],
      },
      {
        text: 'File',
        items: [
          { text: 'New Design', action: () => currentActions?.newProject() },
          { text: 'Open Project…', action: () => currentActions?.openProject() },
          { item: 'Separator' },
          { text: 'Save to Device', action: () => currentActions?.saveProject() },
          { text: 'Save As…', action: () => currentActions?.saveProjectAs() },
          { item: 'Separator' },
          { text: 'Export…', action: () => currentActions?.exportDesign() },
        ],
      },
      {
        text: 'Edit',
        items: [
          { text: 'Undo', action: () => currentActions?.undo() },
          { text: 'Redo', action: () => currentActions?.redo() },
          { item: 'Separator' },
          { item: 'Cut' },
          { item: 'Copy' },
          { item: 'Paste' },
          { item: 'SelectAll' },
        ],
      },
      {
        text: 'Window',
        items: [{ item: 'Minimize' }, { item: 'Fullscreen' }],
      },
    ],
  });
  await menu.setAsAppMenu();
}
