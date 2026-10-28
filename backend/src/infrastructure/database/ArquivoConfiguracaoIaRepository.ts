import * as fs from 'fs';
import * as path from 'path';
import { ConfiguracaoIa, ConfiguracaoIaProps } from '../../domain/entities/ConfiguracaoIa';
import { ConfiguracaoIaRepository } from '../../domain/repositories/ConfiguracaoIaRepository';

/**
 * Persiste a configuração em um arquivo JSON local (fora do versionamento).
 *
 * ATENÇÃO: o arquivo contém a chave de API em texto puro, adequado apenas para
 * execução local neste desafio. Em produção, use um gerenciador de segredos
 * (Vault, AWS Secrets Manager, etc.) e nunca grave a chave em disco.
 */
export class ArquivoConfiguracaoIaRepository implements ConfiguracaoIaRepository {
  constructor(private readonly caminhoArquivo: string) {}

  async obter(): Promise<ConfiguracaoIa | null> {
    if (!fs.existsSync(this.caminhoArquivo)) {
      return null;
    }
    try {
      const bruto = fs.readFileSync(this.caminhoArquivo, 'utf-8');
      return ConfiguracaoIa.restaurar(JSON.parse(bruto) as ConfiguracaoIaProps);
    } catch {
      // Arquivo corrompido/inválido: ignora e volta ao modo padrão.
      return null;
    }
  }

  async salvar(configuracao: ConfiguracaoIa): Promise<void> {
    fs.mkdirSync(path.dirname(this.caminhoArquivo), { recursive: true });
    fs.writeFileSync(this.caminhoArquivo, JSON.stringify(configuracao.toJSON(), null, 2), 'utf-8');
  }

  async limpar(): Promise<void> {
    if (fs.existsSync(this.caminhoArquivo)) {
      fs.rmSync(this.caminhoArquivo);
    }
  }
}
