"use client";

import { useCallback } from "react";
import { sendNotification } from "@/shared/lib/notify/browser";
import { playCoinChime } from "@/shared/lib/sound/chime";
import { useSettings } from "@/shared/providers/SettingsProvider";

/** Chime and browser notification for a watched item, each as the settings allow. */
export function useWatchNotify() {
  const { settings } = useSettings();
  return useCallback(
    (title: string, body?: string) => {
      if (settings.sounds) void playCoinChime(0.5);
      if (settings.notifications) sendNotification(title, body);
    },
    [settings.sounds, settings.notifications]
  );
}
