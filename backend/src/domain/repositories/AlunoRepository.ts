import { Aluno } from '../entities/Aluno';

/**
 * Porta de persistência do agregado Aluno. A camada de domínio/aplicação depende
 * apenas desta abstração; a implementação concreta (memória/JSON/banco) fica na
 * infraestrutura, respeitando a Inversão de Dependência (SOLID).
 */
export interface AlunoRepository {
  listar(): Promise<Aluno[]>;
  buscarPorId(id: string): Promise<Aluno | null>;
  /** Busca por nome (parcial) ou matrícula. Termo vazio retorna todos. */
  buscar(termo: string): Promise<Aluno[]>;
}
