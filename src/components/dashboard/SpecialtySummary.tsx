"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listSpecialtyTotalsForPeriod } from "@/lib/supabase/queries";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SpecialtySummary({ from, to }: { from: string; to: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await listSpecialtyTotalsForPeriod(from, to);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [from, to]);

  const formatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", currencyDisplay: "code" });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-[--border]">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Spécialités (Top solde)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.slice(0, 8).map((r) => ({ name: `${r.center} · ${r.name}`, solde: r.balance }))} margin={{ left: 6, right: 6, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="fill-muted-foreground" tick={{ fontSize: 10 }} />
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
          <CardTitle className="text-sm text-muted-foreground">Tableau par spécialité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left">Centre · Spécialité</th>
                  <th className="px-3 py-2 text-right">Entrées</th>
                  <th className="px-3 py-2 text-right">Sorties</th>
                  <th className="px-3 py-2 text-right">Solde</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={`${r.center}-${r.name}-${idx}`}>
                    <td className="px-3 py-2">{r.center} · {r.name}</td>
                    <td className="px-3 py-2 text-right">{formatter.format(Number(r.income) || 0)}</td>
                    <td className="px-3 py-2 text-right">{formatter.format(Number(r.expense) || 0)}</td>
                    <td className="px-3 py-2 text-right">{formatter.format(Number(r.balance) || 0)}</td>
                  </tr>
                ))}
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
