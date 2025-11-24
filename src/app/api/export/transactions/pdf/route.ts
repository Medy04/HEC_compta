import { NextResponse } from "next/server";
import { requireAdmin, fetchTransactionsForExport } from "@/lib/supabase/queries-admin";
import PDFDocument from "pdfkit";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.isAdmin) return NextResponse.redirect(new URL("/login", req.url));
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? undefined;
  const rows = await fetchTransactionsForExport({ month });

  const doc = new PDFDocument({ margin: 36, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (c: any) => chunks.push(c as Buffer));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const title = "Bilan comptable HEC Abidjan" + (month ? ` — ${month}` : "");
  const logoPath = path.join(process.cwd(), "public", "branding", "logo-hec-abidjan.png");
  try {
    doc.image(logoPath, 36, 24, { width: 40 });
  } catch {}
  doc.fontSize(18).text(title, 0, 28, { align: "center" });
  doc.moveDown(2);

  // Table header
  doc.fontSize(10).text("Date", 36, doc.y, { continued: true, width: 60 });
  doc.text("Type", { continued: true, width: 45 });
  doc.text("Montant", { continued: true, width: 70 });
  doc.text("Mode", { continued: true, width: 65 });
  doc.text("Catégorie", { continued: true, width: 110 });
  doc.text("Centre", { continued: true, width: 110 });
  doc.text("Spécialité", { width: 110 });
  doc.moveTo(36, doc.y).lineTo(559, doc.y).stroke();

  for (const r of rows as any[]) {
    const yBefore = doc.y;
    doc.text(r.t_date, 36, yBefore, { continued: true, width: 60 });
    doc.text(r.t_type === "income" ? "Entrée" : "Sortie", { continued: true, width: 45 });
    doc.text(String(r.amount), { continued: true, width: 70 });
    doc.text(r.payment_method ?? "", { continued: true, width: 65 });
    doc.text((r as any).categories?.name ?? "", { continued: true, width: 110 });
    doc.text((r as any).cost_centers?.name ?? "", { continued: true, width: 110 });
    doc.text((r as any).specialties?.name ?? "", { width: 110 });
    if (doc.y > 760) doc.addPage();
  }

  doc.end();
  const pdf = await done;
  const body = new Uint8Array(pdf);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=transactions${month ? "-" + month : ""}.pdf`,
    },
  });
}
