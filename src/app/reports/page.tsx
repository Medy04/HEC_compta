"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCurrentRole } from "@/lib/supabase/queries";

export default function Page() {
  const [role, setRole] = useState<string>("viewer");
  const [month, setMonth] = useState<string>("");

  useEffect(() => {
    getCurrentRole().then(setRole as any).catch(() => setRole("viewer"));
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    setMonth(`${now.getFullYear()}-${m}`);
  }, []);

  const isAdmin = role === "admin";

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
              <Button asChild className="bg-[--primary] text-[--primary-foreground]" disabled={!isAdmin}>
                <a href={`/api/export/transactions/csv${month ? `?month=${month}` : ""}`} target="_blank" rel="noopener noreferrer">Exporter bilan CSV</a>
              </Button>
              <Button asChild className="bg-[--accent] text-[--accent-foreground]" disabled={!isAdmin}>
                <a href={`/api/export/transactions/pdf${month ? `?month=${month}` : ""}`} target="_blank" rel="noopener noreferrer">Exporter bilan PDF</a>
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <Button asChild className="bg-[--primary] text-[--primary-foreground]" disabled={!isAdmin}>
                <a href={`/api/export/cost-centers/csv`} target="_blank" rel="noopener noreferrer">Exporter bilan Centres CSV</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
