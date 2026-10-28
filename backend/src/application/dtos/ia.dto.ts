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
  modelo: string | null;
  atualizadoEm: string | null;
  promptPadrao: string;
}

export interface ConfiguracaoIaPublicaDTO {
  provedor: ProvedorIa;
  modelo: string;
  promptSistema: string;
  temperatura: number;
  maxTokens: number;
  atualizadoEm: string;
}

export interface SalvarConfiguracaoIaDTO {
  provedor: ProvedorIa;
  apiKey: string;
  /** Opcional: sem ele, usa o modelo padrão do provedor. */
  modelo?: string;
  promptSistema?: string;
  temperatura?: number;
  maxTokens?: number;
}

export interface TesteIaDTO {
  ok: boolean;
  provedor: string;
  modo: ModoLlm;
  resposta: string;
}
