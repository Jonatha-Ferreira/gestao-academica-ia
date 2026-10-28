import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../services/api';
import type { AlunoDetalhe } from '../types';

interface Mensagem {
  autor: 'usuario' | 'assistente';
  texto: string;
  meta?: string;
}

const SUGESTOES = [
  'Quais alunos estão inadimplentes?',
  'Quantos alunos estão com matrícula ativa?',
  'Resuma a situação financeira geral.',
];

export function ChatAssistente({ alunoSelecionado }: { alunoSelecionado: AlunoDetalhe | null }) {
  const [pergunta, setPergunta] = useState('');
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [restringirAoAluno, setRestringirAoAluno] = useState(false);

  async function enviar(texto: string) {
    const limpo = texto.trim();
    if (!limpo || carregando) {
      return;
    }

    setMensagens((atuais) => [...atuais, { autor: 'usuario', texto: limpo }]);
    setPergunta('');
    setErro(null);
    setCarregando(true);

    try {
      const alunoId = restringirAoAluno && alunoSelecionado ? alunoSelecionado.id : undefined;
      const resposta = await api.perguntar(limpo, alunoId);
      setMensagens((atuais) => [
        ...atuais,
        {
          autor: 'assistente',
          texto: resposta.resposta,
          meta: `${resposta.provedor} · modo ${resposta.modo}`,
        },
      ]);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Falha ao consultar o assistente.');
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
        {mensagens.map((mensagem, indice) => (
          <div key={indice} className={`mensagem ${mensagem.autor}`}>
            <p>{mensagem.texto}</p>
            {mensagem.meta && <small>{mensagem.meta}</small>}
          </div>
        ))}
        {carregando && (
          <p className="feedback carregando" role="status">
            Consultando o assistente...
          </p>
        )}
        {erro && (
          <p className="feedback erro" role="alert">
            {erro}
          </p>
        )}
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
