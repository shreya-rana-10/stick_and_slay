/** Display timestamps stored in UTC as India Standard Time (PRD §7). */
export function formatIST(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
