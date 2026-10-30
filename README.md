# Gestão Acadêmica IA

Aplicação de gestão acadêmica que permite **listar e buscar alunos**, **consultar a situação
financeira** de cada um e **fazer perguntas a um assistente de IA** sobre os dados fictícios.

Desafio prático — Desenvolvedor Full Stack.

- **Back-end:** Node.js + TypeScript + Express, seguindo Clean Architecture / SOLID.
- **Front-end:** React.js + TypeScript (Vite).
- **IA:** integração real com Anthropic (Claude) ou OpenAI, com **modo demonstrativo local**
  quando não há chave de API configurada.
- **Testes:** Vitest (unitários da regra financeira + integração das rotas).
- **Documentação técnica completa:** [`docs/DOCUMENTACAO.md`](./docs/DOCUMENTACAO.md) — arquitetura,
  padrões, uso de IA (RAG/fine-tuning), boas práticas, segurança e limitações.
- **Guia de integração de IA (para usuários):** [`docs/INTEGRACAO-IA.md`](./docs/INTEGRACAO-IA.md) —
  como funciona por dentro e exemplos prontos para testar (Command Code, OpenAI, Ollama).

---

## 1. O que está implementado (real) x demonstrado

| Item | Situação |
| --- | --- |
| API REST com os 4 endpoints pedidos | **Implementado** |
| Dados fictícios locais (JSON em memória) | **Implementado** |
| Regra de situação financeira (adimplente/inadimplente) | **Implementado** |
| Validação de entrada, tratamento de erros e status HTTP | **Implementado** |
| Front-end React (lista, busca, detalhe, financeiro, chat, loading/erro) | **Implementado** |
| Testes automatizados da regra financeira + integração | **Implementado** |
| Adaptadores Anthropic/OpenAI (chamada HTTP real, timeouts, erros) | **Implementado** |
| Assistente de IA respondendo de verdade | **Depende de chave**. Sem chave, roda em **modo demonstrativo** (respostas locais determinísticas). A API informa no campo `modo` se a resposta é `real` ou `demonstrativo`. |
| Integração de LLM configurável **em tempo de execução** (painel na tela, protegido por senha) | **Implementado** |

O **modo demonstrativo não é um “fake” de tela**: ele usa exatamente o mesmo contexto que seria
enviado ao modelo real e responde a partir dele, sem inventar dados. É o comportamento descrito no
enunciado como alternativa para quem não possui chave de API.

---

## 2. Arquitetura (Clean Architecture)

```
backend/src
├── domain/            # regras de negócio puras (sem framework, sem I/O)
│   ├── entities/      # Aluno, Mensalidade
│   ├── services/      # SituacaoFinanceiraService  <-- coração da correção (item 4)
│   ├── repositories/  # AlunoRepository (porta)
│   └── errors/        # DomainError
├── application/       # orquestração de casos de uso
│   ├── use-cases/     # ListarAlunos, ConsultarAluno, ConsultarFinanceiro, ProcessarAssistenteIA
│   ├── dtos/          # contratos de entrada/saída e contexto da IA
│   ├── ports/         # Clock, LlmProvider (interfaces)
│   ├── services/      # construção do contexto acadêmico
│   ├── mappers/       # entidade -> DTO
│   └── errors/        # AppError (status HTTP + código)
├── infrastructure/    # detalhes: banco, LLM, relógio
│   ├── database/      # InMemoryAlunoRepository + data/alunos.json
│   ├── llm/           # AnthropicProvider, OpenAiProvider, DemoProvider, prompts
│   └── clock/         # SystemClock, FixedClock
├── presentation/      # HTTP
│   ├── controllers/   # AlunoController, AssistenteController
│   ├── routes/        # /api/alunos, /api/assistente
│   ├── schemas/       # validação (zod)
│   └── middlewares/   # asyncHandler, errorHandler (tratamento centralizado)
└── main/              # composition root (container) + servidor
```

**Regra de dependência:** as camadas internas (domain/application) não conhecem Express, JSON nem
SDKs. As implementações concretas são injetadas no `container` — o que torna tudo testável com
dublês (relógio fixo, provedor de IA falso, repositório em memória).

---

## 3. Como executar localmente

Pré-requisitos: **Node.js 20+** e npm.

```bash
# 1) instalar dependências (workspaces: backend + frontend)
npm install

# 2) subir o back-end (http://localhost:3333)
npm run dev:backend

# 3) em outro terminal, subir o front-end (http://localhost:5173)
npm run dev:frontend
```

O front-end faz proxy de `/api` para `http://localhost:3333` (veja `frontend/vite.config.ts`),
então **não é necessário configurar CORS nem URL** em desenvolvimento.

