import { AlunoRepository } from '../../domain/repositories/AlunoRepository';
import { Clock } from '../ports/Clock';
import { ResolvedorProvedorIa } from '../ports/ResolvedorProvedorIa';
import { InterpretadorResposta } from '../ports/InterpretadorResposta';
import { construirContextoAcademico } from '../services/construirContextoAcademico';
import { responderComSaidaEstruturada } from '../services/responderComSaidaEstruturada';
import { OpcoesRetry } from '../services/comRetry';
import { ProcessarAssistenteInput, RespostaAssistenteDTO } from '../dtos/assistente.dto';
import { NotFoundError } from '../errors/AppError';

/**
 * Caso de uso: responder uma pergunta do usuário com apoio de IA.
 *
 * Fluxo:
 *  1. reúne apenas os dados acadêmicos necessários (contexto);
 *  2. resolve, em tempo de execução, qual provedor de LLM está ativo;
 *  3. chama o provedor exigindo **saída estruturada** (JSON) e valida o contrato —
 *     com retry para resposta vazia/fora do formato;
 *  4. devolve o texto + as listas estruturadas + metadados de origem.
 */
export class ProcessarAssistenteIA {
  constructor(
    private readonly alunos: AlunoRepository,
    private readonly clock: Clock,
    private readonly ia: ResolvedorProvedorIa,
    private readonly interpretador: InterpretadorResposta,
    private readonly retry: OpcoesRetry,
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
    const rotulo = await this.ia.obterRotulo();

    const resultado = await responderComSaidaEstruturada(
      provedor,
      { pergunta, contexto },
      this.interpretador,
      this.retry,
    );

    return {
      resposta: resultado.resposta,
      adimplentes: resultado.adimplentes,
      inadimplentes: resultado.inadimplentes,
      provedor: provedor.nome,
      rotulo,
      modo: provedor.modo,
      geradoEm: new Date().toISOString(),
    };
  }
}
