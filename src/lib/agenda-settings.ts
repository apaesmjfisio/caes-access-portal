// Store for agenda settings, statuses and holidays (per user, in localStorage).

export type ViewMode = "day" | "week" | "month";
export type Reminder =
  | "sem"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "12h"
  | "1d"
  | "1s";

export const REMINDER_OPTIONS: { value: Reminder; label: string }[] = [
  { value: "sem", label: "Sem lembrete" },
  { value: "1h", label: "Uma hora antes" },
  { value: "2h", label: "Duas horas antes" },
  { value: "4h", label: "Quatro horas antes" },
  { value: "6h", label: "Seis horas antes" },
  { value: "12h", label: "Doze horas antes" },
  { value: "1d", label: "Um dia antes" },
  { value: "1s", label: "Uma semana antes" },
];

export type DayKey = "dom" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab";
export const DAY_KEYS: DayKey[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
export const DAY_LABEL: Record<DayKey, string> = {
  dom: "Dom", seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sab",
};

export type DaySchedule = {
  enabled: boolean;
  workStart: string; // HH:mm or ""
  workEnd: string;
  breakStart: string;
  breakEnd: string;
};

export type AgendaSettings = {
  defaultView: ViewMode;
  defaultDuration: number; // minutes
  intervalDisplay: number; // minutes
  color: string; // hex
  frequency: "diaria" | "semanal" | "quinzenal" | "mensal";
  repetitions: number;
  showBirthdays: boolean;
  enableDragDrop: boolean;
  limitWorkingHours: boolean;
  showProfessionalName: boolean;
  days: Record<DayKey, DaySchedule>;
  dailyReports: boolean;
  limitAppointmentsPerSlot: boolean;
  adjustAfterInterval: boolean;
  emailReminder: Reminder;
  smsReminder: Reminder;
  whatsappReminder: Reminder;
};

export function defaultSettings(): AgendaSettings {
  const day = (enabled: boolean): DaySchedule => ({
    enabled,
    workStart: enabled ? "07:00" : "",
    workEnd: enabled ? "18:00" : "",
    breakStart: "",
    breakEnd: "",
  });
  return {
    defaultView: "week",
    defaultDuration: 60,
    intervalDisplay: 60,
    color: "#22d3ee",
    frequency: "semanal",
    repetitions: 10,
    showBirthdays: true,
    enableDragDrop: false,
    limitWorkingHours: false,
    showProfessionalName: true,
    days: {
      dom: day(false),
      seg: day(true),
      ter: day(true),
      qua: day(true),
      qui: day(true),
      sex: day(true),
      sab: day(false),
    },
    dailyReports: true,
    limitAppointmentsPerSlot: false,
    adjustAfterInterval: false,
    emailReminder: "sem",
    smsReminder: "sem",
    whatsappReminder: "sem",
  };
}

// ---------- Status ----------
export type StatusItem = {
  id: string;
  name: string;
  color: string;
  hidden: boolean;
  deleteFinancial: boolean;
  availableLimited: boolean;
  notCountProfessional: boolean;
  deleteReminders: boolean;
  notCountRoom: boolean;
  sessionControl: "descontar" | "liberar";
  packageCommission: boolean;
  description?: string;
};

export function defaultStatuses(): StatusItem[] {
  const base = (
    name: string,
    color: string,
    description: string,
    sessionControl: "descontar" | "liberar" = "descontar",
  ): StatusItem => ({
    id: crypto.randomUUID(),
    name,
    color,
    hidden: false,
    deleteFinancial: false,
    availableLimited: false,
    notCountProfessional: false,
    deleteReminders: false,
    notCountRoom: false,
    sessionControl,
    packageCommission: false,
    description,
  });
  return [
    base("Agendado", "#3b82f6", "Indica que o atendimento está agendado."),
    base("Atendido", "#16a34a", "Indica que já houve atendimento. Desconta sessões de pacotes."),
    base("Cancelado", "#0f172a", "Indica que o atendimento foi cancelado.", "liberar"),
    base("Faltou", "#ef4444", "Paciente faltou. Não contabiliza no limite por sala/profissional."),
    base("Faltou (com aviso prévio)", "#86efac", "Falta com aviso — libera sessão do pacote.", "liberar"),
    base("Faltou (sem aviso prévio)", "#fb923c", "Falta sem aviso — desconta sessão do pacote."),
    base("Não atendido", "#cbd5e1", "Passou do horário sem atendimento."),
    base("Não atendido (Sem cobrança)", "#1f2937", "Não atendido, sem cobrança."),
    base("Presença confirmada", "#1e3a8a", "Presença confirmada (uso com reconhecimento facial)."),
    base("Remarcar", "#bae6fd", "Paciente pediu para remarcar.", "liberar"),
  ];
}

// ---------- Holidays ----------
export type HolidayScope = "nacional" | "estadual" | "municipal" | "facultativo";
export type Holiday = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  scope: HolidayScope;
  allowAppointments: boolean;
};

