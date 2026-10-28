import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../services/api';
import type { ModeloIa, ProvedorIa, StatusIa } from '../types';

interface Props {
  status: StatusIa | null;
  onAtualizarStatus: () => void;
}

/**
 * Opções do seletor de provedor. `provedor` é o ADAPTADOR de API e `baseUrl` é o
 * endereço do serviço — é isso que permite usar qualquer provedor compatível com
 * a API da OpenAI (DeepSeek, Groq, OpenRouter, Cohere/Command, Mistral, Ollama...).
 */
const PRESETS: Array<{ id: string; nome: string; provedor: ProvedorIa; baseUrl: string }> = [
  { id: 'anthropic', nome: 'Anthropic (Claude)', provedor: 'anthropic', baseUrl: 'https://api.anthropic.com/v1' },
  { id: 'openai', nome: 'OpenAI (GPT)', provedor: 'openai', baseUrl: 'https://api.openai.com/v1' },
  { id: 'deepseek', nome: 'DeepSeek', provedor: 'openai', baseUrl: 'https://api.deepseek.com/v1' },
  { id: 'groq', nome: 'Groq', provedor: 'openai', baseUrl: 'https://api.groq.com/openai/v1' },
  { id: 'openrouter', nome: 'OpenRouter', provedor: 'openai', baseUrl: 'https://openrouter.ai/api/v1' },
  { id: 'cohere', nome: 'Cohere (Command)', provedor: 'openai', baseUrl: 'https://api.cohere.ai/compatibility/v1' },
  { id: 'mistral', nome: 'Mistral', provedor: 'openai', baseUrl: 'https://api.mistral.ai/v1' },
  { id: 'together', nome: 'Together AI', provedor: 'openai', baseUrl: 'https://api.together.xyz/v1' },
  { id: 'ollama', nome: 'Ollama (local)', provedor: 'openai', baseUrl: 'http://localhost:11434/v1' },
  { id: 'lmstudio', nome: 'LM Studio (local)', provedor: 'openai', baseUrl: 'http://localhost:1234/v1' },
  { id: 'custom', nome: 'Outro (compatível com OpenAI)', provedor: 'openai', baseUrl: '' },
];

