import { Pool } from '@neondatabase/serverless';

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('DATABASE_URL not set, using placeholder');
    return 'postgresql://placeholder:placeholder@placeholder/placeholder';
  }
  return url;
};

let poolInstance: Pool | null = null;

const getPool = () => {
  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: getDatabaseUrl() });
  }
  return poolInstance;
};

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const start = Date.now();
  try {
    const pool = getPool();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (duration > 1000) {
      console.warn(`⚠ Slow query (${duration}ms):`, text);
    }

    return result.rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

export async function transaction<T>(
  callback: (client: {
    query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
  }) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback({
      query: async (text: string, params?: any[]) => {
        const res = await client.query(text, params);
        return { rows: res.rows };
      }
    });
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export { getPool as getDb };
