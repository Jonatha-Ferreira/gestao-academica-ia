import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../services/api';
import type { AlunoCitado, AlunoDetalhe } from '../types';
import { formatarMoeda } from '../utils/formato';

interface Mensagem {
  id: string;
  autor: 'usuario' | 'assistente';
  texto: string;
  meta?: string;
  adimplentes?: AlunoCitado[];
  inadimplentes?: AlunoCitado[];
}

const SUGESTOES = [
  'Quais alunos estão inadimplentes?',
  'Quantos alunos estão com matrícula ativa?',
  'Resuma a situação financeira geral.',
];

const CHAVE_SESSAO = 'gestao-academica:sessao';

function criarId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Identificador da sessão do navegador — compõe a chave de idempotência. */
function obterSessao(): string {
  try {
    const existente = sessionStorage.getItem(CHAVE_SESSAO);
    if (existente) {
      return existente;
    }
    const nova = criarId();
    sessionStorage.setItem(CHAVE_SESSAO, nova);
    return nova;
  } catch {
    return criarId();
  }
}

export function ChatAssistente({ alunoSelecionado }: { alunoSelecionado: AlunoDetalhe | null }) {
  const [sessao] = useState(obterSessao);
  const [pergunta, setPergunta] = useState('');
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [falha, setFalha] = useState<{ id: string; texto: string } | null>(null);
  const [restringirAoAluno, setRestringirAoAluno] = useState(false);

  const fimRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'nearest' });
  }, [mensagens, carregando, erro]);

  /**
   * Envia a pergunta. `idExistente` é usado no "Tentar novamente": a mesma
   * Idempotency-Key volta ao servidor (que devolve o resultado já calculado) e a
   * UI substitui a bolha em vez de duplicar.
   */
  async function enviar(texto: string, idExistente?: string) {
    const limpo = texto.trim();
    if (!limpo || carregando) {
      return;
    }

    const id = idExistente ?? criarId();

    setMensagens((atuais) => {
      const jaTemPergunta = atuais.some((m) => m.id === `${id}:u`);
      const semRespostaAntiga = atuais.filter((m) => m.id !== `${id}:a`);
      return jaTemPergunta
        ? semRespostaAntiga
        : [...semRespostaAntiga, { id: `${id}:u`, autor: 'usuario', texto: limpo }];
    });

    setPergunta('');
    setErro(null);
    setFalha(null);
    setCarregando(true);

    try {
      const alunoId = restringirAoAluno && alunoSelecionado ? alunoSelecionado.id : undefined;
      const resposta = await api.perguntar(limpo, alunoId, {
        idempotencyKey: id,
        sessionId: sessao,
      });

      const origem =
        resposta.modo === 'real'
          ? `Assistente virtual · ${resposta.rotulo ?? resposta.provedor}`
          : 'Assistente virtual · modo demonstrativo';

      setMensagens((atuais) => [
        ...atuais.filter((m) => m.id !== `${id}:a`),
        {
          id: `${id}:a`,
          autor: 'assistente',
          texto: resposta.resposta,
          meta: origem,
          adimplentes: resposta.adimplentes,
          inadimplentes: resposta.inadimplentes,
        },
      ]);
    } catch (falhaCapturada) {
      const mensagem =
        falhaCapturada instanceof Error ? falhaCapturada.message : 'Falha ao consultar o assistente.';
      setErro(mensagem);
      setFalha({ id, texto: limpo });
    } finally {
      setCarregando(false);
    }
  }

  function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    void enviar(pergunta);
  }

  return (
    <section className="chat">
      <h2>Assistente de IA</h2>

      <div className="chat-mensagens">
        {mensagens.length === 0 && (
          <p className="feedback vazio">Faça uma pergunta sobre os alunos.</p>
        )}

        {mensagens.map((mensagem) => (
          <div key={mensagem.id} className={`mensagem ${mensagem.autor}`}>
            <p>{mensagem.texto}</p>

            {mensagem.autor === 'assistente' &&
              ((mensagem.adimplentes?.length ?? 0) > 0 ||
                (mensagem.inadimplentes?.length ?? 0) > 0) && (
                <div className="estruturado">
                  {(mensagem.inadimplentes?.length ?? 0) > 0 && (
                    <div>
                      <span className="estruturado-titulo">Inadimplentes</span>
                      <ul>
                        {mensagem.inadimplentes?.map((aluno) => (
                          <li key={`inat-${aluno.matricula}`}>
                            <span className="badge inadimplente">inadimplente</span>{' '}
                            {aluno.nome} · {aluno.matricula}
                            {typeof aluno.valorEmAtraso === 'number' &&
                              ` · ${formatarMoeda(aluno.valorEmAtraso)} em atraso`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(mensagem.adimplentes?.length ?? 0) > 0 && (
                    <div>
                      <span className="estruturado-titulo">Adimplentes</span>
                      <ul>
                        {mensagem.adimplentes?.map((aluno) => (
                          <li key={`ad-${aluno.matricula}`}>
                            <span className="badge adimplente">adimplente</span> {aluno.nome} ·{' '}
                            {aluno.matricula}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

            {mensagem.meta && <small>{mensagem.meta}</small>}
          </div>
        ))}

        {carregando && (
          <p className="feedback carregando" role="status">
            Consultando o assistente...
          </p>
        )}

        {erro && (
          <div className="falha">
            <p className="feedback erro" role="alert">
              {erro}
            </p>
            {falha && (
              <button
                type="button"
                className="secundario"
                onClick={() => void enviar(falha.texto, falha.id)}
              >
                Tentar novamente
              </button>
            )}
          </div>
        )}

        <div ref={fimRef} />
      </div>

      <div className="sugestoes">
        {SUGESTOES.map((sugestao) => (
          <button
            key={sugestao}
            type="button"
            onClick={() => void enviar(sugestao)}
            disabled={carregando}
          >
            {sugestao}
          </button>
        ))}
      </div>

      <form onSubmit={aoEnviar}>
        <input
          value={pergunta}
          onChange={(evento) => setPergunta(evento.target.value)}
          placeholder="Digite sua pergunta..."
          disabled={carregando}
        />
        <button type="submit" disabled={carregando || !pergunta.trim()}>
          Enviar
        </button>
      </form>

      {alunoSelecionado && (
        <label className="restricao">
          <input
            type="checkbox"
            checked={restringirAoAluno}
            onChange={(evento) => setRestringirAoAluno(evento.target.checked)}
          />
          Usar apenas os dados de {alunoSelecionado.nome}
        </label>
      )}
    </section>
  );
}
