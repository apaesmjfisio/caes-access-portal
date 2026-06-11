import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  X, Save, Eraser, Trash2, ArrowRight, ArrowLeft, Search, Camera, Plus,
  User, Phone, MapPin, UserPlus, Star, HelpCircle, FileText, Info, Mail, MessageSquare,
  LayoutGrid, CheckCircle2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSession, type Session } from "@/lib/auth";
import {
  loadPatients, savePatients, emptyPatient, emptyContatoEmergencia, calcIdade,
  UFS, SEXOS, GENEROS, ESTADOS_CIVIS, ESCOLARIDADES, TIPOS_DOCUMENTO,
  TIPOS_SANGUINEOS, FATORES_RH, ETNIAS, RELIGIOES, ORGAOS_EMISSORES, PARENTESCOS,
  type Patient, type Endereco, type Documento, type ContatoEmergencia,
} from "@/lib/patients-store";
import { MaskedInput } from "@/components/MaskedInput";
import {
  maskCPF, validateCPF, maskGroup3FromRight, maskCNS, validateCNS,
  maskCelular, maskFixo, maskTelefoneSmart, maskCEP, fetchViaCep, onlyDigits,
} from "@/lib/masks";

export const Route = createFileRoute("/pacientes")({
  head: () => ({ meta: [{ title: "Cadastro de Pacientes — CAES" }] }),
  component: PacientesPage,
});

const TABS = [
  { id: 1, label: "1. Identificação", icon: User },
  { id: 2, label: "2. Contato", icon: Phone },
  { id: 3, label: "3. Endereço", icon: MapPin },
  { id: 4, label: "4. Responsável Legal", icon: UserPlus },
  { id: 5, label: "5. Emergência", icon: Star },
] as const;

function PacientesPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [list, setList] = useState<Patient[]>([]);
  const [patient, setPatient] = useState<Patient>(() => emptyPatient());
  const [tab, setTab] = useState<number>(1);
  const [showSearch, setShowSearch] = useState(false);
  const [showAllTabs, setShowAllTabs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s) { navigate({ to: "/login" }); return; }
    setSession(s);
    setList(loadPatients(s.login));
  }, [navigate]);

  // Keyboard shortcuts (F2 save, F3 clear, F5 next, F6 previous)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); doSave(); }
      else if (e.key === "F3") { e.preventDefault(); doClear(); }
      else if (e.key === "F5") { e.preventDefault(); setTab(t => Math.min(5, t + 1)); }
      else if (e.key === "F6") { e.preventDefault(); setTab(t => Math.max(1, t - 1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return list;
    const td = onlyDigits(t);
    return list.filter(p =>
      p.nomeCompleto.toLowerCase().includes(t) ||
      (td && onlyDigits(p.cpf).includes(td)) ||
      (td && onlyDigits(p.cns).includes(td)) ||
      (td && onlyDigits(p.celularPrincipal).includes(td)) ||
      p.emailPrincipal.toLowerCase().includes(t),
    );
  }, [list, searchTerm]);

  if (!session) return null;

  function upd<K extends keyof Patient>(k: K, v: Patient[K]) {
    setPatient(p => ({ ...p, [k]: v }));
  }

  function doSave() {
    if (!session) return;
    if (!patient.nomeCompleto.trim()) { toast.error("Informe o nome completo do paciente."); return; }
    const cpfDigits = onlyDigits(patient.cpf);
    if (!cpfDigits) { toast.error("Informe o CPF do paciente."); return; }
    if (!validateCPF(cpfDigits)) { toast.error("CPF inválido. Verifique os dígitos."); return; }
    if (patient.cns && !validateCNS(patient.cns)) {
      toast.error("CNS inválido. Verifique o número do Cartão SUS."); return;
    }
    const now = new Date().toISOString();
    const exists = list.some(p => p.id === patient.id);
    const updated = exists
      ? list.map(p => (p.id === patient.id ? { ...patient, updatedAt: now } : p))
      : [...list, { ...patient, updatedAt: now }];
    setList(updated);
    savePatients(session.login, updated);
    setPatient({ ...patient, updatedAt: now });
    toast.success("Paciente salvo com sucesso.");
  }

  function doClear() {
    if (!confirm("Limpar todos os campos do formulário?")) return;
    setPatient(emptyPatient());
    setTab(1);
  }

  function doDelete() {
    if (!session) return;
    if (!list.some(p => p.id === patient.id)) {
      toast.error("Este paciente ainda não foi salvo.");
      return;
    }
    if (!confirm("Excluir este paciente? Esta ação não pode ser desfeita.")) return;
    const next = list.filter(p => p.id !== patient.id);
    setList(next);
    savePatients(session.login, next);
    setPatient(emptyPatient());
    setTab(1);
    toast.success("Paciente excluído.");
  }

  function loadOne(p: Patient) {
    setPatient(p);
    setShowSearch(false);
    setTab(1);
    toast.success(`Carregado: ${p.nomeCompleto}`);
  }

  function close() { navigate({ to: "/app" }); }


  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] bg-white shadow-sm">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-100 p-2 text-sky-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold text-slate-800">Cadastro de Paciente</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSearch(true)}>
              <Search className="h-4 w-4" /> Pesquisar / Filtrar
            </Button>
            <Button variant="ghost" size="icon" onClick={close} aria-label="Fechar">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <nav className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-4 py-2">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "border-b-2 border-sky-500 font-semibold text-sky-600"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </nav>

        <div className="grid gap-5 px-6 py-5 lg:grid-cols-[1fr_280px]">
          {/* Main */}
          <div className="space-y-5">
            {tab === 1 && <TabIdentificacao p={patient} upd={upd} setP={setPatient} />}
            {tab === 2 && <TabContato p={patient} upd={upd} setP={setPatient} />}
            {tab === 3 && <TabEndereco p={patient} setP={setPatient} />}
            {tab === 4 && <TabResponsavel p={patient} setP={setPatient} />}
            {tab === 5 && <TabEmergencia p={patient} setP={setPatient} />}
          </div>

          {/* Right side action panel (sticky) */}
          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <Card className="border-slate-200 p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Ações</h3>
              <div className="space-y-1.5">
                <ActionBtn onClick={doSave} color="emerald" icon={<Save className="h-4 w-4" />} label="Salvar" hint="F2" />
                <ActionBtn onClick={doClear} color="rose" icon={<Eraser className="h-4 w-4" />} label="Limpar" hint="F3" />
                <ActionBtn onClick={doDelete} color="amber" icon={<Trash2 className="h-4 w-4" />} label="Apagar" hint="F4" />
                <ActionBtn onClick={() => setTab(t => Math.min(5, t + 1))} color="sky" icon={<ArrowRight className="h-4 w-4" />} label="Próximo" hint="F5" variant="outline" />
                <ActionBtn onClick={() => setTab(t => Math.max(1, t - 1))} color="sky" icon={<ArrowLeft className="h-4 w-4" />} label="Anterior" hint="F6" variant="outline" />
              </div>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50 p-3">
              <div className="mb-1.5 flex items-center gap-2 text-amber-700">
                <HelpCircle className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Ajuda</h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-600">{helpText(tab)}</p>
            </Card>

            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAllTabs(true)}>
              <LayoutGrid className="h-4 w-4" /> Ver todas as abas
            </Button>
          </aside>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-slate-200 px-6 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span><span className="text-rose-500">*</span> Campos obrigatórios</span>
            <span className="flex items-center gap-1"><Info className="h-3 w-3" /> Passe o mouse sobre os campos para mais informações</span>
          </div>
          <Button variant="outline" size="sm" onClick={close}>
            <X className="h-4 w-4" /> Fechar
          </Button>
        </footer>
      </div>

      {/* Search dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Pesquisar paciente</DialogTitle></DialogHeader>
          <Input
            autoFocus
            placeholder="Buscar por nome, CPF, CNS, telefone ou e-mail…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {list.length === 0 ? "Nenhum paciente cadastrado ainda." : "Nenhum resultado encontrado."}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">CPF</th>
                    <th className="px-3 py-2">Celular</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-t border-slate-200">
                      <td className="px-3 py-2 font-medium">{p.nomeCompleto || "(sem nome)"}</td>
                      <td className="px-3 py-2">{p.cpf || "—"}</td>
                      <td className="px-3 py-2">{p.celularPrincipal || "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" onClick={() => loadOne(p)}>Selecionar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* All tabs overview */}
      <Dialog open={showAllTabs} onOpenChange={setShowAllTabs}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ir para aba</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <Button
                  key={t.id} variant="outline" className="h-auto justify-start py-3"
                  onClick={() => { setTab(t.id); setShowAllTabs(false); }}
                >
                  <Icon className="mr-2 h-4 w-4" /> {t.label}
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----- helpers ----- */

