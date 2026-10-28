import { Clock } from '../../application/ports/Clock';
import { dataISOHoje } from '../../shared/date';

/** Relógio de produção: usa a data local do servidor. */
export class SystemClock implements Clock {
  hojeISO(): string {
    return dataISOHoje();
  }
}

/** Relógio fixo para testes determinísticos. */
export class FixedClock implements Clock {
  constructor(private readonly data: string) {}

  hojeISO(): string {
    return this.data;
  }
}
