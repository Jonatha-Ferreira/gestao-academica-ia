import type { AlunoDetalhe } from '../types';
import { FinanceiroPanel } from './FinanceiroPanel';
import { EstadoVazio, IndicadorCarregando, MensagemErro } from './EstadoFeedback';

interface Props {
  detalhe: AlunoDetalhe | null;
  carregando: boolean;
  erro: string | null;
}

export function DetalheAluno({ detalhe, carregando, erro }: Props) {
  if (carregando) {
    return <IndicadorCarregando texto="Carregando detalhes do aluno..." />;
  }
  if (erro) {
    return <MensagemErro mensagem={erro} />;
  }
  if (!detalhe) {
    return <EstadoVazio texto="Selecione um aluno para ver os detalhes." />;
  }

  return (
    <article className="detalhe">
      <h2>{detalhe.nome}</h2>
      <dl className="dados-aluno">
        <div>
          <dt>Curso</dt>
          <dd>{detalhe.curso}</dd>
        </div>
        <div>
          <dt>Matrícula</dt>
          <dd>{detalhe.matricula}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{detalhe.status}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>
            <span className={`badge ${detalhe.situacaoFinanceira}`}>
              {detalhe.situacaoFinanceira}
            </span>
          </dd>
        </div>
      </dl>

      <FinanceiroPanel resumo={detalhe.financeiro} />
    </article>
  );
}
