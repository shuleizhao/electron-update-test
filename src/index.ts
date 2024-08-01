import { app, BrowserWindow, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import log from "electron-log/main";
import path from "path";
import * as dotenv from "dotenv";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

dotenv.config();

let mainWindow: BrowserWindow | null;
let updateTimeout: NodeJS.Timeout | null = null;

log.transports.file.level = "debug";
autoUpdater.logger = log;

if (require("electron-squirrel-startup")) {
  app.quit();
}

if (process.env.NODE_ENV === "development") {
  const path = require("path");
  const updateConfigPath = path.join(
    __dirname,
    "..",
    "..",
    "dev-app-update.yml"
  );
  autoUpdater.updateConfigPath = updateConfigPath;
}

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

  // Need this to avoid that the packaged app cannot find the index html.
  let indexPath;
  if (app.isPackaged) {
    indexPath = path.join(
      __dirname,
      "..",
      "renderer",
      "main_window",
      "index.html"
    );
  } else {
    indexPath = path.resolve(__dirname, "..", "..", "src", "index.html");
  }
  mainWindow.loadFile(indexPath);

  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  createWindow();

  autoUpdater.forceDevUpdateConfig = true;
  // autoUpdater.setFeedURL({
  //   url: `https://shuleizhao-electron-update-test.vercel.app/update/${
  //     process.platform
  //   }/v${app.getVersion()}`,
  //   provider: "generic",
  // });

  // autoUpdater.setFeedURL({
  //   provider: "s3",
  //   bucket: "shuleizhao-electron-update-test",
  //   region: "us-east-2",
  //   path: "electron-update-test/win32/x64/",
  // });

  const bucketName =
    process.env.AWS_S3_BUCKET || "shuleizhao-electron-update-test";
  const s3Path = process.env.AWS_S3_PATH || "electron-update-test/win32/x64/";
  const signedURL = process.env.AWS_S3_SIGNED_URL || "";

  if (signedURL) {
    autoUpdater.setFeedURL({
      provider: "generic",
      url: signedURL,
    });
    autoUpdater.checkForUpdatesAndNotify();
  } else if (bucketName && s3Path) {
    autoUpdater.setFeedURL({
      provider: "generic",
      url: `https://${bucketName}.s3.amazonaws.com/${s3Path}`,
      channel: "latest",
    });
    autoUpdater.checkForUpdatesAndNotify();
  }
});

autoUpdater.on("error", (err) => {
  mainWindow?.webContents.send("error", err);
});

autoUpdater.on("update-available", (info) => {
  mainWindow?.webContents.send("update-available", info.version);
});

autoUpdater.on("update-not-available", () => {
  mainWindow?.webContents.send("update-not-available");
});

autoUpdater.on("update-downloaded", (info) => {
  mainWindow?.webContents.send("update-downloaded", info.version);
  updateTimeout = setTimeout(() => {
    autoUpdater.quitAndInstall(false, true);
  }, 5000);
});

ipcMain.on("cancel_update", () => {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
    updateTimeout = null;
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
