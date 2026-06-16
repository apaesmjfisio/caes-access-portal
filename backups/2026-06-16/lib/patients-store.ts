// Patient registry — local storage scoped per user (login).
import type { Diagnosis, DiagnosisDoc } from "@/lib/diagnoses-store";

export type Documento = {
  tipo: string;
  numero: string;
  orgaoEmissor: string;
  dataEmissao: string;
};

export type ContatoEmergencia = {
  nome: string;
  parentesco: string;
  telefonePrincipal: string;
  telefoneAlternativo: string;
  email: string;
  observacoes: string;
  principal: boolean;
};

export type Endereco = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
};

export type Patient = {
  id: string;
  createdAt: string;
  updatedAt: string;

  // 1. Identificação
  nomeCompleto: string;
  nomeSocial: string;
  sexoBiologico: string;
  genero: string;
  dataNascimento: string;
  estadoCivil: string;
  nacionalidade: string;
  naturalidade: string;
  profissao: string;
  empresaTrabalha: string;
  escolaridade: string;
  cpf: string;
  rg: string;
  orgaoEmissor: string;
  dataEmissao: string;
  cns: string;
  ama: string;
  nis: string;
  fotoDataUrl: string;
  documentos: Documento[];
  tipoSanguineo: string;
  fatorRh: string;
  etnia: string;
  religiao: string;
  observacoes: string;

  // 2. Contato
  celularPrincipal: string;
  celularSecundario: string;
  telefoneResidencial: string;
  telefoneComercial: string;
  emailPrincipal: string;
  emailSecundario: string;
  preferenciaContato: { whatsapp: boolean; ligacao: boolean; sms: boolean; email: boolean };
  autorizacoes: {
    mensagens: boolean;
    lembretes: boolean;
    campanhas: boolean;
    contatoTelefone: boolean;
  };
  contatoObservacoes: string;

  // 3. Endereço
  enderecoResidencial: Endereco;
  enderecoMesmoCorrespondencia: boolean;
  enderecoCorrespondencia: Endereco;

  // 4. Representante Legal
  rep: {
    nomeCompleto: string;
    nomeSocial: string;
    cpf: string;
    rg: string;
    orgaoEmissor: string;
    dataEmissao: string;
    dataNascimento: string;
    estadoCivil: string;
    nacionalidade: string;
    naturalidade: string;
    profissao: string;
    empresaTrabalha: string;
    escolaridade: string;
    celularPrincipal: string;
    celularSecundario: string;
    telefoneResidencial: string;
    telefoneComercial: string;
    email: string;
    mesmoEndereco: boolean;
    endereco: Endereco;
  };

  // 5. Emergência
  contatosEmergencia: ContatoEmergencia[];

  // 6. Diagnósticos (CID-10 / CID-11)
  diagnoses: Diagnosis[];
  diagnosisDocs: DiagnosisDoc[];
};

const KEY = (login: string) => `caes.patients.${login}`;

export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
export const SEXOS = ["Masculino", "Feminino", "Intersexo"];
export const GENEROS = ["Masculino", "Feminino", "Não-binário", "Outro", "Prefere não informar"];
export const ESTADOS_CIVIS = ["Solteiro(a)","Casado(a)","Divorciado(a)","Viúvo(a)","União estável","Separado(a)"];
export const ESCOLARIDADES = ["Analfabeto","Fundamental incompleto","Fundamental completo","Médio incompleto","Médio completo","Superior incompleto","Superior completo","Pós-graduação","Mestrado","Doutorado"];
export const TIPOS_DOCUMENTO = ["RG","CNH","Passaporte","Carteira de Trabalho","Título de Eleitor","Certidão de Nascimento","Outro"];
export const TIPOS_SANGUINEOS = ["A","B","AB","O"];
export const FATORES_RH = ["Positivo","Negativo"];
export const ETNIAS = ["Branca","Preta","Parda","Amarela","Indígena","Não declarada"];
export const RELIGIOES = ["Católica","Evangélica","Espírita","Umbanda/Candomblé","Judaica","Muçulmana","Budista","Sem religião","Outra"];
export const ORGAOS_EMISSORES = ["SSP","SESP","PC","DETRAN","IFP","Outro"];
export const PARENTESCOS = ["Pai","Mãe","Cônjuge","Filho(a)","Irmão(ã)","Avô/Avó","Tio(a)","Primo(a)","Amigo(a)","Outro"];

function emptyEndereco(): Endereco {
  return { cep:"", logradouro:"", numero:"", complemento:"", bairro:"", cidade:"", estado:"", pais:"Brasil" };
}

export function emptyContatoEmergencia(principal = false): ContatoEmergencia {
  return { nome:"", parentesco:"", telefonePrincipal:"", telefoneAlternativo:"", email:"", observacoes:"", principal };
}

export function emptyPatient(): Patient {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nomeCompleto:"", nomeSocial:"", sexoBiologico:"", genero:"", dataNascimento:"",
    estadoCivil:"", nacionalidade:"", naturalidade:"", profissao:"", empresaTrabalha:"",
    escolaridade:"", cpf:"", rg:"", orgaoEmissor:"", dataEmissao:"", cns:"", ama:"", nis:"",
    fotoDataUrl:"", documentos:[], tipoSanguineo:"", fatorRh:"", etnia:"", religiao:"", observacoes:"",
    celularPrincipal:"", celularSecundario:"", telefoneResidencial:"", telefoneComercial:"",
    emailPrincipal:"", emailSecundario:"",
    preferenciaContato:{ whatsapp:true, ligacao:true, sms:false, email:false },
    autorizacoes:{ mensagens:true, lembretes:true, campanhas:false, contatoTelefone:true },
    contatoObservacoes:"",
    enderecoResidencial: emptyEndereco(),
    enderecoMesmoCorrespondencia: true,
    enderecoCorrespondencia: emptyEndereco(),
    rep: {
      nomeCompleto:"", nomeSocial:"", cpf:"", rg:"", orgaoEmissor:"", dataEmissao:"",
      dataNascimento:"", estadoCivil:"", nacionalidade:"", naturalidade:"",
      profissao:"", empresaTrabalha:"", escolaridade:"",
      celularPrincipal:"", celularSecundario:"", telefoneResidencial:"", telefoneComercial:"", email:"",
      mesmoEndereco:false, endereco: emptyEndereco(),
    },
    contatosEmergencia: [emptyContatoEmergencia(true)],
    diagnoses: [],
    diagnosisDocs: [],
  };
}

export function loadPatients(login: string): Patient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY(login));
    return raw ? (JSON.parse(raw) as Patient[]) : [];
  } catch { return []; }
}

export function savePatients(login: string, list: Patient[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY(login), JSON.stringify(list));
}

export function calcIdade(dataNascimento: string): string {
  if (!dataNascimento) return "";
  const d = new Date(dataNascimento);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? `${age} anos` : "";
}
