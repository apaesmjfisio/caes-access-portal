// Diagnósticos (CID-10 / CID-11) — tipos e dataset de exemplo para autocomplete.
export type CidSystem = "CID-10" | "CID-11";
export type DiagnosisStatus = "Ativo" | "Em acompanhamento" | "Resolvido" | "Crônico" | "Remissão" | "Recidiva";

export type Diagnosis = {
  id: string;
  sistema: CidSystem;
  codigo: string;
  descricao: string;
  dataDiagnostico: string;       // YYYY-MM-DD
  dataInsercao: string;          // ISO timestamp
  principal: boolean;
  status: DiagnosisStatus;
  observacoes: string;
};

export type DiagnosisDoc = {
  id: string;
  nome: string;
  tipo: string;                  // PDF / JPG / etc.
  cidsRelacionados: string[];    // ex.: ["M54.5","M51.1"]
  dataInsercao: string;          // ISO
  inseridoPor: string;
  dataUrl?: string;              // base64 (opcional)
  tamanho?: number;
};

export const CID_SYSTEMS: CidSystem[] = ["CID-10", "CID-11"];
export const DIAGNOSIS_STATUSES: DiagnosisStatus[] = [
  "Ativo", "Em acompanhamento", "Resolvido", "Crônico", "Remissão", "Recidiva",
];

export const STATUS_COLOR: Record<DiagnosisStatus, string> = {
  "Ativo": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Em acompanhamento": "bg-sky-100 text-sky-700 border-sky-200",
  "Resolvido": "bg-slate-100 text-slate-700 border-slate-200",
  "Crônico": "bg-orange-100 text-orange-700 border-orange-200",
  "Remissão": "bg-violet-100 text-violet-700 border-violet-200",
  "Recidiva": "bg-rose-100 text-rose-700 border-rose-200",
};

// Catálogo de CIDs carregado sob demanda a partir de src/lib/cid-data.json
// (gerado por scripts/build-cid-data.mjs a partir dos CSVs oficiais).
export type CidEntry = { sistema: CidSystem; codigo: string; descricao: string };

type RawEntry = { s: 10 | 11; c: string; d: string };
let _cache: CidEntry[] | null = null;
let _loading: Promise<CidEntry[]> | null = null;

export async function loadCidCatalog(): Promise<CidEntry[]> {
  if (_cache) return _cache;
  if (_loading) return _loading;
  _loading = (async () => {
    const mod = await import("./cid-data.json");
    const raw = (mod.default ?? mod) as RawEntry[];
    _cache = raw.map((r) => ({
      sistema: r.s === 10 ? "CID-10" : "CID-11",
      codigo: r.c,
      descricao: r.d,
    }));
    return _cache;
  })();
  return _loading;
}

export async function searchCid(sistema: CidSystem, term: string): Promise<CidEntry[]> {
  const catalog = await loadCidCatalog();
  const t = term.trim().toLowerCase();
  const same = catalog.filter((c) => c.sistema === sistema);
  if (!t) return same.slice(0, 50);
  const scored: { e: CidEntry; rank: number }[] = [];
  for (const e of same) {
    const code = e.codigo.toLowerCase();
    const desc = e.descricao.toLowerCase();
    let rank = -1;
    if (code === t) rank = 0;
    else if (code.startsWith(t)) rank = 1;
    else if (code.includes(t)) rank = 2;
    else if (desc.startsWith(t)) rank = 3;
    else if (desc.includes(t)) rank = 4;
    if (rank >= 0) scored.push({ e, rank });
    if (scored.length > 800) break;
  }
  scored.sort((a, b) => a.rank - b.rank || a.e.codigo.localeCompare(b.e.codigo));
  return scored.slice(0, 50).map((s) => s.e);
}

