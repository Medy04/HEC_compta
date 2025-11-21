"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listCategories, listCostCenters, createTransaction, listSpecialtiesByCostCenter } from "@/lib/supabase/queries";
import { useToast } from "@/components/ui/ToastProvider";

export function TransactionCreateDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  const { notify } = useToast();
  const [type, setType] = useState<"income" | "expense">("income");
  const [date, setDate] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [costCenterId, setCostCenterId] = useState<string>("");
  const [specialtyId, setSpecialtyId] = useState<string>("");
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [cats, setCats] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [centers, setCenters] = useState<Array<{ id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [cats, centers] = await Promise.all([
        listCategories(),
        listCostCenters(),
      ]);
      setCats((cats.data as any) ?? []);
      setCenters((centers.data as any) ?? []);
    })();
  }, []);

  useEffect(() => {
    if (costCenterId) {
      listSpecialtiesByCostCenter(costCenterId).then((res) => {
        setSpecialties((res.data as any) ?? []);
        setSpecialtyId("");
      });
    } else {
      setSpecialties([]);
      setSpecialtyId("");
    }
  }, [costCenterId]);

  useEffect(() => {
    if (!props.open) return;
    setDate(new Date().toISOString().slice(0, 10));
  }, [props.open]);

  async function submit() {
    if (!date || !amount) return;
    setSaving(true);
    const amt = Number(amount);
    const { error } = await createTransaction({
      t_type: type,
      t_date: date,
      amount: Number(amount),
      category_id: categoryId || null,
      cost_center_id: costCenterId || null,
      specialty_id: specialtyId || null,
      payment_method: paymentMethod || null,
      notes: notes || null,
    } as any);
    setSaving(false);
    if (!error) {
      notify({ variant: "success", title: "Transaction ajoutée", description: `${type === "income" ? "Entrée" : "Sortie"} enregistrée` });
      props.onOpenChange(false);
      setAmount("");
      setNotes("");
      props.onCreated?.();
    } else {
      notify({ variant: "destructive", title: "Erreur", description: error.message });
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle transaction</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs mb-1">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Entrée</SelectItem>
                <SelectItem value="expense">Sortie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs mb-1">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs mb-1">Montant</label>
            <Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs mb-1">Catégorie</label>
            <Select value={categoryId ?? "none"} onValueChange={(v) => setCategoryId(v === "none" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {cats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} {c.type === "expense" ? "(Sortie)" : "(Entrée)"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs mb-1">Centre de coût</label>
            <Select value={costCenterId} onValueChange={setCostCenterId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un centre" />
              </SelectTrigger>
              <SelectContent>
                {centers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs mb-1">Spécialité (optionnel)</label>
            <Select value={specialtyId} onValueChange={setSpecialtyId}>
              <SelectTrigger>
                <SelectValue placeholder={costCenterId ? (specialties.length ? "Sélectionner une spécialité" : "Aucune spécialité") : "Choisissez un centre"} />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs mb-1">Mode de paiement</label>
            <Input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Espèces / Virement / Chèque..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs mb-1">Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optionnel)" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>Annuler</Button>
          <Button className="bg-[--primary] text-[--primary-foreground]" disabled={saving} onClick={submit}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
