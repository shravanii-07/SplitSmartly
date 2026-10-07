import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ExpenseRow } from "./dsa/settlement-optimizer";

export type Db = SupabaseClient<Database>;

export interface MemberInfo {
  userId: string;
  name: string;
  email: string;
}

export class AppError extends Error {}

/** Throws when the caller is not a member of the group. */
export async function assertMembership(db: Db, groupId: string, userId: string) {
  const { data, error } = await db
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new AppError("Could not verify group access.");
  if (!data) throw new AppError("You don't have access to this group.");
}

export async function loadMembers(db: Db, groupId: string): Promise<MemberInfo[]> {
  const { data, error } = await db
    .from("group_members")
    .select("user_id, joined_at")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });
  if (error) throw new AppError("Could not load group members.");
  const ids = (data ?? []).map((m) => m.user_id);
  if (ids.length === 0) return [];
  const { data: profiles, error: pErr } = await db
    .from("profiles")
    .select("id, name, email")
    .in("id", ids);
  if (pErr) throw new AppError("Could not load member profiles.");
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return ids.map((id) => ({
    userId: id,
    name: byId.get(id)?.name || byId.get(id)?.email || "Member",
    email: byId.get(id)?.email ?? "",
  }));
}

export interface FullExpense extends ExpenseRow {
  title: string;
  category: string;
  expenseDate: string;
  createdAt: string;
  groupId: string;
  receiptPath: string | null;
  receiptUrl: string | null;
}

export async function loadExpenses(db: Db, groupId: string): Promise<FullExpense[]> {
  const { data, error } = await db
    .from("expenses")
    .select("id, group_id, title, amount, paid_by, category, expense_date, created_at, receipt_path")
    .eq("group_id", groupId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new AppError("Could not load expenses.");
  const expenses = data ?? [];
  if (expenses.length === 0) return [];

  const { data: parts, error: partErr } = await db
    .from("expense_participants")
    .select("expense_id, user_id, share_amount")
    .in(
      "expense_id",
      expenses.map((e) => e.id),
    );
  if (partErr) throw new AppError("Could not load expense participants.");

  const grouped = new Map<string, Array<{ userId: string; share: number }>>();
  for (const p of parts ?? []) {
    const list = grouped.get(p.expense_id) ?? [];
    list.push({ userId: p.user_id, share: Number(p.share_amount) });
    grouped.set(p.expense_id, list);
  }

  // Private bucket: mint short-lived signed URLs so members can see thumbnails.
  const receiptPaths = expenses.map((e) => e.receipt_path).filter((p): p is string => Boolean(p));
  const signed = new Map<string, string>();
  if (receiptPaths.length > 0) {
    const { data: urls } = await db.storage.from("receipts").createSignedUrls(receiptPaths, 3600);
    for (const u of urls ?? []) {
      if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
    }
  }

  return expenses.map((e) => ({
    id: e.id,
    groupId: e.group_id,
    title: e.title,
    category: e.category,
    amount: Number(e.amount),
    paidBy: e.paid_by,
    expenseDate: e.expense_date,
    createdAt: e.created_at,
    receiptPath: e.receipt_path ?? null,
    receiptUrl: e.receipt_path ? (signed.get(e.receipt_path) ?? null) : null,
    participants: grouped.get(e.id) ?? [],
  }));
}
