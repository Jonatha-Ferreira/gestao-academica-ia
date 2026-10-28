import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { criarAppDeTeste } from '../helpers/app';

const app = criarAppDeTeste();

describe('GET /api/alunos', () => {
  it('lista todos os alunos com a situação financeira calculada', async () => {
    const resposta = await request(app).get('/api/alunos');

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(5);

    const porMatricula = Object.fromEntries(
      resposta.body.dados.map((a: { matricula: string; situacaoFinanceira: string }) => [
        a.matricula,
        a.situacaoFinanceira,
      ]),
    );

    expect(porMatricula['202601']).toBe('inadimplente');
    expect(porMatricula['202602']).toBe('adimplente');
    expect(porMatricula['202603']).toBe('adimplente');
    expect(porMatricula['202604']).toBe('inadimplente');
  });

  it('filtra por nome (parcial, sem diferenciar acentos/maiúsculas)', async () => {
    const resposta = await request(app).get('/api/alunos').query({ busca: 'maria' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(1);
    expect(resposta.body.dados[0].matricula).toBe('202602');
  });

  it('filtra por matrícula', async () => {
    const resposta = await request(app).get('/api/alunos').query({ busca: '202604' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(1);
    expect(resposta.body.dados[0].nome).toBe('Ana Beatriz');
  });

  it('retorna lista vazia quando nada corresponde', async () => {
    const resposta = await request(app).get('/api/alunos').query({ busca: 'inexistente-xyz' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(0);
    expect(resposta.body.dados).toEqual([]);
  });
});

describe('GET /api/alunos/:id', () => {
  it('retorna o detalhe do aluno com o financeiro', async () => {
    const resposta = await request(app).get('/api/alunos/1');

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.nome).toBe('João da Silva');
    expect(resposta.body.dados.situacaoFinanceira).toBe('inadimplente');
    expect(resposta.body.dados.financeiro.situacao).toBe('inadimplente');
  });

  it('retorna 404 para aluno inexistente', async () => {
    const resposta = await request(app).get('/api/alunos/999');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro.codigo).toBe('NAO_ENCONTRADO');
  });
});

describe('GET /api/alunos/:id/financeiro', () => {
  it('retorna o resumo financeiro correto do aluno inadimplente', async () => {
    const resposta = await request(app).get('/api/alunos/1/financeiro');

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.situacao).toBe('inadimplente');
    expect(resposta.body.dados.parcelasEmAtraso).toBe(1);
    expect(resposta.body.dados.valorEmAtrasoEmCentavos).toBe(50000);
  });

  it('retorna 404 para aluno inexistente', async () => {
    const resposta = await request(app).get('/api/alunos/999/financeiro');

    expect(resposta.status).toBe(404);
  });
});

describe('rota inexistente', () => {
  it('retorna 404 padronizado', async () => {
    const resposta = await request(app).get('/api/nao-existe');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro.codigo).toBe('ROTA_NAO_ENCONTRADA');
  });
});
