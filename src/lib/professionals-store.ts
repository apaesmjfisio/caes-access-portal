// Profissionais (colaboradores) — armazenamento local por usuário.
// Schema reformulado conforme PROFISSIONAIS E CIDS.txt.

export type AvailabilityDay = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export type HorarioMode = "igual" | "diferente";
export type HorarioDia = {
  entrada: string; almocoIni: string; almocoFim: string;
  saida: string; evolucaoIni: string; evolucaoFim: string;
};

export type RegistroProfissional = {
  conselho: string;          // ex.: CRM, CRESS
  ufConselho: string;        // usado p/ conselhos com UF
  regiao: string;            // usado p/ conselhos com Região (1..27)
  numeroRegistro: string;
};

export type AssociacaoItem = { nome: string; numero: string };

export type ProfessionalStatus = "Ativo" | "Inativo";

export type Professional = {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastAccessAt: string;

  // 1. Dados pessoais
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  sexo: string;
  estadoCivil: string;
  email: string;
  celular: string;
  telefoneSecundario: string;
  cep: string;
  logradouro: string;
  numeroEnd: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;

  // 2. Dados profissionais
  profissao: string;
  registroProf: RegistroProfissional;
  rqes: string[];
  associacoes: AssociacaoItem[];

  // 3. Disponibilidade
  dias: AvailabilityDay[];
  horaEntrada: string;
  horaSaida: string;
  almocoIni: string;
  almocoFim: string;
  evolucaoIni: string;
  evolucaoFim: string;

  // 4. Configurações
  status: ProfessionalStatus;
  corAgenda: string;
  fotoDataUrl: string;
  assinaturaDataUrl: string;
};

const KEY = (u: string) => `caes.sys.${u}.professionals.v2`;
const isBrowser = () => typeof window !== "undefined";

export function loadProfessionals(user: string): Professional[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(KEY(user)) ?? "[]"); }
  catch { return []; }
}

export function saveProfessionals(user: string, list: Professional[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY(user), JSON.stringify(list));
}

export function emptyProfessional(): Professional {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    createdAt: now, updatedAt: now, lastAccessAt: "",
    nome: "", cpf: "", rg: "", dataNascimento: "", sexo: "", estadoCivil: "",
    email: "", celular: "", telefoneSecundario: "",
    cep: "", logradouro: "", numeroEnd: "", complemento: "",
    bairro: "", cidade: "", estado: "", pais: "Brasil",
    profissao: "",
    registroProf: { conselho: "", ufConselho: "", regiao: "", numeroRegistro: "" },
    rqes: [],
    associacoes: [],
    dias: [],
    horaEntrada: "08:00", horaSaida: "18:00",
    almocoIni: "12:00", almocoFim: "13:00",
    evolucaoIni: "17:00", evolucaoFim: "18:00",
    status: "Ativo",
    corAgenda: "#3B82F6",
    fotoDataUrl: "", assinaturaDataUrl: "",
  };
}

// ============= Listas auxiliares =============

export const UFS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

export const SEXOS = ["Feminino", "Masculino", "Outro", "Prefiro não informar"];
export const ESTADOS_CIVIS = [
  "Solteiro(a)","Casado(a)","Divorciado(a)","Viúvo(a)","União estável","Separado(a)",
];

// Profissão -> Conselho automático (regulamentadas)
export const PROFISSAO_TO_CONSELHO: Record<string, string> = {
  "Assistente Social": "CRESS",
  "Dentista": "CRO",
  "Enfermeiro": "COREN",
  "Farmacêutico": "CRF",
  "Fisioterapeuta": "CREFITO",
  "Fonoaudiólogo": "CRFa",
  "Médico": "CRM",
  "Nutricionista": "CRN",
  "Psicólogo": "CRP",
  "Terapeuta Ocupacional": "CREFITO",
};

// Outras profissões (não regulamentadas / sem conselho automático)
export const OUTRAS_PROFISSOES = [
  "Auxiliar Administrativo", "Recepcionista", "Coordenador(a)",
  "Educador(a) Físico(a)", "Técnico(a) de Enfermagem", "Pedagogo(a)",
  "Auxiliar de Limpeza", "Motorista", "Outro",
];

export const PROFISSOES = [
  ...Object.keys(PROFISSAO_TO_CONSELHO),
  ...OUTRAS_PROFISSOES,
].sort((a, b) => a.localeCompare(b, "pt-BR"));

export function isProfissaoRegulamentada(profissao: string): boolean {
  return !!PROFISSAO_TO_CONSELHO[profissao];
}

// Tipo de identificação por conselho
export type ConselhoIdentType = "uf" | "regiao" | "none";

export function conselhoIdentType(conselho: string): ConselhoIdentType {
  const porUF = ["CRO", "COREN", "CRF", "CRM"];
  const porRegiao = ["CRESS", "CREFITO", "CRFa", "CRN", "CRP"];
  if (porUF.includes(conselho)) return "uf";
  if (porRegiao.includes(conselho)) return "regiao";
  return "none";
}

// Regiões 1ª - 27ª (formatação por conselho)
export function listRegioes(conselho: string): string[] {
  const n = 27;
  const arr: string[] = [];
  if (conselho === "CREFITO") {
    for (let i = 1; i <= n; i++) arr.push(String(i));
  } else if (conselho === "CRP") {
    for (let i = 1; i <= n; i++) arr.push(String(i).padStart(2, "0"));
  } else {
    for (let i = 1; i <= n; i++) arr.push(`${i}ª Região`);
  }
  return arr;
}

// Cores sugeridas para a agenda
export const CORES_AGENDA = [
  { label: "Azul",    value: "#3B82F6" },
  { label: "Verde",   value: "#10B981" },
  { label: "Laranja", value: "#F97316" },
  { label: "Roxo",    value: "#8B5CF6" },
  { label: "Rosa",    value: "#EC4899" },
  { label: "Vermelho",value: "#EF4444" },
  { label: "Âmbar",   value: "#F59E0B" },
  { label: "Ciano",   value: "#06B6D4" },
];

export const DIAS_SEMANA: { v: AvailabilityDay; l: string }[] = [
  { v: "seg", l: "Segunda-feira" },
  { v: "ter", l: "Terça-feira" },
  { v: "qua", l: "Quarta-feira" },
  { v: "qui", l: "Quinta-feira" },
  { v: "sex", l: "Sexta-feira" },
];
