"use client";

import { TransactionsFilter } from "@/components/filters/TransactionsFilter";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { TransactionCreateDialog } from "@/components/transactions/TransactionCreateDialog";
import { listTransactions } from "@/lib/supabase/queries";
import type { TransactionsFilterValue } from "@/components/filters/TransactionsFilter";
import type { Transaction } from "@/lib/types";

export default function Page() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TransactionsFilterValue>({ type: "all" });

  async function refresh() {
    setLoading(true);
    const { data } = await listTransactions({
      type: (filters.type as any) ?? "all",
      from: filters.from,
      to: filters.to,
      categoryId: filters.categoryId,
      costCenterId: filters.costCenterId,
      q: filters.q,
    });
    setRows((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 text-sm rounded-md bg-[--primary] text-[--primary-foreground]" onClick={() => setOpen(true)}>Nouvelle transaction</button>
          <a className="px-3 py-2 text-sm rounded-md bg-[--accent] text-[--accent-foreground]" href="#">Importer CSV</a>
        </div>
      </header>
      <Card>
        <CardContent className="pt-6">
          <TransactionsFilter value={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Catégorie</th>
              <th className="px-3 py-2 text-left">Centre de coûts</th>
              <th className="px-3 py-2 text-right">Montant</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2">{new Date(r.t_date).toLocaleDateString()}</td>
                <td className="px-3 py-2">{r.t_type === "income" ? "Entrée" : "Sortie"}</td>
                <td className="px-3 py-2">{r.categories?.name ?? "—"}</td>
                <td className="px-3 py-2">{r.cost_centers?.name ?? "—"}</td>
                <td className="px-3 py-2 text-right">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", currencyDisplay: "code" }).format(r.amount)}</td>
                <td className="px-3 py-2 text-center">
                  <a className="text-[--primary]" href="#">Voir</a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-4" colSpan={6}>{loading ? "Chargement..." : "Aucune transaction"}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TransactionCreateDialog open={open} onOpenChange={setOpen} onCreated={refresh} />
    </div>
  );
}
