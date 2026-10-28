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

interface Citado {
  nome: string;
  matricula: string;
  valorEmAtraso?: number;
}

/** Mesmo contrato de saída exigido dos provedores reais. */
interface Envelope {
  resposta: string;
  adimplentes: Citado[];
  inadimplentes: Citado[];
}

function citado(aluno: AlunoContexto, comAtraso = false): Citado {
  return comAtraso
    ? { nome: aluno.nome, matricula: aluno.matricula, valorEmAtraso: aluno.resumo.valorEmAtraso }
    : { nome: aluno.nome, matricula: aluno.matricula };
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
 *
 * Devolve o mesmo envelope estruturado exigido dos provedores reais, para que o
 * pipeline (interpretação + validação) seja idêntico nos dois modos.
 */
export function responderLocalmente(pergunta: string, contexto: ContextoAcademico): Envelope {
  const p = normalizar(pergunta);
  const alunos = contexto.alunos;
  const inadimplentes = alunos.filter((a) => a.situacaoFinanceira === 'inadimplente');
  const adimplentes = alunos.filter((a) => a.situacaoFinanceira === 'adimplente');
  const ativos = alunos.filter((a) => normalizar(a.status) === 'ativa');
  const aluno = localizarAluno(p, alunos);

  const mencionaFinanceiro =
    /resum|situacao|financeir|mensalidad|parcela|deve|pag|status|adimpl|inadimpl|atras/.test(p);

  if (aluno && mencionaFinanceiro) {
    return envelopeDoAluno(aluno);
  }

  if (/inadimpl|atras|devedor|devendo|divida/.test(p)) {
    if (inadimplentes.length === 0) {
      return {
        resposta: `Nenhum aluno está inadimplente. Total de alunos analisados: ${alunos.length}.`,
        adimplentes: [],
        inadimplentes: [],
      };
    }
    const totalAtraso = inadimplentes.reduce((soma, a) => soma + a.resumo.valorEmAtraso, 0);
    return {
      resposta:
        `Alunos inadimplentes (${inadimplentes.length}):\n${descreverLista(inadimplentes)}\n` +
        `Valor total em atraso: ${formatarMoedaBR(totalAtraso)}.`,
      adimplentes: [],
      inadimplentes: inadimplentes.map((a) => citado(a, true)),
    };
  }

  if (/adimplent|em dia|quitad|regular/.test(p)) {
    return {
      resposta: `Alunos adimplentes (${adimplentes.length}):\n${descreverLista(adimplentes) || '- nenhum'}`,
      adimplentes: adimplentes.map((a) => citado(a)),
      inadimplentes: [],
    };
  }

  if (/quant|quantos|quantas|numero de/.test(p)) {
    let resposta: string;
    if (/ativ/.test(p)) {
      resposta = `Há ${ativos.length} aluno(s) com matrícula ativa, de ${alunos.length} no total.`;
    } else if (/inadimpl/.test(p)) {
      resposta = `Há ${inadimplentes.length} aluno(s) inadimplente(s) de ${alunos.length} no total.`;
    } else if (/adimpl/.test(p)) {
      resposta = `Há ${adimplentes.length} aluno(s) adimplente(s) de ${alunos.length} no total.`;
    } else {
      resposta = `Total de ${alunos.length} alunos cadastrados.`;
    }
    return { resposta, adimplentes: [], inadimplentes: [] };
  }

  if (aluno) {
    return envelopeDoAluno(aluno);
  }

  if (/resum|panorama|visao geral|geral/.test(p)) {
    const totalAtraso = inadimplentes.reduce((soma, a) => soma + a.resumo.valorEmAtraso, 0);
    const base =
      `Panorama acadêmico (data de referência ${formatarDataBR(contexto.dataReferencia)}): ${alunos.length} alunos; ` +
      `${inadimplentes.length} inadimplente(s) e ${adimplentes.length} adimplente(s); ` +
      `valor total em atraso ${formatarMoedaBR(totalAtraso)}.`;
    return {
      resposta:
        inadimplentes.length > 0 ? `${base}\nInadimplentes:\n${descreverLista(inadimplentes)}` : base,
      adimplentes: adimplentes.map((a) => citado(a)),
      inadimplentes: inadimplentes.map((a) => citado(a, true)),
    };
  }

  return {
    resposta:
      'Não encontrei essa informação nos dados disponíveis. Você pode perguntar sobre alunos ' +
      'inadimplentes, quantidade de matrículas ativas ou o resumo financeiro de um aluno ' +
      'específico (por nome ou matrícula).',
    adimplentes: [],
    inadimplentes: [],
  };
}

function envelopeDoAluno(aluno: AlunoContexto): Envelope {
  const inadimplente = aluno.situacaoFinanceira === 'inadimplente';
  return {
    resposta: resumoAluno(aluno),
    adimplentes: inadimplente ? [] : [citado(aluno)],
    inadimplentes: inadimplente ? [citado(aluno, true)] : [],
  };
}

/**
 * Provedor de demonstração: usado quando há integração real configurada? Não —
 * é o fallback. Identifica-se como `modo: demonstrativo` para deixar claro na
 * API que a resposta NÃO vem de um LLM real.
 */
export class DemoProvider implements LlmProvider {
  readonly nome = 'demonstrativo';
  readonly modo: ModoLlm = 'demonstrativo';

  async responder({ pergunta, contexto }: EntradaLlm): Promise<string> {
    // Serializa no mesmo contrato JSON dos provedores reais.
    return JSON.stringify(responderLocalmente(pergunta, contexto));
  }
}
