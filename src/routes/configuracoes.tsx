import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Save, Plus, Trash2, Eye, EyeOff, HelpCircle, Settings as Gear,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import bgImage from "@/assets/bg-configuracoes.jpg";
import logoApae from "@/assets/logo-apae.png";
import { getSession, type Session } from "@/lib/auth";
import {
  loadCalendars, saveCalendars, suggestColor, PALETTE, type Calendar,
} from "@/lib/calendar-store";
import {
  loadSettings, saveSettings, defaultSettings,
  loadStatuses, saveStatuses, type StatusItem,
  loadHolidays, saveHolidays, type Holiday, type HolidayScope,
  REMINDER_OPTIONS, DAY_KEYS, DAY_LABEL, type AgendaSettings, type DayKey,
} from "@/lib/agenda-settings";

type SearchParams = { agenda?: string; tab?: "geral" | "status" | "feriado" };

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — CAES Agenda" }] }),
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    agenda: typeof s.agenda === "string" ? s.agenda : undefined,
    tab: (s.tab as SearchParams["tab"]) ?? "geral",
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const navigate = useNavigate();
  const { agenda: agendaParam, tab } = useSearch({ from: "/configuracoes" });
  const [session, setSession] = useState<Session | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [scope, setScope] = useState<string>(agendaParam ?? "default"); // "default" | calendarId
  const [settings, setSettings] = useState<AgendaSettings>(defaultSettings());
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // dialogs
  const [showCreateAgenda, setShowCreateAgenda] = useState(false);
  const [showCreateStatus, setShowCreateStatus] = useState(false);
  const [showCreateHoliday, setShowCreateHoliday] = useState(false);

  // status/holiday filters
  const [statusSearch, setStatusSearch] = useState("");
  const [holidaySearch, setHolidaySearch] = useState("");
  const [holYear, setHolYear] = useState<number | "todos">(new Date().getFullYear());
  const [holMonth, setHolMonth] = useState<number | "todos">("todos");

  useEffect(() => {
    const s = getSession();
    if (!s) { navigate({ to: "/login" }); return; }
    setSession(s);
    const cals = loadCalendars(s.login).filter(
      (c) => c.name.toLowerCase() !== s.login.toLowerCase(),
    );
    setCalendars(cals);
    setSettings(loadSettings(s.login, scope));
    setStatuses(loadStatuses(s.login));
    setHolidays(loadHolidays(s.login));
  }, [navigate, scope]);

  function handleSave() {
    if (!session) return;
    saveSettings(session.login, scope, settings);
    saveStatuses(session.login, statuses);
    saveHolidays(session.login, holidays);
    toast.success(
      scope === "default"
        ? "Configurações padrão salvas para todas as agendas."
        : `Configurações salvas para "${calendars.find((c) => c.id === scope)?.name ?? "agenda"}".`,
    );
  }

  function applyAsDefault() {
    if (!session) return;
    saveSettings(session.login, "default", settings);
    toast.success("Salvo como padrão para todas as agendas.");
  }

  if (!session) return null;

  const scopeLabel =
    scope === "default" ? "Padrão · todas as agendas"
    : (calendars.find((c) => c.id === scope)?.name ?? "Agenda");

  return (
    <TooltipProvider>
      <div
        className="min-h-screen bg-background"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.96)), url(${bgImage})`,
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
        }}
      >
        {/* header */}
        <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
            <div className="flex items-center gap-3">
              <Link to="/app" className="flex items-center gap-3">
                <img src={logoApae} alt="APAE" className="h-9 w-auto" />
                <div className="leading-tight">
                  <div className="text-sm font-bold">CAES · Configurações</div>
                  <div className="text-xs text-muted-foreground">{scopeLabel}</div>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/app" })}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              {scope !== "default" && (
                <Button variant="outline" size="sm" onClick={applyAsDefault}>
                  Salvar como padrão
                </Button>
              )}
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4" /> Salvar
              </Button>
            </div>
          </div>

          {/* Scope selector */}
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 border-t border-border/60 bg-muted/30 px-6 py-2 text-sm">
            <span className="font-semibold">Escopo:</span>
            <button
              onClick={() => setScope("default")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                scope === "default"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background hover:bg-accent"
              }`}
            >
              Padrão (todas)
            </button>
            {calendars.map((c) => (
              <button
                key={c.id}
                onClick={() => setScope(c.id)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition ${
                  scope === c.id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background hover:bg-accent"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                {c.name}
              </button>
            ))}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setShowCreateAgenda(true)}>
              <Plus className="h-4 w-4" /> Criar Agenda
            </Button>
          </div>
        </header>

        {/* tabs */}
        <main className="mx-auto max-w-7xl px-6 py-6">
          <Tabs defaultValue={tab ?? "geral"} className="w-full">
            <TabsList className="h-12 w-full justify-start gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
              <TabsTrigger
                value="geral"
                className="rounded-lg px-5 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow"
              >
                <Gear className="mr-2 h-4 w-4" /> Configurações Gerais
              </TabsTrigger>
              <TabsTrigger
                value="status"
                className="rounded-lg px-5 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow"
              >
                Status
              </TabsTrigger>
              <TabsTrigger
                value="feriado"
                className="rounded-lg px-5 py-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow"
              >
                Feriado
              </TabsTrigger>
            </TabsList>

            {/* ---- General tab ---- */}
            <TabsContent value="geral" className="mt-6 space-y-8">
              <GeneralPanel settings={settings} setSettings={setSettings} />
              <DaysPanel settings={settings} setSettings={setSettings} />
              <AdditionalPanel settings={settings} setSettings={setSettings} />
            </TabsContent>

            {/* ---- Status tab ---- */}
            <TabsContent value="status" className="mt-6">
              <StatusPanel
                items={statuses}
                setItems={setStatuses}
                search={statusSearch}
                setSearch={setStatusSearch}
                onAdd={() => setShowCreateStatus(true)}
              />
            </TabsContent>

            {/* ---- Holiday tab ---- */}
            <TabsContent value="feriado" className="mt-6">
              <HolidayPanel
                items={holidays}
                setItems={setHolidays}
                year={holYear}
                month={holMonth}
                setYear={setHolYear}
                setMonth={setHolMonth}
                search={holidaySearch}
                setSearch={setHolidaySearch}
                onAdd={() => setShowCreateHoliday(true)}
              />
            </TabsContent>
          </Tabs>
        </main>

        {/* Create agenda dialog */}
        <CreateAgendaDialog
          open={showCreateAgenda}
          onClose={() => setShowCreateAgenda(false)}
          existing={calendars}
          onCreate={(c) => {
            const next = [...calendars, c];
            setCalendars(next);
            if (session) saveCalendars(session.login, next);
            setScope(c.id);
          }}
        />

        <CreateStatusDialog
          open={showCreateStatus}
          onClose={() => setShowCreateStatus(false)}
          onCreate={(s) => setStatuses((arr) => [...arr, s])}
        />

        <CreateHolidayDialog
          open={showCreateHoliday}
          onClose={() => setShowCreateHoliday(false)}
          onCreate={(h) => setHolidays((arr) => [...arr, h])}
        />
      </div>
    </TooltipProvider>
  );
}

