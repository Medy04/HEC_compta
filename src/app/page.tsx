"use client";

import { useEffect, useMemo, useState } from "react";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { CostCenterSummary } from "@/components/dashboard/CostCenterSummary";
import { SpecialtySummary } from "@/components/dashboard/SpecialtySummary";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [mode, setMode] = useState<"month" | "year">("month");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    setMonth(`${now.getFullYear()}-${m}`);
    setYear(String(now.getFullYear()));
  }, []);

  const { from, to } = useMemo(() => {
    if (mode === "year" && year) {
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    }
    if (mode === "month" && month) {
      const d = new Date(`${month}-01T00:00:00`);
      const from = `${month}-01`;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const to = `${month}-${String(lastDay).padStart(2, "0")}`;
      return { from, to };
    }
    const now = new Date();
    const f = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const t = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
    return { from: f, to: t };
  }, [mode, month, year]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <div className="flex items-center gap-3">
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Période" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Par mois</SelectItem>
              <SelectItem value="year">Par année</SelectItem>
            </SelectContent>
          </Select>
          {mode === "month" ? (
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[160px]" />
          ) : (
            <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-[120px]" />
          )}
        </div>
      </header>
      <KpiCards from={from} to={to} mode={mode} />
      <MonthlyChart from={from} to={to} mode={mode} />
      <CostCenterSummary from={from} to={to} />
      <SpecialtySummary from={from} to={to} />
    </div>
  );
}
