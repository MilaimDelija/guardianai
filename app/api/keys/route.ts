import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes } from "crypto";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("No DATABASE_URL");
  return neon(url);
}

function generateApiKey(): string {
  return "gai_live_" + randomBytes(32).toString("hex");
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

async function ensureTables() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS api_keys (
      id SERIAL PRIMARY KEY,
      clerk_user_id TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT 'Default Key',
      plan TEXT NOT NULL DEFAULT 'starter',
      scans_used INTEGER DEFAULT 0,
      scans_limit INTEGER DEFAULT 5000,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_used_at TIMESTAMPTZ
    )
  `;
}

// GET — list user's API keys
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ensureTables();
    const sql = getDb();
    const keys = await sql`
      SELECT id, name, plan, scans_used, scans_limit, is_active, created_at, last_used_at
      FROM api_keys WHERE clerk_user_id = ${userId} ORDER BY created_at DESC
    `;
    return NextResponse.json({ keys });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST — create new API key
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string; plan?: string } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }

  try {
    await ensureTables();
    const sql = getDb();

    // Max 3 keys per user
    const existing = await sql`SELECT COUNT(*) as count FROM api_keys WHERE clerk_user_id = ${userId}`;
    if (Number(existing[0].count) >= 3) {
      return NextResponse.json({ error: "Maximum 3 API keys per account" }, { status: 400 });
    }

    const apiKey = generateApiKey();
    const keyHash = hashKey(apiKey);
    const name = body.name || "Default Key";
    const plan = body.plan || "starter";
    const scansLimit = plan === "pro" ? 25000 : plan === "personal" ? 500 : 5000;

    await sql`
      INSERT INTO api_keys (clerk_user_id, key_hash, name, plan, scans_limit)
      VALUES (${userId}, ${keyHash}, ${name}, ${plan}, ${scansLimit})
    `;

    return NextResponse.json({ api_key: apiKey, name, plan, scans_limit: scansLimit, message: "Save this key — it will not be shown again." });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE — revoke API key
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  try {
    const sql = getDb();
    await sql`UPDATE api_keys SET is_active = FALSE WHERE id = ${id} AND clerk_user_id = ${userId}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