/* ===================== panels ===================== */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-5 text-lg font-bold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-muted-foreground">{children}</p>;
}

function GeneralPanel({
  settings, setSettings,
}: { settings: AgendaSettings; setSettings: (s: AgendaSettings) => void }) {
  const set = <K extends keyof AgendaSettings>(k: K, v: AgendaSettings[K]) =>
    setSettings({ ...settings, [k]: v });

  return (
    <Section title="Configurações de visualização de agenda">
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <Label>Visualização padrão: *</Label>
          <Select value={settings.defaultView} onValueChange={(v) => set("defaultView", v as AgendaSettings["defaultView"])}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
            </SelectContent>
          </Select>
          <FieldHint>Formato de visualização padrão da agenda</FieldHint>
        </div>
        <div>
          <Label>Duração padrão: *</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input type="number" min={5} step={5} value={settings.defaultDuration}
              onChange={(e) => set("defaultDuration", Number(e.target.value))}/>
            <span className="text-sm text-muted-foreground">minutos</span>
          </div>
          <FieldHint>Duração padrão de um agendamento</FieldHint>
        </div>
        <div>
          <Label>Intervalo de exibição: *</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input type="number" min={5} step={5} value={settings.intervalDisplay}
              onChange={(e) => set("intervalDisplay", Number(e.target.value))}/>
            <span className="text-sm text-muted-foreground">minutos</span>
          </div>
          <FieldHint>Intervalo entre um horário e outro na exibição da agenda</FieldHint>
        </div>

        <div>
          <Label>Cor dos agendamentos:</Label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {PALETTE.map((p) => (
              <button key={p} onClick={() => set("color", p)}
                className={`h-7 w-7 rounded-full border-2 ${settings.color === p ? "border-foreground" : "border-transparent"}`}
                style={{ background: p }} aria-label={p} />
            ))}
            <input type="color" value={settings.color} onChange={(e) => set("color", e.target.value)}
              className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent" />
            <Input value={settings.color} onChange={(e) => set("color", e.target.value)}
              className="h-8 w-28 font-mono text-xs" />
          </div>
          <FieldHint>Cor aplicada aos agendamentos com status "Agendado" deste profissional.</FieldHint>
        </div>

        <div>
          <Label>Frequência:</Label>
          <Select value={settings.frequency} onValueChange={(v) => set("frequency", v as AgendaSettings["frequency"])}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="diaria">Diariamente</SelectItem>
              <SelectItem value="semanal">Semanalmente</SelectItem>
              <SelectItem value="quinzenal">Quinzenalmente</SelectItem>
              <SelectItem value="mensal">Mensalmente</SelectItem>
            </SelectContent>
          </Select>
          <FieldHint>Frequência de repetição</FieldHint>
        </div>
        <div>
          <Label>Repetições: *</Label>
          <Input className="mt-1" type="number" min={1} value={settings.repetitions}
            onChange={(e) => set("repetitions", Number(e.target.value))} />
          <FieldHint>Número de repetições padrão para agendamentos repetidos</FieldHint>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <CheckboxField
          label="Mostrar aniversariantes"
          hint="Exibe os aniversários na parte superior da agenda"
          checked={settings.showBirthdays} onChange={(v) => set("showBirthdays", v)} />
        <CheckboxField
          label="Habilitar arrasta e solta na agenda"
          hint="Permite alterar horários dos agendamentos no estilo arrasta e solta"
          checked={settings.enableDragDrop} onChange={(v) => set("enableDragDrop", v)} />
        <CheckboxField
          label="Delimitar horário de agendamentos"
          hint="Delimita horário de início conforme a duração padrão"
          checked={settings.limitWorkingHours} onChange={(v) => set("limitWorkingHours", v)} />
        <CheckboxField
          label="Mostrar nome do profissional"
          hint="Exibe o nome do profissional nos agendamentos."
          checked={settings.showProfessionalName} onChange={(v) => set("showProfessionalName", v)} />
      </div>
    </Section>
  );
}

