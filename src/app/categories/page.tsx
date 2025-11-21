"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCategory, listCategories } from "@/lib/supabase/queries";
import { useToast } from "@/components/ui/ToastProvider";

type Row = { id: string; name: string; type: "income" | "expense"; active: boolean; created_at: string };

export default function Page() {
  const { notify } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");

  async function refresh() {
    setLoading(true);
    const { data, error } = await listCategories();
    if (!error && data) setRows(data as any);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate() {
    if (!name.trim()) return;
    const { error } = await createCategory({ name, type });
    if (!error) {
      setName("");
      setType("income");
      notify({ variant: "success", title: "Catégorie ajoutée", description: name });
      refresh();
    } else {
      notify({ variant: "destructive", title: "Erreur", description: error.message });
    }
  }

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Catégories</h1>
      </header>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-3">
              <label className="block text-xs mb-1">Nom</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Scolarités" />
            </div>
            <div>
              <label className="block text-xs mb-1">Type</label>
              <Select value={type} onValueChange={(val) => setType(val as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrée</SelectItem>
                  <SelectItem value="expense">Sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={onCreate} className="bg-[--primary] text-[--primary-foreground] hover:opacity-90">Ajouter</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Nom</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Statut</th>
              <th className="px-3 py-2 text-left">Créée le</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.type === "income" ? "Entrée" : "Sortie"}</td>
                <td className="px-3 py-2">{r.active ? "Active" : "Inactive"}</td>
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-4" colSpan={4}>{loading ? "Chargement..." : "Aucune catégorie"}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
