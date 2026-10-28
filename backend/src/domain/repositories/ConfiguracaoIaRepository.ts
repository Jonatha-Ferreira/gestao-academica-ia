import { ConfiguracaoIa } from '../entities/ConfiguracaoIa';

/** Persistência da configuração de IA (opcional — null significa "não configurada"). */
export interface ConfiguracaoIaRepository {
  obter(): Promise<ConfiguracaoIa | null>;
  salvar(configuracao: ConfiguracaoIa): Promise<void>;
  limpar(): Promise<void>;
}