function CheckboxField({
  label, hint, checked, onChange,
}: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-3">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-1" />
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function DaysPanel({
  settings, setSettings,
}: { settings: AgendaSettings; setSettings: (s: AgendaSettings) => void }) {
  function update(day: DayKey, patch: Partial<AgendaSettings["days"][DayKey]>) {
    setSettings({
      ...settings,
      days: { ...settings.days, [day]: { ...settings.days[day], ...patch } },
    });
  }
  return (
    <Section title="Dias para exibir na agenda *">
      <div className="hidden grid-cols-12 gap-2 px-2 pb-2 text-xs font-semibold text-muted-foreground md:grid">
        <div className="col-span-1">Dia</div>
        <div className="col-span-5">Horário de expediente</div>
        <div className="col-span-6">Horário de intervalo</div>
      </div>
      <div className="space-y-2">
        {DAY_KEYS.map((d) => {
          const cfg = settings.days[d];
          return (
            <div key={d} className="grid grid-cols-1 items-center gap-2 rounded-md border border-border bg-background/60 px-2 py-2 md:grid-cols-12">
              <div className="col-span-1 flex items-center gap-2">
                <Checkbox checked={cfg.enabled} onCheckedChange={(v) => update(d, { enabled: !!v })} />
                <span className="text-sm font-semibold">{DAY_LABEL[d]}</span>
              </div>
              <div className="col-span-5 grid grid-cols-2 gap-2">
                <TimePair label="das" value={cfg.workStart} disabled={!cfg.enabled}
                  onChange={(v) => update(d, { workStart: v })} />
                <TimePair label="às" value={cfg.workEnd} disabled={!cfg.enabled}
                  onChange={(v) => update(d, { workEnd: v })} />
              </div>
              <div className="col-span-6 grid grid-cols-2 gap-2">
                <TimePair label="das" value={cfg.breakStart} disabled={!cfg.enabled}
                  onChange={(v) => update(d, { breakStart: v })} />
                <TimePair label="às" value={cfg.breakEnd} disabled={!cfg.enabled}
                  onChange={(v) => update(d, { breakEnd: v })} />
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function TimePair({ label, value, disabled, onChange }: {
  label: string; value: string; disabled?: boolean; onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input type="time" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm outline-none disabled:opacity-50" />
    </label>
  );
}

function AdditionalPanel({
  settings, setSettings,
}: { settings: AgendaSettings; setSettings: (s: AgendaSettings) => void }) {
  const set = <K extends keyof AgendaSettings>(k: K, v: AgendaSettings[K]) =>
    setSettings({ ...settings, [k]: v });
  return (
    <Section title="Configurações adicionais">
      <div className="grid gap-4 md:grid-cols-3">
        <CheckboxField
          label="Relatórios diários"
          hint="Envia diariamente um e-mail sobre a agenda do dia e relatórios de desempenho de atendimentos para o profissional"
          checked={settings.dailyReports} onChange={(v) => set("dailyReports", v)} />
        <CheckboxField
          label="Limite de atendimentos por horário"
          hint="Define um limite de atendimentos por horário para o profissional"
          checked={settings.limitAppointmentsPerSlot} onChange={(v) => set("limitAppointmentsPerSlot", v)} />
        <div className="flex gap-3">
          <Checkbox checked={settings.adjustAfterInterval}
            onCheckedChange={(v) => set("adjustAfterInterval", !!v)} className="mt-1" />
          <div>
            <div className="flex items-center gap-1 text-sm font-semibold">
              Ajustar o horário posterior ao intervalo.
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button"><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-foreground text-background">
                  Ao marcar essa opção, na busca por horários vagos do profissional, ao invés
                  de todos os horários seguintes serem ajustados conforme o horário final do
                  intervalo e a duração padrão dos atendimentos, somente o horário seguinte
                  ao intervalo será exibido com o horário restante da duração padrão e não
                  haverá interferência dos demais horários vagos.
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xs text-muted-foreground">
              Na busca de horários vagos da agenda, ajustar somente o horário vago posterior ao
              intervalo, conforme o horário restante da duração padrão.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <ReminderField label="Lembrete E-mail:"
          hint="Envia um e-mail para o paciente com o lembrete de atendimento"
          value={settings.emailReminder} onChange={(v) => set("emailReminder", v)} />
        <ReminderField label="Lembrete SMS:"
          hint="Ativa automaticamente o lembrete SMS para todos os novos agendamentos realizados"
          value={settings.smsReminder} onChange={(v) => set("smsReminder", v)} />
        <ReminderField label="Lembrete Whatsapp:"
          hint="Ativa automaticamente o lembrete via WhatsApp para todos os novos agendamentos realizados"
          value={settings.whatsappReminder} onChange={(v) => set("whatsappReminder", v)} />
      </div>
    </Section>
  );
}

function ReminderField({
  label, hint, value, onChange,
}: { label: string; hint?: string; value: string; onChange: (v: never) => void }) {
  return (
    <div>
      <Label className="font-bold">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as never)}>
        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          {REMINDER_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

/* ===================== Status ===================== */

function StatusPanel({
  items, setItems, search, setSearch, onAdd,
}: {
  items: StatusItem[]; setItems: (i: StatusItem[]) => void;
  search: string; setSearch: (s: string) => void;
  onAdd: () => void;
}) {
  const [showCols, setShowCols] = useState({ status: true, acoes: true });
  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase().trim())),
    [items, search],
  );
  function toggleHide(id: string) {
    setItems(items.map((i) => (i.id === id ? { ...i, hidden: !i.hidden } : i)));
  }
  function remove(id: string) {
    if (!confirm("Excluir este status?")) return;
    setItems(items.filter((i) => i.id !== id));
  }
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setItems([...items])}>↻</Button>
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs">
              <span className="grid h-4 w-4 grid-cols-2 grid-rows-2 gap-px">
                <span className="bg-current" /><span className="bg-current" />
                <span className="bg-current" /><span className="bg-current" />
              </span>
            </summary>
            <div className="absolute z-10 mt-1 w-40 rounded-md border border-border bg-popover p-2 shadow-md">
              <label className="flex items-center gap-2 px-1 py-1 text-xs">
                <Checkbox checked={showCols.status} onCheckedChange={(v) => setShowCols({ ...showCols, status: !!v })} />
                Status
              </label>
              <label className="flex items-center gap-2 px-1 py-1 text-xs">
                <Checkbox checked={showCols.acoes} onCheckedChange={(v) => setShowCols({ ...showCols, acoes: !!v })} />
                Ações
              </label>
            </div>
          </details>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Pesquisar" value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-48" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (confirm("Limpar busca?")) setSearch(""); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
          <Button onClick={onAdd} className="ml-2">
            <Plus className="h-4 w-4" /> Cadastrar novo
          </Button>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/20 text-left">
            {showCols.status && <th className="px-4 py-2 font-semibold">Status</th>}
            {showCols.acoes && <th className="w-32 px-4 py-2 text-center font-semibold">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-accent/30">
              {showCols.status && (
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-sm border border-border" style={{ background: s.color }} />
                    <span className={s.hidden ? "text-muted-foreground line-through" : ""}>{s.name}</span>
                  </div>
                  {s.description && (
                    <div className="ml-7 mt-0.5 text-xs text-muted-foreground">{s.description}</div>
                  )}
                </td>
              )}
              {showCols.acoes && (
                <td className="px-4 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <Button size="sm" variant="secondary" className="h-7 bg-amber-500 text-white hover:bg-amber-600"
                      onClick={() => toggleHide(s.id)}>
                      {s.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      <span className="ml-1 text-xs">{s.hidden ? "Mostrar" : "Ocultar"}</span>
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(s.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={2}>
              Nenhum status encontrado.
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ===================== Holiday ===================== */

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const SCOPE_LABEL: Record<HolidayScope, string> = {
  nacional: "Feriado nacional",
  estadual: "Feriado estadual",
  municipal: "Feriado municipal",
  facultativo: "Feriado facultativo",
};

function HolidayPanel({
  items, setItems, year, month, setYear, setMonth, search, setSearch, onAdd,
}: {
  items: Holiday[]; setItems: (i: Holiday[]) => void;
  year: number | "todos"; month: number | "todos";
  setYear: (y: number | "todos") => void; setMonth: (m: number | "todos") => void;
  search: string; setSearch: (s: string) => void;
  onAdd: () => void;
}) {
  const years = useMemo(() => {
    const cur = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => cur - 2 + i);
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter((h) => {
        const d = new Date(h.date + "T00:00:00");
        if (year !== "todos" && d.getFullYear() !== year) return false;
        if (month !== "todos" && d.getMonth() !== month) return false;
        if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [items, year, month, search]);

  function setAllow(id: string, allow: boolean) {
    setItems(items.map((h) => (h.id === id ? { ...h, allowAppointments: allow } : h)));
  }
  function remove(id: string) {
    if (!confirm("Excluir este feriado?")) return;
    setItems(items.filter((h) => h.id !== id));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div>
            <Label className="text-xs">Ano:</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(v === "todos" ? "todos" : Number(v))}>
              <SelectTrigger className="mt-1 h-9 w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Mês:</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(v === "todos" ? "todos" : Number(v))}>
              <SelectTrigger className="mt-1 h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {MONTHS.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={onAdd}><Plus className="h-4 w-4" /> Cadastrar novo</Button>
      </div>

      <div className="mb-2 flex items-center justify-end">
        <Input placeholder="Pesquisar" value={search} onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-56" />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/20 text-left">
            <th className="px-3 py-2 font-semibold">Nome</th>
            <th className="px-3 py-2 font-semibold">Data</th>
            <th className="px-3 py-2 font-semibold">Permissão de agendamentos</th>
            <th className="w-20 px-3 py-2 text-center font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((h) => {
            const d = new Date(h.date + "T00:00:00");
            const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
            return (
              <tr key={h.id} className="border-b border-border/60 last:border-0 hover:bg-accent/30">
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{h.name}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                      {SCOPE_LABEL[h.scope]}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{dateStr}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button size="sm" variant={!h.allowAppointments ? "default" : "outline"}
                      className={!h.allowAppointments ? "h-7 bg-amber-500 text-white hover:bg-amber-600" : "h-7"}
                      onClick={() => setAllow(h.id, false)}>✕ Não</Button>
                    <Button size="sm" variant={h.allowAppointments ? "default" : "outline"}
                      className={h.allowAppointments ? "h-7 bg-emerald-600 text-white hover:bg-emerald-700" : "h-7"}
                      onClick={() => setAllow(h.id, true)}>✓ Sim</Button>
                  </div>
                </td>
                <td className="px-3 py-2 text-center">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(h.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={4} className="px-3 py-10 text-center text-sm text-muted-foreground">
              Nenhum feriado encontrado.
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ===================== Dialogs ===================== */

function CreateAgendaDialog({
  open, onClose, existing, onCreate,
}: {
  open: boolean; onClose: () => void; existing: Calendar[];
  onCreate: (c: Calendar) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(suggestColor(existing));
  const [group, setGroup] = useState<Calendar["group"]>("personal");

  useEffect(() => {
    if (open) { setName(""); setColor(suggestColor(existing)); setGroup("personal"); }
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Fonoaudiologia" />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="flex gap-2">
              {(["personal", "team", "shared"] as const).map((g) => (
                <button key={g} onClick={() => setGroup(g)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    group === g ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {g === "personal" ? "Pessoal" : g === "team" ? "Equipe" : "Compartilhado"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((p) => (
                <button key={p} onClick={() => setColor(p)}
                  className={`h-7 w-7 rounded-full border-2 ${color === p ? "border-foreground" : "border-transparent"}`}
                  style={{ background: p }} />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!name.trim()} onClick={() => {
            onCreate({ id: crypto.randomUUID(), name: name.trim(), color, visible: true, group });
            onClose();
          }}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateStatusDialog({
  open, onClose, onCreate,
}: { open: boolean; onClose: () => void; onCreate: (s: StatusItem) => void }) {
  const [form, setForm] = useState<StatusItem>(() => ({
    id: "", name: "", color: "#86efac",
    hidden: false, deleteFinancial: false, availableLimited: false,
    notCountProfessional: false, deleteReminders: false, notCountRoom: false,
    sessionControl: "descontar", packageCommission: false,
  }));
  useEffect(() => {
    if (open) setForm({
      id: "", name: "", color: "#86efac",
      hidden: false, deleteFinancial: false, availableLimited: false,
      notCountProfessional: false, deleteReminders: false, notCountRoom: false,
      sessionControl: "descontar", packageCommission: false,
    });
  }, [open]);
  const set = <K extends keyof StatusItem>(k: K, v: StatusItem[K]) => setForm({ ...form, [k]: v });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Cadastrar novo status</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nome: *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Cor: *</Label>
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-border" />
                <Input value={form.color} onChange={(e) => set("color", e.target.value)}
                  className="font-mono text-xs" />
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <CheckboxField label="Deletar registros financeiros" checked={form.deleteFinancial}
              onChange={(v) => set("deleteFinancial", v)} />
            <CheckboxField label="Deletar lembretes" checked={form.deleteReminders}
              onChange={(v) => set("deleteReminders", v)} />
            <CheckboxField label="Disponível para profissionais limitados" checked={form.availableLimited}
              onChange={(v) => set("availableLimited", v)} />
            <CheckboxField label="Não contabiliza para o limite de agendamentos da sala"
              checked={form.notCountRoom} onChange={(v) => set("notCountRoom", v)} />
            <CheckboxField label="Não contabiliza para o limite de agendamentos do profissional"
              checked={form.notCountProfessional} onChange={(v) => set("notCountProfessional", v)} />
          </div>
          <div>
            <Label>Controle de sessão nos pacotes de atendimentos: *</Label>
            <Select value={form.sessionControl}
              onValueChange={(v) => set("sessionControl", v as StatusItem["sessionControl"])}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="descontar">Descontar sessão</SelectItem>
                <SelectItem value="liberar">Liberar sessão</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2">
              <CheckboxField label="Lançar comissão de pacote de atendimentos"
                checked={form.packageCommission} onChange={(v) => set("packageCommission", v)} />
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p><span className="font-semibold text-foreground">Descontar sessão:</span> usar em status
              que informem a falta do paciente sem aviso prévio ou que a sessão foi realizada.</p>
            <p className="mt-1"><span className="font-semibold text-foreground">Liberar sessão:</span> usar em
              status que informem o cancelamento com aviso prévio, podendo ser refeita em outra data.</p>
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea rows={2} value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!form.name.trim()} onClick={() => {
            onCreate({ ...form, id: crypto.randomUUID(), name: form.name.trim() });
            onClose();
          }}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateHolidayDialog({
  open, onClose, onCreate,
}: { open: boolean; onClose: () => void; onCreate: (h: Holiday) => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [scope, setScope] = useState<HolidayScope>("nacional");
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    if (open) { setName(""); setDate(""); setScope("nacional"); setAllow(false); }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Cadastrar novo feriado</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome: *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Data: *</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Marcar como:</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["nacional", "estadual", "municipal", "facultativo"] as HolidayScope[]).map((s) => (
                <label key={s} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition ${
                  scope === s ? "border-primary bg-primary/10" : "border-border"}`}>
                  <Checkbox checked={scope === s} onCheckedChange={() => setScope(s)} />
                  Feriado {s}
                </label>
              ))}
            </div>
          </div>
          <CheckboxField label="Permitir agendamentos neste dia" checked={allow} onChange={setAllow} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!name.trim() || !date} onClick={() => {
            onCreate({ id: crypto.randomUUID(), name: name.trim(), date, scope, allowAppointments: allow });
            onClose();
          }}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
