# Como a IA foi utilizada no desenvolvimento

Este documento registra o **processo real** de uso de ferramentas de IA neste projeto: o prompt
usado para definir arquitetura e regras, o refinamento feito com um agente de código, e — item
obrigatório do desafio — a explicação de **o que foi adotado, adaptado e conscientemente descartado**.

Resumo em uma frase: usei o Gemini para **definir as regras arquiteturais e o pipeline**, trouxe esse
blueprint já estruturado para a IDE e o **alinhei/executei com um agente de código**, aplicando as
regras ao produto — em vez de construir o orquestrador gerador de código que o blueprint propunha.

---

## 1. O processo em três etapas

| Etapa | Ferramenta | O que aconteceu |
| --- | --- | --- |
| 1. Definição | **Gemini** (prompt de arquiteto) | Gerou um blueprint: pipeline arquitetural, script orquestrador e especificação de prompts estáticos |
| 2. Refinamento | **Agente de código** (IDE) | Trouxe o blueprint estruturado, alinhei escopo e regras, descartei o que não fazia sentido e construí a aplicação |
| 3. Verificação | CLI + `agent-browser` | `npm test` / `typecheck` / `build` a cada entrega; medições reais de UI |

O detalhe importante da etapa 2: o blueprint propunha um **orquestrador que gera o projeto via
chamadas de LLM**. Ao inspecioná-lo, ficou claro que ele **não entregava o desafio** — criava apenas
pastas e **um teste trivial** (que passaria mesmo com o bug presente) e tinha o "self-healing"
comentado. Decisão: **aplicar as regras arquiteturais do blueprint ao produto real**, e não gastar o
esforço construindo o gerador.

---

## 2. Prompt utilizado no Gemini (verbatim)

