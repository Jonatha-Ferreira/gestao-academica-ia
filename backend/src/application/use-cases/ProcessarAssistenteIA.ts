import { AlunoRepository } from '../../domain/repositories/AlunoRepository';
import { Clock } from '../ports/Clock';
import { ResolvedorProvedorIa } from '../ports/ResolvedorProvedorIa';
import { construirContextoAcademico } from '../services/construirContextoAcademico';
import { ProcessarAssistenteInput, RespostaAssistenteDTO } from '../dtos/assistente.dto';
import { NotFoundError } from '../errors/AppError';

/**
 * Caso de uso: responder uma pergunta do usuário com apoio de IA.
 *
 * Responsabilidades:
 *  1. reunir apenas os dados acadêmicos necessários (contexto);
 *  2. resolver, em tempo de execução, qual provedor de LLM está ativo;
 *  3. devolver a resposta com metadados (provedor/modo) para transparência.
 */
export class ProcessarAssistenteIA {
  constructor(
    private readonly alunos: AlunoRepository,
    private readonly clock: Clock,
    private readonly ia: ResolvedorProvedorIa,
  ) {}

  async executar(input: ProcessarAssistenteInput): Promise<RespostaAssistenteDTO> {
    const pergunta = input.pergunta.trim();
    const dataReferencia = this.clock.hojeISO();

    let alunos;
    if (input.alunoId) {
      const aluno = await this.alunos.buscarPorId(input.alunoId);
      if (!aluno) {
        throw new NotFoundError(`Aluno "${input.alunoId}" não encontrado.`);
      }
      alunos = [aluno];
    } else {
      alunos = await this.alunos.listar();
    }

    const contexto = construirContextoAcademico(alunos, dataReferencia);
    const provedor = await this.ia.obterProvedor();
    const resposta = await provedor.responder({ pergunta, contexto });

    return {
      resposta,
      provedor: provedor.nome,
      modo: provedor.modo,
      geradoEm: new Date().toISOString(),
    };
  }
}
