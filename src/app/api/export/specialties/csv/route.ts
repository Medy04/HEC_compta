import { NextResponse } from "next/server";
import { requireAdmin, fetchSpecialtySummaryForPeriod } from "@/lib/supabase/queries-admin";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "from/to requis" }, { status: 400 });

  const rows = await fetchSpecialtySummaryForPeriod(from, to);
  const header = ["Centre", "Spécialité", "Entrées", "Sorties", "Solde", "Transactions"];
  const lines = [header.join(",")];
  for (const r of rows as any[]) {
    const line = [r.center, r.specialty, r.income, r.expense, r.balance, r.txn_count];
    lines.push(line.join(","));
  }
  const csv = lines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=specialties-${from}_to_${to}.csv`,
    },
  });
}