### Scripts úteis (raiz)

| Comando | Descrição |
| --- | --- |
| `npm run dev:backend` | API em modo watch (`tsx`) |
| `npm run dev:frontend` | Front-end Vite |
| `npm test` | Testes do back-end (Vitest) |
| `npm run build` | Compila back-end e front-end |
| `npm run typecheck` | Checagem de tipos (back-end e front-end) |

---

## 4. Variáveis de ambiente

Copie `backend/.env.example` para `backend/.env`. **Nunca** versione o `.env`.

```env
LLM_PROVIDER=auto            # anthropic | openai | demo | auto
ANTHROPIC_API_KEY=           # opcional
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
OPENAI_API_KEY=              # opcional
OPENAI_MODEL=gpt-4o-mini
PORT=3333
CORS_ORIGIN=http://localhost:5173
IA_ADMIN_PASSWORD=troque-esta-senha   # senha do painel de integração de IA
```

Sem nenhuma chave e com `LLM_PROVIDER` ausente/`auto`, o sistema cai automaticamente no **modo
demonstrativo**. O front-end lê `VITE_API_URL` (ver `frontend/.env.example`); em desenvolvimento,
deixe vazio para usar o proxy.

> A variável `IA_ADMIN_PASSWORD` protege o painel de integração de IA em tempo de execução
> (seção 6). Se não for definida, o padrão é `admin` — **troque em qualquer ambiente real**.

---

## 5. Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/alunos` | Lista alunos. Aceita `?busca=` (nome parcial ou matrícula). |
| GET | `/api/alunos/:id` | Detalhe do aluno + financeiro. |
| GET | `/api/alunos/:id/financeiro` | Situação financeira resumida. |
| POST | `/api/assistente` | Pergunta ao assistente de IA. Corpo: `{ "pergunta": "...", "alunoId?": "..." }`. |
| GET | `/api/ia/status` | Estado da integração de IA (público; nunca expõe a chave). |
| POST | `/api/ia/autenticar` | Valida a senha de administração. |
| GET | `/api/ia/configuracao` | Configuração atual **sem a chave** (protegido por senha). |
| PUT | `/api/ia/configuracao` | Valida e salva a integração (protegido por senha). |
| DELETE | `/api/ia/configuracao` | Remove a integração e volta ao modo demonstrativo (protegido). |
| POST | `/api/ia/modelos` | Lista os modelos do provedor usando a chave informada (protegido). |
| POST | `/api/ia/testar` | Envia uma pergunta de amostra pelo provedor ativo (protegido). |

Respostas de sucesso seguem `{ "dados": ... }`. Erros seguem
`{ "erro": { "codigo": "...", "mensagem": "..." } }` com o status HTTP adequado
(`400` validação, `404` não encontrado, `503` IA indisponível, `500` interno).

Exemplos:

```bash
curl http://localhost:3333/api/alunos
curl "http://localhost:3333/api/alunos?busca=Maria"
curl http://localhost:3333/api/alunos/1/financeiro
curl -X POST http://localhost:3333/api/assistente \
  -H "Content-Type: application/json" \
  -d '{"pergunta":"Quais alunos estão inadimplentes?"}'
```

---

## 6. Integração com IA

O assistente segue a porta `LlmProvider`. Três implementações:

- `AnthropicProvider` — Claude (Messages API), prompt de sistema enviado com `cache_control`
  para aproveitar **prompt caching** (texto estático entre chamadas).
- `OpenAiProvider` — Chat Completions.
- `DemoProvider` — respostas locais (sem rede).

**Configurar a integração real:** defina `LLM_PROVIDER=anthropic` (ou `openai`) e a respectiva
chave. Nenhuma chave é exposta ao front-end: o navegador só fala com a nossa API.

### Como evitamos invenções (anti-alucinação)

1. Só enviamos ao modelo **dados que existem** (nome, curso, matrícula, status e financeiro
   já calculado). O contexto é montado em `construirContextoAcademico`.
2. O prompt de sistema instrui explicitamente a responder **apenas** com os dados fornecidos e a
   dizer quando a informação não está disponível.
3. `temperature` baixa (OpenAI) e limite de tokens.
4. Falhas/rede/timeout são normalizadas em `LlmIndisponivelError` → **HTTP 503**, sem quebrar a app.

### Integração de LLM em tempo de execução (painel na própria aplicação)

Além do `.env`, é possível **integrar uma LLM real direto pela interface**, sem reiniciar a API.
No topo da tela há o painel **“Integrar IA real”**:

1. **Senha de administração** (`IA_ADMIN_PASSWORD`) — a integração mexe com comunicação externa,
   então só é liberada após informar a senha correta.
