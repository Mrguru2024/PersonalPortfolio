/** Dispatched after admin saves settings that affect read-aloud (e.g. TTS under /admin/settings). */
export const READ_ALOUD_STATUS_REFRESH_EVENT = "ascendra:read-aloud-refresh";

export function dispatchReadAloudStatusRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(READ_ALOUD_STATUS_REFRESH_EVENT));
}
