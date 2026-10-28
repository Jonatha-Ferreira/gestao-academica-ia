import { ModoLlm } from '../ports/LlmProvider';
import { ProvedorIa } from '../../domain/entities/ConfiguracaoIa';

export interface ModeloIaDTO {
  id: string;
  nome: string;
}

export interface StatusIaDTO {
  configurado: boolean;
  modo: ModoLlm;
  provedor: string;
  rotulo: string | null;
  modelo: string | null;
  atualizadoEm: string | null;
  promptPadrao: string;
}

export interface ConfiguracaoIaPublicaDTO {
  provedor: ProvedorIa;
  rotulo: string;
  baseUrl: string;
  modelo: string;
  promptSistema: string;
  temperatura: number;
  maxTokens: number;
  atualizadoEm: string;
}

export interface SalvarConfiguracaoIaDTO {
  provedor: ProvedorIa;
  /** Rótulo de exibição (ex.: "DeepSeek"). Opcional. */
  rotulo?: string;
  /** URL base da API, já com a versão (ex.: https://api.deepseek.com/v1). Opcional. */
  baseUrl?: string;
  apiKey: string;
  /** Opcional: sem ele, usa o modelo padrão do adaptador. */
  modelo?: string;
  promptSistema?: string;
  temperatura?: number;
  maxTokens?: number;
}

export interface TesteIaDTO {
  ok: boolean;
  provedor: string;
  rotulo: string | null;
  modo: ModoLlm;
  resposta: string;
}
