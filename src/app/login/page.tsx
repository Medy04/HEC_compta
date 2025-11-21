"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/ToastProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      notify({ variant: "destructive", title: "Connexion échouée", description: error.message });
      return;
    }
    notify({ variant: "success", title: "Bienvenue", description: email });
    router.replace("/");
  }

  return (
    <div className="min-h-svh w-full flex items-center justify-center bg-gradient-to-b from-[#f8fafc] to-[#eef2ff]">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-md">
        <div className="flex flex-col items-center gap-3 mb-4">
          <Image src="/branding/logo-hec-abidjan.png" width={72} height={72} alt="HEC Abidjan" />
          <h1 className="text-xl font-semibold text-center">Connexion</h1>
          <p className="text-xs text-muted-foreground text-center">Veuillez saisir vos identifiants</p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-xs mb-1">Email utilisateur</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex: user@hec-ci.edu" required />
          </div>
          <div>
            <label className="block text-xs mb-1">Mot de passe</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[--primary] text-[--primary-foreground]">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