export function ConfiguracaoIa({ status, onAtualizarStatus }: Props) {
  const [aberto, setAberto] = useState(false);

  const [senha, setSenha] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [autenticando, setAutenticando] = useState(false);

  const [presetId, setPresetId] = useState('anthropic');
  const [provedor, setProvedor] = useState<ProvedorIa>('anthropic');
  const [rotulo, setRotulo] = useState('Anthropic (Claude)');
  const [baseUrl, setBaseUrl] = useState('https://api.anthropic.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [modelo, setModelo] = useState('');
  const [modelos, setModelos] = useState<ModeloIa[]>([]);
  const [promptSistema, setPromptSistema] = useState('');
  const [temperatura, setTemperatura] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(1024);

  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!autenticado) {
      return;
    }
    let ativo = true;
    api.ia
      .configuracao(senha)
      .then((config) => {
        if (!ativo || !config) {
          return;
        }
        const preset = PRESETS.find(
          (item) => item.provedor === config.provedor && item.baseUrl === config.baseUrl,
        );
        setPresetId(preset?.id ?? 'custom');
        setProvedor(config.provedor);
        setRotulo(config.rotulo);
        setBaseUrl(config.baseUrl);
        setModelo(config.modelo);
        setPromptSistema(config.promptSistema);
        setTemperatura(config.temperatura);
        setMaxTokens(config.maxTokens);
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);

  function selecionarPreset(id: string) {
    const preset = PRESETS.find((item) => item.id === id);
    if (!preset) {
      return;
    }
    setPresetId(id);
    setProvedor(preset.provedor);
    setRotulo(preset.nome);
    setBaseUrl(preset.baseUrl);
    setModelos([]);
  }

  async function autenticar(evento: FormEvent) {
    evento.preventDefault();
    setErroSenha(null);
    setAutenticando(true);
    try {
      await api.ia.autenticar(senha);
      setAutenticado(true);
    } catch (falha) {
      setErroSenha(falha instanceof Error ? falha.message : 'Falha ao autenticar.');
    } finally {
      setAutenticando(false);
    }
  }

  async function carregarModelos() {
    setErro(null);
    setMensagem(null);
    setOcupado(true);
    try {
      const lista = await api.ia.modelos(senha, provedor, baseUrl.trim() || undefined, apiKey);
      setModelos(lista);
      if (!modelo && lista.length > 0) {
        setModelo(lista[0]!.id);
      }
      setMensagem(
        lista.length > 0
          ? `${lista.length} modelo(s) disponíveis em ${baseUrl}.`
          : `O provedor em ${baseUrl} não expôs uma lista de modelos — informe o nome do modelo.`,
      );
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Falha ao carregar modelos.');
    } finally {
      setOcupado(false);
    }
  }

  async function salvar() {
    setErro(null);
    setMensagem(null);
    setOcupado(true);
    try {
      const novoStatus = await api.ia.salvar(senha, {
        provedor,
        rotulo,
        baseUrl: baseUrl.trim() || undefined,
        apiKey,
        modelo: modelo.trim() || undefined,
        promptSistema,
        temperatura,
        maxTokens,
      });
      setMensagem(`Integração salva. Modo atual: ${novoStatus.modo}.`);
      onAtualizarStatus();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Falha ao salvar a integração.');
    } finally {
      setOcupado(false);
    }
  }

  async function testar() {
    setErro(null);
    setMensagem(null);
    setOcupado(true);
    try {
      const teste = await api.ia.testar(senha);
      setMensagem(`Teste OK (${teste.provedor} · modo ${teste.modo}): ${teste.resposta}`);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Falha no teste da integração.');
    } finally {
      setOcupado(false);
    }
  }

  async function remover() {
    setErro(null);
    setMensagem(null);
    setOcupado(true);
    try {
      await api.ia.remover(senha);
      setMensagem('Integração removida. Assistente voltou ao modo demonstrativo.');
      setApiKey('');
      onAtualizarStatus();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Falha ao remover a integração.');
    } finally {
      setOcupado(false);
    }
  }

  const modo = status?.modo ?? 'demonstrativo';
  const podeCarregar = Boolean(apiKey.trim());

  return (
    <section className="ia">
      <div className="ia-barra">
        <div>
          <strong>IA:</strong>{' '}
          <span className={`badge ${modo === 'real' ? 'adimplente' : 'aberta'}`}>{modo}</span>
          {status?.configurado && (
            <span className="ia-detalhe">
              {' '}
              {status.rotulo ?? status.provedor}
              {status.modelo ? ` · ${status.modelo}` : ''}
            </span>
          )}
        </div>
        <button type="button" onClick={() => setAberto((valor) => !valor)}>
          {aberto ? 'Fechar' : 'Integrar IA real'}
        </button>
      </div>

      {aberto && (
        <div className="ia-painel">
          {!autenticado ? (
            <form className="ia-senha" onSubmit={autenticar}>
              <label htmlFor="senha-ia">Senha de administração</label>
              <div className="linha">
                <input
                  id="senha-ia"
                  type="password"
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                  placeholder="Senha para liberar a integração"
                  autoComplete="off"
                />
                <button type="submit" disabled={autenticando || !senha}>
                  {autenticando ? 'Verificando...' : 'Desbloquear'}
                </button>
              </div>
              {erroSenha && <p className="feedback erro">{erroSenha}</p>}
              <p className="ia-nota">
                A integração mexe com comunicação externa e por isso é protegida por senha.
              </p>
            </form>
          ) : (
            <div className="ia-form">
              <div className="ia-campos">
                <label>
                  Provedor
                  <select value={presetId} onChange={(evento) => selecionarPreset(evento.target.value)}>
                    {PRESETS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Chave de API
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(evento) => setApiKey(evento.target.value)}
                    placeholder="Cole a chave do provedor"
                    autoComplete="off"
                  />
                </label>
              </div>

              <label className="ia-base-url">
                URL base da API
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(evento) => {
                    setBaseUrl(evento.target.value);
                    // Editar a URL manualmente = provedor personalizado, que no
                    // nosso caso é sempre compatível com a API da OpenAI.
                    setPresetId('custom');
                    setProvedor('openai');
                    setRotulo('Personalizado');
                    setModelos([]);
                  }}
                  placeholder="https://api.exemplo.com/v1"
                  spellCheck={false}
                />
                <span className="ia-nota">
                  Endereço da API, já com a versão. Qualquer serviço compatível com a API da OpenAI
                  funciona (DeepSeek, Groq, OpenRouter, Cohere/Command, Mistral, Ollama...).
                </span>
              </label>

              <div className="ia-campos">
                <label>
                  Modelo (opcional)
                  <div className="linha">
                    <input
                      list="lista-modelos"
                      value={modelo}
                      onChange={(evento) => setModelo(evento.target.value)}
                      placeholder="Se vazio, usa o padrão do provedor"
                    />
                    <button
                      type="button"
                      className="secundario"
                      onClick={carregarModelos}
                      disabled={ocupado || !podeCarregar}
                    >
                      Carregar modelos
                    </button>
                  </div>
                  <datalist id="lista-modelos">
                    {modelos.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </datalist>
                </label>

                <label>
                  Temperatura ({temperatura})
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={temperatura}
                    onChange={(evento) => setTemperatura(Number(evento.target.value))}
                  />
                </label>

                <label>
                  Máx. tokens
                  <input
                    type="number"
                    min={1}
                    max={8000}
                    value={maxTokens}
                    onChange={(evento) => setMaxTokens(Number(evento.target.value))}
                  />
                </label>
              </div>

              <label className="ia-regras">
                Regras do assistente (prompt de sistema)
                <textarea
                  rows={10}
                  value={promptSistema}
                  onChange={(evento) => setPromptSistema(evento.target.value)}
                  placeholder="Descreva as regras que o modelo deve seguir..."
                />
              </label>

              <div className="ia-acoes">
                <button type="button" onClick={salvar} disabled={ocupado || !podeCarregar}>
                  Salvar integração
                </button>
                <button type="button" className="secundario" onClick={testar} disabled={ocupado}>
                  Testar
                </button>
                <button
                  type="button"
                  className="secundario"
                  onClick={() => setPromptSistema(status?.promptPadrao ?? '')}
                >
                  Restaurar regras padrão
                </button>
                <button
                  type="button"
                  className="perigo"
                  onClick={remover}
                  disabled={ocupado || !status?.configurado}
                >
                  Remover integração
                </button>
              </div>

              {!podeCarregar ? (
                <p className="ia-nota">Informe a chave de API para salvar a integração.</p>
              ) : !modelo.trim() ? (
                <p className="ia-nota">
                  Sem modelo selecionado, será usado o padrão do provedor (linha rápida/barata mais
                  atualizada).
                </p>
              ) : null}

              {mensagem && <p className="feedback sucesso">{mensagem}</p>}
              {erro && <p className="feedback erro">{erro}</p>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
