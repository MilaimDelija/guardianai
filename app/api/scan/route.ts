import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("No DATABASE_URL");
  return neon(url);
}

// Initialize DB table if not exists
async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS scan_logs (
      id SERIAL PRIMARY KEY,
      scan_type TEXT NOT NULL,
      input_preview TEXT,
      is_safe BOOLEAN NOT NULL,
      threat_level TEXT,
      threats JSONB,
      scan_duration_ms NUMERIC,
      api_key_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function POST(req: NextRequest) {
  let body: { scan_type: string; input_preview: string; is_safe: boolean; threat_level: string; threats: unknown[]; scan_duration_ms: number };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  try {
    await ensureTable();
    const sql = getDb();
    await sql`
      INSERT INTO scan_logs (scan_type, input_preview, is_safe, threat_level, threats, scan_duration_ms)
      VALUES (${body.scan_type}, ${body.input_preview}, ${body.is_safe}, ${body.threat_level}, ${JSON.stringify(body.threats)}, ${body.scan_duration_ms})
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[GuardianAI Scan Log]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    await ensureTable();
    const sql = getDb();
    const rows = await sql`
      SELECT scan_type, is_safe, threat_level, threats, scan_duration_ms, created_at
      FROM scan_logs ORDER BY created_at DESC LIMIT 50
    `;
    const stats = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_safe = false) as threats_found,
        COUNT(*) FILTER (WHERE is_safe = true) as safe_count
      FROM scan_logs
    `;
    return NextResponse.json({ logs: rows, stats: stats[0] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
