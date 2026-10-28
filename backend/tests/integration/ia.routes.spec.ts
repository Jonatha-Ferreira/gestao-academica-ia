import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/presentation/app';
import { buildContainer } from '../../src/main/container';
import { FixedClock } from '../../src/infrastructure/clock/Clock';
import { DemoProvider } from '../../src/infrastructure/llm/DemoProvider';
import { MemoriaConfiguracaoIaRepository } from '../../src/infrastructure/database/MemoriaConfiguracaoIaRepository';
import { GerenciadorIa } from '../../src/application/services/GerenciadorIa';
import { CatalogoModelos } from '../../src/application/ports/CatalogoModelos';
import { LlmProvider, ModoLlm } from '../../src/application/ports/LlmProvider';
import { ModeloIaDTO } from '../../src/application/dtos/ia.dto';
import { ProvedorInvalidoError } from '../../src/application/errors/AppError';

const SENHA = 'segredo-admin';

class CatalogoFalso implements CatalogoModelos {
  constructor(
    private readonly modelos: ModeloIaDTO[] = [
      { id: 'claude-3-5-sonnet-latest', nome: 'Claude 3.5 Sonnet' },
    ],
    private readonly falhar = false,
  ) {}

  async listar(): Promise<ModeloIaDTO[]> {
    if (this.falhar) {
      throw new ProvedorInvalidoError('O provedor recusou a requisição (HTTP 401).');
    }
    return this.modelos;
  }
}

class ProvedorFalso implements LlmProvider {
  readonly modo: ModoLlm = 'real';
  constructor(readonly nome = 'anthropic') {}
  async responder(): Promise<string> {
    return `Resposta simulada do provedor ${this.nome}.`;
  }
}

interface OpcoesApp {
  catalogo?: CatalogoModelos;
  provedorReal?: LlmProvider;
  provedorFallback?: LlmProvider;
}

function criarApp(opcoes: OpcoesApp = {}): Express {
  const gerenciadorIa = new GerenciadorIa({
    repositorio: new MemoriaConfiguracaoIaRepository(),
    catalogo: opcoes.catalogo ?? new CatalogoFalso(),
    montarProvedor: () => opcoes.provedorReal ?? new ProvedorFalso(),
    provedorFallback: opcoes.provedorFallback ?? new DemoProvider(),
    senhaAdmin: SENHA,
  });
  const container = buildContainer({
    clock: new FixedClock('2026-10-28'),
    gerenciadorIa,
  });
  return createApp(container.dependencias);
}

const configuracaoValida = {
  senha: SENHA,
  provedor: 'anthropic',
  apiKey: 'chave-de-teste-anthropic',
  modelo: 'claude-3-5-sonnet-latest',
  promptSistema: 'Responda apenas o que está nos dados.',
  temperatura: 0.1,
};

describe('GET /api/ia/status', () => {
  it('começa em modo demonstrativo e sem configuração', async () => {
    const resposta = await request(criarApp()).get('/api/ia/status');

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.modo).toBe('demonstrativo');
    expect(resposta.body.dados.configurado).toBe(false);
    expect(typeof resposta.body.dados.promptPadrao).toBe('string');
  });
});

describe('POST /api/ia/autenticar', () => {
  it('aceita a senha correta', async () => {
    const resposta = await request(criarApp()).post('/api/ia/autenticar').send({ senha: SENHA });
    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.valido).toBe(true);
  });

  it('rejeita a senha incorreta com 401', async () => {
    const resposta = await request(criarApp()).post('/api/ia/autenticar').send({ senha: 'errada' });
    expect(resposta.status).toBe(401);
    expect(resposta.body.erro.codigo).toBe('NAO_AUTORIZADO');
  });
});

describe('rotas protegidas de IA', () => {
  it('exigem a senha (401 sem senha)', async () => {
    const resposta = await request(criarApp()).get('/api/ia/configuracao');
    expect(resposta.status).toBe(401);
  });

  it('retornam a configuração quando a senha é válida', async () => {
    const resposta = await request(criarApp())
      .get('/api/ia/configuracao')
      .set('x-senha-ia', SENHA);
    expect(resposta.status).toBe(200);
    expect(resposta.body.dados).toBeNull();
  });
});

