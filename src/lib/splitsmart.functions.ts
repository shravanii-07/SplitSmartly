import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertMembership,
  loadExpenses,
  loadMembers,
  AppError,
  type Db,
} from "./splitsmart.server";
import {
  equalSplit,
  runSettlementPipeline,
  type SettlementResult,
} from "./dsa/settlement-optimizer";
import { round2 } from "./dsa/debt-graph";

export type { SettlementResult };

/** Full group snapshot: members, expenses, DSA balances + settlement preview. */
export const getGroupData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ groupId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    await assertMembership(db, data.groupId, context.userId);

    const { data: group, error } = await db
      .from("groups")
      .select("id, name, category, description, created_at, created_by")
      .eq("id", data.groupId)
      .maybeSingle();
    if (error || !group) throw new AppError("Group not found.");

    const [members, expenses] = await Promise.all([
      loadMembers(db, data.groupId),
      loadExpenses(db, data.groupId),
    ]);

    const pipeline = runSettlementPipeline(
      members.map((m) => m.userId),
      expenses,
    );

    const { data: settlements } = await db
      .from("settlements")
      .select("id, from_user, to_user, amount, status, created_at, completed_at")
      .eq("group_id", data.groupId)
      .order("created_at", { ascending: false });

    const totalSpent = round2(expenses.reduce((s, e) => s + e.amount, 0));

    return {
      group,
      members,
      expenses,
      pipeline,
      settlements: (settlements ?? []).map((s) => ({ ...s, amount: Number(s.amount) })),
      stats: {
        totalSpent,
        expenseCount: expenses.length,
        memberCount: members.length,
        averageExpense: expenses.length ? round2(totalSpent / expenses.length) : 0,
        highestExpense: expenses.length ? round2(Math.max(...expenses.map((e) => e.amount))) : 0,
      },
      currentUserId: context.userId,
    };
  });

/** Adds an existing registered user to a group by email. */
export const addGroupMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ groupId: z.string().uuid(), email: z.string().email() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    await assertMembership(db, data.groupId, context.userId);

    const email = data.email.trim().toLowerCase();
    const { data: profile } = await db
      .from("profiles")
      .select("id, name, email")
      .ilike("email", email)
      .maybeSingle();
    if (!profile) throw new AppError("No SplitSmart account found with that email.");

    const { data: existing } = await db
      .from("group_members")
      .select("id")
      .eq("group_id", data.groupId)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (existing) throw new AppError("That person is already in this group.");

    const { error } = await db
      .from("group_members")
      .insert({ group_id: data.groupId, user_id: profile.id });
    if (error) throw new AppError("Could not add the member.");
    return { name: profile.name || profile.email };
  });

/** Creates an expense + its equal-split participants (rolls back on failure). */
export const createExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        groupId: z.string().uuid(),
        title: z.string().trim().min(1).max(120),
        amount: z.number().positive().max(100000000),
        paidBy: z.string().uuid(),
        category: z.string().trim().min(1).max(40),
        expenseDate: z.string().min(8),
        participantIds: z.array(z.string().uuid()).min(1),
        receiptPath: z.string().trim().max(400).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    await assertMembership(db, data.groupId, context.userId);

    const members = await loadMembers(db, data.groupId);
    const memberIds = new Set(members.map((m) => m.userId));
    if (!memberIds.has(data.paidBy)) throw new AppError("The payer must be a group member.");
    const participantIds = [...new Set(data.participantIds)];
    if (participantIds.some((id) => !memberIds.has(id)))
      throw new AppError("Every participant must be a group member.");

    const amount = round2(data.amount);
    if (amount <= 0) throw new AppError("Amount must be greater than zero.");

    const { data: expense, error } = await db
      .from("expenses")
      .insert({
        group_id: data.groupId,
        title: data.title.trim(),
        amount,
        paid_by: data.paidBy,
        category: data.category,
        expense_date: data.expenseDate,
        receipt_path: data.receiptPath || null,
      })
      .select("id")
      .single();
    if (error || !expense) throw new AppError("Could not save the expense.");

    const shares = equalSplit(amount, participantIds);
    const { error: partErr } = await db.from("expense_participants").insert(
      shares.map((s) => ({
        expense_id: expense.id,
        user_id: s.userId,
        share_amount: s.share,
      })),
    );
    if (partErr) {
      // Manual rollback: without participants the expense would be invalid.
      await db.from("expenses").delete().eq("id", expense.id);
      throw new AppError("Could not save the expense shares. Nothing was saved.");
    }

    return { expenseId: expense.id, shares };
  });

export const deleteExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ expenseId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    const { data: existing } = await db
      .from("expenses")
      .select("receipt_path")
      .eq("id", data.expenseId)
      .maybeSingle();
    const { error } = await db.from("expenses").delete().eq("id", data.expenseId);
    if (!error && existing?.receipt_path) {
      await db.storage.from("receipts").remove([existing.receipt_path]);
    }
    if (error) throw new AppError("Could not delete the expense.");
    return { ok: true };
  });

