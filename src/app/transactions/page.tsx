"use client";

import { TransactionsFilter } from "@/components/filters/TransactionsFilter";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { TransactionCreateDialog } from "@/components/transactions/TransactionCreateDialog";
import { listTransactions } from "@/lib/supabase/queries";
import type { TransactionsFilterValue } from "@/components/filters/TransactionsFilter";
import type { Transaction } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Page() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TransactionsFilterValue>({ type: "all" });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);

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
          <button className="px-3 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]" onClick={() => setOpen(true)}>Nouvelle transaction</button>
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
                  <button
                    className="text-[var(--primary)] hover:underline"
                    onClick={() => {
                      setDetail(r);
                      setDetailOpen(true);
                    }}
                  >
                    Voir
                  </button>
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail de la transaction</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Date</div>
                <div>{new Date(detail.t_date).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Type</div>
                <div>{detail.t_type === "income" ? "Entrée" : "Sortie"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Montant</div>
                <div>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", currencyDisplay: "code" }).format(Number(detail.amount))}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Catégorie</div>
                <div>{detail.categories?.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Centre de coûts</div>
                <div>{detail.cost_centers?.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Spécialité</div>
                <div>{detail.specialties?.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Mode de paiement</div>
                <div>{detail.payment_method ?? "—"}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-muted-foreground text-xs">Notes</div>
                <div className="whitespace-pre-wrap break-words">{detail.notes ?? "—"}</div>
              </div>
              {(() => {
                const m = typeof detail.notes === "string" ? detail.notes.match(/Justificatif:\s*(\S+)/) : null;
                const url = m?.[1];
                if (!url) return null;
                const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
                const isPdf = /\.pdf$/i.test(url);
                return (
                  <div className="md:col-span-2 space-y-2">
                    <div className="text-muted-foreground text-xs">Pièce jointe</div>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">Ouvrir la pièce jointe</a>
                    <div className="mt-2">
                      {isImage && <img src={url} alt="Justificatif" className="max-h-80 rounded border" />}
                      {isPdf && (
                        <iframe src={url} className="w-full h-80 border rounded" />
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
