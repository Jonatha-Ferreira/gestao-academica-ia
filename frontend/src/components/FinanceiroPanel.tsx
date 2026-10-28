import type { ResumoFinanceiro } from '../types';
import { formatarCentavos, formatarCompetencia, formatarData, formatarMoeda } from '../utils/formato';

export function FinanceiroPanel({ resumo }: { resumo: ResumoFinanceiro }) {
  return (
    <section className="financeiro">
      <h3>Situação financeira</h3>
      <ul className="totais">
        <li>
          Parcelas pagas: <strong>{resumo.parcelasPagas}</strong>
        </li>
        <li>
          Em aberto: <strong>{resumo.parcelasEmAberto}</strong>
        </li>
        <li>
          Em atraso: <strong>{resumo.parcelasEmAtraso}</strong>
        </li>
        <li>
          Valor em aberto: <strong>{formatarCentavos(resumo.valorEmAbertoEmCentavos)}</strong>
        </li>
        <li>
          Valor em atraso: <strong>{formatarCentavos(resumo.valorEmAtrasoEmCentavos)}</strong>
        </li>
        <li>
          Próximo vencimento:{' '}
          <strong>{formatarData(resumo.proximoVencimento)}</strong>
        </li>
      </ul>

      <div className="tabela-wrapper">
        <table className="tabela-parcelas">
          <thead>
            <tr>
              <th>Competência</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {resumo.parcelas.map((parcela) => (
              <tr key={parcela.id}>
                <td>{formatarCompetencia(parcela.competencia)}</td>
                <td>{formatarData(parcela.vencimento)}</td>
                <td>{formatarMoeda(parcela.valor)}</td>
                <td>
                  <span className={`badge ${parcela.situacao}`}>{parcela.situacao}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
