import { ContextoAcademico } from '../../application/dtos/contexto.dto';

/** Serializa o contexto em texto compacto e legível para o modelo. */
export function serializarContexto(contexto: ContextoAcademico): string {
  const linhas: string[] = [
    `Data de referência: ${contexto.dataReferencia}`,
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
      `- Valores: em aberto=R$ ${aluno.resumo.valorEmAberto.toFixed(2)}, em atraso=R$ ${aluno.resumo.valorEmAtraso.toFixed(2)}`,
    );
    linhas.push(`- Próximo vencimento: ${aluno.resumo.proximoVencimento ?? 'nenhum'}`);
    const mensalidades = aluno.mensalidades
      .map((m) => `${m.competencia} (venc ${m.vencimento}, R$ ${m.valor.toFixed(2)}, ${m.situacao})`)
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
