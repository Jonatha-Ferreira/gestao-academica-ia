import { describe, it, expect } from 'vitest';
import { Aluno, AlunoProps } from '../../src/domain/entities/Aluno';
import { SituacaoFinanceiraService } from '../../src/domain/services/SituacaoFinanceiraService';

const REF = '2026-10-28';

function montarAluno(mensalidades: AlunoProps['mensalidades']): Aluno {
  return Aluno.criar({
    id: 'x1',
    nome: 'Aluno de Teste',
    curso: 'Curso de Teste',
    matricula: '202699',
    status: 'ativa',
    mensalidades,
  });
}

describe('SituacaoFinanceiraService', () => {
  it('REGRESSÃO: aluno com mensalidade vencida e não paga é INADIMPLENTE', () => {
    // Este cenário reproduz exatamente o bug relatado na sustentação:
    // um aluno com parcela vencida em aberto aparecia como adimplente.
    const aluno = montarAluno([
      { id: 'm1', competencia: '2026-08', vencimento: '2026-08-10', valorEmCentavos: 50000, pago: true, dataPagamento: '2026-08-09' },
      { id: 'm2', competencia: '2026-09', vencimento: '2026-09-10', valorEmCentavos: 50000, pago: false, dataPagamento: null },
    ]);

    const resumo = SituacaoFinanceiraService.avaliar(aluno, REF);

    expect(resumo.situacao).toBe('inadimplente');
    expect(resumo.parcelasEmAtraso).toBe(1);
    expect(resumo.valorEmAtrasoEmCentavos).toBe(50000);
    expect(resumo.parcelas.find((p) => p.id === 'm2')?.situacao).toBe('atrasada');
  });

  it('aluno com parcela em aberto ainda dentro do prazo é ADIMPLENTE', () => {
    const aluno = montarAluno([
      { id: 'm1', competencia: '2026-10', vencimento: '2026-10-10', valorEmCentavos: 50000, pago: true, dataPagamento: '2026-10-09' },
      { id: 'm2', competencia: '2026-11', vencimento: '2026-11-10', valorEmCentavos: 50000, pago: false, dataPagamento: null },
    ]);

    const resumo = SituacaoFinanceiraService.avaliar(aluno, REF);

    expect(resumo.situacao).toBe('adimplente');
    expect(resumo.parcelasEmAberto).toBe(1);
    expect(resumo.parcelasEmAtraso).toBe(0);
    expect(resumo.valorEmAbertoEmCentavos).toBe(50000);
    expect(resumo.valorEmAtrasoEmCentavos).toBe(0);
  });

  it('aluno com todas as parcelas pagas é ADIMPLENTE', () => {
    const aluno = montarAluno([
      { id: 'm1', competencia: '2026-09', vencimento: '2026-09-10', valorEmCentavos: 55000, pago: true, dataPagamento: '2026-09-07' },
      { id: 'm2', competencia: '2026-10', vencimento: '2026-10-10', valorEmCentavos: 55000, pago: true, dataPagamento: '2026-10-10' },
    ]);

    const resumo = SituacaoFinanceiraService.avaliar(aluno, REF);

    expect(resumo.situacao).toBe('adimplente');
    expect(resumo.parcelasPagas).toBe(2);
    expect(resumo.parcelasEmAberto).toBe(0);
    expect(resumo.parcelasEmAtraso).toBe(0);
    expect(resumo.proximoVencimento).toBeNull();
  });

  it('soma corretamente o valor em atraso de múltiplas parcelas', () => {
    const aluno = montarAluno([
      { id: 'm1', competencia: '2026-06', vencimento: '2026-06-10', valorEmCentavos: 30000, pago: false, dataPagamento: null },
      { id: 'm2', competencia: '2026-07', vencimento: '2026-07-10', valorEmCentavos: 30000, pago: false, dataPagamento: null },
      { id: 'm3', competencia: '2026-12', vencimento: '2026-12-10', valorEmCentavos: 30000, pago: false, dataPagamento: null },
    ]);

    const resumo = SituacaoFinanceiraService.avaliar(aluno, REF);

    expect(resumo.situacao).toBe('inadimplente');
    expect(resumo.parcelasEmAtraso).toBe(2);
    expect(resumo.parcelasEmAberto).toBe(1);
    expect(resumo.valorEmAtrasoEmCentavos).toBe(60000);
    expect(resumo.valorEmAbertoEmCentavos).toBe(90000);
  });

  it('o resultado é determinístico para a mesma data de referência', () => {
    const aluno = montarAluno([
      { id: 'm1', competencia: '2026-09', vencimento: '2026-09-10', valorEmCentavos: 50000, pago: false, dataPagamento: null },
    ]);

    const primeira = SituacaoFinanceiraService.avaliar(aluno, REF);
    const segunda = SituacaoFinanceiraService.avaliar(aluno, REF);

    expect(primeira).toEqual(segunda);
  });
});
