import { useEffect, useState } from 'react';
import { api } from './services/api';
import type { AlunoDetalhe, AlunoResumo } from './types';
import { BuscaAlunos } from './components/BuscaAlunos';
import { ListaAlunos } from './components/ListaAlunos';
import { DetalheAluno } from './components/DetalheAluno';
import { ChatAssistente } from './components/ChatAssistente';

export default function App() {
  const [busca, setBusca] = useState('');
  const [alunos, setAlunos] = useState<AlunoResumo[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [erroAlunos, setErroAlunos] = useState<string | null>(null);

  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<AlunoDetalhe | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    setCarregandoAlunos(true);
    setErroAlunos(null);

    const timer = setTimeout(() => {
      api
        .listarAlunos(busca)
        .then((dados) => {
          if (ativo) {
            setAlunos(dados);
          }
        })
        .catch((falha: Error) => {
          if (ativo) {
            setErroAlunos(falha.message);
          }
        })
        .finally(() => {
          if (ativo) {
            setCarregandoAlunos(false);
          }
        });
    }, 300);

    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [busca]);

  useEffect(() => {
    if (!selecionadoId) {
      setDetalhe(null);
      setErroDetalhe(null);
      return;
    }

    let ativo = true;
    setCarregandoDetalhe(true);
    setErroDetalhe(null);

    api
      .consultarAluno(selecionadoId)
      .then((dados) => {
        if (ativo) {
          setDetalhe(dados);
        }
      })
      .catch((falha: Error) => {
        if (ativo) {
          setErroDetalhe(falha.message);
        }
      })
      .finally(() => {
        if (ativo) {
          setCarregandoDetalhe(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [selecionadoId]);

  return (
    <div className="app">
      <header className="cabecalho">
        <h1>Gestão Acadêmica</h1>
        <p>Consulta de alunos, situação financeira e assistente de IA.</p>
      </header>

      <main className="layout">
        <section className="coluna">
          <BuscaAlunos valor={busca} onMudar={setBusca} />
          <ListaAlunos
            alunos={alunos}
            carregando={carregandoAlunos}
            erro={erroAlunos}
            selecionadoId={selecionadoId}
            onSelecionar={setSelecionadoId}
          />
        </section>

        <section className="coluna">
          <DetalheAluno detalhe={detalhe} carregando={carregandoDetalhe} erro={erroDetalhe} />
        </section>

        <section className="coluna">
          <ChatAssistente alunoSelecionado={detalhe} />
        </section>
      </main>
    </div>
  );
}