/** Runs the DSA pipeline and persists the optimised transactions. */
export const generateSettlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ groupId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    await assertMembership(db, data.groupId, context.userId);

    const [members, expenses] = await Promise.all([
      loadMembers(db, data.groupId),
      loadExpenses(db, data.groupId),
    ]);
    if (expenses.length === 0) throw new AppError("Add an expense before generating a settlement.");

    const pipeline = runSettlementPipeline(
      members.map((m) => m.userId),
      expenses,
    );
    if (pipeline.transactions.length === 0)
      throw new AppError("Everyone is already settled up — nothing to transfer.");

    // Replace pending plan; completed history is kept.
    await db.from("settlements").delete().eq("group_id", data.groupId).eq("status", "PENDING");

    const { error } = await db.from("settlements").insert(
      pipeline.transactions.map((t) => ({
        group_id: data.groupId,
        from_user: t.from,
        to_user: t.to,
        amount: t.amount,
      })),
    );
    if (error) throw new AppError("Could not save the settlement plan.");

    return {
      created: pipeline.transactions.length,
      rawTransactionCount: pipeline.rawTransactionCount,
      transfersSaved: pipeline.transfersSaved,
    };
  });

export const completeSettlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ settlementId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const db = context.supabase as Db;
    const { error } = await db
      .from("settlements")
      .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
      .eq("id", data.settlementId)
      .eq("status", "PENDING");
    if (error) throw new AppError("Could not update the settlement.");
    return { ok: true };
  });

/** Dashboard + history + analytics feed across every group the user belongs to. */
export const getOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as Db;
    const userId = context.userId;

    const { data: memberships } = await db
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);
    const groupIds = (memberships ?? []).map((m) => m.group_id);

    if (groupIds.length === 0) {
      return {
        currentUserId: userId,
        groups: [],
        expenses: [],
        totals: { groups: 0, expenses: 0, spent: 0, owe: 0, receive: 0 },
        pendingSettlements: [],
      };
    }

    const { data: groups } = await db
      .from("groups")
      .select("id, name, category, description, created_at, created_by")
      .in("id", groupIds)
      .order("created_at", { ascending: false });

    const perGroup = await Promise.all(
      groupIds.map(async (groupId) => {
        const [members, expenses] = await Promise.all([
          loadMembers(db, groupId),
          loadExpenses(db, groupId),
        ]);
        const pipeline = runSettlementPipeline(
          members.map((m) => m.userId),
          expenses,
        );
        return { groupId, members, expenses, pipeline };
      }),
    );

    const memberLookup = new Map<string, string>();
    for (const g of perGroup) for (const m of g.members) memberLookup.set(m.userId, m.name);

    const expenses = perGroup.flatMap((g) =>
      g.expenses.map((e) => ({
        id: e.id,
        groupId: g.groupId,
        groupName: (groups ?? []).find((gr) => gr.id === g.groupId)?.name ?? "Group",
        title: e.title,
        amount: e.amount,
        category: e.category,
        expenseDate: e.expenseDate,
        createdAt: e.createdAt,
        receiptUrl: e.receiptUrl,
        paidBy: e.paidBy,
        paidByName: memberLookup.get(e.paidBy) ?? "Member",
        participants: e.participants.map((p) => ({
          userId: p.userId,
          name: memberLookup.get(p.userId) ?? "Member",
          share: p.share,
        })),
      })),
    );
    expenses.sort((a, b) => (a.expenseDate < b.expenseDate ? 1 : a.expenseDate > b.expenseDate ? -1 : 0));

    let owe = 0;
    let receive = 0;
    for (const g of perGroup) {
      const mine = g.pipeline.balances.find((b) => b.userId === userId);
      if (!mine) continue;
      if (mine.netBalance < 0) owe += -mine.netBalance;
      else receive += mine.netBalance;
    }

    const { data: pending } = await db
      .from("settlements")
      .select("id, group_id, from_user, to_user, amount, status, created_at, completed_at")
      .in("group_id", groupIds)
      .order("created_at", { ascending: false });

    return {
      currentUserId: userId,
      groups: (groups ?? []).map((g) => {
        const info = perGroup.find((p) => p.groupId === g.id);
        return {
          ...g,
          memberCount: info?.members.length ?? 0,
          expenseCount: info?.expenses.length ?? 0,
          totalSpent: round2((info?.expenses ?? []).reduce((s, e) => s + e.amount, 0)),
          members: info?.members ?? [],
        };
      }),
      expenses,
      totals: {
        groups: groupIds.length,
        expenses: expenses.length,
        spent: round2(expenses.reduce((s, e) => s + e.amount, 0)),
        owe: round2(owe),
        receive: round2(receive),
      },
      pendingSettlements: (pending ?? []).map((s) => ({
        ...s,
        amount: Number(s.amount),
        groupName: (groups ?? []).find((g) => g.id === s.group_id)?.name ?? "Group",
        fromName: memberLookup.get(s.from_user) ?? "Member",
        toName: memberLookup.get(s.to_user) ?? "Member",
      })),
    };
  });
