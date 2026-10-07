import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExpense } from "@/lib/splitsmart.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { EXPENSE_CATEGORIES, formatMoney, friendlyError } from "@/lib/format";

export interface ExpenseGroupOption {
  id: string;
  name: string;
  members: Array<{ userId: string; name: string }>;
}

export function AddExpenseDialog({
  groups,
  defaultGroupId,
  trigger,
}: {
  groups: ExpenseGroupOption[];
  defaultGroupId?: string;
  trigger?: React.ReactNode;
}) {
  const addExpense = useServerFn(createExpense);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState(defaultGroupId ?? groups[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [category, setCategory] = useState<string>("Food");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [participants, setParticipants] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const group = groups.find((g) => g.id === groupId);

  useEffect(() => {
    if (!group) return;
    setParticipants(group.members.map((m) => m.userId));
    setPaidBy((prev) => (group.members.some((m) => m.userId === prev) ? prev : (group.members[0]?.userId ?? "")));
  }, [groupId, group]);

  const parsedAmount = Number(amount);
  const perHead =
    participants.length > 0 && parsedAmount > 0 ? parsedAmount / participants.length : 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!groupId) {
      toast.error("Pick a group first.");
      return;
    }
    if (!title.trim()) {
      toast.error("Add a title for the expense.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }
    if (participants.length === 0) {
      toast.error("Select at least one participant.");
      return;
    }
    setSaving(true);
    try {
      let receiptPath: string | null = null;
      if (receipt) {
        if (!user) {
          toast.error("Please sign in again to attach a receipt.");
          return;
        }
        const ext = (receipt.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(path, receipt, { contentType: receipt.type || "image/jpeg", upsert: false });
        if (uploadError) {
          toast.error("Could not upload the receipt image.");
          return;
        }
        receiptPath = path;
      }
      await addExpense({
        data: {
          groupId,
          title: title.trim(),
          amount: Math.round(parsedAmount * 100) / 100,
          paidBy,
          category,
          expenseDate: date,
          participantIds: participants,
          receiptPath,
        },
      });
      toast.success("Expense added.");
      setOpen(false);
      setTitle("");
      setAmount("");
      setReceipt(null);
      setReceiptPreview(null);
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error(friendlyError(error, "Could not add the expense."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Receipt className="size-4" /> Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add an expense</DialogTitle>
        </DialogHeader>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Create a group first — expenses always belong to a group.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-group">Group</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger id="expense-group">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-title">Title</Label>
              <Input
                id="expense-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Dinner at Cafe Mocha"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount ({"₹"})</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-date">Date</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expense-paidby">Paid by</Label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger id="expense-paidby">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {(group?.members ?? []).map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="expense-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Participants (equal split)</Label>
              <div className="space-y-2 rounded-lg border border-border p-3">
                {(group?.members ?? []).map((m) => (
                  <label key={m.userId} className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={participants.includes(m.userId)}
                      onCheckedChange={(checked) =>
                        setParticipants((prev) =>
                          checked ? [...new Set([...prev, m.userId])] : prev.filter((id) => id !== m.userId),
                        )
                      }
                    />
                    {m.name}
                  </label>
                ))}
              </div>
              {perHead > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {participants.length} participants · about {formatMoney(perHead)} each
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-receipt">Receipt image (optional)</Label>
              <div className="flex items-center gap-3">
                {receiptPreview ? (
                  <img
                    src={receiptPreview}
                    alt="Selected receipt preview"
                    className="size-14 shrink-0 rounded-lg border border-border object-cover"
                  />
                ) : null}
                <Input
                  id="expense-receipt"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      toast.error("Receipt must be smaller than 5 MB.");
                      e.target.value = "";
                      return;
                    }
                    setReceipt(file);
                    setReceiptPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                JPG or PNG up to 5 MB — only group members can view it.
              </p>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Add expense"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
