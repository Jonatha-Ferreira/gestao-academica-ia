import { EntradaLlm, LlmProvider, ModoLlm } from '../../application/ports/LlmProvider';
import { AlunoContexto, ContextoAcademico } from '../../application/dtos/contexto.dto';
import { formatarDataBR } from '../../shared/date';
import { formatarMoedaBR } from '../../shared/money';

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function descreverLista(alunos: AlunoContexto[]): string {
  return alunos.map((a) => `- ${a.nome} (matrícula ${a.matricula})`).join('\n');
}

function resumoAluno(a: AlunoContexto): string {
  return (
    `${a.nome} (matrícula ${a.matricula}, curso ${a.curso}, situação da matrícula: ${a.status}) está ${a.situacaoFinanceira}. ` +
    `Parcelas pagas: ${a.resumo.parcelasPagas}; em aberto: ${a.resumo.parcelasEmAberto}; em atraso: ${a.resumo.parcelasEmAtraso}. ` +
    `Valor em aberto: ${formatarMoedaBR(a.resumo.valorEmAberto)}; em atraso: ${formatarMoedaBR(a.resumo.valorEmAtraso)}. ` +
    `Próximo vencimento: ${a.resumo.proximoVencimento ? formatarDataBR(a.resumo.proximoVencimento) : 'nenhum'}.`
  );
}

function localizarAluno(perguntaNormalizada: string, alunos: AlunoContexto[]): AlunoContexto | null {
  const numeros: string[] = perguntaNormalizada.match(/\d{4,}/g) ?? [];
  for (const aluno of alunos) {
    if (numeros.includes(aluno.matricula)) {
      return aluno;
    }
  }
  for (const aluno of alunos) {
    const nomeNormalizado = normalizar(aluno.nome);
    if (perguntaNormalizada.includes(nomeNormalizado)) {
      return aluno;
    }
    const primeiroNome = nomeNormalizado.split(' ')[0] ?? '';
    if (primeiroNome.length >= 4 && new RegExp(`\\b${primeiroNome}\\b`).test(perguntaNormalizada)) {
      return aluno;
    }
  }
  return null;
}

/**
 * Resposta local determinística, sem rede. É o coração do modo demonstrativo:
 * calcula tudo a partir do MESMO contexto que seria enviado ao modelo real,
 * portanto nunca inventa dados — apenas reformula o que já existe.
 */
export function responderLocalmente(pergunta: string, contexto: ContextoAcademico): string {
  const p = normalizar(pergunta);
  const alunos = contexto.alunos;
  const inadimplentes = alunos.filter((a) => a.situacaoFinanceira === 'inadimplente');
  const adimplentes = alunos.filter((a) => a.situacaoFinanceira === 'adimplente');
  const ativos = alunos.filter((a) => normalizar(a.status) === 'ativa');
  const aluno = localizarAluno(p, alunos);

  const mencionaFinanceiro =
    /resum|situacao|financeir|mensalidad|parcela|deve|pag|status|adimpl|inadimpl|atras/.test(p);

  if (aluno && mencionaFinanceiro) {
    return resumoAluno(aluno);
  }

  if (/inadimpl|atras|devedor|devendo|divida/.test(p)) {
    if (inadimplentes.length === 0) {
      return `Nenhum aluno está inadimplente. Total de alunos analisados: ${alunos.length}.`;
    }
    const totalAtraso = inadimplentes.reduce((soma, a) => soma + a.resumo.valorEmAtraso, 0);
    return (
      `Alunos inadimplentes (${inadimplentes.length}):\n${descreverLista(inadimplentes)}\n` +
      `Valor total em atraso: ${formatarMoedaBR(totalAtraso)}.`
    );
  }

  if (/adimplent|em dia|quitad|regular/.test(p)) {
    return `Alunos adimplentes (${adimplentes.length}):\n${descreverLista(adimplentes) || '- nenhum'}`;
  }

  if (/quant|quantos|quantas|numero de/.test(p)) {
    if (/ativ/.test(p)) {
      return `Há ${ativos.length} aluno(s) com matrícula ativa, de ${alunos.length} no total.`;
    }
    if (/inadimpl/.test(p)) {
      return `Há ${inadimplentes.length} aluno(s) inadimplente(s) de ${alunos.length} no total.`;
    }
    if (/adimpl/.test(p)) {
      return `Há ${adimplentes.length} aluno(s) adimplente(s) de ${alunos.length} no total.`;
    }
    return `Total de ${alunos.length} alunos cadastrados.`;
  }

  if (aluno) {
    return resumoAluno(aluno);
  }

  if (/resum|panorama|visao geral|geral/.test(p)) {
    const totalAtraso = inadimplentes.reduce((soma, a) => soma + a.resumo.valorEmAtraso, 0);
    const base =
      `Panorama acadêmico (data de referência ${formatarDataBR(contexto.dataReferencia)}): ${alunos.length} alunos; ` +
      `${inadimplentes.length} inadimplente(s) e ${adimplentes.length} adimplente(s); ` +
      `valor total em atraso ${formatarMoedaBR(totalAtraso)}.`;
    return inadimplentes.length > 0
      ? `${base}\nInadimplentes:\n${descreverLista(inadimplentes)}`
      : base;
  }

  return (
    'Não encontrei essa informação nos dados disponíveis. Você pode perguntar sobre alunos ' +
    'inadimplentes, quantidade de matrículas ativas ou o resumo financeiro de um aluno ' +
    'específico (por nome ou matrícula).'
  );
}

/**
 * Provedor de demonstração: usado quando não há chave de API configurada.
 * Identifica-se como `modo: demonstrativo` para deixar claro na API que a
 * resposta NÃO vem de um LLM real.
 */
export class DemoProvider implements LlmProvider {
  readonly nome = 'demonstrativo';
  readonly modo: ModoLlm = 'demonstrativo';

  async responder({ pergunta, contexto }: EntradaLlm): Promise<string> {
    return responderLocalmente(pergunta, contexto);
  }
}
