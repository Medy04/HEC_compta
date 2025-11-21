"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type TransactionsFilterValue = {
  type?: "income" | "expense" | "all";
  from?: string;
  to?: string;
  categoryId?: string;
  costCenterId?: string;
  amountMin?: string;
  amountMax?: string;
  q?: string;
};

export function TransactionsFilter(props: {
  value?: TransactionsFilterValue;
  onChange?: (v: TransactionsFilterValue) => void;
}) {
  const [v, setV] = useState<TransactionsFilterValue>({
    type: "all",
    ...props.value,
  });

  function update<K extends keyof TransactionsFilterValue>(key: K, value: TransactionsFilterValue[K]) {
    const next = { ...v, [key]: value };
    setV(next);
    props.onChange?.(next);
  }

  function reset() {
    const next: TransactionsFilterValue = { type: "all" };
    setV(next);
    props.onChange?.(next);
  }

  return (
    <div className="grid gap-3 md:grid-cols-7">
      <div className="md:col-span-1">
        <label className="block text-xs mb-1">Type</label>
        <Select value={v.type} onValueChange={(val) => update("type", val as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="income">Entrées</SelectItem>
            <SelectItem value="expense">Sorties</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-xs mb-1">Du</label>
        <Input type="date" value={v.from ?? ""} onChange={(e) => update("from", e.target.value)} />
      </div>
      <div>
        <label className="block text-xs mb-1">Au</label>
        <Input type="date" value={v.to ?? ""} onChange={(e) => update("to", e.target.value)} />
      </div>
      <div>
        <label className="block text-xs mb-1">Catégorie</label>
        <Select value={v.categoryId ?? "all"} onValueChange={(val) => update("categoryId", val === "all" ? undefined : val)}>
          <SelectTrigger>
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-xs mb-1">Centre de coûts</label>
        <Select value={v.costCenterId ?? "all"} onValueChange={(val) => update("costCenterId", val === "all" ? undefined : val)}>
          <SelectTrigger>
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-xs mb-1">Montant min</label>
        <Input type="number" inputMode="decimal" value={v.amountMin ?? ""} onChange={(e) => update("amountMin", e.target.value)} />
      </div>
      <div>
        <label className="block text-xs mb-1">Montant max</label>
        <Input type="number" inputMode="decimal" value={v.amountMax ?? ""} onChange={(e) => update("amountMax", e.target.value)} />
      </div>
      <div className="md:col-span-5">
        <label className="block text-xs mb-1">Recherche</label>
        <Input placeholder="Texte, note, référence…" value={v.q ?? ""} onChange={(e) => update("q", e.target.value)} />
      </div>
      <div className="md:col-span-2 flex items-end gap-2">
        <Button className="bg-[--primary] text-[--primary-foreground]" onClick={() => props.onChange?.(v)}>Rechercher</Button>
        <Button variant="secondary" onClick={reset}>Réinitialiser</Button>
      </div>
    </div>
  );
}