2. **Provedor** — um **preset** (Anthropic, OpenAI, DeepSeek, Groq, OpenRouter,
   **Cohere/Command**, Mistral, Together, Ollama, LM Studio) **ou “Outro”** informando a **URL base**
   da API. Qualquer serviço compatível com a API da OpenAI funciona — não ficamos presos a um
   fornecedor.
3. **Chave de API** — validada de verdade: o back-end chama `GET /v1/models` do provedor; chave
   inválida é recusada (`400 PROVEDOR_INVALIDO`).
4. **Modelo (opcional)** — o botão **“Carregar modelos”** busca a lista **com base na LLM e na
   chave** informadas; o campo aceita escolher da lista ou digitar. **Se ficar vazio, o sistema usa o
   modelo padrão do provedor** — a linha “flash” mais atualizada (`claude-3-5-haiku-latest` na
   Anthropic, `gpt-4o-mini` na OpenAI) —, escolhido preferencialmente a partir da lista real
   devolvida pela API.
5. **Regras (prompt de sistema)** — já vem com um **template pronto** e é totalmente editável
   (“Restaurar regras padrão” devolve o template). Isso permite definir o comportamento do
   assistente como você quiser.
6. **Temperatura / máx. tokens** e botões **Salvar**, **Testar** e **Remover integração**.

Enquanto uma integração estiver salva, o assistente responde de fato (`modo: "real"`); o badge no
topo mostra o provedor e o modelo ativos. A configuração é persistida localmente em
`backend/.data/ia-config.json`, que está **fora do versionamento** (`.gitignore`). A chave nunca é
devolvida pela API (`GET /api/ia/configuracao` retorna tudo, menos a chave).

O **rótulo** escolhido (ex.: “Command Code”) aparece na interface, e as respostas são **validadas em
um contrato JSON** (`resposta` + listas de adimplentes/inadimplentes) antes de serem exibidas — com
**retry** para resposta vazia/fora do formato e **idempotência** (`Idempotency-Key` + `X-Session-Id`)
para que um retry não duplique mensagens nem chame o modelo duas vezes.

> Segurança: guardar a chave localmente em arquivo serve apenas para este desafio local. Em
> produção, use um gerenciador de segredos e nunca grave a chave em disco.
>
> Passo a passo detalhado, exemplos prontos e tabela de erros comuns:
> [`docs/INTEGRACAO-IA.md`](./docs/INTEGRACAO-IA.md).

---

## 7. Sustentação: correção do problema (item 4)

> **Problema relatado:** “Um aluno com mensalidade em aberto está aparecendo como adimplente na
> interface.”

### Causa-raiz

A situação era derivada de uma checagem incompleta do estado das parcelas — por exemplo, olhar
apenas *“existe alguma mensalidade paga?”* ou o campo errado, **sem comparar o vencimento com a
data atual**. Assim, uma parcela **em aberto e já vencida** não rebaixava o aluno para
inadimplente. O sintoma “em aberto = adimplente” aparece porque confundimos **“não paga”** com
**“não vencida”**.

### Como a correção foi implementada

A regra passou a ser explícita e única, em `domain/entities/Mensalidade.ts`:

```ts
/** parcela em atraso = não paga E vencimento anterior à data de referência */
estaEmAtraso(dataReferenciaISO: string): boolean {
  return !this.props.pago && this.props.vencimento < dataReferenciaISO;
}
```

E `domain/services/SituacaoFinanceiraService.ts` consolida: **o aluno é `inadimplente` se houver
ao menos uma parcela em atraso; caso contrário `adimplente`**. Parcelas só “abertas” (ainda dentro
do prazo) **não** tornam o aluno inadimplente.

Detalhes que evitam novos erros:

- Datas são comparadas como **texto ISO `YYYY-MM-DD`** — ordenação lexicográfica == cronológica,
  sem surpresas de fuso horário.
- A “data de hoje” vem de um **`Clock` injetável** (`SystemClock` em produção, `FixedClock` nos
  testes), então o resultado é determinístico e testável.
- `dataISOHoje()` usa a data **local** (não `toISOString()`, que é UTC), evitando “virar o dia”
  indevidamente em UTC-3.

### Como validei

- Teste de **regressão** que reproduz o bug relatado
  (`tests/unit/situacao-financeira.spec.ts`): aluno com 1 parcela paga + 1 vencida e não paga
  **deve** ser `inadimplente`.
- Testes de borda: parcela paga com vencimento passado **não** conta; parcela em aberto **futura**
  não conta; **vencimento igual a hoje** não conta como atraso; soma de valores em atraso.
