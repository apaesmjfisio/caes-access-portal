// Máscaras, validações e formatadores reutilizáveis.
// Convenção: armazenar SOMENTE os dígitos; exibir formatado.

export const onlyDigits = (s: string) => (s || "").replace(/\D+/g, "");

/* ---------- CPF ---------- */
export function maskCPF(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function validateCPF(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += parseInt(base[i], 10) * (factor - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 10), 11);
  return d1 === parseInt(cpf[9], 10) && d2 === parseInt(cpf[10], 10);
}

/* ---------- Agrupamento 3 dígitos da direita (RG / AMA) ---------- */
export function maskGroup3FromRight(raw: string): string {
  const d = onlyDigits(raw);
  if (!d) return "";
  const parts: string[] = [];
  for (let i = d.length; i > 0; i -= 3) {
    parts.unshift(d.slice(Math.max(0, i - 3), i));
  }
  return parts.join(".");
}

/* ---------- CNS ---------- */
export function maskCNS(raw: string): string {
  const d = onlyDigits(raw).slice(0, 15);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 11) return `${d.slice(0, 3)}.${d.slice(3, 7)}.${d.slice(7)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 7)}.${d.slice(7, 11)}.${d.slice(11)}`;
}

// Validação oficial CNS (Ministério da Saúde).
export function validateCNS(raw: string): boolean {
  const cns = onlyDigits(raw);
  if (cns.length !== 15) return false;
  const first = cns[0];
  const digits = cns.split("").map((c) => parseInt(c, 10));
  if (first === "1" || first === "2") {
    const pis = cns.substring(0, 11);
    let soma = 0;
    for (let i = 0; i < 11; i++) soma += parseInt(pis[i], 10) * (15 - i);
    let resto = soma % 11;
    let dv = 11 - resto;
    let resultado: string;
    if (dv === 11) dv = 0;
    if (dv === 10) {
      soma += 2;
      resto = soma % 11;
      dv = 11 - resto;
      resultado = `${pis}001${dv}`;
    } else {
      resultado = `${pis}000${dv}`;
    }
    return resultado === cns;
  }
  if (first === "7" || first === "8" || first === "9") {
    let soma = 0;
    for (let i = 0; i < 15; i++) soma += digits[i] * (15 - i);
    return soma % 11 === 0;
  }
  return false;
}

/* ---------- Telefones ---------- */
export function maskCelular(raw: string): string {
  // (00) 00000-0000
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskFixo(raw: string): string {
  // (00) 0000-0000
  const d = onlyDigits(raw).slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

// Inteligente: 11 dígitos = celular; 10 dígitos = fixo
export function maskTelefoneSmart(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length === 11) return maskCelular(d);
  if (d.length === 10) return maskFixo(d);
  // em digitação ainda incompleta, mostra "celular-style"
  return maskCelular(d);
}

/* ---------- CEP ---------- */
export function maskCEP(raw: string): string {
  const d = onlyDigits(raw).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export type ViaCepResult = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export async function fetchViaCep(rawCep: string): Promise<ViaCepResult | null> {
  const d = onlyDigits(rawCep);
  if (d.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
    if (!res.ok) return null;
    const json = (await res.json()) as ViaCepResult;
    if (json.erro) return null;
    return json;
  } catch {
    return null;
  }
}
