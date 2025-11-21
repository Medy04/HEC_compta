import { NextResponse } from "next/server";
import { requireAdmin, fetchTransactionsForExport } from "@/lib/supabase/queries-admin";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? undefined;
  const rows = await fetchTransactionsForExport({ month });

  const header = ["Date", "Type", "Montant", "Mode", "Catégorie", "Centre", "Spécialité", "Notes"];
  const lines = [header.join(",")];
  for (const r of rows as any[]) {
    const line = [
      r.t_date,
      r.t_type,
      r.amount,
      r.payment_method ?? "",
      (r as any).categories?.name ?? "",
      (r as any).cost_centers?.name ?? "",
      (r as any).specialties?.name ?? "",
      (r.notes ?? "").replace(/\n|\r|,/g, " "),
    ];
    lines.push(line.join(","));
  }
  const csv = lines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=transactions${month ? "-" + month : ""}.csv`,
    },
  });
}
