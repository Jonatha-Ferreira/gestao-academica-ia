import type { ResumoFinanceiro } from '../types';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const deCentavos = (centavos: number) => moeda(centavos / 100);

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
          Valor em aberto: <strong>{deCentavos(resumo.valorEmAbertoEmCentavos)}</strong>
        </li>
        <li>
          Valor em atraso: <strong>{deCentavos(resumo.valorEmAtrasoEmCentavos)}</strong>
        </li>
        <li>
          Próximo vencimento: <strong>{resumo.proximoVencimento ?? '—'}</strong>
        </li>
      </ul>

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
              <td>{parcela.competencia}</td>
              <td>{parcela.vencimento}</td>
              <td>{moeda(parcela.valor)}</td>
              <td>
                <span className={`badge ${parcela.situacao}`}>{parcela.situacao}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
