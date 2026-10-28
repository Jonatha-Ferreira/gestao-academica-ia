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

/** Monta a mensagem do usuário com dados + pergunta + reforço anti-alucinação. */
export function montarMensagemUsuario(pergunta: string, contextoTexto: string): string {
  return [
    '[DADOS ACADÊMICOS]',
    contextoTexto,
    '',
    '[PERGUNTA DO USUÁRIO]',
    pergunta,
    '',
    'Responda usando apenas os dados acima. Não invente informações.',
  ].join('\n');
}