function helpText(tab: number) {
  switch (tab) {
    case 1: return "Preencha todas as informações obrigatórias marcadas com *. Navegue pelas abas ou use os botões Próximo/Anterior para avançar entre os tópicos.";
    case 2: return "Preencha todas as informações de contato para que possamos nos comunicar melhor com o paciente.";
    case 3: return "Preencha os campos com o endereço residencial do paciente. Selecione a opção de correspondência caso seja diferente.";
    case 4: return "Informe os dados completos do representante legal. Essas informações poderão ser utilizadas para autorizações, assinaturas e contatos oficiais.";
    case 5: return "Informe pelo menos um contato de emergência. Essas informações são confidenciais e utilizadas apenas em situações necessárias.";
    default: return "";
  }
}

function ActionBtn({
  onClick, color, icon, label, hint, variant = "solid",
}: {
  onClick: () => void; color: "emerald"|"rose"|"amber"|"sky";
  icon: React.ReactNode; label: string; hint: string;
  variant?: "solid"|"outline";
}) {
  const styles: Record<string, string> = {
    emerald: variant === "solid"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
    rose: variant === "solid"
      ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
      : "border-rose-300 text-rose-700 hover:bg-rose-50",
    amber: variant === "solid"
      ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
      : "border-amber-300 text-amber-700 hover:bg-amber-50",
    sky: variant === "solid"
      ? "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
      : "border-sky-300 text-sky-700 hover:bg-sky-50",
  };
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium transition ${styles[color]}`}
    >
      <span className="flex items-center gap-2">{icon} {label}</span>
      <span className="text-xs opacity-70">{hint}</span>
    </button>
  );
}

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="border-slate-200 p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sky-600">
          {icon}
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

function Field({ label, required, children, className = "" }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-xs font-medium text-slate-700">
        {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

/* ----- Tab 1: Identificação ----- */

function TabIdentificacao({ p, upd, setP }: { p: Patient; upd: <K extends keyof Patient>(k: K, v: Patient[K]) => void; setP: React.Dispatch<React.SetStateAction<Patient>> }) {
  function handleFoto(file?: File | null) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => upd("fotoDataUrl", r.result as string);
    r.readAsDataURL(file);
  }

  const [doc, setDoc] = useState<Documento>({ tipo:"", numero:"", orgaoEmissor:"", dataEmissao:"" });
  function addDoc() {
    if (!doc.tipo || !doc.numero) { toast.error("Preencha tipo e número do documento."); return; }
    setP(prev => ({ ...prev, documentos: [...prev.documentos, doc] }));
    setDoc({ tipo:"", numero:"", orgaoEmissor:"", dataEmissao:"" });
  }
  function rmDoc(i: number) {
    setP(prev => ({ ...prev, documentos: prev.documentos.filter((_, idx) => idx !== i) }));
  }

  return (
    <>
      <Section icon={<User className="h-5 w-5" />} title="Dados Pessoais">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_200px]">
          <div className="space-y-4 md:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome completo" required>
                <Input value={p.nomeCompleto} placeholder="Digite o nome completo"
                  onChange={(e) => upd("nomeCompleto", e.target.value)} />
              </Field>
              <Field label="Nome social">
                <Input value={p.nomeSocial} placeholder="Digite o nome social"
                  onChange={(e) => upd("nomeSocial", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Sexo biológico" required>
                <SimpleSelect value={p.sexoBiologico} onChange={(v) => upd("sexoBiologico", v)} options={SEXOS} />
              </Field>
              <Field label="Gênero">
                <SimpleSelect value={p.genero} onChange={(v) => upd("genero", v)} options={GENEROS} />
              </Field>
              <Field label="Data de nascimento" required>
                <Input type="date" value={p.dataNascimento}
                  onChange={(e) => upd("dataNascimento", e.target.value)} />
              </Field>
              <Field label="Idade">
                <Input disabled value={calcIdade(p.dataNascimento)} placeholder="—" />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Estado civil">
                <SimpleSelect value={p.estadoCivil} onChange={(v) => upd("estadoCivil", v)} options={ESTADOS_CIVIS} />
              </Field>
              <Field label="Nacionalidade">
                <Input value={p.nacionalidade} placeholder="Ex.: Brasileira"
                  onChange={(e) => upd("nacionalidade", e.target.value)} />
              </Field>
              <Field label="Naturalidade">
                <Input value={p.naturalidade} placeholder="Cidade de nascimento"
                  onChange={(e) => upd("naturalidade", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Profissão">
                <Input value={p.profissao} onChange={(e) => upd("profissao", e.target.value)} />
              </Field>
              <Field label="Empresa onde trabalha">
                <Input value={p.empresaTrabalha} onChange={(e) => upd("empresaTrabalha", e.target.value)} />
              </Field>
              <Field label="Escolaridade">
                <SimpleSelect value={p.escolaridade} onChange={(v) => upd("escolaridade", v)} options={ESCOLARIDADES} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <Field label="CPF" required>
                <Input value={p.cpf} placeholder="000.000.000-00"
                  onChange={(e) => upd("cpf", e.target.value)} />
              </Field>
              <Field label="RG">
                <Input value={p.rg} placeholder="Digite o RG"
                  onChange={(e) => upd("rg", e.target.value)} />
              </Field>
              <Field label="Órgão emissor">
                <SimpleSelect value={p.orgaoEmissor} onChange={(v) => upd("orgaoEmissor", v)} options={ORGAOS_EMISSORES} />
              </Field>
              <Field label="Data de emissão">
                <Input type="date" value={p.dataEmissao}
                  onChange={(e) => upd("dataEmissao", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="CNS (Cartão Nacional de Saúde)">
                <Input value={p.cns} placeholder="Digite o CNS"
                  onChange={(e) => upd("cns", e.target.value)} />
              </Field>
              <Field label="AMA (Cartão do AMA)">
                <Input value={p.ama} placeholder="Digite o nº do AMA"
                  onChange={(e) => upd("ama", e.target.value)} />
              </Field>
              <Field label="NIS (Nº de Identificação Social)">
                <Input value={p.nis} placeholder="Digite o NIS"
                  onChange={(e) => upd("nis", e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Foto */}
          <div>
            <Label className="text-xs font-medium text-slate-700">Foto do paciente</Label>
            <div className="mt-1 flex flex-col items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
              {p.fotoDataUrl ? (
                <img src={p.fotoDataUrl} alt="Foto" className="h-44 w-44 rounded-md object-cover" />
              ) : (
                <div className="flex h-44 w-44 items-center justify-center rounded-md bg-slate-200 text-slate-400">
                  <User className="h-16 w-16" />
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-white px-3 py-2 text-xs hover:bg-slate-50">
                <Camera className="h-4 w-4" /> Selecionar foto
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleFoto(e.target.files?.[0])} />
              </label>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={<FileText className="h-5 w-5" />} title="Documentos">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <Field label="Tipo de documento">
            <SimpleSelect value={doc.tipo} onChange={(v) => setDoc({ ...doc, tipo: v })} options={TIPOS_DOCUMENTO} />
          </Field>
          <Field label="Número">
            <Input value={doc.numero} placeholder="Digite o número"
              onChange={(e) => setDoc({ ...doc, numero: e.target.value })} />
          </Field>
          <Field label="Órgão emissor">
            <Input value={doc.orgaoEmissor} placeholder="Digite o órgão"
              onChange={(e) => setDoc({ ...doc, orgaoEmissor: e.target.value })} />
          </Field>
          <Field label="Data de emissão">
            <Input type="date" value={doc.dataEmissao}
              onChange={(e) => setDoc({ ...doc, dataEmissao: e.target.value })} />
          </Field>
          <div className="flex items-end">
            <Button size="sm" onClick={addDoc}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2">Tipo de Documento</th>
                <th className="px-3 py-2">Número</th>
                <th className="px-3 py-2">Órgão Emissor</th>
                <th className="px-3 py-2">Data de Emissão</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {p.documentos.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                  Nenhum documento cadastrado
                </td></tr>
              ) : p.documentos.map((d, i) => (
                <tr key={i} className="border-t border-slate-200">
                  <td className="px-3 py-2">{d.tipo}</td>
                  <td className="px-3 py-2">{d.numero}</td>
                  <td className="px-3 py-2">{d.orgaoEmissor || "—"}</td>
                  <td className="px-3 py-2">{d.dataEmissao || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="icon" variant="ghost" onClick={() => rmDoc(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section icon={<Info className="h-5 w-5" />} title="Outras Informações">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Tipo sanguíneo">
            <SimpleSelect value={p.tipoSanguineo} onChange={(v) => upd("tipoSanguineo", v)} options={TIPOS_SANGUINEOS} />
          </Field>
          <Field label="Fator RH">
            <SimpleSelect value={p.fatorRh} onChange={(v) => upd("fatorRh", v)} options={FATORES_RH} />
          </Field>
          <Field label="Etnia">
            <SimpleSelect value={p.etnia} onChange={(v) => upd("etnia", v)} options={ETNIAS} />
          </Field>
          <Field label="Religião">
            <SimpleSelect value={p.religiao} onChange={(v) => upd("religiao", v)} options={RELIGIOES} />
          </Field>
        </div>
        <Field label="Observações">
          <Textarea rows={3} value={p.observacoes} placeholder="Digite observações adicionais sobre o paciente"
            onChange={(e) => upd("observacoes", e.target.value)} />
        </Field>
      </Section>
    </>
  );
}

/* ----- Tab 2: Contato ----- */

function TabContato({ p, upd, setP }: { p: Patient; upd: <K extends keyof Patient>(k: K, v: Patient[K]) => void; setP: React.Dispatch<React.SetStateAction<Patient>> }) {
  return (
    <>
      <Section icon={<Phone className="h-5 w-5" />} title="Telefones">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Celular principal" required>
            <Input value={p.celularPrincipal} placeholder="(11) 99999-9999"
              onChange={(e) => upd("celularPrincipal", e.target.value)} />
          </Field>
          <Field label="Celular secundário">
            <Input value={p.celularSecundario} placeholder="(11) 99999-9999"
              onChange={(e) => upd("celularSecundario", e.target.value)} />
          </Field>
          <Field label="Telefone residencial">
            <Input value={p.telefoneResidencial} placeholder="(11) 3333-3333"
              onChange={(e) => upd("telefoneResidencial", e.target.value)} />
          </Field>
          <Field label="Telefone comercial">
            <Input value={p.telefoneComercial} placeholder="(11) 2222-2222"
              onChange={(e) => upd("telefoneComercial", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section icon={<Mail className="h-5 w-5" />} title="E-mails">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="E-mail principal" required>
            <Input type="email" value={p.emailPrincipal} placeholder="exemplo@email.com.br"
              onChange={(e) => upd("emailPrincipal", e.target.value)} />
          </Field>
          <Field label="E-mail secundário">
            <Input type="email" value={p.emailSecundario} placeholder="outro@email.com.br"
              onChange={(e) => upd("emailSecundario", e.target.value)} />
          </Field>
        </div>
      </Section>

      <div className="grid gap-5 md:grid-cols-2">
        <Section icon={<MessageSquare className="h-5 w-5" />} title="Preferência de contato" subtitle="Como você prefere ser contatado?">
          {[
            ["whatsapp", "WhatsApp"],
            ["ligacao", "Ligação telefônica"],
            ["sms", "SMS"],
            ["email", "E-mail"],
          ].map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={p.preferenciaContato[k as keyof typeof p.preferenciaContato]}
                onCheckedChange={(v) =>
                  setP(prev => ({ ...prev, preferenciaContato: { ...prev.preferenciaContato, [k]: Boolean(v) } }))
                }
              />
              {label}
            </label>
          ))}
        </Section>

        <Section icon={<Info className="h-5 w-5" />} title="Autorizações e consentimentos">
          {[
            ["mensagens", "Autoriza o envio de mensagens por WhatsApp/SMS/E-mail?"],
            ["lembretes", "Autoriza o envio de lembretes de consultas e exames?"],
            ["campanhas", "Autoriza o recebimento de campanhas e promoções?"],
            ["contatoTelefone", "Autoriza o contato por telefone para assuntos da clínica?"],
          ].map(([k, label]) => {
            const checked = p.autorizacoes[k as keyof typeof p.autorizacoes];
            return (
              <div key={k} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-slate-700">{label}</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={checked}
                    onCheckedChange={(v) =>
                      setP(prev => ({ ...prev, autorizacoes: { ...prev.autorizacoes, [k]: v } }))
                    }
                  />
                  <span className={`text-xs font-medium ${checked ? "text-sky-600" : "text-slate-400"}`}>
                    {checked ? "Sim" : "Não"}
                  </span>
                </div>
              </div>
            );
          })}
        </Section>
      </div>

      <Section icon={<FileText className="h-5 w-5" />} title="Observações" subtitle="Informações adicionais de contato">
        <Textarea rows={4} value={p.contatoObservacoes} placeholder="Digite aqui informações complementares sobre contato…"
          onChange={(e) => upd("contatoObservacoes", e.target.value)} maxLength={500} />
        <div className="text-right text-xs text-slate-400">{p.contatoObservacoes.length}/500</div>
      </Section>
    </>
  );
}

/* ----- Tab 3: Endereço ----- */

function EnderecoFields({ value, onChange, includeCorrespondencia, p, setP }: {
  value: Endereco;
  onChange: (e: Endereco) => void;
  includeCorrespondencia?: boolean;
  p?: Patient; setP?: React.Dispatch<React.SetStateAction<Patient>>;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="CEP" required>
          <Input value={value.cep} placeholder="00000-000" onChange={(e) => onChange({ ...value, cep: e.target.value })} />
        </Field>
        <Field label="Logradouro (Rua, Avenida, etc.)" required className="md:col-span-2">
          <Input value={value.logradouro} placeholder="Digite o logradouro"
            onChange={(e) => onChange({ ...value, logradouro: e.target.value })} />
        </Field>
        <Field label="Número" required>
          <Input value={value.numero} placeholder="Digite o número"
            onChange={(e) => onChange({ ...value, numero: e.target.value })} />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Complemento">
          <Input value={value.complemento} placeholder="Apto, Bloco, Casa, etc."
            onChange={(e) => onChange({ ...value, complemento: e.target.value })} />
        </Field>
        <Field label="Bairro" required>
          <Input value={value.bairro} placeholder="Digite o bairro"
            onChange={(e) => onChange({ ...value, bairro: e.target.value })} />
        </Field>
        <Field label="Cidade" required>
          <Input value={value.cidade} placeholder="Digite a cidade"
            onChange={(e) => onChange({ ...value, cidade: e.target.value })} />
        </Field>
        <Field label="Estado" required>
          <SimpleSelect value={value.estado} onChange={(v) => onChange({ ...value, estado: v })} options={UFS} />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="País" required>
          <Input value={value.pais} onChange={(e) => onChange({ ...value, pais: e.target.value })} />
        </Field>
      </div>
      {includeCorrespondencia && p && setP && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <Checkbox checked={p.enderecoMesmoCorrespondencia}
            onCheckedChange={(v) => setP(prev => ({ ...prev, enderecoMesmoCorrespondencia: Boolean(v) }))} />
          Utilizar este endereço como endereço de correspondência
        </label>
      )}
    </>
  );
}

function TabEndereco({ p, setP }: { p: Patient; setP: React.Dispatch<React.SetStateAction<Patient>> }) {
  return (
    <>
      <Section icon={<MapPin className="h-5 w-5" />} title="Endereço Residencial" subtitle="Informe o endereço onde o paciente reside.">
        <EnderecoFields
          value={p.enderecoResidencial}
          onChange={(v) => setP(prev => ({ ...prev, enderecoResidencial: v }))}
          includeCorrespondencia p={p} setP={setP}
        />
      </Section>

      <Section icon={<Mail className="h-5 w-5" />} title="Endereço para Correspondência" subtitle="Informe o endereço para envio de correspondências e documentos.">
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={p.enderecoMesmoCorrespondencia}
              onChange={() => setP(prev => ({ ...prev, enderecoMesmoCorrespondencia: true }))} />
            Mesmo endereço residencial
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={!p.enderecoMesmoCorrespondencia}
              onChange={() => setP(prev => ({ ...prev, enderecoMesmoCorrespondencia: false }))} />
            Usar um endereço diferente
          </label>
        </div>
        {!p.enderecoMesmoCorrespondencia && (
          <EnderecoFields
            value={p.enderecoCorrespondencia}
            onChange={(v) => setP(prev => ({ ...prev, enderecoCorrespondencia: v }))}
          />
        )}
      </Section>
    </>
  );
}

/* ----- Tab 4: Responsável Legal ----- */

function TabResponsavel({ p, setP }: { p: Patient; setP: React.Dispatch<React.SetStateAction<Patient>> }) {
  function updRep<K extends keyof Patient["rep"]>(k: K, v: Patient["rep"][K]) {
    setP(prev => ({ ...prev, rep: { ...prev.rep, [k]: v } }));
  }
  const r = p.rep;
  return (
    <>
      <Section icon={<UserPlus className="h-5 w-5" />} title="Representante Legal" subtitle="Informe os dados do responsável legal do paciente. Obrigatório apenas para menores de idade.">
        <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
          <Info className="mr-1 inline h-4 w-4" />
          Este campo é obrigatório para pacientes menores de 18 anos ou quando o paciente não possuir capacidade legal para responder por si.
        </div>
      </Section>

      <Section icon={<User className="h-5 w-5" />} title="Dados Pessoais">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome completo" required>
            <Input value={r.nomeCompleto} placeholder="Digite o nome completo"
              onChange={(e) => updRep("nomeCompleto", e.target.value)} />
          </Field>
          <Field label="Nome social (opcional)">
            <Input value={r.nomeSocial} onChange={(e) => updRep("nomeSocial", e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="CPF" required>
            <Input value={r.cpf} placeholder="000.000.000-00"
              onChange={(e) => updRep("cpf", e.target.value)} />
          </Field>
          <Field label="RG">
            <Input value={r.rg} onChange={(e) => updRep("rg", e.target.value)} />
          </Field>
          <Field label="Órgão emissor" required>
            <SimpleSelect value={r.orgaoEmissor} onChange={(v) => updRep("orgaoEmissor", v)} options={ORGAOS_EMISSORES} />
          </Field>
          <Field label="Data de emissão">
            <Input type="date" value={r.dataEmissao}
              onChange={(e) => updRep("dataEmissao", e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Data de nascimento">
            <Input type="date" value={r.dataNascimento}
              onChange={(e) => updRep("dataNascimento", e.target.value)} />
          </Field>
          <Field label="Estado civil">
            <SimpleSelect value={r.estadoCivil} onChange={(v) => updRep("estadoCivil", v)} options={ESTADOS_CIVIS} />
          </Field>
          <Field label="Nacionalidade">
            <Input value={r.nacionalidade} onChange={(e) => updRep("nacionalidade", e.target.value)} />
          </Field>
          <Field label="Naturalidade">
            <Input value={r.naturalidade} onChange={(e) => updRep("naturalidade", e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Profissão">
            <Input value={r.profissao} onChange={(e) => updRep("profissao", e.target.value)} />
          </Field>
          <Field label="Empresa onde trabalha">
            <Input value={r.empresaTrabalha} onChange={(e) => updRep("empresaTrabalha", e.target.value)} />
          </Field>
          <Field label="Escolaridade">
            <SimpleSelect value={r.escolaridade} onChange={(v) => updRep("escolaridade", v)} options={ESCOLARIDADES} />
          </Field>
        </div>
      </Section>

      <Section icon={<Phone className="h-5 w-5" />} title="Contato">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Celular principal" required>
            <Input value={r.celularPrincipal} placeholder="(11) 99999-9999"
              onChange={(e) => updRep("celularPrincipal", e.target.value)} />
          </Field>
          <Field label="Celular secundário">
            <Input value={r.celularSecundario} placeholder="(11) 99999-9999"
              onChange={(e) => updRep("celularSecundario", e.target.value)} />
          </Field>
          <Field label="Telefone residencial">
            <Input value={r.telefoneResidencial} placeholder="(11) 3333-3333"
              onChange={(e) => updRep("telefoneResidencial", e.target.value)} />
          </Field>
          <Field label="Telefone comercial">
            <Input value={r.telefoneComercial} placeholder="(11) 2222-2222"
              onChange={(e) => updRep("telefoneComercial", e.target.value)} />
          </Field>
        </div>
        <Field label="E-mail">
          <Input type="email" value={r.email} placeholder="exemplo@email.com.br"
            onChange={(e) => updRep("email", e.target.value)} />
        </Field>
      </Section>

      <Section icon={<MapPin className="h-5 w-5" />} title="Endereço">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={r.mesmoEndereco}
            onCheckedChange={(v) => updRep("mesmoEndereco", Boolean(v))} />
          Mesmo endereço do paciente
        </label>
        {!r.mesmoEndereco && (
          <EnderecoFields value={r.endereco} onChange={(v) => updRep("endereco", v)} />
        )}
      </Section>
    </>
  );
}

/* ----- Tab 5: Emergência ----- */

function TabEmergencia({ p, setP }: { p: Patient; setP: React.Dispatch<React.SetStateAction<Patient>> }) {
  function updContato(i: number, patch: Partial<ContatoEmergencia>) {
    setP(prev => ({
      ...prev,
      contatosEmergencia: prev.contatosEmergencia.map((c, idx) => idx === i ? { ...c, ...patch } : c),
    }));
  }
  function addContato() {
    setP(prev => ({ ...prev, contatosEmergencia: [...prev.contatosEmergencia, emptyContatoEmergencia(false)] }));
  }
  function rmContato(i: number) {
    setP(prev => ({ ...prev, contatosEmergencia: prev.contatosEmergencia.filter((_, idx) => idx !== i) }));
  }

  return (
    <>
      <Section icon={<Star className="h-5 w-5" />} title="Contato de Emergência" subtitle="Informe os contatos que devemos acionar em caso de emergência.">
        {p.contatosEmergencia.map((c, i) => (
          <Card key={i} className="border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-600">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-semibold">Contato de Emergência {i + 1}</span>
                {c.principal && <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs text-sky-700">Principal</span>}
              </div>
              {!c.principal && (
                <Button size="icon" variant="ghost" className="text-rose-600" onClick={() => rmContato(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome completo" required={c.principal}>
                  <Input value={c.nome} placeholder="Digite o nome completo"
                    onChange={(e) => updContato(i, { nome: e.target.value })} />
                </Field>
                <Field label="Grau de parentesco" required={c.principal}>
                  <SimpleSelect value={c.parentesco} onChange={(v) => updContato(i, { parentesco: v })} options={PARENTESCOS} placeholder="Selecione o parentesco" />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Telefone principal" required={c.principal}>
                  <Input value={c.telefonePrincipal} placeholder="(11) 99999-9999"
                    onChange={(e) => updContato(i, { telefonePrincipal: e.target.value })} />
                </Field>
                <Field label="Telefone alternativo">
                  <Input value={c.telefoneAlternativo} placeholder="(11) 99999-9999"
                    onChange={(e) => updContato(i, { telefoneAlternativo: e.target.value })} />
                </Field>
                <Field label="E-mail">
                  <Input type="email" value={c.email} placeholder="exemplo@email.com.br"
                    onChange={(e) => updContato(i, { email: e.target.value })} />
                </Field>
              </div>
              <Field label="Observações">
                <Textarea rows={3} value={c.observacoes} maxLength={500}
                  placeholder="Informações adicionais sobre o contato (ex.: trabalha em tal empresa, melhor horário para contato, etc.)"
                  onChange={(e) => updContato(i, { observacoes: e.target.value })} />
                <div className="text-right text-xs text-slate-400">{c.observacoes.length}/500</div>
              </Field>
            </div>
          </Card>
        ))}

        <Button variant="outline" onClick={addContato}>
          <Plus className="h-4 w-4" /> Adicionar outro contato de emergência
        </Button>
      </Section>
    </>
  );
}

/* ----- Simple Select ----- */
function SimpleSelect({ value, onChange, options, placeholder = "Selecione" }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
