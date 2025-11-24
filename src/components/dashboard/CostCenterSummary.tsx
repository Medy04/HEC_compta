"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCostCenterSummary, listCostCenterTotalsForPeriod } from "@/lib/supabase/queries";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function CostCenterSummary({ from, to }: { from?: string; to?: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [top, setTop] = useState<any | null>(null);
  const [bottom, setBottom] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let data: any[] | null = null;
      if (from && to) {
        data = await listCostCenterTotalsForPeriod(from, to);
      } else {
        const res = await listCostCenterSummary();
        data = (res.data as any) ?? [];
      }
      setRows(data ?? []);
      if (data && data.length > 0) {
        const sorted = [...data].sort((a: any, b: any) => (b.balance || 0) - (a.balance || 0));
        setTop(sorted[0]);
        setBottom(sorted[sorted.length - 1]);
      } else {
        setTop(null);
        setBottom(null);
      }
      setLoading(false);
    })();
  }, [from, to]);

  const chartData = rows.slice(0, 6).map((r) => ({ name: r.name, solde: r.balance }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(top || bottom) && (
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border p-3 bg-emerald-50 border-emerald-200 text-emerald-700">
            <div className="text-xs opacity-80">Meilleur centre (période)</div>
            <div className="text-sm font-semibold">{top?.name ?? "—"} — {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", currencyDisplay: "code" }).format(top?.balance || 0)}</div>
          </div>
          <div className="rounded-md border p-3 bg-red-50 border-red-200 text-red-700">
            <div className="text-xs opacity-80">Moins bon centre (période)</div>
            <div className="text-sm font-semibold">{bottom?.name ?? "—"} — {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", currencyDisplay: "code" }).format(bottom?.balance || 0)}</div>
          </div>
        </div>
      )}
      <Card className="border-[--border]">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Top centres (solde)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 6, right: 6, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="fill-muted-foreground" tick={{ fontSize: 12 }} />
                <YAxis className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="solde" fill="var(--primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[--border]">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Synthèse par centre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left">Centre</th>
                  <th className="px-3 py-2 text-right">Entrées</th>
                  <th className="px-3 py-2 text-right">Sorties</th>
                  <th className="px-3 py-2 text-right">Solde</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const income = Number(r.total_income ?? r.income ?? 0);
                  const expense = Number(r.total_expense ?? r.expense ?? 0);
                  const balance = Number.isFinite(r.balance) ? Number(r.balance) : Number(income - expense);
                  return (
                    <tr key={r.id ?? r.name}>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2 text-right">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", currencyDisplay: "code" }).format(Number(income) || 0)}</td>
                      <td className="px-3 py-2 text-right">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", currencyDisplay: "code" }).format(Number(expense) || 0)}</td>
                      <td className="px-3 py-2 text-right">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", currencyDisplay: "code" }).format(Number(balance) || 0)}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td className="px-3 py-4" colSpan={4}>{loading ? "Chargement..." : "Aucune donnée"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