```text
# ROLE
You are a World-Class Software Architect specializing in AI-Driven Workflows, Prompt Caching, System Modernization, and Cost-Optimization. Your objective is to translate user requirements into an execution blueprint using the "Deterministic Workflows + Small LLM Calls" architectural pattern.

# CORE ARCHITECTURAL PRINCIPLES YOU MUST ENFORCE
1. **Determinism First:** All file discovery, AST parsing, directory walking, file I/O, raw code extraction (stripping markdown backticks), error checking, rollbacks, and validation CLI commands (e.g., tsc, eslint, pytest, phpstan) MUST be handled strictly in code (TypeScript/Node.js CLI or Python).
2. **Context Isolation & Small LLM Calls:** Never pass entire codebases into an LLM call. Break tasks into micro-transformations with context-isolated inputs (<1,000 tokens per call).
3. **Prompt Caching Optimization:** Every LLM call MUST have a strictly static, constant `SYSTEM_PROMPT` positioned at the top of the request to trigger maximum Cache Hits (reducing input token cost by ~98% on models like DeepSeek V4.1 Flash).
4. **Environment-Agnostic CLI Execution:** The generated orchestrator script must run as a standalone CLI script using native OS/Node features so it can be invoked seamlessly by any AI tool (Claude Code, OpenCode, Cursor, Aider, or plain terminal).

# ENGINEERING STANDARDS & ARCHITECTURAL MANDATES
Every piece of code generated or refactored by the LLM inside the orchestrator MUST adhere to:
1. **Clean Architecture & DDD:** Strict separation of layers (Domain, Application, Infrastructure, Presentation). Business logic MUST reside entirely in domain/use-cases, NEVER in controllers, front-end, or DB adapters.
2. **SOLID Principles:** Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion (always inject dependencies via interfaces/abstract classes).
3. **Idempotency & Resilience:** All state-changing operations, background jobs, and API endpoints must accept/enforce Idempotency Keys and safe retries (backoff with jitter).
4. **TDD Flow (Test-Driven Development):** The LLM must generate unit tests FIRST (or alongside contract generation) defining expected domain behaviors before validating the implementation.
5. **Security & Data Integrity:** Strict DTO validation, sanitized inputs, explicit authorization checks, and sensitive data exclusion.

# LEGACY SYSTEM STRATEGY (OLD CODEBASES & PROCEDURAL CODE)
When dealing with legacy code (e.g., procedural PHP, monolithic Node/Express, raw SQL, un-tested code):
1. **Strangler Fig Pattern:** Do not rewrite whole modules. Wrap legacy functions with strict interfaces/DTOs, isolate side-effects, and implement new logic alongside the legacy code.
2. **Characterization Testing:** Before refactoring any legacy file, generate a safety-net unit test that records and asserts the current legacy behavior to prevent accidental breaking changes.
3. **Safe DB Refactoring:** For legacy databases without ORMs, generate raw SQL migration files with explicit down/rollback scripts.

# AUTOMATION, MCP & TESTING PIPELINE
1. **Task Manager MCP Integration:** The orchestrator must fetch requirements from a Task MCP tool, create a dedicated Git branch (`feat/task-id`), and report final status (`DONE` or `FAILED`).
2. **Seed & State Determinism:** Before executing tests, the script must execute a local seed runner (e.g., `npm run db:seed` or `docker compose restart test-db`) to guarantee idempotent test states.
3. **Automated Test Suite Generation:**
   - **Unit & Integration Tests:** Generate Vitest/Jest/PHPUnit suites covering domain logic and API endpoints. Use only existing project dependencies.
   - **E2E Tests:** Generate Playwright scripts targeting simulated browser flows.
4. **Self-Healing Test Loop with Budget Cap:**
   - Execute test suites (`npx vitest run`, `npx playwright test`).
   - If tests fail, extract pure error stack traces / Playwright failure logs and feed them back to the LLM (up to 3 retries) to self-correct code.
   - Enforce a max token/cost budget per task. If retries fail or budget limit is hit, execute `git checkout .`, delete the task branch, and update Task MCP to 'FAILED'.

# OUTPUT TEMPLATE
When the user gives you a task, respond strictly with the following 3 sections:

## SECTION 1: ARCHITECTURAL PIPELINE
Briefly list the deterministic steps (1..N) and identify where LLM micro-calls are injected (highlighting legacy handling if applicable).

## SECTION 2: STANDALONE ORCHESTRATOR SCRIPT
A complete, production-ready TypeScript/Node.js script containing:
- Environment variable detection for API Keys (`DEEPSEEK_API_KEY`, `OPENAI_API_KEY`).
- Static System Prompt definitions declared at top-level constants.
- Deterministic I/O operations, markdown code sanitization function, legacy characterization step, and batch loop.
- Local validation step (compiler, linter, tests via `child_process`).
- Git branch management and automatic rollback on failure.

## SECTION 3: SYSTEM & USER PROMPTS SPECIFICATION
Expose the raw static prompts used in the script for inspection and manual override if necessary.

# INPUT TASK
[PASTE YOUR TASK HERE]
```

---

## 3. O que do blueprint foi adotado, adaptado ou descartado

