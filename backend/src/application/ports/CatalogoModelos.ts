import { ProvedorIa } from '../../domain/entities/ConfiguracaoIa';
import { ModeloIaDTO } from '../dtos/ia.dto';

/**
 * Consulta os modelos disponíveis em um provedor de LLM usando a chave do
 * usuário. Também serve como validação da chave: se a listagem falhar, a chave
 * não é aceita.
 */
export interface CatalogoModelos {
  listar(provedor: ProvedorIa, apiKey: string): Promise<ModeloIaDTO[]>;
}
