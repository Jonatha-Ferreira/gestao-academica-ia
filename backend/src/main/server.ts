import 'dotenv/config';
import { buildContainer } from './container';
import { createApp } from '../presentation/app';

const porta = Number(process.env.PORT ?? 3333);

const container = buildContainer();
const app = createApp(container.dependencias, { corsOrigin: process.env.CORS_ORIGIN });

app.listen(porta, () => {
  console.log(`[api] Gestão acadêmica ouvindo em http://localhost:${porta}`);
  console.log(`[ia]  Provedor: ${container.llm.nome} (modo ${container.llm.modo})`);
  if (container.llm.modo === 'demonstrativo') {
    console.log('[ia]  Nenhuma chave de API configurada: usando respostas locais (modo demonstrativo).');
  }
});
