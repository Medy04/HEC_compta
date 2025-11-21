"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentRole } from "@/lib/supabase/queries";
import { useToast } from "@/components/ui/ToastProvider";

type UserRow = { id: string; email: string | null; created_at: string; role: string | null; full_name: string | null };

export default function Page() {
  const { notify } = useToast();
  const [role, setRole] = useState<string>("viewer");
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "viewer">("viewer");

  const isAdmin = role === "admin";

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const json = await res.json();
      setItems(json.items as UserRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    getCurrentRole().then((r) => setRole(r as any)).catch(() => setRole("viewer"));
  }, []);

  useEffect(() => {
    if (isAdmin) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function invite() {
    if (!email) return;
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: password || undefined, role: newRole }),
    });
    if (res.ok) {
      notify({ variant: "success", title: "Utilisateur ajouté", description: email });
      setEmail("");
      setPassword("");
      setNewRole("viewer");
      refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      notify({ variant: "destructive", title: "Erreur", description: j.error || "Action impossible" });
    }
  }

  async function updateRole(targetEmail: string, role: "admin" | "viewer") {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, role }),
    });
    if (res.ok) {
      notify({ variant: "success", title: "Rôle mis à jour", description: `${targetEmail} → ${role}` });
      refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      notify({ variant: "destructive", title: "Erreur", description: j.error || "Action impossible" });
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Utilisateurs</h1>
        <div className="text-sm text-red-600">Accès réservé à l’administrateur.</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Utilisateurs</h1>
      </header>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2">
              <label className="block text-xs mb-1">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex: user@hec-ci.edu" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs mb-1">Mot de passe (optionnel)</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs mb-1">Rôle</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Utilisateur</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={invite} className="bg-[--primary] text-[--primary-foreground] hover:opacity-90">Ajouter un utilisateur</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Nom</th>
              <th className="px-3 py-2 text-left">Rôle</th>
              <th className="px-3 py-2 text-left">Créé le</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.full_name ?? "—"}</td>
                <td className="px-3 py-2">{u.role ?? "—"}</td>
                <td className="px-3 py-2">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-right space-x-2">
                  <Button size="sm" className="bg-[--primary] text-[--primary-foreground]" onClick={() => updateRole(u.email || "", "viewer")}>Utilisateur</Button>
                  <Button size="sm" className="bg-[--accent] text-[--accent-foreground]" onClick={() => updateRole(u.email || "", "admin")}>Admin</Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-3 py-4" colSpan={5}>{loading ? "Chargement..." : "Aucun utilisateur"}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
