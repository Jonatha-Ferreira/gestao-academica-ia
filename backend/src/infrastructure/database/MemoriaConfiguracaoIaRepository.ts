import { ConfiguracaoIa } from '../../domain/entities/ConfiguracaoIa';
import { ConfiguracaoIaRepository } from '../../domain/repositories/ConfiguracaoIaRepository';

/** Implementação em memória — usada em testes e como padrão volátil. */
export class MemoriaConfiguracaoIaRepository implements ConfiguracaoIaRepository {
  private configuracao: ConfiguracaoIa | null = null;

  async obter(): Promise<ConfiguracaoIa | null> {
    return this.configuracao;
  }

  async salvar(configuracao: ConfiguracaoIa): Promise<void> {
    this.configuracao = configuracao;
  }

  async limpar(): Promise<void> {
    this.configuracao = null;
  }
}
