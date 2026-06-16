import { useEffect, useRef, useState } from "react";
import { Stethoscope, Plus, Pencil, Clock, Trash2, Search, Paperclip, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CID_SYSTEMS, DIAGNOSIS_STATUSES, STATUS_COLOR,
  searchCid, type CidEntry, type CidSystem,
  type Diagnosis, type DiagnosisDoc, type DiagnosisStatus,
} from "@/lib/diagnoses-store";

type Props = {
  diagnoses: Diagnosis[];
  documents: DiagnosisDoc[];
  onChange: (next: { diagnoses: Diagnosis[]; documents: DiagnosisDoc[] }) => void;
  currentUser: string;
};

export function TabDiagnosticos({ diagnoses, documents, onChange, currentUser }: Props) {
  const [sistema, setSistema] = useState<CidSystem>("CID-10");
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataDiag, setDataDiag] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [principal, setPrincipal] = useState<string>("");
  const [status, setStatus] = useState<DiagnosisStatus>("Ativo");
  const [obs, setObs] = useState("");
  const [openSuggest, setOpenSuggest] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [histOpen, setHistOpen] = useState<Diagnosis | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [docCidLink, setDocCidLink] = useState<string>("");

  const [suggestions, setSuggestions] = useState<CidEntry[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingSug(true);
    searchCid(sistema, codigo || descricao)
      .then((r) => { if (!cancelled) setSuggestions(r); })
      .finally(() => { if (!cancelled) setLoadingSug(false); });
    return () => { cancelled = true; };
  }, [sistema, codigo, descricao]);


  function pickSuggestion(c: CidEntry) {
    setCodigo(c.codigo);
    setDescricao(c.descricao);
    setOpenSuggest(false);
  }

  function clearForm() {
    setCodigo(""); setDescricao(""); setObs(""); setPrincipal(""); setStatus("Ativo");
    setDataDiag(new Date().toISOString().slice(0, 10));
    setEditId(null);
  }

  function addOrUpdate() {
    if (!codigo.trim()) { toast.error("Informe o código do CID."); return; }
    if (!descricao.trim()) { toast.error("Selecione um CID da lista para preencher a descrição."); return; }
    if (!dataDiag) { toast.error("Informe a data do diagnóstico."); return; }
    if (!principal) { toast.error("Indique se o diagnóstico é Principal."); return; }

    if (editId) {
      const next = diagnoses.map(d => d.id === editId
        ? { ...d, sistema, codigo, descricao, dataDiagnostico: dataDiag, principal: principal === "sim", status, observacoes: obs }
        : d);
      onChange({ diagnoses: next, documents });
      toast.success("Diagnóstico atualizado.");
    } else {
      const novo: Diagnosis = {
        id: crypto.randomUUID(),
        sistema, codigo, descricao,
        dataDiagnostico: dataDiag,
        dataInsercao: new Date().toISOString(),
        principal: principal === "sim",
        status,
        observacoes: obs,
      };
      onChange({ diagnoses: [...diagnoses, novo], documents });
      toast.success("Diagnóstico adicionado.");
    }
    clearForm();
  }

  function startEdit(d: Diagnosis) {
    setEditId(d.id);
    setSistema(d.sistema);
    setCodigo(d.codigo);
    setDescricao(d.descricao);
    setDataDiag(d.dataDiagnostico);
    setPrincipal(d.principal ? "sim" : "nao");
    setStatus(d.status);
    setObs(d.observacoes);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeDiag(id: string) {
    if (!confirm("Marcar este diagnóstico como inativo? O histórico será preservado.")) return;
    const next = diagnoses.map(d => d.id === id ? { ...d, status: "Resolvido" as DiagnosisStatus } : d);
    onChange({ diagnoses: next, documents });
    toast.success("Diagnóstico encerrado (mantido no histórico).");
  }

  async function handleFile(file?: File | null) {
    if (!file) return;
    const max = 10 * 1024 * 1024;
    if (file.size > max) { toast.error("Arquivo excede 10 MB."); return; }
    const allowed = /\.(pdf|jpe?g|png|webp|tiff?|bmp|heic|docx?|)$/i;
    if (!allowed.test(file.name)) { toast.error("Formato não permitido."); return; }
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    const ext = file.name.split(".").pop()?.toUpperCase() || "";
    const novo: DiagnosisDoc = {
      id: crypto.randomUUID(),
      nome: file.name,
      tipo: ext,
      cidsRelacionados: docCidLink ? [docCidLink] : [],
      dataInsercao: new Date().toISOString(),
      inseridoPor: currentUser,
      dataUrl,
      tamanho: file.size,
    };
    onChange({ diagnoses, documents: [...documents, novo] });
    if (fileInput.current) fileInput.current.value = "";
    setDocCidLink("");
    toast.success("Documento anexado.");
  }

  function removeDoc(id: string) {
    if (!confirm("Remover este documento?")) return;
    onChange({ diagnoses, documents: documents.filter(d => d.id !== id) });
  }

  function downloadDoc(d: DiagnosisDoc) {
    if (!d.dataUrl) return;
    const a = document.createElement("a");
    a.href = d.dataUrl;
    a.download = d.nome;
    a.click();
  }

  return (
    <>
      <Card className="border-slate-200 p-5">
        <div className="mb-3 flex items-center gap-2 text-sky-600">
          <Stethoscope className="h-5 w-5" />
          <h2 className="text-base font-semibold">Diagnósticos Médicos (CID-10 / CID-11)</h2>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Cadastre todos os diagnósticos do paciente. É possível registrar diagnósticos em CID-10 ou CID-11, em datas diferentes.
        </p>

        <h3 className="mb-3 text-sm font-semibold text-sky-600">Adicionar Diagnóstico</h3>
        <div className="grid gap-4 md:grid-cols-[180px_180px_1fr]">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">Sistema de Classificação</Label>
            <Select value={sistema} onValueChange={(v) => setSistema(v as CidSystem)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CID_SYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">
              Código <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={codigo}
              placeholder="Ex.: M54.5"
              onChange={(e) => { setCodigo(e.target.value); setOpenSuggest(true); }}
              onFocus={() => setOpenSuggest(true)}
            />
          </div>
          <div className="relative space-y-1">
            <Label className="text-xs font-medium text-slate-700">
              Descrição do Diagnóstico <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Input
                value={descricao}
                placeholder="Digite a descrição ou pesquise o código"
                onChange={(e) => { setDescricao(e.target.value); setOpenSuggest(true); }}
                onFocus={() => setOpenSuggest(true)}
                className="pr-8"
              />

              <Search className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-slate-400" />
            </div>
            {openSuggest && suggestions.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-md">
                {suggestions.map(s => (
                  <button
                    key={`${s.sistema}-${s.codigo}`}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-sky-50"
                    onClick={() => pickSuggestion(s)}
                  >
                    <span className="font-mono font-semibold text-sky-700">{s.codigo}</span>
                    <span className="ml-2 text-slate-700">— {s.descricao}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className="block w-full border-t border-slate-100 px-3 py-1.5 text-center text-xs text-slate-500 hover:bg-slate-50"
                  onClick={() => setOpenSuggest(false)}
                >Fechar sugestões</button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[180px_180px_180px_1fr_auto]">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">
              Data do Diagnóstico <span className="text-rose-500">*</span>
            </Label>
            <Input type="date" value={dataDiag} onChange={(e) => setDataDiag(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">Diagnóstico Principal?</Label>
            <Select value={principal} onValueChange={setPrincipal}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">Status Clínico</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as DiagnosisStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIAGNOSIS_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700">Observações (opcional)</Label>
            <Input value={obs} onChange={(e) => setObs(e.target.value)}
              placeholder="Informações complementares sobre o diagnóstico" />
          </div>
          <div className="flex items-end gap-2">
            {editId && (
              <Button variant="outline" onClick={clearForm}>Cancelar</Button>
            )}
            <Button variant="outline" className="border-sky-300 text-sky-700 hover:bg-sky-50" onClick={addOrUpdate}>
              <Plus className="h-4 w-4" /> {editId ? "Atualizar" : "Adicionar Diagnóstico"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-slate-200 p-5">
        <h3 className="mb-3 text-sm font-semibold text-sky-600">Diagnósticos Cadastrados</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2">Sistema</th>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Descrição do Diagnóstico</th>
                <th className="px-3 py-2">Data do Diagnóstico</th>
                <th className="px-3 py-2">Principal</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Data de Inserção</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {diagnoses.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                  Nenhum diagnóstico cadastrado.
                </td></tr>
              ) : diagnoses.map(d => (
                <tr key={d.id} className="border-t border-slate-200">
                  <td className="px-3 py-2">
                    <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${d.sistema === "CID-10" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-violet-200 bg-violet-50 text-violet-700"}`}>
                      {d.sistema}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-800">{d.codigo}</td>
                  <td className="px-3 py-2 text-slate-700">{d.descricao}</td>
                  <td className="px-3 py-2 text-slate-700">{fmtDate(d.dataDiagnostico)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${d.principal ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {d.principal ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[d.status]}`}>{d.status}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-700">{fmtDateTime(d.dataInsercao)}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-sky-600" onClick={() => startEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-sky-600" onClick={() => setHistOpen(d)}>
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600" onClick={() => removeDiag(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">Total de registros: {diagnoses.length}</p>
        <div className="mt-3 grid gap-2 rounded-md border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600 md:grid-cols-3">
          <span><b className="text-emerald-600">Ativo:</b> diagnóstico atual e considerado no tratamento</span>
          <span><b className="text-amber-600">Inativo:</b> diagnóstico não mais considerado, mantido no histórico</span>
          <span><b className="text-sky-600">Histórico:</b> visualizar alterações e histórico do diagnóstico</span>
        </div>
      </Card>

      <Card className="border-slate-200 p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-sky-600">Documentos e Anexos Relacionados</h3>
          <div className="flex items-center gap-2">
            <Select value={docCidLink} onValueChange={setDocCidLink}>
              <SelectTrigger className="h-8 w-[200px]"><SelectValue placeholder="Vincular ao CID (opcional)" /></SelectTrigger>
              <SelectContent>
                {diagnoses.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-slate-500">Nenhum CID cadastrado</div>
                ) : diagnoses.map(d => (
                  <SelectItem key={d.id} value={d.codigo}>{d.codigo} — {d.descricao}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="border-sky-300 text-sky-700 hover:bg-sky-50" onClick={() => fileInput.current?.click()}>
              <Paperclip className="h-4 w-4" /> Anexar Documento
            </Button>
            <input
              ref={fileInput} type="file" className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.bmp,.heic,.doc,.docx"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        </div>
        <p className="mb-3 text-sm text-slate-600">Anexe atestados, exames, laudos e outros documentos relacionados aos diagnósticos.</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2">Nome do Arquivo</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Relacionado ao CID</th>
                <th className="px-3 py-2">Data de Inserção</th>
                <th className="px-3 py-2">Inserido por</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  Nenhum documento anexado.
                </td></tr>
              ) : documents.map(d => (
                <tr key={d.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 text-slate-700">
                    <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-rose-500" />{d.nome}</span>
                  </td>
                  <td className="px-3 py-2">{d.tipo}</td>
                  <td className="px-3 py-2 font-mono text-xs">{d.cidsRelacionados.join(", ") || "—"}</td>
                  <td className="px-3 py-2">{fmtDateTime(d.dataInsercao)}</td>
                  <td className="px-3 py-2">{d.inseridoPor}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-sky-600" onClick={() => downloadDoc(d)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600" onClick={() => removeDoc(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">Formatos permitidos: PDF, JPG, JPEG, PNG, WEBP, TIFF, BMP, HEIC, DOC, DOCX | Tamanho máximo: 10MB por arquivo</p>
      </Card>

      <Dialog open={!!histOpen} onOpenChange={(o) => !o && setHistOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Histórico do Diagnóstico</DialogTitle></DialogHeader>
          {histOpen && (
            <div className="space-y-3 text-sm">
              <p className="font-mono"><b>{histOpen.sistema}</b> — {histOpen.codigo}</p>
              <p className="text-slate-700">{histOpen.descricao}</p>
              <ul className="space-y-2 border-l-2 border-sky-200 pl-3">
                <li>
                  <span className="text-xs text-slate-500">{fmtDateTime(histOpen.dataInsercao)}</span>
                  <p>Diagnóstico criado — Status: <b>{histOpen.status}</b>{histOpen.principal && " — Principal"}</p>
                </li>
                {histOpen.observacoes && (
                  <li><span className="text-xs text-slate-500">Observações</span><p>{histOpen.observacoes}</p></li>
                )}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function fmtDate(d: string) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("pt-BR");
}
function fmtDateTime(iso: string) {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return iso;
  return `${dt.toLocaleDateString("pt-BR")} ${dt.toTimeString().slice(0, 5)}`;
}
