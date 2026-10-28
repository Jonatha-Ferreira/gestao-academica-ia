import { ProvedorIa } from '../../domain/entities/ConfiguracaoIa';
import { ModeloIaDTO } from '../dtos/ia.dto';

/**
 * Consulta os modelos disponíveis em um provedor usando a chave do usuário.
 * Também serve como validação da chave: se o provedor recusar a chave, a
 * integração não é aceita.
 *
 * A `baseUrl` é configurável — é o que permite usar qualquer serviço compatível
 * com a API da OpenAI, não só um fornecedor fixo.
 */
export interface CatalogoModelos {
  listar(provedor: ProvedorIa, baseUrl: string, apiKey: string): Promise<ModeloIaDTO[]>;
}
