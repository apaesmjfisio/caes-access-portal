import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Plus, Trash2, Camera, Upload, UserPlus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import logoApae from "@/assets/logo-apae.png";
import bgImage from "@/assets/bg-configuracoes.jpg";
import { getSession, type Session } from "@/lib/auth";
import {
  loadProfessionals, saveProfessionals, emptyProfessional,
  UFS, CONSELHOS, CBOS_LIST, GRAUS_PARTICIPACAO, TIPOS_ATENDIMENTO,
  SEXOS, ESTADOS_CIVIS, type Professional,
} from "@/lib/professionals-store";

export const Route = createFileRoute("/profissionais")({
  head: () => ({ meta: [{ title: "Profissionais — CAES" }] }),
  component: ProfissionaisPage,
});

function ProfissionaisPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [list, setList] = useState<Professional[]>([]);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [cbosSearch, setCbosSearch] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s) { navigate({ to: "/login" }); return; }
    setSession(s);
    setList(loadProfessionals(s.login));
  }, [navigate]);

  if (!session) return null;

  function startNew() { setEditing(emptyProfessional()); }
  function startEdit(p: Professional) { setEditing({ ...p }); setCbosSearch(""); }

  function save() {
    if (!editing || !session) return;
    if (!editing.nome.trim()) {
      toast.error("Informe o nome do colaborador.");
      return;
    }
    const exists = list.some((p) => p.id === editing.id);
    const updated = exists
      ? list.map((p) => (p.id === editing.id ? editing : p))
      : [...list, editing];
    setList(updated);
    saveProfessionals(session.login, updated);
    toast.success("Profissional salvo com sucesso.");
    setEditing(null);
  }

  function removeProf(id: string) {
    if (!session) return;
    if (!confirm("Excluir este profissional?")) return;
    const next = list.filter((p) => p.id !== id);
    setList(next);
    saveProfessionals(session.login, next);
    toast.success("Profissional excluído.");
  }

  function update<K extends keyof Professional>(k: K, v: Professional[K]) {
    if (!editing) return;
    setEditing({ ...editing, [k]: v });
  }

  function handleFoto(file?: File | null) {
    if (!file || !editing) return;
    const r = new FileReader();
    r.onload = () => setEditing({ ...editing, fotoDataUrl: r.result as string });
    r.readAsDataURL(file);
  }

  function addConvenio() {
    if (!editing) return;
    setEditing({
      ...editing,
      conveniosCodigos: [...editing.conveniosCodigos, { convenio: "", codigo: "" }],
    });
  }
  function rmConvenio(i: number) {
    if (!editing) return;
    const arr = editing.conveniosCodigos.filter((_, idx) => idx !== i);
    setEditing({ ...editing, conveniosCodigos: arr });
  }

  const filteredCbos = CBOS_LIST.filter((c) =>
    `${c.code} ${c.name}`.toLowerCase().includes(cbosSearch.toLowerCase()),
  );

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
            {!editing && (
              <Button size="sm" onClick={startNew}>
                <UserPlus className="h-4 w-4" /> Novo profissional
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        {!editing && (
          <Card className="p-5">
            <h2 className="mb-3 text-lg font-bold">Profissionais cadastrados</h2>
            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum profissional cadastrado. Clique em <b>Novo profissional</b> para iniciar.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-3 py-2">Área</th>
                      <th className="px-3 py-2">Registro</th>
                      <th className="px-3 py-2">E-mail</th>
                      <th className="px-3 py-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-3 py-2 font-semibold">{p.nome}</td>
                        <td className="px-3 py-2">{p.area || "—"}</td>
                        <td className="px-3 py-2">{p.registro || "—"}</td>
                        <td className="px-3 py-2">{p.email || "—"}</td>
                        <td className="px-3 py-2 text-right">
                          <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="ghost" className="ml-2 text-destructive"
                            onClick={() => removeProf(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {editing && (
          <Form
            p={editing} update={update} handleFoto={handleFoto}
            addConvenio={addConvenio} rmConvenio={rmConvenio}
            cbosSearch={cbosSearch} setCbosSearch={setCbosSearch}
            filteredCbos={filteredCbos}
            onCancel={() => setEditing(null)}
            onSave={save}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Form ---------- */

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

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="font-semibold">
        {label}{required && <span className="text-destructive">*</span>}:
      </Label>
      {children}
    </div>
  );
}

type FormProps = {
  p: Professional;
  update: <K extends keyof Professional>(k: K, v: Professional[K]) => void;
  handleFoto: (f?: File | null) => void;
  addConvenio: () => void;
  rmConvenio: (i: number) => void;
  cbosSearch: string;
  setCbosSearch: (s: string) => void;
  filteredCbos: typeof CBOS_LIST;
  onCancel: () => void;
  onSave: () => void;
};

function Form({
  p, update, handleFoto, addConvenio, rmConvenio,
  cbosSearch, setCbosSearch, filteredCbos, onCancel, onSave,
}: FormProps) {
  return (
    <div className="space-y-5">
      <Section title="Dados pessoais">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Field label="Nome" required>
              <Input value={p.nome} placeholder="Nome do colaborador"
                onChange={(e) => update("nome", e.target.value)} />
            </Field>
          </div>
          <label className="mt-7 flex items-center gap-2 text-sm">
            <Checkbox checked={p.nomeSocial}
              onCheckedChange={(v) => update("nomeSocial", Boolean(v))} />
            É nome social
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Tipo">
            <Select value={p.tipo} onValueChange={(v) => update("tipo", v as Professional["tipo"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pessoa física">Pessoa física</SelectItem>
                <SelectItem value="Pessoa jurídica">Pessoa jurídica</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Data de nascimento">
            <Input type="date" value={p.dataNascimento}
              onChange={(e) => update("dataNascimento", e.target.value)} />
          </Field>
          <Field label="Sexo">
            <Select value={p.sexo} onValueChange={(v) => update("sexo", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {SEXOS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="CPF">
            <Input value={p.cpf} placeholder="___.___.___-__"
              onChange={(e) => update("cpf", e.target.value)} />
          </Field>
          <Field label="RG">
            <Input value={p.rg} onChange={(e) => update("rg", e.target.value)} />
          </Field>
          <Field label="Estado civil">
            <Select value={p.estadoCivil} onValueChange={(v) => update("estadoCivil", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {ESTADOS_CIVIS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Profissão">
            <Input value={p.profissao} onChange={(e) => update("profissao", e.target.value)} />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={p.email}
              onChange={(e) => update("email", e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Telefone fixo">
            <Input value={p.telefoneFixo} placeholder="(__) ____-____"
              onChange={(e) => update("telefoneFixo", e.target.value)} />
          </Field>
          <Field label="Celular">
            <Input value={p.celular} placeholder="(99) 9 9999-9999"
              onChange={(e) => update("celular", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Dados profissionais">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Área do profissional">
            <Input value={p.area} onChange={(e) => update("area", e.target.value)} />
          </Field>
          <div className="space-y-1">
            <Field label="Registro">
              <Input value={p.registro} onChange={(e) => update("registro", e.target.value)} />
            </Field>
            <p className="text-xs text-muted-foreground">
              Informações do registro. Ex: Crefito: 999999-F
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Grau Part.">
            <Select value={p.grauPart} onValueChange={(v) => update("grauPart", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {GRAUS_PARTICIPACAO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tipo de Atendimento">
            <Select value={p.tipoAtendimento} onValueChange={(v) => update("tipoAtendimento", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {TIPOS_ATENDIMENTO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Dados de endereço">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="País">
            <Input value={p.pais} onChange={(e) => update("pais", e.target.value)} />
          </Field>
          <Field label="CEP">
            <Input value={p.cep} onChange={(e) => update("cep", e.target.value)} />
          </Field>
          <Field label="Estado">
            <Select value={p.estado} onValueChange={(v) => update("estado", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um estado" /></SelectTrigger>
              <SelectContent>
                {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Cidade">
            <Input value={p.cidade} onChange={(e) => update("cidade", e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Logradouro">
            <Input value={p.logradouro} onChange={(e) => update("logradouro", e.target.value)} />
          </Field>
          <Field label="Número">
            <Input value={p.numeroEnd} onChange={(e) => update("numeroEnd", e.target.value)} />
          </Field>
          <Field label="Bairro">
            <Input value={p.bairro} onChange={(e) => update("bairro", e.target.value)} />
          </Field>
          <Field label="Complemento">
            <Input value={p.complemento} onChange={(e) => update("complemento", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Dados bancários">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Nome do banco">
            <Input value={p.banco} onChange={(e) => update("banco", e.target.value)} />
          </Field>
          <Field label="Agência da conta">
            <Input value={p.agencia} onChange={(e) => update("agencia", e.target.value)} />
          </Field>
          <Field label="Número da conta">
            <Input value={p.conta} onChange={(e) => update("conta", e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Pix">
            <Select value={p.pix} onValueChange={(v) => update("pix", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
                <SelectItem value="E-mail">E-mail</SelectItem>
                <SelectItem value="Celular">Celular</SelectItem>
                <SelectItem value="Chave aleatória">Chave aleatória</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="space-y-2">
            <Label className="font-semibold">Foto:</Label>
            <div className="flex items-center gap-3">
              {p.fotoDataUrl && (
                <img src={p.fotoDataUrl} alt="foto"
                  className="h-14 w-14 rounded-md object-cover" />
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                <Upload className="h-4 w-4" /> Carregar foto
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleFoto(e.target.files?.[0])} />
              </label>
              <Button type="button" variant="outline" size="sm" disabled>
                <Camera className="h-4 w-4" /> Tirar foto
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Preferência de contato">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={p.contato.campanhas}
            onCheckedChange={(v) => update("contato", { ...p.contato, campanhas: Boolean(v) })} />
          Permitir o envio de campanhas de e-mail
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={p.contato.notificacoes}
            onCheckedChange={(v) => update("contato", { ...p.contato, notificacoes: Boolean(v) })} />
          Permitir o envio de e-mails de notificação do sistema
        </label>
        <div className="ml-7 space-y-2">
          {(["email", "sms", "whatsapp"] as const).map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <Checkbox checked={p.contato[k]}
                onCheckedChange={(v) =>
                  update("contato", { ...p.contato, [k]: Boolean(v) })} />
              {k === "email" ? "E-mail" : k === "sms" ? "SMS" : "WhatsApp"}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Registro do profissional">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Conselho profissional">
            <Select value={p.registroProf.conselho}
              onValueChange={(v) => update("registroProf", { ...p.registroProf, conselho: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {CONSELHOS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Número no conselho">
            <Input value={p.registroProf.numero}
              onChange={(e) => update("registroProf", { ...p.registroProf, numero: e.target.value })} />
          </Field>
          <Field label="UF">
            <Select value={p.registroProf.uf}
              onValueChange={(v) => update("registroProf", { ...p.registroProf, uf: v })}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Código CBOS">
            <Select value={p.registroProf.cbos}
              onValueChange={(v) => update("registroProf", { ...p.registroProf, cbos: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="max-h-80">
                <div className="sticky top-0 z-10 bg-popover p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input className="h-8 pl-7" placeholder="Pesquisar..."
                      value={cbosSearch} onChange={(e) => setCbosSearch(e.target.value)} />
                  </div>
                </div>
                {filteredCbos.map((c) => (
                  <SelectItem key={`${c.code}-${c.name}`} value={`(${c.code}) ${c.name}`}>
                    ({c.code}) {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Lista de códigos identificadores por convênio">
        <Button type="button" variant="outline" size="sm" onClick={addConvenio}>
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
        {p.conveniosCodigos.length > 0 && (
          <div className="space-y-2">
            {p.conveniosCodigos.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input placeholder="Convênio" value={row.convenio}
                  onChange={(e) => {
                    const arr = [...p.conveniosCodigos];
                    arr[i] = { ...arr[i], convenio: e.target.value };
                    update("conveniosCodigos", arr);
                  }} />
                <Input placeholder="Código identificador" value={row.codigo}
                  onChange={(e) => {
                    const arr = [...p.conveniosCodigos];
                    arr[i] = { ...arr[i], codigo: e.target.value };
                    update("conveniosCodigos", arr);
                  }} />
                <Button type="button" variant="ghost" size="icon" onClick={() => rmConvenio(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={onSave} className="bg-sky-500 hover:bg-sky-600 text-white">
          <Save className="h-4 w-4" /> Salvar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Os itens com * são obrigatórios</p>
    </div>
  );
}
