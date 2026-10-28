import { AlunoRepository } from '../../domain/repositories/AlunoRepository';
import { Clock } from '../ports/Clock';
import { ResolvedorProvedorIa } from '../ports/ResolvedorProvedorIa';
import { InterpretadorResposta } from '../ports/InterpretadorResposta';
import { construirContextoAcademico } from '../services/construirContextoAcademico';
import { responderComSaidaEstruturada } from '../services/responderComSaidaEstruturada';
import { OpcoesRetry } from '../services/comRetry';
import { TesteIaDTO } from '../dtos/ia.dto';

/**
 * Caso de uso: enviar uma pergunta de amostra pelo provedor efetivo para
 * verificar se a integração de IA está respondendo de fato.
 *
 * Usa o mesmo pipeline estruturado da conversa — inclusive o retry —, então um
 * "Teste OK" significa que o contrato de saída também está funcionando.
 */
export class TestarIntegracaoIa {
  constructor(
    private readonly alunos: AlunoRepository,
    private readonly clock: Clock,
    private readonly ia: ResolvedorProvedorIa,
    private readonly interpretador: InterpretadorResposta,
    private readonly retry: OpcoesRetry,
  ) {}

  async executar(): Promise<TesteIaDTO> {
    const alunos = await this.alunos.listar();
    const contexto = construirContextoAcademico(alunos, this.clock.hojeISO());
    const provedor = await this.ia.obterProvedor();
    const rotulo = await this.ia.obterRotulo();

    const resultado = await responderComSaidaEstruturada(
      provedor,
      {
        pergunta: 'Em uma única frase, resuma a situação financeira geral dos alunos.',
        contexto,
      },
      this.interpretador,
      this.retry,
    );

    return {
      ok: true,
      provedor: provedor.nome,
      rotulo,
      modo: provedor.modo,
      resposta: resultado.resposta,
    };
  }
}
