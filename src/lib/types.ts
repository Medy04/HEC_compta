export type AppRole = "admin" | "accountant" | "viewer" | "user";

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  active: boolean;
  created_at: string;
};

export type CostCenter = {
  id: string;
  name: string;
  code: string | null;
  created_at: string;
};

export type Specialty = {
  id: string;
  name: string;
  cost_center_id: string;
  active: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  t_type: "income" | "expense";
  t_date: string; // ISO date
  amount: number;
  category_id: string | null;
  cost_center_id: string | null;
  specialty_id?: string | null;
  payment_method?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  categories?: { name: string } | null;
  cost_centers?: { name: string } | null;
};
