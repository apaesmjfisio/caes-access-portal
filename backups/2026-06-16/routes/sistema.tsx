import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Save, Phone, MessageSquare, Mail, Cake, Send, Calendar as CalIcon,
  Image as ImageIcon, Settings as Gear, UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import logoApae from "@/assets/logo-apae.png";
import bgImage from "@/assets/bg-configuracoes.jpg";
import { getSession, type Session } from "@/lib/auth";
import {
  loadSystemSettings, saveSystemSettings, defaultSystemSettings,
  REMINDER_TAGS, BIRTHDAY_TAGS, type SystemSettings,
} from "@/lib/system-settings";

type SidebarKey = "contato";

export const Route = createFileRoute("/sistema")({
  head: () => ({ meta: [{ title: "Configurações do Sistema — CAES" }] }),
  component: SystemPage,
});

function SystemPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [s, setS] = useState<SystemSettings>(defaultSystemSettings());
  const [section] = useState<SidebarKey>("contato");

  useEffect(() => {
    const sess = getSession();
    if (!sess) { navigate({ to: "/login" }); return; }
    setSession(sess);
    setS(loadSystemSettings(sess.login));
  }, [navigate]);

  function save() {
    if (!session) return;
    saveSystemSettings(session.login, s);
    toast.success("Configurações do sistema salvas.");
  }

  if (!session) return null;

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.97)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <Link to="/app" className="flex items-center gap-3">
            <img src={logoApae} alt="APAE" className="h-9 w-auto" />
            <div className="leading-tight">
              <div className="text-sm font-bold">CAES · Sistema</div>
              <div className="text-xs text-muted-foreground">Configurações premium do projeto</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/app" })}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <Button size="sm" onClick={save}>
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[220px_1fr]">
        {/* sidebar */}
        <aside className="rounded-xl border border-border bg-card p-2 shadow-sm">
          <div className="px-2 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Premium
          </div>
          <button
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
              section === "contato" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            <Phone className="h-4 w-4" /> Contato
          </button>
          <button
            onClick={() => navigate({ to: "/profissionais" })}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-accent"
          >
            <UserRound className="h-4 w-4" /> Profissional
          </button>
          <div className="mt-3 px-2 text-[11px] text-muted-foreground">
            Outras configurações premium serão adicionadas aqui.
          </div>
        </aside>

        {/* content */}
        <main>
          {section === "contato" && <ContatoSection s={s} setS={setS} onSave={save} />}
        </main>
      </div>
    </div>
  );
}

/* ============== Contato Section ============== */

