import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { toast } from "sonner";

export async function checkForUpdates({
  silent = false,
}: { silent?: boolean } = {}) {
  try {
    const currentVersion = await getVersion();
    const update = await check();
    if (!update) {
      if (!silent) {
        toast.info("No updates available", {
          description: `You're on the latest version (${currentVersion}).`,
        });
      }
      return;
    }

    toast(`A new version (${update.version}) is available`, {
      description: update.body ?? undefined,
      duration: Infinity,
      action: {
        label: "Update & restart",
        onClick: () => installUpdate(update),
      },
    });
  } catch (error) {
    if (!silent) {
      toast.error("Failed to check for updates", {
        description: String(error),
      });
    }
  }
}

async function installUpdate(update: Update) {
  const toastId = toast.loading("Downloading update...");
  try {
    let downloaded = 0;
    let contentLength = 0;
    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength ?? 0;
          break;
        case "Progress": {
          downloaded += event.data.chunkLength;
          const percent = contentLength
            ? Math.round((downloaded / contentLength) * 100)
            : 0;
          toast.loading(`Downloading update... ${percent}%`, { id: toastId });
          break;
        }
        case "Finished":
          toast.loading("Installing update...", { id: toastId });
          break;
      }
    });

    toast.success("Update installed. Restarting...", { id: toastId });
    await relaunch();
  } catch (error) {
    toast.error("Failed to update", {
      id: toastId,
      description: String(error),
    });
  }
}
