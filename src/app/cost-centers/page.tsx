"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createCostCenter, listCostCenters, listCostCenterSummary, listSpecialtiesByCostCenter, createSpecialty, deleteSpecialty, deleteCostCenter, getCurrentRole } from "@/lib/supabase/queries";
import { useToast } from "@/components/ui/ToastProvider";

type Row = { id: string; name: string; code: string | null; created_at: string };
type SumRow = { id: string; name: string; total_income: number; total_expense: number; balance: number; txn_count: number };

export default function Page() {
  const { notify } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [centers, setCenters] = useState<Array<{ id: string; name: string; code: string | null }>>([]);
  const [summary, setSummary] = useState<SumRow[]>([]);
  const [role, setRole] = useState<"admin" | "user" | "viewer" | "accountant">("viewer");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [selCenter, setSelCenter] = useState<string>("");
  const [specs, setSpecs] = useState<Array<{ id: string; name: string }>>([]);
  const [newSpec, setNewSpec] = useState<string>("");

  async function refresh() {
    setLoading(true);
    const [{ data, error }, { data: sdata }] = await Promise.all([
      listCostCenters(),
      listCostCenterSummary(),
    ]);
    if (!error && data) setRows(data as any);
    setSummary((sdata as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const { data } = await listCostCenters();
      setCenters((data as any) ?? []);
    })();
  }, []);

  useEffect(() => {
    getCurrentRole().then(setRole).catch(() => setRole("viewer"));
  }, []);

  useEffect(() => {
    if (!selCenter) {
      setSpecs([]);
      return;
    }
    listSpecialtiesByCostCenter(selCenter).then((res) => setSpecs((res.data as any) ?? []));
  }, [selCenter]);

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate() {
    if (!name.trim()) return;
    const { error } = await createCostCenter({ name, code: code || undefined });
    if (!error) {
      setName("");
      setCode("");
      notify({ variant: "success", title: "Centre de coûts ajouté", description: name });
      refresh();
    } else {
      notify({ variant: "destructive", title: "Erreur", description: error.message });
    }
  }

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Centres de coûts</h1>
      </header>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-3">
              <label className="block text-xs mb-1">Nom</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Campus Principal" />
            </div>
            <div>
              <label className="block text-xs mb-1">Code</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ex: CP" />
            </div>
            <div className="flex items-end">
              <Button onClick={onCreate} className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]">Ajouter</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-3">Synthèse par centre de coûts</h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left">Centre</th>
                  <th className="px-3 py-2 text-right">Entrées</th>
                  <th className="px-3 py-2 text-right">Sorties</th>
                  <th className="px-3 py-2 text-right">Solde</th>
                  <th className="px-3 py-2 text-right">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2 text-right">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", currencyDisplay: "code" }).format(s.total_income)}</td>
                    <td className="px-3 py-2 text-right">{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", currencyDisplay: "code" }).format(s.total_expense)}</td>
                    <td className="px-3 py-2 text-right font-medium {s.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}">
                      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", currencyDisplay: "code" }).format(s.balance)}
                    </td>
                    <td className="px-3 py-2 text-right">{s.txn_count}</td>
                  </tr>
                ))}
                {summary.length === 0 && (
                  <tr>
                    <td className="px-3 py-4" colSpan={5}>{loading ? "Chargement..." : "Aucune donnée"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Nom</th>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Créé le</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.code ?? "—"}</td>
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-right">
                  {role === "admin" && (
                    <button
                      className="px-3 py-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                      onClick={async () => {
                        if (!confirm(`Supprimer le centre de coûts "${r.name}" ?`)) return;
                        const { error } = await deleteCostCenter(r.id);
                        if (!error) {
                          refresh();
                        } else {
                          alert(error.message);
                        }
                      }}
                    >
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-4" colSpan={4}>{loading ? "Chargement..." : "Aucun centre de coûts"}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Card className="border-[--border]">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Gérer les spécialités</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="block text-xs mb-1">Centre</label>
              <select className="w-full border rounded px-2 py-2" value={selCenter} onChange={(e) => setSelCenter(e.target.value)}>
                <option value="">— Sélectionner —</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs mb-1">Nouvelle spécialité</label>
              <input className="w-full border rounded px-2 py-2" value={newSpec} onChange={(e) => setNewSpec(e.target.value)} placeholder="ex: Finances & Comptabilité" />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                onClick={async () => {
                  if (!selCenter || !newSpec.trim()) return;
                  const { error } = await createSpecialty({ name: newSpec.trim(), cost_center_id: selCenter });
                  if (!error) {
                    setNewSpec("");
                    listSpecialtiesByCostCenter(selCenter).then((res) => setSpecs((res.data as any) ?? []));
                  }
                }}
                className="px-3 py-2 rounded bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]"
              >
                Ajouter
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-3 py-2 text-left">Spécialité</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        className="px-3 py-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                        onClick={async () => {
                          if (!confirm(`Supprimer la spécialité "${s.name}" ?`)) return;
                          const { error } = await deleteSpecialty(s.id);
                          if (!error) {
                            listSpecialtiesByCostCenter(selCenter).then((res) => setSpecs((res.data as any) ?? []));
                          } else {
                            alert(error.message);
                          }
                        }}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {selCenter && specs.length === 0 && (
                  <tr><td className="px-3 py-3">Aucune spécialité pour ce centre</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
