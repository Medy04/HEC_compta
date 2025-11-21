import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/queries-admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supa = createAdminClient();
  // fetch auth users (limited fields) and join profiles
  const { data: users, error: ue } = await supa.auth.admin.listUsers();
  if (ue) return NextResponse.json({ error: ue.message }, { status: 500 });
  // fetch profiles
  const { data: profiles, error: pe } = await supa.from("profiles").select("id,role,full_name");
  if (pe) return NextResponse.json({ error: pe.message }, { status: 500 });
  const map = new Map<string, any>();
  for (const p of profiles ?? []) map.set(p.id, p);
  const items = (users?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    role: map.get(u.id)?.role ?? null,
    full_name: map.get(u.id)?.full_name ?? null,
  }));
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { email, password, role } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  const supa = createAdminClient();
  // invite or create user with password if provided
  let userId: string | null = null;
  if (password) {
    const { data, error } = await supa.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    userId = data.user?.id ?? null;
  } else {
    const { data, error } = await supa.auth.admin.inviteUserByEmail(email);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    userId = data.user?.id ?? null;
  }
  if (userId && role) {
    const { error } = await supa.from("profiles").upsert({ id: userId, role }, { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { email, role } = await req.json().catch(() => ({}));
  if (!email || !role) return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  const supa = createAdminClient();
  const { data: users, error: ue } = await supa.auth.admin.listUsers();
  if (ue) return NextResponse.json({ error: ue.message }, { status: 500 });
  const user = (users?.users ?? []).find((u) => u.email === email);
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });
  const { error } = await supa.from("profiles").upsert({ id: user.id, role }, { onConflict: "id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
