import { MODELO_PADRAO, ProvedorIa } from '../../domain/entities/ConfiguracaoIa';
import { ModeloIaDTO } from '../dtos/ia.dto';

/** Linha "flash" (rápida/barata) preferida por provedor, em ordem de prioridade. */
const PREFERENCIA_POR_PROVEDOR: Record<ProvedorIa, string[]> = {
  anthropic: ['haiku', 'sonnet'],
  openai: ['mini', 'nano'],
};

/**
 * Escolhe o modelo padrão de um provedor a partir da lista REAL devolvida por ele,
 * priorizando a linha "flash" e, dentro dela, o alias mais atualizado (`-latest`).
 * Se a lista não estiver disponível, cai para o alias constante do domínio.
 */
export function escolherModeloPadrao(provedor: ProvedorIa, modelos: ModeloIaDTO[]): string {
  const ids = modelos.map((modelo) => modelo.id).filter((id) => id.length > 0);
  if (ids.length === 0) {
    return MODELO_PADRAO[provedor];
  }

  for (const termo of PREFERENCIA_POR_PROVEDOR[provedor]) {
    const candidatos = ids.filter((id) => id.toLowerCase().includes(termo));
    if (candidatos.length === 0) {
      continue;
    }
    const maisAtualizado = candidatos.find((id) => id.toLowerCase().endsWith('-latest'));
    return maisAtualizado ?? candidatos[0]!;
  }

  return ids[0]!;
}
