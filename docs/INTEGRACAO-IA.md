# Integração de IA — como funciona e como testar

Guia prático do assistente de IA: como a integração funciona por dentro e **exemplos prontos**
para você configurar e testar em poucos minutos.

> Resumo: a aplicação fala com **um** de dois formatos de API — **Anthropic** (nativa) ou
> **compatível com OpenAI** (o padrão de fato do mercado). Qualquer provedor que fale um desses
> formatos funciona; o que define o provedor é a **URL base**.

---

## 1. Como funciona (visão de dentro)

```
Navegador (painel "Integrar IA")
   │  PUT /api/ia/configuracao { senha, provedor, baseUrl, apiKey, modelo, promptSistema }
   ▼
[guarda de senha]  →  IaController  →  GerenciadorIa.salvar
   1. valida adaptador, URL base (http/https) e chave
   2. GET {baseUrl}/models com a sua chave   ← valida a chave DE VERDADE
   3. resolve o modelo (o que você escolheu ou o padrão "flash" da lista real)
   4. persiste em backend/.data/ia-config.json  (fora do Git)
   5. monta o adaptador e o mantém ativo em memória (sem reiniciar)
   ▼
POST /api/assistente
   ProcessarAssistenteIA → monta o contexto dos alunos → obtém o provedor ativo → chama a API
```

**Dois adaptadores:**

| Adaptador | Formato | Endpoint usado | Auth |
| --- | --- | --- | --- |
| `anthropic` | API nativa da Anthropic | `POST {baseUrl}/messages` | `x-api-key` + `anthropic-version` |
| `openai` | compatível com a OpenAI | `POST {baseUrl}/chat/completions` | `Authorization: Bearer` |

**O que é enviado ao modelo:** apenas um contexto enxuto e já calculado (nome, curso, matrícula,
status e o financeiro resumido de cada aluno) + as **regras** (prompt de sistema, editável).
Nada de credenciais, dados pessoais reais ou o código do projeto.

**Modo real × demonstrativo:** o campo `modo` na resposta diz de onde veio o texto.
Sem integração configurada, o assistente responde **localmente** (`demonstrativo`), de forma
determinística, usando o mesmo contexto — útil para testar sem chave. A interface mostra um badge
`IA: Real` ou `IA: Demonstrativo`.

---

## 2. Passo a passo na interface

Pré-requisito: back-end rodando (`npm run dev:backend`) e front (`npm run dev:frontend`).

1. Abra http://localhost:5173 e clique em **“Integrar IA real”**.
2. Informe a **senha de administração** (variável `IA_ADMIN_PASSWORD`; se não definida, é `admin`).
3. **Provedor**: escolha um preset (a URL base preenche sozinha) ou **“Outro”** e digite a URL base.
4. **Chave de API**: cole a chave do **mesmo** provedor da URL base.
5. **Carregar modelos**: consulta o provedor com a sua chave.
   - Se a chave estiver errada → `HTTP 401`.
   - Se a URL não for uma API → mensagem “não parece ser uma API de LLM”.
6. **Modelo**: escolha na lista ou deixe vazio (usa o padrão “flash” do provedor).
7. **Regras**: o template já vem pronto; pode editar à vontade (“Restaurar regras padrão” volta).
8. **Salvar integração** → depois **Testar** (⚠️ “Testar” usa a integração **já salva**).
9. Pergunte no chat: *“Quais alunos estão inadimplentes?”*.

---

## 3. Exemplos de integração (prontos para testar)

A URL base **já inclui a versão**. Os IDs de modelo mudam com o tempo — use **“Carregar modelos”**
para pegar os válidos.

| Provedor | Opção no select | URL base | Modelo (exemplo) |
| --- | --- | --- | --- |
| **Command Code** | Command Code | `https://api.commandcode.ai/provider/v1` | `deepseek/deepseek-v4.1-flash` |
| OpenAI | OpenAI (GPT) | `https://api.openai.com/v1` | `gpt-4o-mini` |
| DeepSeek | DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| Groq | Groq | `https://api.groq.com/openai/v1` | use “Carregar modelos” |
| OpenRouter | OpenRouter | `https://openrouter.ai/api/v1` | use “Carregar modelos” |
| Cohere | Cohere (Command) | `https://api.cohere.ai/compatibility/v1` | `command-r-plus` |
| Mistral | Mistral | `https://api.mistral.ai/v1` | `mistral-large-latest` |
| Ollama (local) | Ollama (local) | `http://localhost:11434/v1` | `llama3.2` |

### Exemplo 1 — Command Code (validado neste projeto)

- Provedor: **Command Code**
- URL base: `https://api.commandcode.ai/provider/v1`
- Chave: sua `CMD_API_KEY`
- Modelo: `deepseek/deepseek-v4.1-flash`
- Clique **Salvar integração** e depois **Testar**.

Resultado esperado do “Testar” (resposta real do modelo):

```
Teste OK (openai · modo real): Dos 5 alunos, 3 estão adimplentes (Maria Souza, matrícula 202602;
Carlos Lima, matrícula 202603, com R$ 620,00 em aberto sem atraso; e Pedro Santos, matrícula 202605)
e 2 estão inadimplentes (João da Silva, matrícula 202601, com R$ 500,00 em atraso, e Ana Beatriz,
matrícula 202604, com R$ 960,00 em atraso).
```

> No Command Code, os modelos `claude-*` só aceitam `/messages` (adapter Anthropic). Por isso eles
> **não aparecem** na lista do adapter OpenAI — a aplicação filtra pelo `supported_endpoints`.

### Exemplo 2 — OpenAI

- Provedor: **OpenAI (GPT)** · URL base: `https://api.openai.com/v1`
- Chave: `sk-...` · Modelo: `gpt-4o-mini` (ou “Carregar modelos”)

