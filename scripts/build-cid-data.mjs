// Generate src/lib/cid-data.json from Pasta1.csv (CID-11) and Pasta2.csv (CID-10).
import fs from "node:fs";
import path from "node:path";

const SRC = process.argv[2] || "/mnt/user-uploads";
const OUT = path.resolve("src/lib/cid-data.json");

function read(p) {
  return fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/);
}

// CID-11: "1A06 Descricao" or "1A03.0 Descricao" or "1A36,00 ..." (treat comma as period)
const RE11 = /^([0-9A-Z]{2,8}(?:[.,][0-9A-Z]{1,3})?)\s+(.+?)\s*$/;
// CID-10: "A04 - Descricao" or "A04.5 - Descricao"
const RE10 = /^([A-Z][0-9]{2}(?:\.[0-9A-Z]+)?)\s*[-–]\s*(.+?)\s*$/;

const out = [];
const seen = new Set();

function push(sistema, codigo, descricao) {
  codigo = codigo.replace(",", ".").trim();
  descricao = descricao.replace(/\s+/g, " ").trim();
  if (!codigo || !descricao) return;
  const key = sistema + "|" + codigo;
  if (seen.has(key)) return;
  seen.add(key);
  out.push({ s: sistema === "CID-10" ? 10 : 11, c: codigo, d: descricao });
}

for (const line of read(path.join(SRC, "Pasta1.csv"))) {
  const m = line.match(RE11);
  if (m) push("CID-11", m[1], m[2]);
}
for (const line of read(path.join(SRC, "Pasta2.csv"))) {
  const m = line.match(RE10);
  if (m) push("CID-10", m[1], m[2]);
}

fs.writeFileSync(OUT, JSON.stringify(out));
const sz = fs.statSync(OUT).size;
console.log(`Wrote ${out.length} entries to ${OUT} (${(sz / 1024).toFixed(1)} KB)`);
console.log("CID-10:", out.filter(x => x.s === 10).length);
console.log("CID-11:", out.filter(x => x.s === 11).length);
console.log("Samples:", out.slice(0, 3), "...", out.slice(-3));
