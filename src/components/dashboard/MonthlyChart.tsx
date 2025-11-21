"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { listMonthlySummary, listMonthlySummaryRange } from "@/lib/supabase/queries";

export function MonthlyChart({ from, to, mode }: { from: string; to: string; mode: "month" | "year" }) {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (mode === "month") {
        // Build 6-month window ending at selected month
        const end = new Date(from);
        const start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
        const fromStr = start.toISOString().slice(0, 10);
        const toStr = new Date(end.getFullYear(), end.getMonth() + 1, 0).toISOString().slice(0, 10);
        const { data } = await listMonthlySummaryRange(fromStr, toStr);
        const series = (data as any[] | null) ?? [];
        const ordered = [...series].map((r) => {
          const d = new Date(r.month);
          const label = d.toLocaleDateString("fr-FR", { month: "short" });
          return { month: label, income: Number(r.total_income || 0), expense: Number(r.total_expense || 0) };
        });
        setRows(ordered);
      } else {
        // Year mode: use full range provided
        const { data } = await listMonthlySummaryRange(from, to);
        const series = (data as any[] | null) ?? [];
        const ordered = [...series].map((r) => {
          const d = new Date(r.month);
          const label = d.toLocaleDateString("fr-FR", { month: "short" });
          return { month: label, income: Number(r.total_income || 0), expense: Number(r.total_expense || 0) };
        });
        setRows(ordered);
      }
    })();
  }, [from, to, mode]);

  return (
    <Card className="border-[--border]">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Entrées vs Sorties (6 derniers mois)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ left: 6, right: 6, top: 10 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34c759" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#34c759" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e31d1c" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#e31d1c" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="fill-muted-foreground" />
              <YAxis className="fill-muted-foreground" />
              <Tooltip />
              <Area type="monotone" dataKey="income" stroke="#34c759" fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" stroke="#e31d1c" fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
