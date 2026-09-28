import { isTauri } from '@tauri-apps/api/core';

export const isDesktopApp = () => typeof window !== 'undefined' && isTauri();

export function apiUrl(path: `/api/${string}`): string {
  return isDesktopApp() && import.meta.env.PROD ? `https://shotage.studio${path}` : path;
}
