import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { criarAppDeTeste } from '../helpers/app';
import { LlmProvider } from '../../src/application/ports/LlmProvider';
import { LlmIndisponivelError } from '../../src/application/errors/AppError';

const app = criarAppDeTeste();

describe('POST /api/assistente', () => {
  it('responde em modo demonstrativo usando apenas os dados existentes', async () => {
    const resposta = await request(app)
      .post('/api/assistente')
      .send({ pergunta: 'Quais alunos estão inadimplentes?' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.modo).toBe('demonstrativo');
    expect(resposta.body.dados.rotulo).toBeNull();
    expect(resposta.body.dados.resposta).toContain('João da Silva');
    expect(resposta.body.dados.resposta).toContain('Ana Beatriz');
  });

  it('resume a situação financeira do aluno citado por matrícula', async () => {
    const resposta = await request(app)
      .post('/api/assistente')
      .send({ pergunta: 'Resuma a situação financeira do aluno 202602' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.resposta).toContain('Maria Souza');
    expect(resposta.body.dados.resposta).toContain('adimplente');
  });

  it('rejeita pergunta vazia com 400', async () => {
    const resposta = await request(app).post('/api/assistente').send({ pergunta: '   ' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('VALIDACAO');
  });

  it('rejeita corpo sem o campo pergunta', async () => {
    const resposta = await request(app).post('/api/assistente').send({});

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro.codigo).toBe('VALIDACAO');
  });

  it('retorna 503 quando o provedor de IA está indisponível', async () => {
    const provedorComFalha: LlmProvider = {
      nome: 'fake',
      modo: 'real',
      async responder() {
        throw new LlmIndisponivelError('Serviço de IA fora do ar.');
      },
    };

    const appComFalha = criarAppDeTeste(provedorComFalha);
    const resposta = await request(appComFalha)
      .post('/api/assistente')
      .send({ pergunta: 'Quais alunos estão inadimplentes?' });

    expect(resposta.status).toBe(503);
    expect(resposta.body.erro.codigo).toBe('IA_INDISPONIVEL');
  });
});
