"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getCurrentRole } from "@/lib/supabase/queries";

export function AuthButton() {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<null | { email?: string }>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSession({ email: data.user.email ?? undefined });
    });
    getCurrentRole().then((r) => setRole(r)).catch(() => setRole(null));
  }, []);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (!error) {
      setOpen(false);
      // simple refresh to update role/nav
      window.location.reload();
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (session) {
    return (
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-xs opacity-80">{session.email} {role ? `· ${role}` : ""}</span>
        <Button variant="secondary" size="sm" onClick={signOut}>Se déconnecter</Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="ml-auto bg-[--primary] text-[--primary-foreground]" size="sm">Se connecter</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connexion</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs mb-1">Mot de passe</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button disabled={loading} onClick={signIn} className="bg-[--primary] text-[--primary-foreground]">
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
