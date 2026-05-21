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
  ChevronLeft, ChevronRight, Plus, LogOut, Settings, Trash2, Search,
} from "lucide-react";
import logoApae from "@/assets/logo-apae.png";
import {
  getSession, clearSession, getMaster, setMaster, type Session,
} from "@/lib/auth";
import {
  loadCalendars, saveCalendars, loadEvents, saveEvents,
  suggestColor, PALETTE, type Calendar, type CalendarEvent,
} from "@/lib/calendar-store";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Agenda — CAES" }] }),
  component: CalendarApp,
});

// ---------- helpers ----------
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
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

// ---------- component ----------
function CalendarApp() {
  const navigate = useNavigate();
  const [session, setSessionState] = useState<Session | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [showCreateCal, setShowCreateCal] = useState(false);
  const [showCreateEvt, setShowCreateEvt] = useState<{ date: string } | null>(null);
  const [showMaster, setShowMaster] = useState(false);

  // hydrate session client-side
  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate({ to: "/login" });
      return;
    }
    setSessionState(s);
    setCalendars(loadCalendars(s.login));
    setEvents(loadEvents(s.login));
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
          <Button size="sm" variant="ghost" onClick={logout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-sidebar p-4 md:flex">
          <Button
            onClick={() => setShowCreateCal(true)}
            className="mb-4 w-full justify-start rounded-full"
          >
            <Plus className="h-4 w-4" /> Criar calendário
          </Button>

          {/* mini calendar */}
          <MiniCalendar cursor={cursor} onPick={(d) => setCursor(d)} />

          <div className="mt-4 mb-2 flex items-center gap-2 rounded-md border border-border bg-background px-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar calendários"
              className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <CalGroup title="Meus calendários" cals={grouped.personal} onToggle={toggleCal} onDelete={deleteCal} />
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
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>
                Hoje
              </Button>
              <Button size="icon" variant="ghost"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="ml-2 text-xl font-bold">
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </h2>
            </div>
            <Button onClick={() => setShowCreateEvt({ date: fmtDate(new Date()) })}>
              <Plus className="h-4 w-4" /> Evento
            </Button>
          </div>

          {/* Month grid */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {WEEKDAYS.map((w) => (
                <div key={w} className="px-2 py-2 text-center">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 grid-rows-6">
              {monthDays.map((d) => {
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
          <DialogTitle>Novo calendário</DialogTitle>
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
  open, date, calendars, onClose, onCreate,
}: {
  open: boolean; date: string; calendars: Calendar[];
  onClose: () => void; onCreate: (e: CalendarEvent) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [calendarId, setCalendarId] = useState<string>(calendars[0]?.id ?? "");
  const [d, setD] = useState(date);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setCalendarId(calendars[0]?.id ?? "");
      setD(date);
      setStart("09:00");
      setEnd("10:00");
    }
  }, [open, date, calendars]);

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
