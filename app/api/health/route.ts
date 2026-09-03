import { NextResponse } from 'next/server';
import { pool } from '@/drizzle/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL;
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as connected, NOW() as server_time');
    client.release();
    return NextResponse.json({
      status: 'healthy',
      hasDbUrl,
      db: result.rows[0],
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        hasDbUrl,
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
