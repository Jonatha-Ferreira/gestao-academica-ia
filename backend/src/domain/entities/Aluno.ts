import { DomainError } from '../errors/DomainError';
import { Mensalidade, MensalidadeProps } from './Mensalidade';

export type StatusMatricula = 'ativa' | 'trancada' | 'cancelada' | 'formado';

const STATUS_VALIDOS: ReadonlyArray<StatusMatricula> = ['ativa', 'trancada', 'cancelada', 'formado'];

export interface AlunoProps {
  id: string;
  nome: string;
  curso: string;
  matricula: string;
  status: StatusMatricula;
  mensalidades: MensalidadeProps[];
}

/**
 * Raiz de agregado do domínio. O Aluno é composto por suas mensalidades,
 * garantindo que a lista financeira sempre nasça consistente e validada.
 */
export class Aluno {
  private constructor(
    private readonly dados: Omit<AlunoProps, 'mensalidades'>,
    private readonly mensalidades: Mensalidade[],
  ) {}

  static criar(props: AlunoProps): Aluno {
    if (!props.id) {
      throw new DomainError('Aluno precisa de id.');
    }
    if (!props.nome || !props.nome.trim()) {
      throw new DomainError('Aluno precisa de nome.');
    }
    if (!props.matricula || !props.matricula.trim()) {
      throw new DomainError(`Aluno ${props.id} precisa de matrícula.`);
    }
    if (!STATUS_VALIDOS.includes(props.status)) {
      throw new DomainError(`Status de matrícula inválido para ${props.id}: "${props.status}".`);
    }

    const mensalidades = (props.mensalidades ?? []).map((m) => Mensalidade.criar(m));

    return new Aluno(
      {
        id: props.id,
        nome: props.nome.trim(),
        curso: props.curso,
        matricula: props.matricula.trim(),
        status: props.status,
      },
      mensalidades,
    );
  }

  get id(): string {
    return this.dados.id;
  }

  get nome(): string {
    return this.dados.nome;
  }

  get curso(): string {
    return this.dados.curso;
  }

  get matricula(): string {
    return this.dados.matricula;
  }

  get status(): StatusMatricula {
    return this.dados.status;
  }

  /** Cópia defensiva da coleção interna. */
  get listaMensalidades(): Mensalidade[] {
    return [...this.mensalidades];
  }

  toJSON(): AlunoProps {
    return {
      ...this.dados,
      mensalidades: this.mensalidades.map((m) => m.toJSON()),
    };
  }
}
