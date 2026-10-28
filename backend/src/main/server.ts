import 'dotenv/config';
import { buildContainer } from './container';
import { createApp } from '../presentation/app';

async function main(): Promise<void> {
  const porta = Number(process.env.PORT ?? 3333);
  const container = buildContainer();
  const app = createApp(container.dependencias, { corsOrigin: process.env.CORS_ORIGIN });

  app.listen(porta, () => {
    console.log(`[api] Gestão acadêmica ouvindo em http://localhost:${porta}`);
  });

  const status = await container.gerenciadorIa.status();
  const detalhe = status.modelo ? ` modelo=${status.modelo}` : '';
  console.log(`[ia]  modo=${status.modo} provedor=${status.provedor}${detalhe}`);
  if (status.modo === 'demonstrativo') {
    console.log('[ia]  Nenhuma integração configurada: usando respostas locais (modo demonstrativo).');
    console.log('[ia]  Integre uma LLM real pelo painel "Integrar IA" na interface.');
  }
}

void main();