### Exemplo 3 — Ollama, 100% local (sem custo)

1. Instale e rode o Ollama: `ollama run llama3.2`
2. No painel: Provedor **Ollama (local)**, URL `http://localhost:11434/v1`, chave qualquer
   (o Ollama não valida), modelo `llama3.2`.

### Exemplo 4 — sem chave nenhuma (modo demonstrativo)

Clique em **“Remover integração”**. O badge volta para `Demonstrativo` e o chat responde
localmente — bom para apresentar a aplicação sem depender de rede.

---

## 4. Testando pela API (curl)

Troque `<SENHA>` e `<SUA_CHAVE>`. A senha vai no corpo ou no header `x-senha-ia`.

```bash
# 1) Estado atual
curl http://localhost:3333/api/ia/status

# 2) Validar a senha
curl -X POST http://localhost:3333/api/ia/autenticar \
  -H "Content-Type: application/json" -d '{"senha":"<SENHA>"}'

# 3) Listar modelos do provedor (valida a chave)
curl -X POST http://localhost:3333/api/ia/modelos \
  -H "Content-Type: application/json" \
  -d '{"senha":"<SENHA>","provedor":"openai","baseUrl":"https://api.commandcode.ai/provider/v1","apiKey":"<SUA_CHAVE>"}'

# 4) Salvar a integração
curl -X PUT http://localhost:3333/api/ia/configuracao \
  -H "Content-Type: application/json" \
  -d '{"senha":"<SENHA>","provedor":"openai","rotulo":"Command Code","baseUrl":"https://api.commandcode.ai/provider/v1","apiKey":"<SUA_CHAVE>","modelo":"deepseek/deepseek-v4.1-flash"}'

# 5) Enviar uma pergunta de amostra pelo provedor ativo
curl -X POST http://localhost:3333/api/ia/testar \
  -H "Content-Type: application/json" -d '{"senha":"<SENHA>"}'

# 6) Conversar de verdade
curl -X POST http://localhost:3333/api/assistente \
  -H "Content-Type: application/json" \
  -d '{"pergunta":"Quais alunos estão inadimplentes?"}'

# 7) Remover a integração e voltar ao modo demonstrativo
curl -X DELETE http://localhost:3333/api/ia/configuracao -H "x-senha-ia: <SENHA>"
```

Resposta de sucesso do assistente:

```json
{
  "dados": {
    "resposta": "...",
    "adimplentes": [{ "nome": "Maria Souza", "matricula": "202602" }],
    "inadimplentes": [
      { "nome": "João da Silva", "matricula": "202601", "valorEmAtraso": 500 },
      { "nome": "Ana Beatriz", "matricula": "202604", "valorEmAtraso": 960 }
    ],
    "provedor": "openai",
    "rotulo": "Command Code",
    "modo": "real",
    "geradoEm": "2026-10-28T22:24:53.000Z"
  }
}
```

**Saída estruturada:** o modelo é obrigado a responder um JSON (`resposta` + as listas). O
back-end valida o contrato antes de devolver — se vier texto livre ou JSON inválido, ele **repete**
(com reforço do formato). Se nunca cumprir, responde **`502 IA_RESPOSTA_INVALIDA`** em vez de exibir
texto não confiável. Por isso as listas são a fonte de verdade da interface.

**Retry e idempotência:** falhas transitórias (resposta vazia, `429`, `5xx`) e respostas fora do
contrato são repetidas até 3 vezes com backoff exponencial + jitter. Para o retry do cliente não
duplicar nada, envie:

```bash
 -H "Idempotency-Key: <uuid-da-mensagem>" \
 -H "X-Session-Id: <uuid-da-sessao>"
```

A mesma chave na mesma sessão devolve o **mesmo resultado** (inclusive em chamadas concorrentes),
sem chamar o modelo de novo.

---

## 5. Erros comuns e o que significam

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| `HTTP 401` "recusou a chave de API" | chave de outro provedor, inválida ou sem escopo | confira a chave e se ela pertence à URL base |
| "não parece ser uma API de LLM (respondeu HTML)" | a URL é um site, não a API | use a URL base da API (com `/v1` ou equivalente) |
| `400` "modelo X não está disponível" | modelo inexistente para aquela chave | use **Carregar modelos** |
| `400` URL base inválida | faltou `http(s)://` | ex.: `https://api.provedor.com/v1` |
| `503` "provedor respondeu HTTP 5xx" | instabilidade/limite do provedor | tente outro modelo/provedor |
| "Testar" mostra erro da configuração antiga | a config nova não foi salva | clique em **Salvar integração** antes |

Todas as respostas de erro seguem o formato `{ "erro": { "codigo", "mensagem", "detalhes?" } }`.

---

## 6. Segurança e privacidade

- As rotas `/api/ia/*` (exceto `status` e `autenticar`) exigem a **senha de administração**.
- A **chave nunca é devolvida** pela API (`GET /api/ia/configuracao` retorna tudo, menos a chave).
- A chave é gravada apenas em `backend/.data/ia-config.json`, que está no **`.gitignore`**.
  Para produção, use um gerenciador de segredos em vez de arquivo.
- O front-end nunca fala com o provedor — só com a nossa API.
- A URL base é livre (aceita provedores locais), então em produção valeria uma **allowlist de
  domínios** para evitar SSRF.

---

## 7. Reforço de prompt (anti-alucinação)

- O modelo recebe **somente** os dados acadêmicos necessários, já calculados.
- O prompt de sistema manda responder **apenas** com esses dados e admitir quando não houver
  informação — e é **editável** no painel.
- Temperatura baixa e limite de tokens.
- Se a IA falhar, a aplicação responde `503` em vez de quebrar a tela.
