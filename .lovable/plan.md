## Visão geral

A tarefa tem 3 frentes grandes. Vou apresentar o plano antes para evitar retrabalho.

---

### 1. Backup do projeto atual

Antes de qualquer mudança, crio um snapshot dos arquivos que serão modificados em:

```
backups/2026-06-16/
  ├── routes/profissionais.tsx
  ├── routes/pacientes.tsx
  ├── routes/sistema.tsx
  ├── components/TabDiagnosticos.tsx
  ├── lib/professionals-store.ts
  ├── lib/diagnoses-store.ts
  └── lib/patients-store.ts
```

Observação: o histórico nativo do Lovable (botão de revert em cada mensagem e aba "History") já garante restauração ponto-a-ponto. O backup em `backups/` é redundante mas atende ao pedido.

---

### 2. Base de CIDs (Pasta1.csv = CID-11, Pasta2.csv = CID-10) → aba Diagnósticos

Hoje o autocomplete da aba Diagnóstico usa apenas o catálogo embutido `CID_CATALOG` (~30 itens). Vou substituí-lo pelo conteúdo completo dos dois CSVs.

**Estratégia técnica:**

- Script Node que lê `Pasta1.csv` e `Pasta2.csv`, separando linhas que começam com **código** (ex.: `1A03.0`, `A04.5`) das linhas de **capítulo/categoria** (sem código no início).
- Saída: `src/lib/cid-data.json` com o formato:
  ```json
  [
    {"sistema":"CID-10","codigo":"A04.5","descricao":"Enterite por Campylobacter"},
    {"sistema":"CID-11","codigo":"1A06","descricao":"Gastroenterite por Campylobacter"}
  ]
  ```
- Tamanho esperado: ~35k linhas → ~2-3MB de JSON. Será carregado **sob demanda** (`await import("@/lib/cid-data.json")`) apenas quando a aba Diagnóstico for aberta, para não pesar no bundle inicial.
- `searchCid()` em `diagnoses-store.ts` passa a buscar no dataset completo (limit 50 resultados, ordenado por relevância: match no código primeiro, depois descrição).
- Sistema CID-10/CID-11 continua selecionável (toggle), mantendo a UI atual.

---

### 3. Revamp completo do módulo Profissional

O `txt` lista **mais de 40 campos novos**. Vou reorganizar `src/routes/profissionais.tsx` em duas telas:

**3.1 Tela de listagem (nova)**

Substitui o layout atual. Tabela com:
- Nome | CPF | Profissão | Conselho | Registro | Status (Ativo/Inativo) | Data cadastro | Último acesso
- Ações: 👁 Visualizar | ✏️ Editar | 🔄 Ativar/Inativar | 🗑 Excluir (visível só p/ master)
- Busca rápida (nome, CPF, profissão) + filtros (Profissão / Conselho / Status)
- Botão "Novo Profissional" abre formulário em modal full-screen ou rota `/profissionais/novo`

**3.2 Formulário "Novo / Editar Profissional"**

Organizado em abas/seções:

| Seção | Campos |
|---|---|
| **Dados pessoais** | Nome*, CPF* (máscara+validação, sem duplicado), RG, Nascimento, Sexo, Estado civil, E-mail* (validar formato), Celular* (máscara), Tel. secundário, Endereço completo, CEP, Cidade, Estado |
| **Dados profissionais** | Profissão* (combo) → ao selecionar profissão regulamentada exibe a seção "Registro Profissional" |
| **Registro Profissional** | Conselho (auto-preenchido pela profissão, bloqueado), UF do Conselho (combo de estados) **ou** Região (1ª-27ª — depende do conselho), Nº de registro* (só letras/números/`/`/`-`) |
| **RQE** | Lista dinâmica com botão "+ Adicionar RQE" |
| **Associações / Sociedades** | Lista dinâmica de pares (Nome + Nº registro) com "+ Adicionar" |
| **Disponibilidade de atendimento** | Checkbox Seg-Sex, Horário entrada/saída, Almoço (início/fim), Evolução (início/fim) |
| **Configurações** | Status (Ativo/Inativo), Cor da agenda (paleta), Upload assinatura digital (PNG/JPG), Upload foto (JPG/PNG) |

**Mapa Profissão → Conselho** (do txt):
- Assistente Social → CRESS · Dentista → CRO · Enfermeiro → COREN · Farmacêutico → CRF · Fisioterapeuta → CREFITO · Fonoaudiólogo → CRFa · Médico → CRM · Nutricionista → CRN · Psicólogo → CRP · Terapeuta Ocupacional → CREFITO

**Conselhos por UF**: CRO, COREN, CRF, CRM (combo UF)
**Conselhos por Região**: CRESS, CREFITO, CRFa, CRN, CRP (combo 1ª-27ª)

**Validações ao salvar:**
- Campos obrigatórios preenchidos
- CPF válido (sem duplicidade entre profissionais)
- Conselho e registro presentes se profissão regulamentada
- Pelo menos um dia/horário de atendimento
- Mensagem de sucesso: *"Profissional cadastrado com sucesso."*

**Integração com Agenda:** os horários (entrada/saída/almoço/evolução) já passam a respeitar as regras de bloqueio quando a agenda usar este profissional — implemento a leitura no store; a aplicação visual na agenda fica garantida pelo store unificado.

**Itens das "MELHORIAS RECOMENDADAS" incluídos nesta entrega:**
- Pesquisa rápida ✅
- Filtros (Profissão / Conselho / Status) ✅
- Cadastro de múltiplas especialidades (via RQE + Associações) ✅
- Integração com a Agenda via store ✅

**Itens das "MELHORIAS RECOMENDADAS" que NÃO entram agora** (escopo grande, posso fazer em pedido separado):
- Importação em lote
- Exportação Excel/PDF
- Controle de férias/afastamentos
- Dashboard de indicadores

Confirme se quer que eu inclua algum desses itens agora ou se posso seguir com o escopo acima.

---

### Arquivos que serão criados/alterados

- `backups/2026-06-16/**` — backup
- `scripts/build-cid-data.ts` — gera o JSON a partir dos CSVs
- `src/lib/cid-data.json` — base completa CID-10 + CID-11
- `src/lib/diagnoses-store.ts` — `searchCid` lê do JSON completo (lazy load)
- `src/components/TabDiagnosticos.tsx` — usa a busca async
- `src/lib/professionals-store.ts` — schema expandido (RQE[], Associações[], Disponibilidade, Cor agenda, Assinatura, mapa Profissão→Conselho, helpers de validação CPF, isRegulamentada, etc.)
- `src/routes/profissionais.tsx` — nova listagem + formulário completo
- `src/lib/masks.ts` — reaproveitado p/ CPF/CEP/telefone (já existe)

### Conferência antes de entregar
- Login com `master / layka1711%` → menu Pacientes → aba Diagnóstico → buscar `M54` e `1A06` (CID-10 e CID-11 reais carregando)
- Configurações do Sistema → Profissional → listagem aparece, "Novo Profissional" abre formulário, validação de CPF duplicado e e-mail funcionam, conselho auto-preenche, UF/Região alterna corretamente
- Salvar profissional → aparece na agenda como opção

Posso seguir?