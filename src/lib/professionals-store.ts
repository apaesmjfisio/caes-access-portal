// Profissionais (cadastro de colaboradores) — armazenamento local por usuário.

export type ProfessionalContactPrefs = {
  campanhas: boolean;
  notificacoes: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
};

export type ProfessionalRegistry = {
  conselho: string;
  numero: string;
  uf: string;
  cbos: string;
};

export type Professional = {
  id: string;
  // Dados pessoais
  nome: string;
  nomeSocial: boolean;
  tipo: "Pessoa física" | "Pessoa jurídica";
  dataNascimento: string;
  sexo: string;
  cpf: string;
  rg: string;
  estadoCivil: string;
  profissao: string;
  email: string;
  telefoneFixo: string;
  celular: string;
  // Profissional
  area: string;
  registro: string;
  grauPart: string;
  tipoAtendimento: string;
  // Endereço
  pais: string;
  cep: string;
  estado: string;
  cidade: string;
  logradouro: string;
  numeroEnd: string;
  bairro: string;
  complemento: string;
  // Bancário
  banco: string;
  agencia: string;
  conta: string;
  pix: string;
  fotoDataUrl?: string;
  // Preferências
  contato: ProfessionalContactPrefs;
  // Registro do profissional
  registroProf: ProfessionalRegistry;
  // Convênios
  conveniosCodigos: { convenio: string; codigo: string }[];
};

export function emptyProfessional(): Professional {
  return {
    id: crypto.randomUUID(),
    nome: "", nomeSocial: false, tipo: "Pessoa física",
    dataNascimento: "", sexo: "", cpf: "", rg: "", estadoCivil: "",
    profissao: "", email: "", telefoneFixo: "", celular: "",
    area: "", registro: "", grauPart: "", tipoAtendimento: "",
    pais: "Brasil", cep: "", estado: "", cidade: "",
    logradouro: "", numeroEnd: "", bairro: "", complemento: "",
    banco: "", agencia: "", conta: "", pix: "",
    contato: { campanhas: true, notificacoes: true, email: true, sms: true, whatsapp: true },
    registroProf: { conselho: "", numero: "", uf: "", cbos: "" },
    conveniosCodigos: [],
  };
}

const KEY = (u: string) => `caes.sys.${u}.professionals`;
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

// --- listas auxiliares ---

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
  "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN",
  "RO", "RR", "RS", "SC", "SE", "SP", "TO",
].sort((a, b) => a.localeCompare(b));

export const CONSELHOS = [
  "(01) Conselho Regional de Serviço Social (CRESS)",
  "(02) Conselho Regional de Enfermagem (COREN)",
  "(03) Conselho Regional de Farmácia (CRF)",
  "(04) Conselho Regional de Fonoaudiologia (CREFONO)",
  "(05) Conselho Regional de Fisioterapia e Terapia Ocupacional (CREFITO)",
  "(06) Conselho Regional de Medicina (CRM)",
  "(07) Conselho Regional de Nutrição (CRN)",
  "(08) Conselho Regional de Odontologia (CRO)",
  "(09) Conselho Regional de Psicologia (CRP)",
  "(10) Outros",
  "(11) Conselho Regional de Biologia (CRBio)",
  "(12) Conselho Regional de Biomedicina (CRBM)",
  "(13) Conselho Regional de Educação Física (CREF)",
  "(14) Conselho Regional de Medicina Veterinária (CRMV)",
  "(15) Conselho Regional de Técnicos em Radiologia (CRTR)",
];

// CBOS de saúde mais comuns (ordenados alfabeticamente pelo nome)
export const CBOS_LIST = [
  { code: "223605", name: "Acupunturista" },
  { code: "239435", name: "Arte-terapeuta" },
  { code: "223605", name: "Assistente social" },
  { code: "225320", name: "Cardiologista" },
  { code: "225335", name: "Clínico geral" },
  { code: "225275", name: "Dermatologista" },
  { code: "223208", name: "Enfermeiro" },
  { code: "223405", name: "Farmacêutico" },
  { code: "223605", name: "Fisioterapeuta" },
  { code: "223650", name: "Fisioterapeuta acupunturista" },
  { code: "223660", name: "Fisioterapeuta do trabalho" },
  { code: "223640", name: "Fisioterapeuta osteopata" },
  { code: "223645", name: "Fisioterapeuta quiropraxista" },
  { code: "223655", name: "Fisioterapeuta esportivo" },
  { code: "223810", name: "Fonoaudiólogo" },
  { code: "225124", name: "Geriatra" },
  { code: "225155", name: "Ginecologista e obstetra" },
  { code: "225250", name: "Neurologista" },
  { code: "225133", name: "Neuropediatra" },
  { code: "223710", name: "Nutricionista" },
  { code: "223208", name: "Obstetra" },
  { code: "223204", name: "Odontologista" },
  { code: "225265", name: "Oftalmologista" },
  { code: "225130", name: "Pediatra" },
  { code: "251510", name: "Psicólogo clínico" },
  { code: "251550", name: "Psicopedagogo" },
  { code: "225133", name: "Psiquiatra" },
  { code: "239440", name: "Terapeuta ocupacional" },
].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

export const GRAUS_PARTICIPACAO = [
  "Titular", "Cirurgião", "Auxiliar", "Anestesista", "Instrumentador",
];

export const TIPOS_ATENDIMENTO = [
  "Consulta", "Avaliação", "Retorno", "Sessão de terapia",
  "Procedimento", "Cirurgia", "Domiciliar", "Teleconsulta",
];

export const SEXOS = ["Feminino", "Masculino", "Outro", "Prefiro não informar"];
export const ESTADOS_CIVIS = [
  "Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União estável",
];
