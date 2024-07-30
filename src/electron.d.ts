export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  onUpdateAvailable: (callback: () => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  restartApp: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
