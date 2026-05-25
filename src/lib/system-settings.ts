// System-wide ("premium") settings: Contato (clinic info, WhatsApp, e-mail,
// reminder/birthday templates, sent log filters). Stored per user in localStorage.

export type ConfirmYesNo = "sim" | "nao";

export type ContatoGeneral = {
  clinicName: string;
  phone: string;
  address: string;
  site: string;
  sendConfirmationLink: ConfirmYesNo;
  logoDataUrl?: string;
};

export type ContatoWhatsapp = {
  contactNumber: string;
  allowConfirmation: ConfirmYesNo;
};

export type ContatoEmail = {
  replyTo: string;
};

export type ReminderTemplate = {
  whatsapp: string;
  sms: string;
  email: string;
};

export type ManualReminderTemplate = {
  content: string;
};

export type BirthdayTemplate = {
  content: string;
};

export type SentPeriodFilter = {
  start: string; // YYYY-MM-DD
  end: string;
  patient: string;
  phone: string;
  status: "todas" | "enviada" | "pendente" | "falha";
  countsInPackage: "todas" | "sim" | "nao";
};

export type SystemSettings = {
  general: ContatoGeneral;
  whatsapp: ContatoWhatsapp;
  email: ContatoEmail;
  autoReminder: ReminderTemplate;
  manualReminder: ManualReminderTemplate;
  birthday: BirthdayTemplate;
  sentFilter: SentPeriodFilter;
};

export const REMINDER_TAGS = [
  "#nome_da_clinica",
  "#primeiro_nome_do_paciente",
  "#nome_completo_do_paciente",
  "#profissional_do_atendimento",
  "#area_do_profissional",
  "#especialidade_do_profissional",
  "#data_do_atendimento",
  "#hora_do_atendimento",
  "#dia_da_semana",
  "#convenio_do_paciente",
  "#repeticao_do_atendimento",
  "#pacote_de_atendimento",
  "#procedimento_do_atendimento",
  "#sala_de_atendimento",
];

export const BIRTHDAY_TAGS = [
  "#nome_da_clinica",
  "#nome_completo_do_paciente",
  "#primeiro_nome_do_paciente",
  "#idade_do_paciente",
];

const DEFAULT_REMINDER = `Olá, #primeiro_nome_do_paciente!

Você tem horário agendado com o(a) #area_do_profissional #profissional_do_atendimento #data_do_atendimento às #hora_do_atendimento.

Aguardamos sua presença. Até mais!`;

const DEFAULT_BIRTHDAY = `Parabéns #primeiro_nome_do_paciente! Que você tenha um dia lindo junto com as pessoas que você ama. São os votos da equipe #nome_da_clinica.`;

export function defaultSystemSettings(): SystemSettings {
  const today = new Date();
  const in30 = new Date(today); in30.setDate(today.getDate() + 30);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    general: {
      clinicName: "CAES — APAE Santa Maria de Jetibá",
      phone: "",
      address: "",
      site: "",
      sendConfirmationLink: "sim",
    },
    whatsapp: { contactNumber: "", allowConfirmation: "sim" },
    email: { replyTo: "" },
    autoReminder: {
      whatsapp: DEFAULT_REMINDER,
      sms: DEFAULT_REMINDER,
      email: DEFAULT_REMINDER,
    },
    manualReminder: { content: DEFAULT_REMINDER },
    birthday: { content: DEFAULT_BIRTHDAY },
    sentFilter: {
      start: iso(today),
      end: iso(in30),
      patient: "",
      phone: "",
      status: "todas",
      countsInPackage: "todas",
    },
  };
}

const KEY = (u: string) => `caes.sys.${u}.settings`;
const isBrowser = () => typeof window !== "undefined";

export function loadSystemSettings(user: string): SystemSettings {
  if (!isBrowser()) return defaultSystemSettings();
  const raw = localStorage.getItem(KEY(user));
  if (!raw) {
    const s = defaultSystemSettings();
    localStorage.setItem(KEY(user), JSON.stringify(s));
    return s;
  }
  try { return { ...defaultSystemSettings(), ...JSON.parse(raw) }; }
  catch { return defaultSystemSettings(); }
}

export function saveSystemSettings(user: string, s: SystemSettings) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY(user), JSON.stringify(s));
}