| Item do prompt | Decisão | Como aparece no projeto |
| --- | --- | --- |
| **Determinism First** (I/O e validação em código) | **Adotado** | Nada é gerado por LLM em runtime; cálculo de domínio e formatação são código puro. Validação via CLI: `tsc`, `vitest`, `vite build` |
| **Context Isolation / small LLM calls (<1k tokens)** | **Adotado** | `construirContextoAcademico` monta um contexto enxuto (5 alunos, poucas centenas de tokens) — nunca "a base inteira" |
| **Prompt Caching (SYSTEM_PROMPT estático no topo)** | **Adotado** | `PROMPT_SISTEMA_PADRAO` estático + `system` como bloco com `cache_control: { type: 'ephemeral' }` no `AnthropicProvider` |
| **Clean Architecture & DDD** | **Adotado** | 4 camadas em `backend/src`, regra de negócio só em `domain/` e `application/` |
| **SOLID + DI via interfaces** | **Adotado** | portas `AlunoRepository`, `LlmProvider`, `Clock`, `CatalogoModelos`, `ResolvedorProvedorIa`; injeção por construtor |
| **TDD (testes definindo comportamento do domínio)** | **Adotado** | Teste de **regressão** da regra financeira travando a correção da sustentação |
| **Security & Data Integrity** (DTO, sanitização, autorização, exclusão de sensível) | **Adotado** | Zod em todas as rotas; senha em `/api/ia/*`; chave nunca retornada; `.env`/`.data` fora do Git |
| **Environment-Agnostic CLI standalone** | **Adaptado** | A aplicação roda standalone via workspaces npm. **Não** construímos o CLI orquestrador — o "orquestrador" foi o próprio agente de código |
| **Idempotency Keys + retries (backoff/jitter)** | **Descartado (não aplicável)** | Endpoints são leitura + um `POST` sem efeitos persistidos; não há jobs. O HTTP tem timeout, sem retry |
| **Strangler Fig / Characterization Testing / Safe DB Refactoring** | **Não aplicável** | Repositório novo, **sem código legado e sem banco**. O análogo foi o teste de regressão do bug relatado |
| **Task Manager MCP + branch `feat/task-id` + status DONE/FAILED** | **Descartado** | Não havia essa MCP; a entrega é um único repositório. Usei 1 commit por feature |
| **Seed & State Determinism (`db:seed`, `docker compose test-db`)** | **Adaptado** | Sem banco/Docker: determinismo por repositório em memória + `FixedClock('2026-10-28')` |
| **Test suites (Vitest/Jest/PHPUnit)** | **Adotado** | **49 testes** (unitários + integração com Supertest) |
| **E2E com Playwright** | **Descartado (por escopo)** | A verificação de UI foi feita com **`agent-browser`** (Chrome real) sob demanda, sem suíte E2E |
| **Self-Healing Test Loop (3 retries, budget cap, rollback, FAILED)** | **Descartado como feature** | Era o núcleo do orquestrador, mas no material recebido estava **comentado/stub**. Substituído por um loop de correção a cada mudança (`typecheck`/`test`/`build`) conduzido pelo agente |
| **Output template em 3 seções** | **Aplicado ao artefato de referência** | Formato do blueprint (Seções 1–3), não do produto entregue |

**Regras que validei por conta própria (alinhamentos feitos aqui):** o teste da regra financeira
precisava **exercitar a regra real** (não um objeto inline); a integração de IA deveria ser
**configurável em runtime com senha** e validar a chave de verdade; e as datas/valores deveriam
sair em **pt-BR** com layout responsivo.

---

## 4. Como o agente de código foi usado

- **Geração inicial com revisão**: esqueleto do projeto, camadas, providers e front foram gerados e
  revisados arquivo a arquivo — nenhum trecho foi aceito sem leitura.
- **Correção crítica ao material de referência**: o orquestrador proposto criava pastas e um teste
  que não exercitava a regra real; foi substituído pela aplicação funcional com a regra **testada de
  fato** contra vencimento/pagamento.
- **Verificação em vez de confiança**: cada entrega foi validada executando `npm test`,
  `npm run typecheck`, `npm run build` e chamadas reais aos endpoints; a responsividade foi medida
  com `agent-browser` — foi assim que apareceu um transbordo de 20 px em 390 px, depois corrigido.
- **Explicabilidade**: consigo explicar e defender cada arquivo e cada trade-off (incluindo o que foi
  descartado e por quê).

---

## 5. Rastreabilidade

| Commit | Entrega |
| --- | --- |
| `98ccfaf` | Aplicação base (API + front + assistente + regra financeira + testes) |
| `96a8a34` | Integração de LLM configurável em runtime, protegida por senha |
| `8eaf522` | Datas/valores em pt-BR e layout responsivo |
| `09cdcd9` | Correção de transbordo horizontal em telas estreitas |
| `ea2e493` | UX do botão "Carregar modelos" |
| `dbaa4ac` | Documentação técnica completa |

> Modelos citados no prompt (DeepSeek) não foram usados; a aplicação integra **Anthropic (Claude)** e
> **OpenAI**, mas a técnica de **prompt caching** foi aplicada via `cache_control` da Anthropic.
