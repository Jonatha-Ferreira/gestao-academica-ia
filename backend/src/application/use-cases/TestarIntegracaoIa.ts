import { AlunoRepository } from '../../domain/repositories/AlunoRepository';
import { Clock } from '../ports/Clock';
import { ResolvedorProvedorIa } from '../ports/ResolvedorProvedorIa';
import { construirContextoAcademico } from '../services/construirContextoAcademico';
import { TesteIaDTO } from '../dtos/ia.dto';

/**
 * Caso de uso: enviar uma pergunta de amostra pelo provedor efetivo para
 * verificar se a integração de IA está respondendo de fato.
 */
export class TestarIntegracaoIa {
  constructor(
    private readonly alunos: AlunoRepository,
    private readonly clock: Clock,
    private readonly ia: ResolvedorProvedorIa,
  ) {}

  async executar(): Promise<TesteIaDTO> {
    const alunos = await this.alunos.listar();
    const contexto = construirContextoAcademico(alunos, this.clock.hojeISO());
    const provedor = await this.ia.obterProvedor();

    const resposta = await provedor.responder({
      pergunta: 'Em uma única frase, resuma a situação financeira geral dos alunos.',
      contexto,
    });

    return {
      ok: true,
      provedor: provedor.nome,
      modo: provedor.modo,
      resposta,
    };
  }
}
