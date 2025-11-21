import { NextResponse } from "next/server";
import { requireAdmin, fetchCostCenterSummary, fetchCostCenterSummaryForPeriod } from "@/lib/supabase/queries-admin";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.isAdmin) return NextResponse.redirect(new URL("/login", req.url));
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const rows = from && to ? await fetchCostCenterSummaryForPeriod(from, to) : await fetchCostCenterSummary();

  const header = ["Centre", "Entrées", "Sorties", "Solde", "Transactions"];
  const lines = [header.join(",")];
  for (const r of rows as any[]) {
    const line = [
      r.name,
      r.total_income,
      r.total_expense,
      r.balance,
      r.txn_count,
    ];
    lines.push(line.join(","));
  }
  const csv = lines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=cost-centers${from && to ? `-${from}_to_${to}` : ""}.csv`,
    },
  });
}
