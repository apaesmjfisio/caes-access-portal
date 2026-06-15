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

// Pequeno catálogo de CIDs frequentes para autocomplete.
export type CidEntry = { sistema: CidSystem; codigo: string; descricao: string };
export const CID_CATALOG: CidEntry[] = [
  // CID-10 (amostra ortopédica / clínica frequente)
  { sistema: "CID-10", codigo: "M54.5", descricao: "Dor lombar baixa" },
  { sistema: "CID-10", codigo: "M54.4", descricao: "Lumbago com ciática" },
  { sistema: "CID-10", codigo: "M54.2", descricao: "Cervicalgia" },
  { sistema: "CID-10", codigo: "M54.1", descricao: "Radiculopatia" },
  { sistema: "CID-10", codigo: "M51.1", descricao: "Transtornos de discos lombares e de outros discos com radiculopatia" },
  { sistema: "CID-10", codigo: "M50.1", descricao: "Transtornos de discos cervicais com radiculopatia" },
  { sistema: "CID-10", codigo: "M75.0", descricao: "Capsulite adesiva do ombro" },
  { sistema: "CID-10", codigo: "M17.0", descricao: "Gonartrose primária bilateral" },
  { sistema: "CID-10", codigo: "M25.5", descricao: "Dor articular" },
  { sistema: "CID-10", codigo: "M19.9", descricao: "Artrose não especificada" },
  { sistema: "CID-10", codigo: "M62.6", descricao: "Distensão muscular" },
  { sistema: "CID-10", codigo: "M79.7", descricao: "Fibromialgia" },
  { sistema: "CID-10", codigo: "S83.5", descricao: "Entorse e distensão envolvendo o ligamento cruzado do joelho" },
  { sistema: "CID-10", codigo: "I10", descricao: "Hipertensão essencial (primária)" },
  { sistema: "CID-10", codigo: "E11.9", descricao: "Diabetes mellitus tipo 2 sem complicações" },
  { sistema: "CID-10", codigo: "E66.9", descricao: "Obesidade não especificada" },
  { sistema: "CID-10", codigo: "F32.9", descricao: "Episódio depressivo não especificado" },
  { sistema: "CID-10", codigo: "F41.1", descricao: "Ansiedade generalizada" },
  { sistema: "CID-10", codigo: "G43.9", descricao: "Enxaqueca não especificada" },
  { sistema: "CID-10", codigo: "J45.9", descricao: "Asma não especificada" },
  // CID-11 (amostra)
  { sistema: "CID-11", codigo: "MG30.2", descricao: "Dor lombar crônica" },
  { sistema: "CID-11", codigo: "ME84.2", descricao: "Cervicalgia" },
  { sistema: "CID-11", codigo: "NE52.1", descricao: "Radiculopatia lombar" },
  { sistema: "CID-11", codigo: "FA00.0", descricao: "Osteoartrite do joelho" },
  { sistema: "CID-11", codigo: "FB56.0", descricao: "Capsulite adesiva do ombro" },
  { sistema: "CID-11", codigo: "BA00", descricao: "Hipertensão essencial" },
  { sistema: "CID-11", codigo: "5A11", descricao: "Diabetes mellitus tipo 2" },
  { sistema: "CID-11", codigo: "6A70", descricao: "Episódio depressivo único" },
  { sistema: "CID-11", codigo: "6B00", descricao: "Transtorno de ansiedade generalizada" },
  { sistema: "CID-11", codigo: "8A80", descricao: "Enxaqueca" },
];

export function searchCid(sistema: CidSystem, term: string): CidEntry[] {
  const t = term.trim().toLowerCase();
  if (!t) return CID_CATALOG.filter(c => c.sistema === sistema).slice(0, 10);
  return CID_CATALOG
    .filter(c => c.sistema === sistema)
    .filter(c =>
      c.codigo.toLowerCase().includes(t) ||
      c.descricao.toLowerCase().includes(t),
    )
    .slice(0, 12);
}