export function defaultHolidays(): Holiday[] {
  const y = new Date().getFullYear();
  const mk = (name: string, m: number, d: number, scope: HolidayScope): Holiday => ({
    id: crypto.randomUUID(),
    name,
    date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    scope,
    allowAppointments: false,
  });
  return [
    mk("Confraternização Universal", 1, 1, "nacional"),
    mk("Tiradentes", 4, 21, "nacional"),
    mk("Dia do Trabalho", 5, 1, "nacional"),
    mk("Dia da Independência do Brasil", 9, 7, "nacional"),
    mk("Nossa Senhora Aparecida", 10, 12, "nacional"),
    mk("Finados", 11, 2, "nacional"),
    mk("Proclamação da República", 11, 15, "nacional"),
    mk("Natal", 12, 25, "nacional"),
  ];
}

// ---------- storage ----------
const isBrowser = () => typeof window !== "undefined";
const SET_KEY = (u: string, scope: string) => `caes.cal.${u}.settings.${scope}`;
const STATUS_KEY = (u: string) => `caes.cal.${u}.statuses`;
const HOL_KEY = (u: string) => `caes.cal.${u}.holidays`;

export function loadSettings(user: string, scope: string = "default"): AgendaSettings {
  if (!isBrowser()) return defaultSettings();
  const raw = localStorage.getItem(SET_KEY(user, scope));
  if (!raw) {
    if (scope === "default") {
      const s = defaultSettings();
      localStorage.setItem(SET_KEY(user, scope), JSON.stringify(s));
      return s;
    }
    return loadSettings(user, "default");
  }
  try { return { ...defaultSettings(), ...JSON.parse(raw) }; }
  catch { return defaultSettings(); }
}

export function saveSettings(user: string, scope: string, s: AgendaSettings) {
  if (!isBrowser()) return;
  localStorage.setItem(SET_KEY(user, scope), JSON.stringify(s));
}

export function loadStatuses(user: string): StatusItem[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(STATUS_KEY(user));
  if (!raw) {
    const s = defaultStatuses();
    localStorage.setItem(STATUS_KEY(user), JSON.stringify(s));
    return s;
  }
  try { return JSON.parse(raw); } catch { return defaultStatuses(); }
}
export function saveStatuses(user: string, items: StatusItem[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STATUS_KEY(user), JSON.stringify(items));
}

export function loadHolidays(user: string): Holiday[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(HOL_KEY(user));
  if (!raw) {
    const h = defaultHolidays();
    localStorage.setItem(HOL_KEY(user), JSON.stringify(h));
    return h;
  }
  try { return JSON.parse(raw); } catch { return defaultHolidays(); }
}
export function saveHolidays(user: string, items: Holiday[]) {
  if (!isBrowser()) return;
  localStorage.setItem(HOL_KEY(user), JSON.stringify(items));
}