- Testes de integração das rotas confirmam a situação correta na **API** (que alimenta a interface).

Rodar: `npm test`.

### Como evitaria a reincidência

- Regra de negócio em **um único lugar** (domínio), sem duplicação na UI.
- **Teste automatizado de regressão** rodando na CI a cada mudança.
- Estados do domínio explícitos (`paga`/`aberta`/`atrasada`) e tipados.
- Datas sempre derivadas de um `Clock` injetável — elimina dependência implícita da máquina.

---

## 8. Testes

```
backend/tests
├── unit
│   ├── mensalidade.spec.ts            # regra primitiva de atraso e invariantes da entidade
│   └── situacao-financeira.spec.ts    # regra de adimplência (inclui regressão do bug)
└── integration
    ├── alunos.routes.spec.ts          # listagem, busca, detalhe, financeiro, 404
    └── assistente.routes.spec.ts      # modo demonstrativo, validação, 503 (IA fora)
```

```bash
npm test          # executa tudo
```

---

## 9. Decisões técnicas

- **Clean Architecture + SOLID:** domínio puro; dependências apontam para dentro; inversão de
  dependência via portas (`AlunoRepository`, `LlmProvider`, `Clock`).
- **TypeScript estrito** (`strict`, `noUncheckedIndexedAccess`) nos dois lados.
- **Express + zod:** validação declarativa de DTOs e **tratamento centralizado de erros**.
- **Valores monetários em centavos (inteiros):** evita erros de ponto flutuante.
- **Sem SDK de LLM:** usamos `fetch` nativo (Node 20) com timeout e normalização de erro —
  dependências menores e adaptador transparente. O prompt de sistema é estático (bom para caching).
- **Modo demonstrativo como mais um provider:** o caso de uso não sabe qual provedor está ativo.
- **Front-end sem biblioteca de estado:** `useState`/`useEffect` bastam para o escopo; busca com
  *debounce* e estados de **loading/erro** explícitos.
- **Workspaces npm:** um `npm install` na raiz resolve back-end e front-end.
- **Formatação pt-BR na borda:** a API trafega datas em ISO (ideal para máquina) e o front-end as
  exibe como `DD/MM/YYYY` (competência `MM/YYYY`); valores monetários em `R$` no padrão brasileiro.
  Os textos enviados ao modelo e as respostas do modo demonstrativo também usam o formato brasileiro.
- **Layout responsivo:** grid com 3 colunas no desktop, 2 no tablet (≤1100px) e 1 no celular
  (≤760px); a tabela de parcelas ganha rolagem horizontal em telas estreitas.

---

## 10. Segurança

- Nenhuma chave de API no repositório: apenas `.env.example`.
- A configuração local de IA (`backend/.data/`) e o `.env` estão no `.gitignore`.
- O front-end nunca fala com o provedor de IA — só com a nossa API.
- As rotas que mexem com a integração externa (`/api/ia/*`) exigem senha de administração.
- A chave de API nunca é devolvida pela API (a resposta pública nunca inclui `apiKey`).
- Erros internos não vazam stack trace para o cliente.

---

## 11. Como utilizei ferramentas de IA

Processo em três etapas — com o prompt **verbatim** e a matriz do que foi adotado/adaptado/descartado
em [`docs/PROMPTS-IA.md`](./docs/PROMPTS-IA.md):

1. **Definição (Gemini):** usei um prompt de arquiteto ("Deterministic Workflows + Small LLM Calls")
   para gerar o blueprint: pipeline determinístico, Clean Architecture/DDD, SOLID, TDD, Prompt
   Caching, estratégia para legado, pipeline de testes com self-healing e template de saída.
2. **Refinamento (agente de código na IDE):** trouxe o blueprint **já estruturado** para a IDE e
   alinhei escopo/regras. **Descartei o orquestrador gerador de código** — ele criava apenas pastas e
   um teste trivial que passaria mesmo com o bug presente, com o self-healing comentado. Apliquei as
   **regras arquiteturais** do blueprint ao produto real.
3. **Verificação:** `npm test` / `npm run typecheck` / `npm run build` a cada entrega, e medição real
   de UI com `agent-browser` (foi assim que apareceu um transbordo de 20 px em 390 px, depois
   corrigido).

Sou capaz de explicar e defender cada arquivo, cada decisão e cada item descartado.

---

## 12. Estrutura resumida do repositório

```
gestao-academica-ia/
├── backend/          # API Node.js + TypeScript
├── frontend/         # React + Vite
├── docs/             # DOCUMENTACAO.md e PROMPTS-IA.md
├── package.json      # workspace raiz
└── README.md
```
