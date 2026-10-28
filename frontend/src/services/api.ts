import type { AlunoDetalhe, AlunoResumo, RespostaAssistente, ResumoFinanceiro } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

interface RespostaApi<T> {
  dados: T;
}

interface RespostaErro {
  erro?: { mensagem?: string };
}

async function requisitar<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      headers: { 'content-type': 'application/json' },
      ...init,
    });
  } catch {
    throw new Error('Não foi possível conectar à API. Verifique se o back-end está rodando.');
  }

  const corpo = (await resposta.json().catch(() => null)) as
    | RespostaApi<T>
    | RespostaErro
    | null;

  if (!resposta.ok) {
    const mensagem = (corpo as RespostaErro | null)?.erro?.mensagem;
    throw new Error(mensagem ?? `Erro ${resposta.status} ao consultar a API.`);
  }

  return (corpo as RespostaApi<T>).dados;
}

export const api = {
  listarAlunos(busca?: string): Promise<AlunoResumo[]> {
    const query = busca && busca.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : '';
    return requisitar<AlunoResumo[]>(`/api/alunos${query}`);
  },

  consultarAluno(id: string): Promise<AlunoDetalhe> {
    return requisitar<AlunoDetalhe>(`/api/alunos/${encodeURIComponent(id)}`);
  },

  consultarFinanceiro(id: string): Promise<ResumoFinanceiro> {
    return requisitar<ResumoFinanceiro>(`/api/alunos/${encodeURIComponent(id)}/financeiro`);
  },

  perguntar(pergunta: string, alunoId?: string): Promise<RespostaAssistente> {
    return requisitar<RespostaAssistente>('/api/assistente', {
      method: 'POST',
      body: JSON.stringify({ pergunta, alunoId }),
    });
  },
};
