import type { AlunoResumo } from '../types';
import { EstadoVazio, IndicadorCarregando, MensagemErro } from './EstadoFeedback';

interface Props {
  alunos: AlunoResumo[];
  carregando: boolean;
  erro: string | null;
  selecionadoId: string | null;
  onSelecionar: (id: string) => void;
}

export function ListaAlunos({ alunos, carregando, erro, selecionadoId, onSelecionar }: Props) {
  if (carregando) {
    return <IndicadorCarregando texto="Carregando alunos..." />;
  }
  if (erro) {
    return <MensagemErro mensagem={erro} />;
  }
  if (alunos.length === 0) {
    return <EstadoVazio texto="Nenhum aluno encontrado." />;
  }

  return (
    <ul className="lista-alunos">
      {alunos.map((aluno) => (
        <li key={aluno.id}>
          <button
            type="button"
            className={aluno.id === selecionadoId ? 'item selecionado' : 'item'}
            onClick={() => onSelecionar(aluno.id)}
          >
            <span className="nome">{aluno.nome}</span>
            <span className="matricula">Matrícula {aluno.matricula}</span>
            <span className={`badge ${aluno.situacaoFinanceira}`}>{aluno.situacaoFinanceira}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