describe('POST /api/ia/modelos', () => {
  it('lista os modelos do provedor com a chave informada', async () => {
    const resposta = await request(criarApp())
      .post('/api/ia/modelos')
      .send({ senha: SENHA, provedor: 'anthropic', apiKey: 'chave-de-teste-anthropic' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados[0].id).toBe('claude-3-5-sonnet-latest');
  });

  it('recusa provedor que não seja LLM suportado', async () => {
    const resposta = await request(criarApp())
      .post('/api/ia/modelos')
      .send({ senha: SENHA, provedor: 'gemini', apiKey: 'x' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('VALIDACAO');
  });

  it('recusa chave inválida (provedor rejeitou) com 400', async () => {
    const resposta = await request(criarApp({ catalogo: new CatalogoFalso([], true) }))
      .post('/api/ia/modelos')
      .send({ senha: SENHA, provedor: 'anthropic', apiKey: 'chave-ruim' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('PROVEDOR_INVALIDO');
  });
});

describe('PUT /api/ia/configuracao', () => {
  it('salva a integração e passa a responder de fato (modo real)', async () => {
    const app = criarApp();

    const salvar = await request(app).put('/api/ia/configuracao').send(configuracaoValida);
    expect(salvar.status).toBe(200);
    expect(salvar.body.dados.configurado).toBe(true);
    expect(salvar.body.dados.modo).toBe('real');
    expect(salvar.body.dados.provedor).toBe('anthropic');

    const status = await request(app).get('/api/ia/status');
    expect(status.body.dados.modo).toBe('real');

    const assistente = await request(app)
      .post('/api/assistente')
      .send({ pergunta: 'Quais alunos estão inadimplentes?' });
    expect(assistente.status).toBe(200);
    expect(assistente.body.dados.modo).toBe('real');
    expect(assistente.body.dados.resposta).toContain('simulada');
  });

  it('salva sem informar modelo e aplica o padrão do provedor', async () => {
    const app = criarApp();

    const resposta = await request(app).put('/api/ia/configuracao').send({
      senha: SENHA,
      provedor: 'anthropic',
      apiKey: 'chave-de-teste-anthropic',
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.configurado).toBe(true);
    // O catálogo fake só devolve o sonnet; o seletor de padrão escolhe ele.
    expect(resposta.body.dados.modelo).toBe('claude-3-5-sonnet-latest');
  });

  it('recusa provedor não suportado', async () => {
    const resposta = await request(criarApp())
      .put('/api/ia/configuracao')
      .send({ ...configuracaoValida, provedor: 'gemini' });

    expect(resposta.status).toBe(400);
  });

  it('recusa modelo indisponível no provedor', async () => {
    const resposta = await request(criarApp())
      .put('/api/ia/configuracao')
      .send({ ...configuracaoValida, modelo: 'modelo-inexistente' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('PROVEDOR_INVALIDO');
  });
});

describe('POST /api/ia/testar', () => {
  it('envia uma pergunta de amostra pelo provedor configurado', async () => {
    const app = criarApp();
    await request(app).put('/api/ia/configuracao').send(configuracaoValida);

    const resposta = await request(app).post('/api/ia/testar').send({ senha: SENHA });

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.ok).toBe(true);
    expect(resposta.body.dados.modo).toBe('real');
    expect(resposta.body.dados.resposta).toContain('simulada');
  });
});

describe('DELETE /api/ia/configuracao', () => {
  it('remove a integração e volta ao modo demonstrativo', async () => {
    const app = criarApp();
    await request(app).put('/api/ia/configuracao').send(configuracaoValida);

    const remover = await request(app)
      .delete('/api/ia/configuracao')
      .set('x-senha-ia', SENHA);

    expect(remover.status).toBe(200);
    expect(remover.body.dados.configurado).toBe(false);
    expect(remover.body.dados.modo).toBe('demonstrativo');
  });
});
