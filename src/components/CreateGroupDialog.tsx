import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { GROUP_CATEGORIES, friendlyError } from "@/lib/format";

export function CreateGroupDialog({ trigger }: { trigger?: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Trip");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (name.trim().length < 2) {
      toast.error("Give the group a name of at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: name.trim(),
          category,
          description: description.trim() || null,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Could not create the group.");

      const { error: memberError } = await supabase
        .from("group_members")
        .insert({ group_id: data.id, user_id: user.id });
      if (memberError) {
        await supabase.from("groups").delete().eq("id", data.id);
        throw new Error("Could not add you as a member. Nothing was saved.");
      }

      toast.success("Group created successfully.");
      setOpen(false);
      setName("");
      setDescription("");
      await router.navigate({ to: "/groups/$groupId", params: { groupId: data.id } });
    } catch (error) {
      toast.error(friendlyError(error, "Could not create the group."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" /> Create Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a group</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Goa Trip"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="group-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUP_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-description">Description</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="4-day trip with the hostel gang"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
