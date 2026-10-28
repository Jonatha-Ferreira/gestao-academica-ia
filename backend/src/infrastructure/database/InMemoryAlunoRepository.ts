import alunosSeed from './data/alunos.json';
import { Aluno, AlunoProps } from '../../domain/entities/Aluno';
import { AlunoRepository } from '../../domain/repositories/AlunoRepository';

/**
 * Repositório em memória hidratado a partir do JSON de dados fictícios.
 * Serve como "banco" do desafio; pode ser trocado por uma implementação real
 * sem impactar as camadas de domínio/aplicação.
 */
export class InMemoryAlunoRepository implements AlunoRepository {
  private readonly alunos: Aluno[];

  constructor(seed: AlunoProps[] = alunosSeed as unknown as AlunoProps[]) {
    // A hidratação passa pela validação da entidade: dados inválidos falham cedo.
    this.alunos = seed.map((props) => Aluno.criar(props));
  }

  async listar(): Promise<Aluno[]> {
    return [...this.alunos];
  }

  async buscarPorId(id: string): Promise<Aluno | null> {
    return this.alunos.find((aluno) => aluno.id === id) ?? null;
  }

  async buscar(termo: string): Promise<Aluno[]> {
    const limpo = termo.trim();
    if (!limpo) {
      return this.listar();
    }
    const alvo = this.normalizar(limpo);
    return this.alunos.filter(
      (aluno) =>
        this.normalizar(aluno.nome).includes(alvo) || aluno.matricula.includes(limpo),
    );
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
