import { createClient } from "./server";

export async function requireAdmin() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { isAdmin: false } as const;
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return { isAdmin: data?.role === "admin" } as const;
}

export async function fetchSpecialtySummaryForPeriod(from: string, to: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("amount,t_type,specialty_id,specialties(name),cost_centers(name)")
    .gte("t_date", from)
    .lte("t_date", to);
  if (error) throw error;
  const map = new Map<string, { center: string; specialty: string; income: number; expense: number; balance: number; txn_count: number }>();
  for (const r of (data as any[]) ?? []) {
    const center = r.cost_centers?.name ?? "Sans centre";
    const spec = r.specialties?.name ?? "Sans spécialité";
    const key = `${center}::${spec}`;
    const cur = map.get(key) || { center, specialty: spec, income: 0, expense: 0, balance: 0, txn_count: 0 };
    const amt = Number(r.amount || 0);
    if (r.t_type === "income") {
      cur.income += amt;
      cur.balance += amt;
    } else {
      cur.expense += amt;
      cur.balance -= amt;
    }
    cur.txn_count += 1;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.center.localeCompare(b.center) || a.specialty.localeCompare(b.specialty));
}

export async function fetchTransactionsForExport(params?: { month?: string; from?: string; to?: string }) {
  const supabase = createClient();
  let q = supabase
    .from("transactions")
    .select(
      "t_date,t_type,amount,payment_method,notes,categories(name),cost_centers(name),specialties(name)"
    )
    .order("t_date", { ascending: true });
  if (params?.from && params?.to) {
    q = q.gte("t_date", params.from).lte("t_date", params.to);
  } else if (params?.month) {
    q = q.gte("t_date", params.month + "-01").lte("t_date", params.month + "-31");
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchCostCenterSummary() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_cost_center_summary")
    .select("name,total_income,total_expense,balance,txn_count")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCostCenterSummaryForPeriod(from: string, to: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("amount,t_type,cost_center_id,cost_centers(name)")
    .gte("t_date", from)
    .lte("t_date", to);
  if (error) throw error;
  const map = new Map<string, { name: string; total_income: number; total_expense: number; balance: number; txn_count: number }>();
  for (const r of (data as any[]) ?? []) {
    const key = r.cost_centers?.name ?? "Sans centre";
    const cur = map.get(key) || { name: key, total_income: 0, total_expense: 0, balance: 0, txn_count: 0 };
    const amt = Number(r.amount || 0);
    if (r.t_type === "income") {
      cur.total_income += amt;
      cur.balance += amt;
    } else {
      cur.total_expense += amt;
      cur.balance -= amt;
    }
    cur.txn_count += 1;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
