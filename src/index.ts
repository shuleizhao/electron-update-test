import { app, BrowserWindow, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import log from "electron-log/main";

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

log.transports.file.level = "debug";
autoUpdater.logger = log;

if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("src/index.html");
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  createWindow();

  autoUpdater.forceDevUpdateConfig = true;
  autoUpdater.setFeedURL({
    url: `https://shuleizhao-electron-update-test.vercel.app/update/${
      process.platform
    }/v${app.getVersion()}`,
    provider: "generic",
  });
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on("update-available", () => {
  mainWindow?.webContents.send("update_available");
});

autoUpdater.on("update-downloaded", () => {
  mainWindow?.webContents.send("update_downloaded");
});

autoUpdater.on("error", (err) => {
  log.error("Error in auto-updater.", err);
  log.error("Error properties:");
  for (const prop in err) {
    log.error(`  ${prop}: ${(err as any)[prop]}`);
  }
  if (err.stack) {
    log.error("Stack trace:");
    log.error(err.stack);
  }
});

ipcMain.on("app_version", (event) => {
  console.log("app_version", app.getVersion());
  event.sender.send("app_version", { version: app.getVersion() });
});

ipcMain.on("restart_app", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.on("check-for-update", () => {
  autoUpdater.checkForUpdates();
});

ipcMain.on("download-update", () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on("quit-and-install", () => {
  autoUpdater.quitAndInstall(false, true);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
