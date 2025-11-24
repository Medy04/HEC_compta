"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCurrentRole, listTransactions } from "@/lib/supabase/queries";

export default function Page() {
  const [role, setRole] = useState<string>("viewer");
  const [month, setMonth] = useState<string>("");
  const [txns, setTxns] = useState<any[]>([]);

  useEffect(() => {
    getCurrentRole().then(setRole as any).catch(() => setRole("viewer"));
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    setMonth(`${now.getFullYear()}-${m}`);
  }, []);

  const isAdmin = role === "admin";

  useEffect(() => {
    (async () => {
      if (!month) return;
      const d = new Date(month + "-01");
      const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
      const { data } = await listTransactions({ from, to, type: "all" as any });
      setTxns((data as any) ?? []);
    })();
  }, [month]);

  function toCSV(rows: any[][]) {
    return rows
      .map((r) =>
        r
          .map((c) => {
            const v = c == null ? "" : String(c);
            if (/[",\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
            return v;
          })
          .join(",")
      )
      .join("\n");
  }

  function download(filename: string, content: string, type = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportCSVClient() {
    if (!month) return;
    const headers = [["Date", "Type", "Catégorie", "Centre", "Spécialité", "Montant", "Mode_paiement", "Notes"]];
    const rows = txns.map((t) => [
      new Date(t.t_date).toISOString(),
      t.t_type === "income" ? "Entrée" : "Sortie",
      t.categories?.name ?? "",
      t.cost_centers?.name ?? "",
      t.specialties?.name ?? "",
      Number(t.amount || 0).toFixed(2),
      t.payment_method ?? "",
      (t.notes ?? "").replace(/\n/g, " "),
    ]);

    // Global totals
    const totalIncome = txns.reduce((s, t) => s + (t.t_type === "income" ? Number(t.amount || 0) : 0), 0);
    const totalExpense = txns.reduce((s, t) => s + (t.t_type === "expense" ? Number(t.amount || 0) : 0), 0);
    const balance = totalIncome - totalExpense;

    // Group by cost center and specialty
    const byCenter = new Map<string, { income: number; expense: number; specs: Map<string, { income: number; expense: number }> }>();
    for (const t of txns) {
      const c = t.cost_centers?.name ?? "Sans centre";
      const s = t.specialties?.name ?? "Sans spécialité";
      if (!byCenter.has(c)) byCenter.set(c, { income: 0, expense: 0, specs: new Map() });
      const rec = byCenter.get(c)!;
      const amt = Number(t.amount || 0);
      if (t.t_type === "income") rec.income += amt; else rec.expense += amt;
      if (!rec.specs.has(s)) rec.specs.set(s, { income: 0, expense: 0 });
      const sp = rec.specs.get(s)!;
      if (t.t_type === "income") sp.income += amt; else sp.expense += amt;
    }

    const [yyyy, mm] = month.split("-");
    const out: any[][] = [];
    out.push([`Bilan ${mm}/${yyyy}`]);
    out.push(["Total Entrées", totalIncome.toFixed(2)]);
    out.push(["Total Sorties", totalExpense.toFixed(2)]);
    out.push(["Solde", balance.toFixed(2)]);
    out.push([]);
    out.push(["Par centre de coûts"]);
    out.push(["Centre", "Entrées", "Sorties", "Solde"]);
    for (const [center, v] of byCenter.entries()) {
      out.push([center, v.income.toFixed(2), v.expense.toFixed(2), (v.income - v.expense).toFixed(2)]);
      // specialties under center
      out.push(["  Détail spécialités"]);
      out.push(["  Spécialité", "Entrées", "Sorties", "Solde"]);
      for (const [spec, sv] of v.specs.entries()) {
        out.push([`  ${spec}`, sv.income.toFixed(2), sv.expense.toFixed(2), (sv.income - sv.expense).toFixed(2)]);
      }
      out.push([]);
    }
    out.push([]);
    out.push(["Données transactionnelles"]);
    out.push(...headers);
    out.push(...rows);

    download(`bilan_${yyyy}-${mm}.csv`, toCSV(out));
  }

  function exportPDFClient() {
    if (!month) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const [yyyy, mm] = month.split("-");
    const title = `Bilan comptable HEC Abidjan — ${mm}/${yyyy}`;
    const totalIncome = txns.reduce((s, t) => s + (t.t_type === "income" ? Number(t.amount || 0) : 0), 0);
    const totalExpense = txns.reduce((s, t) => s + (t.t_type === "expense" ? Number(t.amount || 0) : 0), 0);
    const balance = totalIncome - totalExpense;

    const byCenter = new Map<string, { income: number; expense: number; specs: Map<string, { income: number; expense: number }> }>();
    for (const t of txns) {
      const c = t.cost_centers?.name ?? "Sans centre";
      const s = t.specialties?.name ?? "Sans spécialité";
      if (!byCenter.has(c)) byCenter.set(c, { income: 0, expense: 0, specs: new Map() });
      const rec = byCenter.get(c)!;
      const amt = Number(t.amount || 0);
      if (t.t_type === "income") rec.income += amt; else rec.expense += amt;
      if (!rec.specs.has(s)) rec.specs.set(s, { income: 0, expense: 0 });
      const sp = rec.specs.get(s)!;
      if (t.t_type === "income") sp.income += amt; else sp.expense += amt;
    }

    const txnRowsHtml = txns
      .map(
        (t) => `<tr>
      <td>${new Date(t.t_date).toLocaleString()}</td>
      <td>${t.t_type === "income" ? "Entrée" : "Sortie"}</td>
      <td>${t.categories?.name ?? ""}</td>
      <td>${t.cost_centers?.name ?? ""}</td>
      <td>${t.specialties?.name ?? ""}</td>
      <td>${Number(t.amount || 0).toFixed(2)}</td>
      <td>${t.payment_method ?? ""}</td>
      <td>${(t.notes ?? "").replace(/\n/g, " ")}</td>
    </tr>`
      )
      .join("");

    const centersHtml = Array.from(byCenter.entries())
      .map(([center, v]) => {
        const specsHtml = Array.from(v.specs.entries())
          .map(
            ([spec, sv]) => `<tr><td>${spec}</td><td>${sv.income.toFixed(2)}</td><td>${sv.expense.toFixed(2)}</td><td>${(sv.income - sv.expense).toFixed(2)}</td></tr>`
          )
          .join("");
        return `
          <h3 style="margin-top:16px;">Centre: ${center}</h3>
          <table><thead><tr><th>Entrées</th><th>Sorties</th><th>Solde</th></tr></thead><tbody>
            <tr><td>${v.income.toFixed(2)}</td><td>${v.expense.toFixed(2)}</td><td>${(v.income - v.expense).toFixed(2)}</td></tr>
          </tbody></table>
          <div style="height:8px"></div>
          <table><thead><tr><th>Spécialité</th><th>Entrées</th><th>Sorties</th><th>Solde</th></tr></thead><tbody>
            ${specsHtml}
          </tbody></table>
        `;
      })
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:16px}
      .header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
      .header img{width:48px;height:48px}
      .header h2{flex:1;text-align:center;margin:0}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #ddd;padding:6px;text-align:left}
      th{background:#f5f5f5}
    </style>
    </head><body>
    <div class="header">
      <img src="/branding/logo-hec-abidjan.png" alt="HEC Abidjan" />
      <h2>${title}</h2>
      <div style="width:48px"></div>
    </div>
    <h3>Totaux globaux</h3>
    <table><thead><tr><th>Total Entrées</th><th>Total Sorties</th><th>Solde</th></tr></thead><tbody>
      <tr><td>${totalIncome.toFixed(2)}</td><td>${totalExpense.toFixed(2)}</td><td>${balance.toFixed(2)}</td></tr>
    </tbody></table>
    ${centersHtml}
    <h3 style="margin-top:20px;">Transactions</h3>
    <table><thead><tr><th>Date</th><th>Type</th><th>Catégorie</th><th>Centre</th><th>Spécialité</th><th>Montant</th><th>Mode paiement</th><th>Notes</th></tr></thead><tbody>
    ${txnRowsHtml}
    </tbody></table></body></html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rapports</h1>
      </header>

      {!isAdmin && (
        <div className="text-sm text-red-600">Accès réservé à l’administrateur.</div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-xs mb-1">Mois</label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={exportCSVClient} className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]" disabled={!isAdmin || !month}>
                Exporter bilan CSV
              </Button>
              <Button onClick={exportPDFClient} className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]" disabled={!isAdmin || !month}>
                Exporter bilan PDF
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <Button asChild className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]" disabled={!isAdmin}>
                <a href={`/api/export/cost-centers/csv`} target="_blank" rel="noopener noreferrer">Exporter bilan Centres CSV</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
