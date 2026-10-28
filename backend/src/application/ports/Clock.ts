/**
 * Abstração de relógio. A regra financeira depende da "data de hoje", então
 * injetamos o relógio para que os testes sejam determinísticos (nunca dependem
 * da data real da máquina).
 */
export interface Clock {
  hojeISO(): string;
}
