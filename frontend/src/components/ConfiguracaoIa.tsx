import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../services/api';
import type { ModeloIa, ProvedorIa, StatusIa } from '../types';

interface Props {
  status: StatusIa | null;
  onAtualizarStatus: () => void;
}

const PROVEDORES: Array<{ valor: ProvedorIa; rotulo: string }> = [
  { valor: 'anthropic', rotulo: 'Anthropic (Claude)' },
  { valor: 'openai', rotulo: 'OpenAI (GPT)' },
];

export function ConfiguracaoIa({ status, onAtualizarStatus }: Props) {
  const [aberto, setAberto] = useState(false);

  const [senha, setSenha] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [autenticando, setAutenticando] = useState(false);

  const [provedor, setProvedor] = useState<ProvedorIa>('anthropic');
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
        if (!ativo) return;
        if (config) {
          setProvedor(config.provedor);
          setModelo(config.modelo);
          setPromptSistema(config.promptSistema);
          setTemperatura(config.temperatura);
          setMaxTokens(config.maxTokens);
        } else if (status) {
          setPromptSistema(status.promptPadrao);
        }
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);

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
      const lista = await api.ia.modelos(senha, provedor, apiKey);
      setModelos(lista);
      if (!modelo && lista.length > 0) {
        setModelo(lista[0]!.id);
      }
      setMensagem(`${lista.length} modelo(s) disponíveis para ${provedor}.`);
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

  return (
    <section className="ia">
      <div className="ia-barra">
        <div>
          <strong>IA:</strong>{' '}
          <span className={`badge ${modo === 'real' ? 'adimplente' : 'aberta'}`}>{modo}</span>
          {status?.configurado && (
            <span className="ia-detalhe">
              {' '}
              {status.provedor}
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
                  Provedor de LLM
                  <select
                    value={provedor}
                    onChange={(evento) => {
                      setProvedor(evento.target.value as ProvedorIa);
                      setModelos([]);
                    }}
                  >
                    {PROVEDORES.map((item) => (
                      <option key={item.valor} value={item.valor}>
                        {item.rotulo}
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

                <label>
                  Modelo (opcional)
                  <div className="linha">
                    <input
                      list="lista-modelos"
                      value={modelo}
                      onChange={(evento) => setModelo(evento.target.value)}
                      placeholder="Se vazio, usa o padrão do provedor"
                    />
                    <button type="button" onClick={carregarModelos} disabled={ocupado || !apiKey.trim()}>
                      Carregar modelos
                    </button>
                  </div>
                  <span className="ia-nota">Os modelos são consultados no provedor usando a sua chave.</span>
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
                <button type="button" onClick={salvar} disabled={ocupado || !apiKey.trim()}>
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

              {!apiKey.trim() ? (
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
