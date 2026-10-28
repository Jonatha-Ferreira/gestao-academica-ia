import { ContextoAcademico } from '../../application/dtos/contexto.dto';
import { formatarCompetenciaBR, formatarDataBR } from '../../shared/date';
import { formatarMoedaBR } from '../../shared/money';

/** Serializa o contexto em texto compacto e legível para o modelo. */
export function serializarContexto(contexto: ContextoAcademico): string {
  const linhas: string[] = [
    `Data de referência: ${formatarDataBR(contexto.dataReferencia)}`,
    `Total de alunos: ${contexto.totalAlunos}`,
    '',
  ];

  for (const aluno of contexto.alunos) {
    linhas.push(`Aluno: ${aluno.nome}`);
    linhas.push(`- Curso: ${aluno.curso} | Matrícula: ${aluno.matricula} | Status: ${aluno.status}`);
    linhas.push(`- Situação financeira: ${aluno.situacaoFinanceira.toUpperCase()}`);
    linhas.push(
      `- Parcelas: pagas=${aluno.resumo.parcelasPagas}, em aberto=${aluno.resumo.parcelasEmAberto}, em atraso=${aluno.resumo.parcelasEmAtraso}`,
    );
    linhas.push(
      `- Valores: em aberto=${formatarMoedaBR(aluno.resumo.valorEmAberto)}, em atraso=${formatarMoedaBR(aluno.resumo.valorEmAtraso)}`,
    );
    linhas.push(
      `- Próximo vencimento: ${aluno.resumo.proximoVencimento ? formatarDataBR(aluno.resumo.proximoVencimento) : 'nenhum'}`,
    );
    const mensalidades = aluno.mensalidades
      .map(
        (m) =>
          `${formatarCompetenciaBR(m.competencia)} (venc ${formatarDataBR(m.vencimento)}, ${formatarMoedaBR(m.valor)}, ${m.situacao})`,
      )
      .join('; ');
    linhas.push(`- Mensalidades: ${mensalidades}`);
    linhas.push('');
  }

  return linhas.join('\n').trim();
}

/**
 * Contrato de saída imposto a TODOS os provedores. Fica fora das "regras"
 * editáveis para que o formato seja garantido mesmo se o usuário reescrever o
 * prompt de sistema.
 */
export const CONTRATO_SAIDA_JSON = [
  '[FORMATO OBRIGATÓRIO]',
  'Responda SOMENTE com um objeto JSON válido (sem markdown, sem texto fora do JSON), no formato:',
  '{"resposta":"<resposta em português do Brasil>",',
  ' "adimplentes":[{"nome":"...","matricula":"..."}],',
  ' "inadimplentes":[{"nome":"...","matricula":"...","valorEmAtraso":0}]}',
  'Use [] quando não se aplicar. "valorEmAtraso" é em reais. Não invente dados.',
].join('\n');

/** Reforço usado no retry, quando a primeira resposta não respeitou o contrato. */
export const REFORCO_FORMATO =
  'ATENÇÃO: a resposta anterior não respeitou o formato. Responda APENAS com o objeto JSON, começando em { e terminando em }.';

/** Monta a mensagem do usuário com dados + pergunta + reforço anti-alucinação. */
export function montarMensagemUsuario(
  pergunta: string,
  contextoTexto: string,
  reforcarFormato = false,
): string {
  const partes = [
    '[DADOS ACADÊMICOS]',
    contextoTexto,
    '',
    '[PERGUNTA DO USUÁRIO]',
    pergunta,
    '',
    'Responda usando apenas os dados acima. Não invente informações.',
    '',
    CONTRATO_SAIDA_JSON,
  ];

  if (reforcarFormato) {
    partes.push('', REFORCO_FORMATO);
  }

  return partes.join('\n');
}
