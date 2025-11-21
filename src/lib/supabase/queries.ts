import { createClient as createBrowser } from "./client";
import type { Category, CostCenter, Transaction } from "@/lib/types";

// CATEGORIES
export async function listCategories() {
  const supabase = createBrowser();
  return await supabase.from("categories").select("id,name,type,active,created_at").order("name");
}

// MONTHLY SUMMARY (for dashboard)
export async function listMonthlySummary(limit = 6) {
  const supabase = createBrowser();
  return await supabase
    .from("v_monthly_summary")
    .select("month,total_income,total_expense")
    .order("month", { ascending: false })
    .limit(limit);
}

export async function getMonthTotals(yyyyMm: string) {
  const supabase = createBrowser();
  const { data } = await supabase
    .from("v_monthly_summary")
    .select("month,total_income,total_expense")
    .eq("month", `${yyyyMm}-01`) // view stores date at first day of month
    .maybeSingle();
  return data ?? { month: `${yyyyMm}-01`, total_income: 0, total_expense: 0 };
}

export async function listMonthlySummaryRange(from: string, to: string) {
  const supabase = createBrowser();
  return await supabase
    .from("v_monthly_summary")
    .select("month,total_income,total_expense")
    .gte("month", from)
    .lte("month", to)
    .order("month", { ascending: true });
}

export async function getYearTotals(year: number) {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const { data } = await listMonthlySummaryRange(from, to);
  const total_income = (data ?? []).reduce((s: number, r: any) => s + Number(r.total_income || 0), 0);
  const total_expense = (data ?? []).reduce((s: number, r: any) => s + Number(r.total_expense || 0), 0);
  return { total_income, total_expense };
}

export async function createCategory(input: { name: string; type: "income" | "expense" }) {
  const supabase = createBrowser();
  return await supabase.from("categories").insert({ name: input.name, type: input.type });
}

// COST CENTERS
export async function listCostCenters() {
  const supabase = createBrowser();
  return await supabase.from("cost_centers").select("id,name,code,created_at").order("name");
}

export async function createCostCenter(input: { name: string; code?: string }) {
  const supabase = createBrowser();
  return await supabase.from("cost_centers").insert({ name: input.name, code: input.code ?? null });
}

export async function listCostCenterSummary() {
  const supabase = createBrowser();
  return await supabase
    .from("v_cost_center_summary")
    .select("id,name,total_income,total_expense,balance,txn_count")
    .order("name");
}

export async function listCostCenterTotalsForPeriod(from: string, to: string) {
  const supabase = createBrowser();
  // Pull raw transactions joined with center names and aggregate client-side
  const { data } = await supabase
    .from("transactions")
    .select("amount,t_type,cost_center_id,cost_centers(name)")
    .gte("t_date", from)
    .lte("t_date", to);
  const map = new Map<string, { id: string; name: string; income: number; expense: number; balance: number }>();
  for (const r of (data as any[]) ?? []) {
    const id = r.cost_center_id ?? "none";
    const name = r.cost_centers?.name ?? "Sans centre";
    const prev = map.get(id) || { id, name, income: 0, expense: 0, balance: 0 };
    if (r.t_type === "income") {
      prev.income += Number(r.amount || 0);
      prev.balance += Number(r.amount || 0);
    } else {
      prev.expense += Number(r.amount || 0);
      prev.balance -= Number(r.amount || 0);
    }
    map.set(id, prev);
  }
  return Array.from(map.values());
}

// SPECIALTIES
export async function listSpecialties() {
  const supabase = createBrowser();
  return await supabase.from("specialties").select("id,name,active,cost_center_id").order("name");
}

export async function listSpecialtiesByCostCenter(costCenterId: string) {
  const supabase = createBrowser();
  return await supabase
    .from("specialties")
    .select("id,name,active,cost_center_id")
    .eq("cost_center_id", costCenterId)
    .order("name");
}

export async function createSpecialty(input: { name: string; cost_center_id: string }) {
  const supabase = createBrowser();
  return await supabase.from("specialties").insert({ name: input.name, cost_center_id: input.cost_center_id });
}

export async function listSpecialtyTotalsForPeriod(from: string, to: string) {
  const supabase = createBrowser();
  const { data } = await supabase
    .from("transactions")
    .select("amount,t_type,specialty_id,specialties(name,cost_center_id),cost_centers(name)")
    .gte("t_date", from)
    .lte("t_date", to);
  const map = new Map<string, { name: string; center: string; income: number; expense: number; balance: number }>();
  for (const r of (data as any[]) ?? []) {
    const specName = r.specialties?.name ?? "Sans spécialité";
    const centerName = r.cost_centers?.name ?? "Sans centre";
    const key = `${centerName} :: ${specName}`;
    const cur = map.get(key) || { name: specName, center: centerName, income: 0, expense: 0, balance: 0 };
    const amt = Number(r.amount || 0);
    if (r.t_type === "income") {
      cur.income += amt;
      cur.balance += amt;
    } else {
      cur.expense += amt;
      cur.balance -= amt;
    }
    map.set(key, cur);
  }
  return Array.from(map.values());
}

// TRANSACTIONS (basic list; server-side filters can be added later)
export async function listTransactions(params?: {
  type?: "income" | "expense" | "all";
  from?: string;
  to?: string;
  categoryId?: string;
  costCenterId?: string;
  q?: string;
}) {
  const supabase = createBrowser();
  let q = supabase
    .from("transactions")
    .select(
      "id,t_type,t_date,amount,payment_method,notes,created_at,category_id, cost_center_id, categories(name), cost_centers(name)"
    )
    .order("t_date", { ascending: false });

  if (params?.type && params.type !== "all") q = q.eq("t_type", params.type as "income" | "expense");
  if (params?.from) q = q.gte("t_date", params.from);
  if (params?.to) q = q.lte("t_date", params.to);
  if (params?.categoryId) q = q.eq("category_id", params.categoryId);
  if (params?.costCenterId) q = q.eq("cost_center_id", params.costCenterId);
  // simple full text like on notes
  if (params?.q) q = q.ilike("notes", `%${params.q}%`);

  return await q;
}

export async function createTransaction(input: Omit<Transaction, "id" | "created_at">) {
  const supabase = createBrowser();
  const payload: any = {
    t_type: input.t_type,
    t_date: input.t_date,
    amount: input.amount,
    category_id: input.category_id,
    cost_center_id: input.cost_center_id,
    payment_method: input.payment_method ?? null,
    notes: input.notes ?? null,
  };
  const spec = (input as any).specialty_id;
  if (spec) payload.specialty_id = spec; // only include column if provided
  return await supabase.from("transactions").insert(payload);
}

// PROFILE ROLE
export async function getCurrentRole(): Promise<"admin" | "user" | "viewer" | "accountant"> {
  const supabase = createBrowser();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return "viewer";
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return (data?.role as any) ?? "viewer";
}