function ContatoSection({
  s, setS, onSave,
}: { s: SystemSettings; setS: (s: SystemSettings) => void; onSave: () => void }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="h-11 w-full justify-start gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
          {[
            { v: "geral", l: "Geral", icon: <Gear className="mr-1.5 h-4 w-4" /> },
            { v: "whatsapp", l: "WhatsApp", icon: <MessageSquare className="mr-1.5 h-4 w-4" /> },
            { v: "email", l: "E-mail", icon: <Mail className="mr-1.5 h-4 w-4" /> },
            { v: "lembrete_auto", l: "Lembrete automático", icon: <Send className="mr-1.5 h-4 w-4" /> },
            { v: "lembrete_manual", l: "Lembrete manual", icon: <Send className="mr-1.5 h-4 w-4" /> },
            { v: "aniversario", l: "Aniversário", icon: <Cake className="mr-1.5 h-4 w-4" /> },
            { v: "enviadas", l: "Enviadas no período", icon: <CalIcon className="mr-1.5 h-4 w-4" /> },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {t.icon}{t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="geral" className="mt-5"><GeralPanel s={s} setS={setS} /></TabsContent>
        <TabsContent value="whatsapp" className="mt-5"><WhatsappPanel s={s} setS={setS} /></TabsContent>
        <TabsContent value="email" className="mt-5"><EmailPanel s={s} setS={setS} /></TabsContent>
        <TabsContent value="lembrete_auto" className="mt-5"><AutoReminderPanel s={s} setS={setS} /></TabsContent>
        <TabsContent value="lembrete_manual" className="mt-5"><ManualReminderPanel s={s} setS={setS} /></TabsContent>
        <TabsContent value="aniversario" className="mt-5"><BirthdayPanel s={s} setS={setS} /></TabsContent>
        <TabsContent value="enviadas" className="mt-5"><SentPanel s={s} setS={setS} /></TabsContent>
      </Tabs>

      <div className="flex justify-start">
        <Button onClick={onSave} className="bg-sky-500 hover:bg-sky-600 text-white">
          Salvar
        </Button>
      </div>
    </div>
  );
}

/* --- panels --- */

function SectionCard({
  title, icon, children,
}: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2 text-sm font-semibold">
        {icon}{title}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function GeralPanel({ s, setS }: { s: SystemSettings; setS: (v: SystemSettings) => void }) {
  const g = s.general;
  const upd = <K extends keyof typeof g>(k: K, v: (typeof g)[K]) =>
    setS({ ...s, general: { ...g, [k]: v } });

  function handleFile(file?: File | null) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => upd("logoDataUrl", r.result as string);
    r.readAsDataURL(file);
  }

  return (
    <SectionCard title="Geral" icon={<Gear className="h-4 w-4" />}>
      <div className="grid gap-5 md:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="font-bold">Nome da clínica:</Label>
              <Input value={g.clinicName} maxLength={60}
                onChange={(e) => upd("clinicName", e.target.value)} className="mt-1" />
              <p className="mt-1 text-xs text-amber-600">
                {Math.max(0, 60 - g.clinicName.length)} caracteres restantes
              </p>
            </div>
            <div>
              <Label className="font-bold">Telefone:</Label>
              <Input value={g.phone} onChange={(e) => upd("phone", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="font-bold">Endereço:</Label>
            <Input value={g.address} onChange={(e) => upd("address", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="font-bold">Site:</Label>
            <Input value={g.site} onChange={(e) => upd("site", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="font-bold">Enviar link de confirmação:</Label>
            <Select value={g.sendConfirmationLink}
              onValueChange={(v) => upd("sendConfirmationLink", v as "sim" | "nao")}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-6 text-center hover:bg-accent/30">
          {g.logoDataUrl ? (
            <img src={g.logoDataUrl} alt="Logo" className="h-28 w-28 rounded-md object-contain" />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
          <div className="text-sm font-semibold">Logo da clínica:</div>
          <div className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold">1:1</div>
          <div className="text-xs text-muted-foreground">
            Clique para fazer upload ou arraste a imagem aqui
          </div>
          <div className="text-[11px] text-sky-600">PNG, JPG ou JPEG (máx. 5MB)</div>
          <input type="file" accept="image/png,image/jpeg" className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
      </div>
    </SectionCard>
  );
}

function WhatsappPanel({ s, setS }: { s: SystemSettings; setS: (v: SystemSettings) => void }) {
  const w = s.whatsapp;
  return (
    <SectionCard title="WhatsApp" icon={<MessageSquare className="h-4 w-4" />}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label className="font-bold">Número de contato:</Label>
          <Input value={w.contactNumber} onChange={(e) => setS({ ...s, whatsapp: { ...w, contactNumber: e.target.value } })}
            className="mt-1" />
        </div>
        <div>
          <Label className="font-bold">Permitir confirmação pelo WhatsApp:</Label>
          <Select value={w.allowConfirmation}
            onValueChange={(v) => setS({ ...s, whatsapp: { ...w, allowConfirmation: v as "sim" | "nao" } })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sim">Sim</SelectItem>
              <SelectItem value="nao">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SectionCard>
  );
}

function EmailPanel({ s, setS }: { s: SystemSettings; setS: (v: SystemSettings) => void }) {
  return (
    <SectionCard title="E-mail" icon={<Mail className="h-4 w-4" />}>
      <div className="max-w-sm">
        <Label className="font-bold">Responder para:</Label>
        <Input type="email" value={s.email.replyTo}
          onChange={(e) => setS({ ...s, email: { replyTo: e.target.value } })} className="mt-1" />
      </div>
    </SectionCard>
  );
}

function TagBoard({
  tags, onPick, color = "emerald",
}: { tags: string[]; onPick: (t: string) => void; color?: "emerald" | "teal" }) {
  const cls =
    color === "emerald"
      ? "bg-emerald-500 hover:bg-emerald-600"
      : "bg-teal-500 hover:bg-teal-600";
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Etiquetas disponíveis para a mensagem:</div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <button key={t} type="button" onClick={() => onPick(t)}
            className={`rounded-md px-2 py-1 text-[11px] font-semibold text-white ${cls}`}>
            {t}
          </button>
        ))}
      </div>
      <p className="text-xs text-emerald-700">Clique em uma etiqueta para adicioná-la à mensagem.</p>
    </div>
  );
}

function MessageEditor({
  label, value, onChange, maxLen = 360, tags,
}: { label: string; value: string; onChange: (v: string) => void; maxLen?: number; tags: string[] }) {
  function append(t: string) { onChange(value + (value.endsWith(" ") || value === "" ? "" : " ") + t); }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <Textarea rows={8} value={value} maxLength={maxLen}
          onChange={(e) => onChange(e.target.value)} className="mt-1" />
        <p className="mt-1 text-xs text-amber-600">{Math.max(0, maxLen - value.length)} caracteres restantes</p>
      </div>
      <TagBoard tags={tags} onPick={append} />
    </div>
  );
}

function AutoReminderPanel({ s, setS }: { s: SystemSettings; setS: (v: SystemSettings) => void }) {
  const r = s.autoReminder;
  return (
    <SectionCard
      title="Lembrete de atendimento"
      icon={<>
        <CalIcon className="h-4 w-4" />
        <span className="ml-2 text-xs font-normal text-sky-600">envio automático ⚡</span>
      </>}
    >
      <Tabs defaultValue="whatsapp">
        <TabsList className="bg-transparent p-0">
          <TabsTrigger value="whatsapp" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none">
            <MessageSquare className="mr-1 h-4 w-4 text-emerald-600" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="sms" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none">
            <MessageSquare className="mr-1 h-4 w-4" /> SMS
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none">
            <Mail className="mr-1 h-4 w-4" /> E-mail
          </TabsTrigger>
        </TabsList>
        <TabsContent value="whatsapp" className="mt-4">
          <MessageEditor label="Conteúdo da mensagem:" value={r.whatsapp}
            onChange={(v) => setS({ ...s, autoReminder: { ...r, whatsapp: v } })}
            tags={REMINDER_TAGS} />
        </TabsContent>
        <TabsContent value="sms" className="mt-4">
          <MessageEditor label="Conteúdo da mensagem:" value={r.sms}
            onChange={(v) => setS({ ...s, autoReminder: { ...r, sms: v } })}
            tags={REMINDER_TAGS} />
        </TabsContent>
        <TabsContent value="email" className="mt-4">
          <MessageEditor label="Conteúdo da mensagem:" value={r.email}
            onChange={(v) => setS({ ...s, autoReminder: { ...r, email: v } })}
            tags={REMINDER_TAGS} />
        </TabsContent>
      </Tabs>
    </SectionCard>
  );
}

function ManualReminderPanel({ s, setS }: { s: SystemSettings; setS: (v: SystemSettings) => void }) {
  return (
    <SectionCard
      title="Lembrete de atendimento"
      icon={<>
        <CalIcon className="h-4 w-4" />
        <span className="ml-2 text-xs font-normal text-muted-foreground">envio manual</span>
      </>}
    >
      <MessageEditor label="Conteúdo da mensagem:" value={s.manualReminder.content}
        onChange={(v) => setS({ ...s, manualReminder: { content: v } })}
        tags={REMINDER_TAGS} />
    </SectionCard>
  );
}

function BirthdayPanel({ s, setS }: { s: SystemSettings; setS: (v: SystemSettings) => void }) {
  return (
    <SectionCard
      title="Mensagem de aniversário"
      icon={<>
        <Cake className="h-4 w-4" />
        <span className="ml-2 text-xs font-normal text-muted-foreground">envio manual</span>
      </>}
    >
      <MessageEditor label="Conteúdo da mensagem:" value={s.birthday.content}
        onChange={(v) => setS({ ...s, birthday: { content: v } })}
        maxLen={400} tags={BIRTHDAY_TAGS} />
    </SectionCard>
  );
}

function SentPanel({ s, setS }: { s: SystemSettings; setS: (v: SystemSettings) => void }) {
  const f = s.sentFilter;
  const upd = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setS({ ...s, sentFilter: { ...f, [k]: v } });
  const periodLabel = useMemo(() => {
    const fmt = (d: string) => {
      const x = new Date(d + "T00:00:00");
      return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
    };
    return `${fmt(f.start)} - ${fmt(f.end)}`;
  }, [f.start, f.end]);
  return (
    <SectionCard title="Enviadas no período">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label className="font-bold">Período:</Label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <Input type="date" value={f.start} onChange={(e) => upd("start", e.target.value)} />
            <Input type="date" value={f.end} onChange={(e) => upd("end", e.target.value)} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{periodLabel}</p>
        </div>
        <div>
          <Label className="font-bold">Paciente:</Label>
          <Input value={f.patient} onChange={(e) => upd("patient", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="font-bold">Telefone:</Label>
          <Input value={f.phone} onChange={(e) => upd("phone", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="font-bold">Status:</Label>
          <Select value={f.status} onValueChange={(v) => upd("status", v as typeof f.status)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="enviada">Enviada</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="falha">Falha</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-bold">Contabiliza no pacote:</Label>
          <Select value={f.countsInPackage} onValueChange={(v) => upd("countsInPackage", v as typeof f.countsInPackage)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="sim">Sim</SelectItem>
              <SelectItem value="nao">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SectionCard>
  );
}
