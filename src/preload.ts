import { ipcRenderer } from "electron";

process.once("loaded", () => {
  window.addEventListener("DOMContentLoaded", async () => {
    const versionElement = document.getElementById("version") as HTMLElement;
    const notificationElement = document.getElementById(
      "notification"
    ) as HTMLElement;
    const message = document.getElementById("message") as HTMLElement;
    const restartButton = document.getElementById(
      "restart-button"
    ) as HTMLButtonElement;

    versionElement.innerText = await ipcRenderer.invoke("get-app-version");

    ipcRenderer.on("update-available", (_event, version) => {
      notificationElement.classList.remove("hidden");
      message.textContent = `A new update ${version} is available. Downloading now...`;
    });

    ipcRenderer.on("update-not-available", () => {
      notificationElement.classList.remove("hidden");
      message.textContent = `You are on the latest version.`;
    });

    ipcRenderer.on("update-downloaded", (_event, version) => {
      notificationElement.classList.remove("hidden");
      message.textContent = `Update ${version} Downloaded. It will be installed on restart. Restart now?`;
      restartButton.classList.remove("hidden");
    });

    ipcRenderer.on("error", (_event, err) => {
      notificationElement.classList.remove("hidden");
      message.textContent = `An error has occurred.`;
      console.log("Error: -------->", err);
    });

    restartButton.addEventListener("click", () => {
      ipcRenderer.send("restart_app");
    });
  });
});
