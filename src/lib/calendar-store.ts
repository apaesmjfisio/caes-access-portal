// Per-user calendar + event store backed by localStorage.
export type Calendar = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  group: "personal" | "team" | "shared";
};

export type CalendarEvent = {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;
};

const CAL_KEY = (user: string) => `caes.cal.${user}.calendars`;
const EVT_KEY = (user: string) => `caes.cal.${user}.events`;

const PALETTE = [
  "#4285F4", "#16A34A", "#EC4899", "#F97316",
  "#8B5CF6", "#0EA5E9", "#EAB308", "#EF4444",
  "#14B8A6", "#A855F7",
];

export function defaultCalendars(login: string): Calendar[] {
  return [
    { id: crypto.randomUUID(), name: login, color: "#4285F4", visible: true, group: "personal" },
    { id: crypto.randomUUID(), name: "Particular", color: "#F97316", visible: true, group: "personal" },
    { id: crypto.randomUUID(), name: "Equipe", color: "#16A34A", visible: true, group: "team" },
  ];
}

function isBrowser() { return typeof window !== "undefined"; }

export function loadCalendars(user: string): Calendar[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(CAL_KEY(user));
  if (!raw) {
    const seed = defaultCalendars(user);
    localStorage.setItem(CAL_KEY(user), JSON.stringify(seed));
    return seed;
  }
  try { return JSON.parse(raw) as Calendar[]; } catch { return []; }
}

export function saveCalendars(user: string, cals: Calendar[]) {
  if (!isBrowser()) return;
  localStorage.setItem(CAL_KEY(user), JSON.stringify(cals));
}

export function loadEvents(user: string): CalendarEvent[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(EVT_KEY(user));
  if (!raw) return [];
  try { return JSON.parse(raw) as CalendarEvent[]; } catch { return []; }
}

export function saveEvents(user: string, evts: CalendarEvent[]) {
  if (!isBrowser()) return;
  localStorage.setItem(EVT_KEY(user), JSON.stringify(evts));
}

export function suggestColor(existing: Calendar[]): string {
  const used = new Set(existing.map((c) => c.color.toLowerCase()));
  return PALETTE.find((c) => !used.has(c.toLowerCase())) ?? PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

export { PALETTE };
