import type {
  AlunoDetalhe,
  AlunoResumo,
  ConfiguracaoIaPublica,
  ModeloIa,
  ProvedorIa,
  RespostaAssistente,
  ResumoFinanceiro,
  SalvarConfiguracaoIa,
  StatusIa,
  TesteIa,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

interface RespostaApi<T> {
  dados: T;
}

interface RespostaErro {
  erro?: { mensagem?: string };
}

async function requisitar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const { headers, ...resto } = init;

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      ...resto,
      headers: {
        'content-type': 'application/json',
        ...(headers as Record<string, string> | undefined),
      },
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

const comSenha = (senha: string): Record<string, string> => ({ 'x-senha-ia': senha });

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

  ia: {
    status(): Promise<StatusIa> {
      return requisitar<StatusIa>('/api/ia/status');
    },

    autenticar(senha: string): Promise<{ valido: boolean }> {
      return requisitar<{ valido: boolean }>('/api/ia/autenticar', {
        method: 'POST',
        body: JSON.stringify({ senha }),
      });
    },

    configuracao(senha: string): Promise<ConfiguracaoIaPublica | null> {
      return requisitar<ConfiguracaoIaPublica | null>('/api/ia/configuracao', {
        headers: comSenha(senha),
      });
    },

    modelos(senha: string, provedor: ProvedorIa, apiKey: string): Promise<ModeloIa[]> {
      return requisitar<ModeloIa[]>('/api/ia/modelos', {
        method: 'POST',
        headers: comSenha(senha),
        body: JSON.stringify({ senha, provedor, apiKey }),
      });
    },

    salvar(senha: string, dados: SalvarConfiguracaoIa): Promise<StatusIa> {
      return requisitar<StatusIa>('/api/ia/configuracao', {
        method: 'PUT',
        headers: comSenha(senha),
        body: JSON.stringify({ senha, ...dados }),
      });
    },

    remover(senha: string): Promise<StatusIa> {
      return requisitar<StatusIa>('/api/ia/configuracao', {
        method: 'DELETE',
        headers: comSenha(senha),
      });
    },

    testar(senha: string): Promise<TesteIa> {
      return requisitar<TesteIa>('/api/ia/testar', {
        method: 'POST',
        headers: comSenha(senha),
        body: JSON.stringify({ senha }),
      });
    },
  },
};
