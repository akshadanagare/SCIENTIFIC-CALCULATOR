import { Queryable } from '../interfaces/db.interface';

export class HealthController {
  constructor(private readonly db: Queryable) {}

  check = async () => {
    await this.db.query('SELECT 1');
    return { status: 'ok', time: new Date().toISOString() };
  };
}
