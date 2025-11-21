"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listMonthlySummaryRange } from "@/lib/supabase/queries";

function fmt(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", currencyDisplay: "code" }).format(amount || 0);
}

export function KpiCards({ from, to, mode }: { from: string; to: string; mode: "month" | "year" }) {
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [variation, setVariation] = useState(0);

  useEffect(() => {
    (async () => {
      // Current period totals
      const { data: curList } = await listMonthlySummaryRange(from, to);
      const curIncome = (curList ?? []).reduce((s: number, r: any) => s + Number(r.total_income || 0), 0);
      const curExpense = (curList ?? []).reduce((s: number, r: any) => s + Number(r.total_expense || 0), 0);
      setIncome(curIncome);
      setExpense(curExpense);

      // Previous period totals: previous month or previous year
      let prevFrom: string;
      let prevTo: string;
      if (mode === "month") {
        const start = new Date(from);
        const pf = new Date(start.getFullYear(), start.getMonth() - 1, 1);
        const pt = new Date(start.getFullYear(), start.getMonth(), 0);
        prevFrom = pf.toISOString().slice(0, 10);
        prevTo = pt.toISOString().slice(0, 10);
      } else {
        const y = new Date(from).getFullYear() - 1;
        prevFrom = `${y}-01-01`;
        prevTo = `${y}-12-31`;
      }
      const { data: prevList } = await listMonthlySummaryRange(prevFrom, prevTo);
      const prevIncome = (prevList ?? []).reduce((s: number, r: any) => s + Number(r.total_income || 0), 0);
      const prevExpense = (prevList ?? []).reduce((s: number, r: any) => s + Number(r.total_expense || 0), 0);
      const curBal = curIncome - curExpense;
      const prevBal = prevIncome - prevExpense;
      const varPct = prevBal === 0 ? (curBal === 0 ? 0 : 100) : ((curBal - prevBal) / Math.abs(prevBal)) * 100;
      setVariation(varPct);
    })();
  }, [from, to, mode]);

  const kpis = [
    { title: "Entrées (mois)", value: fmt(income) },
    { title: "Sorties (mois)", value: fmt(expense) },
    { title: "Solde (mois)", value: fmt(income - expense) },
    { title: "Variation", value: `${variation.toFixed(1)}%` },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => (
        <Card key={k.title} className="border-[--border]">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{k.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{k.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
