import {
  BASE_URL_PADRAO,
  ConfiguracaoIa,
  normalizarBaseUrl,
  PROMPT_SISTEMA_PADRAO,
  PROVEDORES_IA,
  ProvedorIa,
} from '../../domain/entities/ConfiguracaoIa';
import { ConfiguracaoIaRepository } from '../../domain/repositories/ConfiguracaoIaRepository';
import { CatalogoModelos } from '../ports/CatalogoModelos';
import { LlmProvider } from '../ports/LlmProvider';
import { ResolvedorProvedorIa } from '../ports/ResolvedorProvedorIa';
import {
  ConfiguracaoIaPublicaDTO,
  ModeloIaDTO,
  SalvarConfiguracaoIaDTO,
  StatusIaDTO,
} from '../dtos/ia.dto';
import { ProvedorInvalidoError } from '../errors/AppError';
import { escolherModeloPadrao } from './escolherModeloPadrao';

export interface OpcoesGerenciadorIa {
  repositorio: ConfiguracaoIaRepository;
  catalogo: CatalogoModelos;
  montarProvedor: (configuracao: ConfiguracaoIa) => LlmProvider;
  /** Provedor usado enquanto nenhuma integração real estiver configurada. */
  provedorFallback: LlmProvider;
  senhaAdmin: string;
}

/**
 * Orquestra a integração de IA em tempo de execução: guarda a configuração,
 * valida a chave junto ao provedor, monta o `LlmProvider` efetivo e o entrega
 * aos casos de uso. Também protege as operações com a senha de administração.
 */
export class GerenciadorIa implements ResolvedorProvedorIa {
  private configuracao: ConfiguracaoIa | null = null;
  private provedorDinamico: LlmProvider | null = null;
  private carregado = false;

  constructor(private readonly opcoes: OpcoesGerenciadorIa) {}

  /** Compara a senha informada com a senha de administração configurada. */
  autenticar(senha: string): boolean {
    return typeof senha === 'string' && senha.length > 0 && senha === this.opcoes.senhaAdmin;
  }

  async obterProvedor(): Promise<LlmProvider> {
    await this.garantirCarregado();
    return this.provedorDinamico ?? this.opcoes.provedorFallback;
  }

  async status(): Promise<StatusIaDTO> {
    const provedor = await this.obterProvedor();
    return {
      configurado: this.configuracao !== null,
      modo: provedor.modo,
      provedor: provedor.nome,
      rotulo: this.configuracao?.rotulo ?? null,
      modelo: this.configuracao?.modelo ?? null,
      atualizadoEm: this.configuracao?.atualizadoEm ?? null,
      promptPadrao: PROMPT_SISTEMA_PADRAO,
    };
  }

  async obterConfiguracaoPublica(): Promise<ConfiguracaoIaPublicaDTO | null> {
    await this.garantirCarregado();
    return this.configuracao ? this.configuracao.toPublico() : null;
  }

  async listarModelos(
    provedor: ProvedorIa,
    baseUrl: string,
    apiKey: string,
  ): Promise<ModeloIaDTO[]> {
    if (!PROVEDORES_IA.includes(provedor)) {
      throw new ProvedorInvalidoError(
        `Adaptador "${provedor}" não suportado. Aceitos: ${PROVEDORES_IA.join(', ')}.`,
      );
    }
    return this.opcoes.catalogo.listar(provedor, baseUrl, apiKey);
  }

  async salvar(input: SalvarConfiguracaoIaDTO): Promise<StatusIaDTO> {
    if (!PROVEDORES_IA.includes(input.provedor)) {
      throw new ProvedorInvalidoError(
        `Adaptador "${input.provedor}" não suportado. Aceitos: ${PROVEDORES_IA.join(', ')}.`,
      );
    }

    const apiKey = (input.apiKey ?? '').trim();
    if (!apiKey) {
      throw new ProvedorInvalidoError('Informe a chave de API do provedor.');
    }

    // URL base: a informada ou a padrão do adaptador (OpenAI, DeepSeek, Groq...).
    let baseUrl: string;
    try {
      baseUrl = input.baseUrl?.trim()
        ? normalizarBaseUrl(input.baseUrl)
        : BASE_URL_PADRAO[input.provedor];
    } catch (erro) {
      throw new ProvedorInvalidoError(
        erro instanceof Error ? erro.message : 'URL base inválida.',
      );
    }

    // Valida a chave junto ao provedor — e já obtém a lista real de modelos.
    const modelos = await this.listarModelos(input.provedor, baseUrl, apiKey);

    // Modelo é opcional: sem escolha explícita, usa o padrão "flash" do adaptador,
    // preferindo um modelo que exista de fato na lista devolvida pela API.
    const modeloInformado = input.modelo?.trim();
    const modelo = modeloInformado || escolherModeloPadrao(input.provedor, modelos);

    if (modeloInformado && modelos.length > 0 && !modelos.some((m) => m.id === modelo)) {
      throw new ProvedorInvalidoError(
        `O modelo "${modelo}" não está disponível em ${baseUrl}.`,
      );
    }

    const configuracao = ConfiguracaoIa.criar({ ...input, apiKey, baseUrl, modelo });

    await this.opcoes.repositorio.salvar(configuracao);
    this.configuracao = configuracao;
    this.provedorDinamico = this.opcoes.montarProvedor(configuracao);
    this.carregado = true;

    return this.status();
  }

  async remover(): Promise<StatusIaDTO> {
    await this.opcoes.repositorio.limpar();
    this.configuracao = null;
    this.provedorDinamico = null;
    this.carregado = true;
    return this.status();
  }

  private async garantirCarregado(): Promise<void> {
    if (this.carregado) {
      return;
    }
    this.configuracao = await this.opcoes.repositorio.obter();
    this.provedorDinamico = this.configuracao
      ? this.opcoes.montarProvedor(this.configuracao)
      : null;
    this.carregado = true;
  }
}
