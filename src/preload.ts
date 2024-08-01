import { ipcRenderer } from "electron";

process.once("loaded", () => {
  window.addEventListener("DOMContentLoaded", async () => {
    const versionElement = document.getElementById("version") as HTMLElement;
    const notificationElement = document.getElementById(
      "notification"
    ) as HTMLElement;
    const message = document.getElementById("message") as HTMLElement;
    const cancelButton = document.getElementById(
      "cancel-button"
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
      message.textContent = `Update ${version} downloaded. The app will restart in 5 seconds to install the update.`;
      cancelButton.classList.remove("hidden");
    });

    ipcRenderer.on("error", (_event, err) => {
      notificationElement.classList.remove("hidden");
      message.textContent = `An error has occurred.`;
      console.log("Error:", err);
    });

    cancelButton.addEventListener("click", () => {
      ipcRenderer.send("cancel_update");
      cancelButton.classList.add("hidden");
      message.textContent = `Update installation has been canceled.`;
    });
  });
});
