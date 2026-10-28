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

describe('saída estruturada, retry e idempotência', () => {
  function provedorQueConta(): { provedor: LlmProvider; chamadas: () => number } {
    let total = 0;
    const provedor: LlmProvider = {
      nome: 'fake',
      modo: 'real',
      async responder() {
        total += 1;
        return JSON.stringify({ resposta: 'ok', adimplentes: [], inadimplentes: [] });
      },
    };
    return { provedor, chamadas: () => total };
  }

  it('devolve listas estruturadas validadas, não texto livre', async () => {
    const resposta = await request(app)
      .post('/api/assistente')
      .send({ pergunta: 'Quais alunos estão inadimplentes?' });

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body.dados.adimplentes)).toBe(true);
    expect(resposta.body.dados.inadimplentes.map((a: { matricula: string }) => a.matricula)).toEqual([
      '202601',
      '202604',
    ]);
  });

  it('não chama o modelo duas vezes com a mesma Idempotency-Key', async () => {
    const { provedor, chamadas } = provedorQueConta();
    const appComProvedor = criarAppDeTeste(provedor);
    const cabecalhos = { 'x-session-id': 'sessao-1', 'idempotency-key': 'msg-1' };

    const primeira = await request(appComProvedor)
      .post('/api/assistente')
      .set(cabecalhos)
      .send({ pergunta: 'oi' });
    const segunda = await request(appComProvedor)
      .post('/api/assistente')
      .set(cabecalhos)
      .send({ pergunta: 'oi' });

    expect(primeira.status).toBe(200);
    expect(segunda.status).toBe(200);
    expect(segunda.body.dados.resposta).toBe(primeira.body.dados.resposta);
    expect(chamadas()).toBe(1);
  });

  it('chama o modelo de novo quando a Idempotency-Key muda', async () => {
    const { provedor, chamadas } = provedorQueConta();
    const appComProvedor = criarAppDeTeste(provedor);

    await request(appComProvedor)
      .post('/api/assistente')
      .set({ 'x-session-id': 's', 'idempotency-key': 'a' })
      .send({ pergunta: 'oi' });
    await request(appComProvedor)
      .post('/api/assistente')
      .set({ 'x-session-id': 's', 'idempotency-key': 'b' })
      .send({ pergunta: 'oi' });

    expect(chamadas()).toBe(2);
  });

  it('faz retry quando o modelo responde fora do contrato', async () => {
    let chamadas = 0;
    const provedor: LlmProvider = {
      nome: 'fake',
      modo: 'real',
      async responder() {
        chamadas += 1;
        if (chamadas === 1) {
          return 'texto livre, sem JSON';
        }
        return JSON.stringify({ resposta: 'ok', adimplentes: [], inadimplentes: [] });
      },
    };

    const resposta = await request(criarAppDeTeste(provedor))
      .post('/api/assistente')
      .send({ pergunta: 'oi' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.resposta).toBe('ok');
    expect(chamadas).toBe(2);
  });

  it('devolve 502 quando a IA nunca respeita o contrato', async () => {
    const provedor: LlmProvider = {
      nome: 'fake',
      modo: 'real',
      async responder() {
        return 'sempre sem JSON';
      },
    };

    const resposta = await request(criarAppDeTeste(provedor))
      .post('/api/assistente')
      .send({ pergunta: 'oi' });

    expect(resposta.status).toBe(502);
    expect(resposta.body.erro.codigo).toBe('IA_RESPOSTA_INVALIDA');
  });
});
