import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft, ChevronRight, Plus, LogOut, Settings, Trash2, Search, Bell,
  Sliders, UserRound, Stethoscope, BarChart3,
} from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import logoApae from "@/assets/logo-apae.png";
import {
  getSession, clearSession, getMaster, setMaster, type Session,
} from "@/lib/auth";
import {
  loadCalendars, saveCalendars, loadEvents, saveEvents,
  suggestColor, PALETTE, type Calendar, type CalendarEvent,
} from "@/lib/calendar-store";
import { DAY_KEYS, loadSettings, type AgendaSettings, type DayKey } from "@/lib/agenda-settings";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Agenda — CAES" }] }),
  component: CalendarApp,
});

// ---------- helpers ----------
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY_INDEX_KEYS: DayKey[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return start;
}

function buildMonthGrid(year: number, month: number): Date[] {
  const start = startOfMonthGrid(year, month);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function weekDays(cursor: Date): Date[] {
  const start = new Date(cursor);
  start.setDate(cursor.getDate() - cursor.getDay()); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function shiftCursor(cursor: Date, view: "month" | "week" | "day", dir: number): Date {
  const d = new Date(cursor);
  if (view === "month") d.setMonth(d.getMonth() + dir);
  else if (view === "week") d.setDate(d.getDate() + 7 * dir);
  else d.setDate(d.getDate() + dir);
  return d;
}

function headerLabel(cursor: Date, view: "month" | "week" | "day"): string {
  if (view === "month") return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  if (view === "day") {
    return `${WEEKDAYS[cursor.getDay()]}, ${cursor.getDate()} ${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  }
  const ws = weekDays(cursor);
  const a = ws[0]; const b = ws[6];
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()}–${b.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
  }
  return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
}

function minutesFromHHMM(s?: string): number {
  if (!s) return 0;
  const [h, m] = s.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function hhmm(totalMinutes: number): string {
  const t = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function ceilToStep(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

function floorToStep(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

function dayKeyOf(d: Date): DayKey {
  return DAY_INDEX_KEYS[d.getDay()];
}

function enabledByAnyConfig(d: Date, configs: AgendaSettings[]): boolean {
  if (configs.length === 0) return true;
  return configs.some((cfg) => cfg.days[dayKeyOf(d)]?.enabled);
}

function workingRangeForConfigs(configs: AgendaSettings[]) {
  let start = 24 * 60;
  let end = 0;
  for (const cfg of configs) {
    for (const key of DAY_KEYS) {
      const day = cfg.days[key];
      if (!day?.enabled) continue;
      const s = minutesFromHHMM(day.workStart || "00:00");
      const e = minutesFromHHMM(day.workEnd || "23:59");
      if (e <= s) continue;
      start = Math.min(start, s);
      end = Math.max(end, e);
    }
  }
  if (start >= end) return { startMinute: 0, endMinute: 24 * 60 };
  return { startMinute: Math.max(0, start), endMinute: Math.min(24 * 60, end) };
}

function workingRangeForDayConfigs(d: Date, configs: AgendaSettings[]) {
  const key = dayKeyOf(d);
  let start = 24 * 60;
  let end = 0;
  for (const cfg of configs) {
    const day = cfg.days[key];
    if (!day?.enabled) continue;
    const s = minutesFromHHMM(day.workStart || "00:00");
    const e = minutesFromHHMM(day.workEnd || "23:59");
    if (e <= s) continue;
    start = Math.min(start, s);
    end = Math.max(end, e);
  }
  if (start >= end) return null;
  return { startMinute: Math.max(0, start), endMinute: Math.min(24 * 60, end) };
}

function nextEnabledDate(from: Date, configs: AgendaSettings[]) {
  const d = new Date(from);
  for (let i = 0; i < 14; i += 1) {
    if (enabledByAnyConfig(d, configs)) return d;
    d.setDate(d.getDate() + 1);
  }
  return from;
}


// ---------- component ----------
type ViewMode = "month" | "week" | "day";

function CalendarApp() {
  const navigate = useNavigate();
  const [session, setSessionState] = useState<Session | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [showCreateCal, setShowCreateCal] = useState(false);
  const [showCreateEvt, setShowCreateEvt] = useState<{ date: string; start?: string; end?: string } | null>(null);
  const [showMaster, setShowMaster] = useState(false);
  const [view, setView] = useState<ViewMode>("month");
  const [hourHeight, setHourHeight] = useState(48); // px per hour (zoom)
  const [agendaCfg, setAgendaCfg] = useState<ReturnType<typeof loadSettings> | null>(null);

  // hydrate session client-side
  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate({ to: "/login" });
      return;
    }
    setSessionState(s);
    // Migration: drop auto-seeded calendar whose name matches the login.
    const raw = loadCalendars(s.login);
    const cleaned = raw.filter((c) => c.name.toLowerCase() !== s.login.toLowerCase());
    if (cleaned.length !== raw.length) saveCalendars(s.login, cleaned);
    setCalendars(cleaned);
    setEvents(loadEvents(s.login));

    // Adopt saved agenda settings and react to updates / focus.
    const apply = () => {
      try {
        const cfg = loadSettings(s.login, "default");
        setAgendaCfg(cfg);
        if (cfg.defaultView) setView(cfg.defaultView);
      } catch { /* noop */ }
    };
    apply();
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith(`caes.cal.${s.login}.settings.`)) apply();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", apply);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", apply);
    };
  }, [navigate]);


  useEffect(() => {
    if (session) saveCalendars(session.login, calendars);
  }, [calendars, session]);
  useEffect(() => {
    if (session) saveEvents(session.login, events);
  }, [events, session]);

  const visibleCalIds = useMemo(
    () => new Set(calendars.filter((c) => c.visible).map((c) => c.id)),
    [calendars],
  );
  const settingsByCalendarId = useMemo(() => {
    if (!session || !agendaCfg) return {} as Record<string, AgendaSettings>;
    return Object.fromEntries(
      calendars.map((c) => [c.id, loadSettings(session.login, c.id)]),
    ) as Record<string, AgendaSettings>;
  }, [agendaCfg, calendars, session]);
  const activeAgendaConfigs = useMemo(() => {
    const visibleSpecific = calendars
      .filter((c) => c.visible)
      .map((c) => settingsByCalendarId[c.id])
      .filter(Boolean);
    return visibleSpecific.length > 0 ? visibleSpecific : agendaCfg ? [agendaCfg] : [];
  }, [agendaCfg, calendars, settingsByCalendarId]);
  const activeSlotMinutes = agendaCfg?.intervalDisplay ?? 60;
  const activeWorkingRange = useMemo(
    () => workingRangeForConfigs(activeAgendaConfigs),
    [activeAgendaConfigs],
  );
  const calById = useMemo(
    () => Object.fromEntries(calendars.map((c) => [c.id, c])),
    [calendars],
  );

  const filteredCalendars = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? calendars.filter((c) => c.name.toLowerCase().includes(q)) : calendars;
  }, [calendars, search]);

  const grouped = useMemo(() => {
    return {
      personal: filteredCalendars.filter((c) => c.group === "personal"),
      team: filteredCalendars.filter((c) => c.group === "team"),
      shared: filteredCalendars.filter((c) => c.group === "shared"),
    };
  }, [filteredCalendars]);

  const monthDays = useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );
  const visibleMonthDays = useMemo(
    () => monthDays.filter((d) => enabledByAnyConfig(d, activeAgendaConfigs)),
    [activeAgendaConfigs, monthDays],
  );
  const visibleTimeGridDays = useMemo(() => {
    const days = view === "week" ? weekDays(cursor) : [cursor];
    return days.filter((d) => enabledByAnyConfig(d, activeAgendaConfigs));
  }, [activeAgendaConfigs, cursor, view]);
  const visibleWeekdayIndexes = useMemo(() => {
    if (activeAgendaConfigs.length === 0) return DAY_INDEX_KEYS.map((_, i) => i);
    return DAY_INDEX_KEYS
      .map((key, index) => ({ key, index }))
      .filter(({ key }) => activeAgendaConfigs.some((cfg) => cfg.days[key]?.enabled))
      .map(({ index }) => index);
  }, [activeAgendaConfigs]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      if (!visibleCalIds.has(e.calendarId)) continue;
      (map[e.date] ??= []).push(e);
    }
    return map;
  }, [events, visibleCalIds]);

  function toggleCal(id: string) {
    setCalendars((cs) => cs.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));
  }
  function deleteCal(id: string) {
    if (!confirm("Excluir este calendário e todos os seus eventos?")) return;
    setCalendars((cs) => cs.filter((c) => c.id !== id));
    setEvents((es) => es.filter((e) => e.calendarId !== id));
  }
  function logout() {
    clearSession();
    navigate({ to: "/login" });
  }

  function openQuickEvent() {
    const snap = Math.max(5, activeSlotMinutes || 60);
    const day = nextEnabledDate(new Date(), activeAgendaConfigs);
    const range = workingRangeForDayConfigs(day, activeAgendaConfigs) ?? activeWorkingRange;
    const startMinute = Math.max(range.startMinute, ceilToStep(range.startMinute, snap));
    const endMinute = Math.min(range.endMinute, startMinute + Math.max(5, agendaCfg?.defaultDuration ?? 60));
    setShowCreateEvt({ date: fmtDate(day), start: hhmm(startMinute), end: hhmm(Math.max(startMinute + 5, endMinute)) });
  }

  if (!session) return null;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={logoApae} alt="APAE" className="h-9 w-auto" />
          <div className="leading-tight">
            <div className="text-sm font-bold">CAES · Agenda</div>
            <div className="text-xs text-muted-foreground">APAE — Santa Maria de Jetibá-ES</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden text-right text-xs text-muted-foreground sm:block">
            <div className="font-semibold text-foreground">{session.login}</div>
            <div className="capitalize">{session.role === "master" ? "Master (Dev)" : "Administrador"}</div>
          </div>
          {session.role === "master" && (
            <Button size="sm" variant="outline" onClick={() => setShowMaster(true)}>
              <Settings className="h-4 w-4" /> Master
            </Button>
          )}
          <Button
            size="icon"
            variant="outline"
            aria-label="Configurações do sistema"
            title="Configurações do sistema"
            onClick={() => navigate({ to: "/sistema" })}
          >
            <Sliders className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            aria-label="Dashboard"
            title="Dashboard"
            onClick={() => navigate({ to: "/dashboard" })}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={logout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-sidebar p-4 md:flex">
          <div className="mb-4 flex items-center gap-2">
            <Button
              onClick={() => setShowCreateCal(true)}
              className="flex-1 justify-start rounded-full"
            >
              <Plus className="h-4 w-4" /> Criar Agenda
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="Configurações da agenda"
              onClick={() => navigate({ to: "/configuracoes" })}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* mini calendar */}
          <MiniCalendar cursor={cursor} onPick={(d) => setCursor(d)} />

          <div className="mt-4 mb-2 flex items-center gap-2 rounded-md border border-border bg-background px-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar agendas"
              className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <CalGroup title="Minhas Agendas" cals={grouped.personal} onToggle={toggleCal} onDelete={deleteCal} />
            {grouped.team.length > 0 && (
              <CalGroup title="Equipe" cals={grouped.team} onToggle={toggleCal} onDelete={deleteCal} />
            )}
            {grouped.shared.length > 0 && (
              <CalGroup title="Compartilhados" cals={grouped.shared} onToggle={toggleCal} onDelete={deleteCal} />
            )}
          </div>
        </aside>


        {/* Main */}
        <main className="min-w-0 flex-1 overflow-auto p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>
                Hoje
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setCursor(shiftCursor(cursor, view, -1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setCursor(shiftCursor(cursor, view, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="ml-2 text-xl font-bold">{headerLabel(cursor, view)}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-border bg-card p-0.5">
                {(["month", "week", "day"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded px-3 py-1 text-xs font-semibold ${
                      view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
                  </button>
                ))}
              </div>
              <BirthdayBell />

              {view !== "month" && (
                <div className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1">
                  <button
                    aria-label="Diminuir zoom"
                    className="px-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setHourHeight((h) => Math.max(24, h - 12))}
                  >−</button>
                  <span className="w-14 text-center text-xs">{hourHeight}px/h</span>
                  <button
                    aria-label="Aumentar zoom"
                    className="px-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setHourHeight((h) => Math.min(160, h + 12))}
                  >+</button>
                </div>
              )}
              <Button onClick={openQuickEvent}>
                <Plus className="h-4 w-4" /> Evento
              </Button>
            </div>
          </div>

          {view === "month" && (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div
                className="grid border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                style={{ gridTemplateColumns: `repeat(${visibleWeekdayIndexes.length || 1}, minmax(0, 1fr))` }}
              >
                {visibleWeekdayIndexes.map((dayIndex) => (
                  <div key={dayIndex} className="px-2 py-2 text-center">{WEEKDAYS[dayIndex]}</div>
                ))}
              </div>
              <div
                className="grid grid-rows-6"
                style={{ gridTemplateColumns: `repeat(${visibleWeekdayIndexes.length || 1}, minmax(0, 1fr))` }}
              >
                {visibleMonthDays.map((d) => {
                  const key = fmtDate(d);
                  const inMonth = d.getMonth() === cursor.getMonth();
                  const isToday = key === fmtDate(new Date());
                  const dayEvts = eventsByDay[key] ?? [];
                  return (
                    <button
                      key={key}
                      onClick={() => setShowCreateEvt({ date: key })}
                      className={`group relative min-h-[110px] border-b border-r border-border p-1.5 text-left transition hover:bg-accent/40 ${
                        inMonth ? "" : "bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <div className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday ? "bg-primary text-primary-foreground" : ""
                      }`}>
                        {d.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvts.slice(0, 3).map((e) => {
                          const c = calById[e.calendarId];
                          return (
                            <div
                              key={e.id}
                              className="truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                              style={{ backgroundColor: c?.color ?? "#64748b" }}
                              title={e.title}
                            >
                              {e.startTime ? `${e.startTime} ` : ""}{e.title}
                            </div>
                          );
                        })}
                        {dayEvts.length > 3 && (
                          <div className="text-[11px] text-muted-foreground">
                            +{dayEvts.length - 3} mais
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(view === "week" || view === "day") && (
            <TimeGrid
              days={visibleTimeGridDays}
              events={events}
              calById={calById}
              visibleCalIds={visibleCalIds}
              hourHeight={hourHeight}
              slotMinutes={activeSlotMinutes}
              defaultDuration={agendaCfg?.defaultDuration ?? 60}
              workingRange={activeWorkingRange}
              activeAgendaConfigs={activeAgendaConfigs}
              onSlotClick={(date, start, end) => setShowCreateEvt({ date, start, end })}
            />
          )}
        </main>
      </div>


      {/* Create calendar modal */}
      <CreateCalendarDialog
        open={showCreateCal}
        onClose={() => setShowCreateCal(false)}
        existing={calendars}
        onCreate={(c) => setCalendars((cs) => [...cs, c])}
      />

      {/* Create event modal */}
      <CreateEventDialog
        open={!!showCreateEvt}
        date={showCreateEvt?.date ?? fmtDate(new Date())}
        initialStart={showCreateEvt?.start}
        initialEnd={showCreateEvt?.end}
        calendars={calendars}
        onClose={() => setShowCreateEvt(null)}
        onCreate={(e) => setEvents((es) => [...es, e])}
      />

      {/* Master settings */}
      {session.role === "master" && (
        <MasterDialog open={showMaster} onClose={() => setShowMaster(false)} />
      )}
    </div>
  );
}

// ---------- sub-components ----------
function MiniCalendar({ cursor, onPick }: { cursor: Date; onPick: (d: Date) => void }) {
  const days = buildMonthGrid(cursor.getFullYear(), cursor.getMonth());
  const today = fmtDate(new Date());
  return (
    <div className="rounded-md border border-border bg-card p-2">
      <div className="mb-1 text-center text-xs font-semibold">
        {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
      </div>
      <div className="grid grid-cols-7 text-[10px] text-muted-foreground">
        {WEEKDAYS.map((w) => <div key={w} className="text-center">{w[0]}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const key = fmtDate(d);
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = key === today;
          return (
            <button
              key={key}
              onClick={() => onPick(d)}
              className={`m-0.5 h-6 w-6 rounded-full text-[11px] ${
                isToday ? "bg-primary text-primary-foreground" : inMonth ? "hover:bg-accent" : "text-muted-foreground/60"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalGroup({
  title, cals, onToggle, onDelete,
}: {
  title: string; cals: Calendar[];
  onToggle: (id: string) => void; onDelete: (id: string) => void;
}) {
  if (cals.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</div>
      <ul className="space-y-0.5">
        {cals.map((c) => (
          <li key={c.id} className="group flex items-center gap-2 rounded px-1.5 py-1 hover:bg-accent/40">
            <button
              onClick={() => onToggle(c.id)}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition"
              style={{
                backgroundColor: c.visible ? c.color : "transparent",
                borderColor: c.color,
              }}
              aria-label={c.visible ? "Ocultar" : "Mostrar"}
            />
            <span className={`flex-1 truncate text-sm ${c.visible ? "" : "text-muted-foreground line-through"}`}>
              {c.name}
            </span>
            <button
              onClick={() => onDelete(c.id)}
              className="text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
              aria-label="Excluir calendário"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreateCalendarDialog({
  open, onClose, existing, onCreate,
}: {
  open: boolean; onClose: () => void;
  existing: Calendar[]; onCreate: (c: Calendar) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(suggestColor(existing));
  const [group, setGroup] = useState<Calendar["group"]>("personal");

  useEffect(() => {
    if (open) {
      setName("");
      setColor(suggestColor(existing));
      setGroup("personal");
    }
  }, [open, existing]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova agenda</DialogTitle>
          <DialogDescription>Defina nome, cor e categoria.</DialogDescription>

        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Financeiro" />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="flex gap-2">
              {(["personal", "team", "shared"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroup(g)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    group === g ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {g === "personal" ? "Pessoal" : g === "team" ? "Equipe" : "Compartilhado"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((p) => (
                <button
                  key={p}
                  onClick={() => setColor(p)}
                  className={`h-7 w-7 rounded-full border-2 ${color === p ? "border-foreground" : "border-transparent"}`}
                  style={{ backgroundColor: p }}
                  aria-label={p}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onCreate({
                id: crypto.randomUUID(),
                name: name.trim(),
                color,
                visible: true,
                group,
              });
              onClose();
            }}
          >
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateEventDialog({
  open, date, initialStart, initialEnd, calendars, onClose, onCreate,
}: {
  open: boolean; date: string; initialStart?: string; initialEnd?: string;
  calendars: Calendar[];
  onClose: () => void; onCreate: (e: CalendarEvent) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [calendarId, setCalendarId] = useState<string>(calendars[0]?.id ?? "");
  const [d, setD] = useState(date);
  const [start, setStart] = useState(initialStart ?? "09:00");
  const [end, setEnd] = useState(initialEnd ?? "10:00");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setCalendarId(calendars[0]?.id ?? "");
      setD(date);
      setStart(initialStart ?? "09:00");
      setEnd(initialEnd ?? "10:00");
    }
  }, [open, date, calendars, initialStart, initialEnd]);


  const selected = calendars.find((c) => c.id === calendarId);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo evento</DialogTitle>
          <DialogDescription>O evento herda a cor do calendário selecionado.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reunião, consulta…" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={d} onChange={(e) => setD(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Início</Label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Calendário</Label>
            <div className="flex flex-wrap gap-2">
              {calendars.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCalendarId(c.id)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                    calendarId === c.id ? "border-foreground" : "border-border"
                  }`}
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          {selected && (
            <div className="rounded-md border border-border p-2 text-xs text-muted-foreground">
              Cor herdada:
              <span
                className="ml-2 inline-block h-3 w-6 rounded align-middle"
                style={{ backgroundColor: selected.color }}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!title.trim() || !calendarId}
            onClick={() => {
              onCreate({
                id: crypto.randomUUID(),
                calendarId,
                title: title.trim(),
                description: description.trim() || undefined,
                date: d,
                startTime: start,
                endTime: end,
              });
              onClose();
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MasterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const current = getMaster();
  const [login, setLoginVal] = useState(current.login);
  const [password, setPassword] = useState(current.password);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      const m = getMaster();
      setLoginVal(m.login);
      setPassword(m.password);
      setSaved(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações Master</DialogTitle>
          <DialogDescription>
            Acesso supremo do desenvolvedor. Visível apenas para o perfil master.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Login / e-mail</Label>
            <Input value={login} onChange={(e) => setLoginVal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {saved && <p className="text-sm text-primary">Credenciais atualizadas.</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button
            disabled={!login.trim() || !password}
            onClick={() => {
              setMaster({ login: login.trim(), password });
              setSaved(true);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Time grid (week / day view) ----------
function TimeGrid({
  days, events, calById, visibleCalIds, hourHeight, slotMinutes, defaultDuration,
  workingRange, activeAgendaConfigs, onSlotClick,
}: {
  days: Date[];
  events: CalendarEvent[];
  calById: Record<string, Calendar>;
  visibleCalIds: Set<string>;
  hourHeight: number;
  slotMinutes: number;
  defaultDuration: number;
  workingRange: { startMinute: number; endMinute: number };
  activeAgendaConfigs: AgendaSettings[];
  onSlotClick: (date: string, start: string, end: string) => void;
}) {
  const todayKey = fmtDate(new Date());
  const snap = Math.max(5, slotMinutes || 60);
  const dur = Math.max(5, defaultDuration || 60);
  const startMinute = workingRange.startMinute;
  const endMinute = Math.max(startMinute + snap, workingRange.endMinute);
  const totalHeight = ((endMinute - startMinute) / 60) * hourHeight;
  const timeMarks = Array.from(
    { length: Math.floor((endMinute - startMinute) / snap) + 1 },
    (_, i) => startMinute + i * snap,
  ).filter((m) => m >= startMinute && m <= endMinute);

  function handleGridClick(day: Date, e: React.MouseEvent<HTMLDivElement>) {
    const dayRange = workingRangeForDayConfigs(day, activeAgendaConfigs) ?? workingRange;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rawMinutes = startMinute + Math.round((y / hourHeight) * 60 / snap) * snap;
    const minutes = Math.max(dayRange.startMinute, Math.min(dayRange.endMinute - snap, rawMinutes));
    const start = hhmm(minutes);
    const end = hhmm(Math.min(dayRange.endMinute, minutes + dur));
    onSlotClick(fmtDate(day), start, end);
  }

  if (days.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Nenhum dia habilitado para este período conforme as configurações da agenda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Day header */}
      <div
        className="grid border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div />
        {days.map((d) => {
          const isToday = fmtDate(d) === todayKey;
          return (
            <div key={fmtDate(d)} className="px-2 py-2 text-center">
              <div>{WEEKDAYS[d.getDay()]}</div>
              <div className={`mx-auto mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                isToday ? "bg-primary text-primary-foreground" : "text-foreground"
              }`}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable body */}
      <div className="max-h-[70vh] overflow-y-auto">
        <div
          className="relative grid"
          style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}
        >
          {/* Hours column */}
          <div className="relative" style={{ height: totalHeight }}>
            {timeMarks.map((m) => (
              <div
                key={m}
                className="absolute left-0 right-0 -translate-y-1/2 pr-2 text-right text-[11px] text-muted-foreground"
                style={{ top: ((m - startMinute) / 60) * hourHeight }}
              >
                {hhmm(m)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const key = fmtDate(day);
            const dayEvts = events.filter(
              (e) => e.date === key && visibleCalIds.has(e.calendarId),
            );
            return (
              <div
                key={key}
                onClick={(e) => handleGridClick(day, e)}
                className="relative cursor-pointer border-l border-border"
                style={{ height: totalHeight }}
              >
                {/* time lines based on intervalo de exibição */}
                {timeMarks.map((m) => (
                  <div
                    key={m}
                    className="absolute left-0 right-0 border-t border-border/60"
                    style={{ top: ((m - startMinute) / 60) * hourHeight }}
                  />
                ))}
                {/* events */}
                {dayEvts.map((ev) => {
                  const sm = minutesFromHHMM(ev.startTime ?? "09:00");
                  const em = Math.max(sm + 15, minutesFromHHMM(ev.endTime ?? ev.startTime ?? "10:00"));
                  if (em <= startMinute || sm >= endMinute) return null;
                  const clippedStart = Math.max(sm, startMinute);
                  const clippedEnd = Math.min(em, endMinute);
                  const top = ((clippedStart - startMinute) / 60) * hourHeight;
                  const height = ((clippedEnd - clippedStart) / 60) * hourHeight;
                  const color = calById[ev.calendarId]?.color ?? "#64748b";
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => e.stopPropagation()}
                      title={`${ev.startTime ?? ""}–${ev.endTime ?? ""} ${ev.title}`}
                      className="absolute left-1 right-1 overflow-hidden rounded px-1.5 py-1 text-[11px] font-medium text-white shadow"
                      style={{ top, height, backgroundColor: color }}
                    >
                      <div className="truncate">{ev.startTime ?? ""} {ev.title}</div>
                      {height > 32 && ev.description && (
                        <div className="truncate text-[10px] opacity-90">{ev.description}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Birthday bell ----------
function BirthdayBell() {
  // Placeholder lists — cadastro real será integrado depois.
  const users: { name: string; date: string }[] = [];
  const professionals: { name: string; date: string }[] = [];
  const total = users.length + professionals.length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          aria-label="Aniversariantes do dia"
          title="Aniversariantes do dia"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {total > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-border px-3 py-2 text-sm font-bold">
          Aniversariantes de hoje
        </div>
        <div className="max-h-80 space-y-3 overflow-y-auto p-3">
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" /> Usuários
            </div>
            {users.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-2 py-2 text-xs text-muted-foreground">
                Nenhum usuário aniversariante hoje.
              </div>
            ) : (
              <ul className="space-y-1 text-sm">
                {users.map((u) => (
                  <li key={u.name} className="flex justify-between">
                    <span>{u.name}</span>
                    <span className="text-xs text-muted-foreground">{u.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5" /> Profissionais
            </div>
            {professionals.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-2 py-2 text-xs text-muted-foreground">
                Nenhum profissional aniversariante hoje.
              </div>
            ) : (
              <ul className="space-y-1 text-sm">
                {professionals.map((p) => (
                  <li key={p.name} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}


