import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Save, Plus, Trash2, Upload, UserPlus, Search, Eye, Pencil,
  Power, X, ImageIcon, FileSignature,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import logoApae from "@/assets/logo-apae.png";
import bgImage from "@/assets/bg-configuracoes.jpg";
import { getSession, type Session } from "@/lib/auth";
import { MaskedInput } from "@/components/MaskedInput";
import { maskCPF, validateCPF, maskCEP, maskTelefoneSmart, onlyDigits } from "@/lib/masks";
import {
  loadProfessionals, saveProfessionals, emptyProfessional,
  UFS, SEXOS, ESTADOS_CIVIS, PROFISSOES, PROFISSAO_TO_CONSELHO,
  isProfissaoRegulamentada, conselhoIdentType, listRegioes,
  CORES_AGENDA, DIAS_SEMANA,
  type Professional, type ProfessionalStatus, type AvailabilityDay,
} from "@/lib/professionals-store";

export const Route = createFileRoute("/profissionais")({
  head: () => ({ meta: [{ title: "Profissionais — CAES" }] }),
  component: ProfissionaisPage,
});

type ViewMode = "list" | "form" | "view";

function ProfissionaisPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [list, setList] = useState<Professional[]>([]);
  const [mode, setMode] = useState<ViewMode>("list");
  const [editing, setEditing] = useState<Professional | null>(null);
  const [viewing, setViewing] = useState<Professional | null>(null);

  // filtros
  const [q, setQ] = useState("");
  const [fProfissao, setFProfissao] = useState<string>("__all");
  const [fConselho, setFConselho] = useState<string>("__all");
  const [fStatus, setFStatus] = useState<string>("__all");

  useEffect(() => {
    const s = getSession();
    if (!s) { navigate({ to: "/login" }); return; }
    setSession(s);
    setList(loadProfessionals(s.login));
  }, [navigate]);

  const isMaster = session?.login === "master";

  const conselhosUnicos = useMemo(() => {
    const set = new Set<string>();
    list.forEach((p) => p.registroProf.conselho && set.add(p.registroProf.conselho));
    return Array.from(set).sort();
  }, [list]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const termDigits = onlyDigits(q);
    return list.filter((p) => {
      if (fProfissao !== "__all" && p.profissao !== fProfissao) return false;
      if (fConselho !== "__all" && p.registroProf.conselho !== fConselho) return false;
      if (fStatus !== "__all" && p.status !== fStatus) return false;
      if (!term) return true;
      return (
        p.nome.toLowerCase().includes(term) ||
        p.profissao.toLowerCase().includes(term) ||
        (termDigits && onlyDigits(p.cpf).includes(termDigits)) ||
        p.cpf.toLowerCase().includes(term)
      );
    });
  }, [list, q, fProfissao, fConselho, fStatus]);

  if (!session) return null;

  function startNew() { setEditing(emptyProfessional()); setMode("form"); }
  function startEdit(p: Professional) { setEditing(JSON.parse(JSON.stringify(p))); setMode("form"); }
  function startView(p: Professional) { setViewing(p); setMode("view"); }

  function toggleStatus(p: Professional) {
    if (!session) return;
    const next = list.map((x) => x.id === p.id
      ? { ...x, status: (x.status === "Ativo" ? "Inativo" : "Ativo") as ProfessionalStatus, updatedAt: new Date().toISOString() }
      : x);
    setList(next);
    saveProfessionals(session.login, next);
    toast.success(`Profissional ${p.status === "Ativo" ? "inativado" : "ativado"}.`);
  }

  function removeProf(id: string) {
    if (!session) return;
    if (!isMaster) { toast.error("Apenas o usuário master pode excluir."); return; }
    if (!confirm("Excluir definitivamente este profissional?")) return;
    const next = list.filter((p) => p.id !== id);
    setList(next);
    saveProfessionals(session.login, next);
    toast.success("Profissional excluído.");
  }

  function save() {
    if (!editing || !session) return;

    const errs: string[] = [];
    if (!editing.nome.trim()) errs.push("Nome");
    if (!editing.cpf.trim()) errs.push("CPF");
    else if (!validateCPF(editing.cpf)) errs.push("CPF inválido");
    if (!editing.email.trim()) errs.push("E-mail");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editing.email)) errs.push("E-mail inválido");
    if (!editing.celular.trim()) errs.push("Celular");
    if (!editing.profissao) errs.push("Profissão");

    // CPF duplicado
    const cpfDig = onlyDigits(editing.cpf);
    const dup = list.find((p) => p.id !== editing.id && onlyDigits(p.cpf) === cpfDig);
    if (dup) errs.push("CPF já cadastrado em outro profissional");

    if (isProfissaoRegulamentada(editing.profissao)) {
      if (!editing.registroProf.numeroRegistro.trim()) errs.push("Número do registro");
      const t = conselhoIdentType(editing.registroProf.conselho);
      if (t === "uf" && !editing.registroProf.ufConselho) errs.push("UF do conselho");
      if (t === "regiao" && !editing.registroProf.regiao) errs.push("Região do conselho");
    }

    if (editing.dias.length === 0) errs.push("Pelo menos um dia de atendimento");
    if (!editing.horaEntrada || !editing.horaSaida) errs.push("Horário de entrada e saída");

    if (errs.length) {
      toast.error("Verifique: " + errs.join(", "));
      return;
    }

    const exists = list.some((p) => p.id === editing.id);
    const stamped = { ...editing, updatedAt: new Date().toISOString() };
    const updated = exists
      ? list.map((p) => (p.id === editing.id ? stamped : p))
      : [...list, stamped];
    setList(updated);
    saveProfessionals(session.login, updated);
    toast.success("Profissional cadastrado com sucesso.");
    setEditing(null);
    setMode("list");
  }

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
          <Link to="/sistema" className="flex items-center gap-3">
            <img src={logoApae} alt="APAE" className="h-9 w-auto" />
            <div className="leading-tight">
              <div className="text-sm font-bold">CAES · Profissionais</div>
              <div className="text-xs text-muted-foreground">Cadastro de colaboradores</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/sistema" })}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            {mode === "list" && (
              <Button size="sm" onClick={startNew}>
                <UserPlus className="h-4 w-4" /> Novo Profissional
              </Button>
            )}
            {mode === "form" && (
              <>
                <Button size="sm" variant="outline" onClick={() => { setEditing(null); setMode("list"); }}>
                  <X className="h-4 w-4" /> Cancelar
                </Button>
                <Button size="sm" onClick={save}>
                  <Save className="h-4 w-4" /> Salvar
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {mode === "list" && (
          <ListView
            list={filtered}
            allCount={list.length}
            isMaster={!!isMaster}
            q={q} setQ={setQ}
            fProfissao={fProfissao} setFProfissao={setFProfissao}
            fConselho={fConselho} setFConselho={setFConselho}
            fStatus={fStatus} setFStatus={setFStatus}
            conselhos={conselhosUnicos}
            onView={startView}
            onEdit={startEdit}
            onToggle={toggleStatus}
            onDelete={removeProf}
          />
        )}

        {mode === "form" && editing && (
          <ProfessionalForm p={editing} setP={setEditing} />
        )}
      </div>

      {/* Dialog de visualização */}
      <Dialog open={mode === "view"} onOpenChange={(o) => { if (!o) { setViewing(null); setMode("list"); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Profissional</DialogTitle>
          </DialogHeader>
          {viewing && <ViewPanel p={viewing} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =================== LIST VIEW =================== */

type ListProps = {
  list: Professional[];
  allCount: number;
  isMaster: boolean;
  q: string; setQ: (s: string) => void;
  fProfissao: string; setFProfissao: (s: string) => void;
  fConselho: string; setFConselho: (s: string) => void;
  fStatus: string; setFStatus: (s: string) => void;
  conselhos: string[];
  onView: (p: Professional) => void;
  onEdit: (p: Professional) => void;
  onToggle: (p: Professional) => void;
  onDelete: (id: string) => void;
};

function ListView(props: ListProps) {
  const {
    list, allCount, isMaster, q, setQ, fProfissao, setFProfissao,
    fConselho, setFConselho, fStatus, setFStatus, conselhos,
    onView, onEdit, onToggle, onDelete,
  } = props;

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <Label className="text-xs font-semibold">Pesquisa rápida</Label>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Nome, CPF ou profissão" className="pl-8" />
          </div>
        </div>
        <div className="w-[200px]">
          <Label className="text-xs font-semibold">Profissão</Label>
          <Select value={fProfissao} onValueChange={setFProfissao}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todas</SelectItem>
              {PROFISSOES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[160px]">
          <Label className="text-xs font-semibold">Conselho</Label>
          <Select value={fConselho} onValueChange={setFConselho}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              {conselhos.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[140px]">
          <Label className="text-xs font-semibold">Status</Label>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-2 text-xs text-muted-foreground">
        {list.length} de {allCount} profissional(is)
      </div>

      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhum profissional encontrado. Clique em <b>Novo Profissional</b> para iniciar.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs">
              <tr>
                <th className="px-3 py-2">Nome Completo</th>
                <th className="px-3 py-2">CPF</th>
                <th className="px-3 py-2">Profissão</th>
                <th className="px-3 py-2">Conselho</th>
                <th className="px-3 py-2">Registro</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Cadastro</th>
                <th className="px-3 py-2">Último Acesso</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: p.corAgenda || "#94a3b8" }}
                        title="Cor da agenda"
                      />
                      <span className="font-semibold">{p.nome || "—"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{p.cpf || "—"}</td>
                  <td className="px-3 py-2">{p.profissao || "—"}</td>
                  <td className="px-3 py-2">{p.registroProf.conselho || "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.registroProf.numeroRegistro || "—"}</td>
                  <td className="px-3 py-2">
                    <Badge variant={p.status === "Ativo" ? "default" : "secondary"}
                      className={p.status === "Ativo"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        : "bg-slate-200 text-slate-700"}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-xs">{fmtDate(p.createdAt)}</td>
                  <td className="px-3 py-2 text-xs">{p.lastAccessAt ? fmtDate(p.lastAccessAt) : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Visualizar"
                        onClick={() => onView(p)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Editar"
                        onClick={() => onEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Ativar/Inativar"
                        onClick={() => onToggle(p)}>
                        <Power className={`h-4 w-4 ${p.status === "Ativo" ? "text-emerald-600" : "text-slate-400"}`} />
                      </Button>
                      {isMaster && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Excluir"
                          onClick={() => onDelete(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

/* =================== VIEW PANEL =================== */

function ViewPanel({ p }: { p: Professional }) {
  const dias = p.dias.map(d => DIAS_SEMANA.find(x => x.v === d)?.l).filter(Boolean).join(", ") || "—";
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-4">
        {p.fotoDataUrl ? (
          <img src={p.fotoDataUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-full bg-muted text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        <div>
          <div className="text-lg font-bold">{p.nome}</div>
          <div className="text-xs text-muted-foreground">{p.profissao}</div>
          <Badge className={p.status === "Ativo" ? "mt-1 bg-emerald-100 text-emerald-700" : "mt-1 bg-slate-200 text-slate-700"}>
            {p.status}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Info label="CPF" v={p.cpf} />
        <Info label="RG" v={p.rg} />
        <Info label="E-mail" v={p.email} />
        <Info label="Celular" v={p.celular} />
        <Info label="Tel. secundário" v={p.telefoneSecundario} />
        <Info label="Nascimento" v={p.dataNascimento} />
      </div>
      <div className="rounded-md border p-3">
        <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">Registro Profissional</div>
        <div className="grid grid-cols-2 gap-3">
          <Info label="Conselho" v={p.registroProf.conselho} />
          <Info label="Nº Registro" v={p.registroProf.numeroRegistro} />
          {p.registroProf.ufConselho && <Info label="UF" v={p.registroProf.ufConselho} />}
          {p.registroProf.regiao && <Info label="Região" v={p.registroProf.regiao} />}
        </div>
        {p.rqes.length > 0 && (
          <div className="mt-2">
            <div className="text-xs font-semibold">RQEs:</div>
            <div className="text-xs">{p.rqes.join(", ")}</div>
          </div>
        )}
      </div>
      <div className="rounded-md border p-3">
        <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">Disponibilidade</div>
        <Info label="Dias" v={dias} />
        <Info label="Atendimento" v={`${p.horaEntrada} - ${p.horaSaida}`} />
        <Info label="Almoço" v={`${p.almocoIni} - ${p.almocoFim}`} />
        <Info label="Evolução" v={`${p.evolucaoIni} - ${p.evolucaoFim}`} />
      </div>
    </div>
  );
}
function Info({ label, v }: { label: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{v || "—"}</div>
    </div>
  );
}

/* =================== FORM =================== */

function ProfessionalForm({
  p, setP,
}: { p: Professional; setP: (p: Professional) => void }) {
  const reg = isProfissaoRegulamentada(p.profissao);

  function upd<K extends keyof Professional>(k: K, v: Professional[K]) {
    setP({ ...p, [k]: v });
  }
  function updReg<K extends keyof Professional["registroProf"]>(k: K, v: Professional["registroProf"][K]) {
    setP({ ...p, registroProf: { ...p.registroProf, [k]: v } });
  }

  function handleProfissaoChange(prof: string) {
    const conselho = PROFISSAO_TO_CONSELHO[prof] || "";
    setP({
      ...p,
      profissao: prof,
      registroProf: {
        ...p.registroProf,
        conselho,
        ufConselho: "",
        regiao: "",
      },
    });
  }

  function toggleDia(d: AvailabilityDay, on: boolean) {
    const set = new Set(p.dias);
    if (on) set.add(d); else set.delete(d);
    setP({ ...p, dias: Array.from(set) });
  }

  function addRqe() { setP({ ...p, rqes: [...p.rqes, ""] }); }
  function updRqe(i: number, v: string) {
    setP({ ...p, rqes: p.rqes.map((x, idx) => (idx === i ? v.replace(/[^0-9A-Za-z/-]/g, "") : x)) });
  }
  function rmRqe(i: number) { setP({ ...p, rqes: p.rqes.filter((_, idx) => idx !== i) }); }

  function addAss() { setP({ ...p, associacoes: [...p.associacoes, { nome: "", numero: "" }] }); }
  function updAss(i: number, k: "nome" | "numero", v: string) {
    setP({ ...p, associacoes: p.associacoes.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)) });
  }
  function rmAss(i: number) { setP({ ...p, associacoes: p.associacoes.filter((_, idx) => idx !== i) }); }

  function handleImg(field: "fotoDataUrl" | "assinaturaDataUrl", file?: File | null) {
    if (!file) return;
    if (!/\.(png|jpe?g)$/i.test(file.name)) { toast.error("Use PNG ou JPG."); return; }
    const r = new FileReader();
    r.onload = () => setP({ ...p, [field]: r.result as string });
    r.readAsDataURL(file);
  }

  const identType = conselhoIdentType(p.registroProf.conselho);
  const cpfValid = !p.cpf || validateCPF(p.cpf);
  const emailValid = !p.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email);

  return (
    <div className="space-y-5">
      {/* DADOS PESSOAIS */}
      <Section title="Dados Pessoais">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome Completo" required>
            <Input value={p.nome} onChange={(e) => upd("nome", e.target.value)} />
          </Field>
          <Field label="CPF" required hint={!cpfValid ? "CPF inválido" : undefined} hintColor="rose">
            <MaskedInput value={p.cpf} onChange={(v) => upd("cpf", v)}
              format={maskCPF} placeholder="000.000.000-00" inputMode="numeric" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="RG"><Input value={p.rg} onChange={(e) => upd("rg", e.target.value)} /></Field>
          <Field label="Data de Nascimento">
            <Input type="date" value={p.dataNascimento}
              onChange={(e) => upd("dataNascimento", e.target.value)} />
          </Field>
          <Field label="Sexo">
            <Select value={p.sexo} onValueChange={(v) => upd("sexo", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {SEXOS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Estado Civil">
            <Select value={p.estadoCivil} onValueChange={(v) => upd("estadoCivil", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {ESTADOS_CIVIS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="E-mail" required hint={!emailValid ? "E-mail inválido" : undefined} hintColor="rose">
            <Input type="email" value={p.email} onChange={(e) => upd("email", e.target.value)} />
          </Field>
          <Field label="Telefone Celular" required>
            <MaskedInput value={p.celular} onChange={(v) => upd("celular", v)}
              format={maskTelefoneSmart} placeholder="(00) 00000-0000" inputMode="tel" />
          </Field>
          <Field label="Telefone Secundário">
            <MaskedInput value={p.telefoneSecundario} onChange={(v) => upd("telefoneSecundario", v)}
              format={maskTelefoneSmart} placeholder="(00) 00000-0000" inputMode="tel" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="CEP">
            <MaskedInput value={p.cep} onChange={(v) => upd("cep", v)}
              format={maskCEP} placeholder="00000-000" inputMode="numeric" />
          </Field>
          <Field label="Logradouro" className="md:col-span-2">
            <Input value={p.logradouro} onChange={(e) => upd("logradouro", e.target.value)} />
          </Field>
          <Field label="Número">
            <Input value={p.numeroEnd} onChange={(e) => upd("numeroEnd", e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Bairro"><Input value={p.bairro} onChange={(e) => upd("bairro", e.target.value)} /></Field>
          <Field label="Cidade"><Input value={p.cidade} onChange={(e) => upd("cidade", e.target.value)} /></Field>
          <Field label="Estado">
            <Select value={p.estado} onValueChange={(v) => upd("estado", v)}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Complemento">
            <Input value={p.complemento} onChange={(e) => upd("complemento", e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* DADOS PROFISSIONAIS */}
      <Section title="Dados Profissionais">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Profissão" required>
            <Select value={p.profissao} onValueChange={handleProfissaoChange}>
              <SelectTrigger><SelectValue placeholder="Selecione a profissão" /></SelectTrigger>
              <SelectContent>
                {PROFISSOES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {reg && (
          <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50/40 p-4">
            <div className="mb-3 text-sm font-bold text-sky-700">Registro Profissional</div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Conselho">
                <Input value={p.registroProf.conselho} readOnly className="bg-muted" />
              </Field>
              {identType === "uf" && (
                <Field label="UF do Conselho" required>
                  <Select value={p.registroProf.ufConselho}
                    onValueChange={(v) => updReg("ufConselho", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              {identType === "regiao" && (
                <Field label="Região do Conselho" required>
                  <Select value={p.registroProf.regiao}
                    onValueChange={(v) => updReg("regiao", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {listRegioes(p.registroProf.conselho).map((r) =>
                        <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field label="Número do Registro" required>
                <Input value={p.registroProf.numeroRegistro}
                  onChange={(e) => updReg("numeroRegistro",
                    e.target.value.replace(/[^0-9A-Za-z/-]/g, ""))}
                  placeholder="Ex.: 123456/SP-PA" />
              </Field>
            </div>

            <div className="mt-4">
              <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">
                RQE (Registro de Qualificação de Especialista)
              </div>
              {p.rqes.length === 0 && (
                <p className="mb-2 text-xs text-muted-foreground">Nenhum RQE cadastrado.</p>
              )}
              <div className="space-y-2">
                {p.rqes.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={r} placeholder="Nº RQE"
                      onChange={(e) => updRqe(i, e.target.value)} />
                    <Button size="icon" variant="ghost" className="text-destructive"
                      onClick={() => rmRqe(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="mt-2" onClick={addRqe}>
                <Plus className="h-4 w-4" /> Adicionar RQE
              </Button>
            </div>

            <div className="mt-4">
              <div className="mb-1 text-xs font-bold uppercase text-muted-foreground">
                Associações / Sociedades
              </div>
              {p.associacoes.length === 0 && (
                <p className="mb-2 text-xs text-muted-foreground">Nenhuma associação cadastrada.</p>
              )}
              <div className="space-y-2">
                {p.associacoes.map((a, i) => (
                  <div key={i} className="grid grid-cols-[1fr_180px_auto] items-center gap-2">
                    <Input value={a.nome} placeholder="Nome da Associação/Sociedade"
                      onChange={(e) => updAss(i, "nome", e.target.value)} />
                    <Input value={a.numero} placeholder="Nº de Registro"
                      onChange={(e) => updAss(i, "numero", e.target.value)} />
                    <Button size="icon" variant="ghost" className="text-destructive"
                      onClick={() => rmAss(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="mt-2" onClick={addAss}>
                <Plus className="h-4 w-4" /> Adicionar Associação
              </Button>
            </div>
          </div>
        )}
      </Section>

      {/* DISPONIBILIDADE */}
      <Section title="Disponibilidade de Atendimento">
        <div>
          <Label className="text-xs font-bold uppercase text-muted-foreground">Dias de Atendimento</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {DIAS_SEMANA.map((d) => (
              <label key={d.v} className="flex items-center gap-2 text-sm">
                <Checkbox checked={p.dias.includes(d.v)}
                  onCheckedChange={(v) => toggleDia(d.v, Boolean(v))} />
                {d.l}
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Horário Entrada">
            <Input type="time" value={p.horaEntrada}
              onChange={(e) => upd("horaEntrada", e.target.value)} />
          </Field>
          <Field label="Horário Saída">
            <Input type="time" value={p.horaSaida}
              onChange={(e) => upd("horaSaida", e.target.value)} />
          </Field>
          <Field label="Almoço Início">
            <Input type="time" value={p.almocoIni}
              onChange={(e) => upd("almocoIni", e.target.value)} />
          </Field>
          <Field label="Almoço Fim">
            <Input type="time" value={p.almocoFim}
              onChange={(e) => upd("almocoFim", e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Evolução Início">
            <Input type="time" value={p.evolucaoIni}
              onChange={(e) => upd("evolucaoIni", e.target.value)} />
          </Field>
          <Field label="Evolução Fim">
            <Input type="time" value={p.evolucaoFim}
              onChange={(e) => upd("evolucaoFim", e.target.value)} />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          A agenda bloqueará automaticamente os horários de almoço e evolução e impedirá conflitos.
        </p>
      </Section>

      {/* CONFIGURAÇÕES */}
      <Section title="Configurações Adicionais">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Status">
            <Select value={p.status} onValueChange={(v) => upd("status", v as ProfessionalStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Cor da Agenda">
            <div className="flex flex-wrap items-center gap-2">
              {CORES_AGENDA.map((c) => (
                <button key={c.value} type="button"
                  title={c.label}
                  onClick={() => upd("corAgenda", c.value)}
                  className={`h-7 w-7 rounded-full border-2 ${p.corAgenda === c.value ? "border-foreground" : "border-transparent"}`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs font-bold uppercase text-muted-foreground">Foto do Profissional</Label>
            <div className="mt-2 flex items-center gap-3">
              {p.fotoDataUrl ? (
                <img src={p.fotoDataUrl} alt="" className="h-16 w-16 rounded-md object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-md bg-muted text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                <Upload className="h-4 w-4" /> Carregar (JPG/PNG)
                <input type="file" accept="image/png,image/jpeg" className="hidden"
                  onChange={(e) => handleImg("fotoDataUrl", e.target.files?.[0])} />
              </label>
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase text-muted-foreground">Assinatura Digital</Label>
            <div className="mt-2 flex items-center gap-3">
              {p.assinaturaDataUrl ? (
                <img src={p.assinaturaDataUrl} alt="" className="h-16 w-32 rounded-md border bg-white object-contain p-1" />
              ) : (
                <div className="grid h-16 w-32 place-items-center rounded-md bg-muted text-muted-foreground">
                  <FileSignature className="h-6 w-6" />
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                <Upload className="h-4 w-4" /> Carregar (JPG/PNG)
                <input type="file" accept="image/png,image/jpeg" className="hidden"
                  onChange={(e) => handleImg("assinaturaDataUrl", e.target.files?.[0])} />
              </label>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 border-b border-border pb-2 text-base font-bold text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function Field({
  label, children, required, hint, hintColor, className,
}: {
  label: string; children: React.ReactNode; required?: boolean;
  hint?: string; hintColor?: "rose" | "emerald"; className?: string;
}) {
  return (
    <div className={`space-y-1 ${className || ""}`}>
      <Label className="font-semibold">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && (
        <p className={`text-xs ${hintColor === "rose" ? "text-rose-600" : "text-emerald-600"}`}>{hint}</p>
      )}
    </div>
  );
}
