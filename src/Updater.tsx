import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export async function checkForUpdates() {
  try {
    const update = await check();
    if (!update) {
      window.alert("No updates available");
      return;
    }

    console.log(
      `found update ${update.version} from ${update.date} with notes ${update.body}`,
    );

    const shouldInstall = window.confirm(
      `A new version (${update.version}) is available.\n\n${update.body ?? ""}\n\nDo you want to update and restart now?`,
    );
    if (!shouldInstall) {
      console.log("user declined update");
      return;
    }

    let downloaded = 0;
    let contentLength = 0;
    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength!;
          console.log(`started downloading ${event.data.contentLength} bytes`);
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          console.log(`downloaded ${downloaded} from ${contentLength}`);
          break;
        case "Finished":
          console.log("download finished");
          break;
      }
    });

    console.log("update installed");
    await relaunch();
  } catch (error) {
    window.alert(`Failed to update: ${error}`);
  }
}
