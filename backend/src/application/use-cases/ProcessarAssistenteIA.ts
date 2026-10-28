import { AlunoRepository } from '../../domain/repositories/AlunoRepository';
import { Clock } from '../ports/Clock';
import { LlmProvider } from '../ports/LlmProvider';
import { construirContextoAcademico } from '../services/construirContextoAcademico';
import { ProcessarAssistenteInput, RespostaAssistenteDTO } from '../dtos/assistente.dto';
import { NotFoundError } from '../errors/AppError';

/**
 * Caso de uso: responder uma pergunta do usuário com apoio de IA.
 *
 * Responsabilidades:
 *  1. reunir apenas os dados acadêmicos necessários (contexto);
 *  2. delegar a geração da resposta ao provedor de LLM configurado;
 *  3. devolver a resposta com metadados (provedor/modo) para transparência.
 *
 * O modo demonstrativo (sem chave de API) é apenas mais um `LlmProvider`, então
 * o caso de uso não precisa saber qual está em uso.
 */
export class ProcessarAssistenteIA {
  constructor(
    private readonly alunos: AlunoRepository,
    private readonly clock: Clock,
    private readonly llm: LlmProvider,
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
    const resposta = await this.llm.responder({ pergunta, contexto });

    return {
      resposta,
      provedor: this.llm.nome,
      modo: this.llm.modo,
      geradoEm: new Date().toISOString(),
    };
  }
}
