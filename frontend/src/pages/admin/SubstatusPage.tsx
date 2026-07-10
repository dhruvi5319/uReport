import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminListPage, type ColumnDef } from "@/components/admin/AdminListPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Star } from "lucide-react";
import api from "@/lib/api";

export interface Substatus {
  id: number;
  name: string;
  status: "open" | "closed";
  description?: string;
  isDefault: boolean;
}

async function fetchSubstatus(): Promise<Substatus[]> {
  const res = await api.get<Substatus[]>("/substatus");
  return res.data;
}

function SubstatusSheet({
  substatus,
  onClose,
}: {
  substatus: Substatus | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: substatus?.name ?? "",
    status: substatus?.status ?? "open" as "open" | "closed",
    description: substatus?.description ?? "",
    isDefault: substatus?.isDefault ?? false,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        status: form.status,
        description: form.description || null,
        isDefault: form.isDefault,
      };
      if (substatus) {
        await api.put(`/substatus/${substatus.id}`, payload);
      } else {
        await api.post("/substatus", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["substatus"] });
      toast({ title: "Saved", description: "Substatus saved successfully." });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="sub-name">Name <span className="text-destructive">*</span></label>
        <Input
          id="sub-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="sub-status">Status</label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm((f) => ({ ...f, status: v as "open" | "closed" }))}
        >
          <SelectTrigger id="sub-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="sub-desc">Description</label>
        <Textarea
          id="sub-desc"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
        />
      </div>
      <div className="space-y-1">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            className="rounded"
            aria-describedby="default-hint"
          />
          Is Default
        </label>
        <p id="default-hint" className="text-xs text-muted-foreground ml-5">
          Only one substatus per status can be default
        </p>
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

const columns: ColumnDef<Substatus>[] = [
  {
    key: "name",
    header: "Name",
    cell: (s) => s.name,
  },
  {
    key: "status",
    header: "Status",
    cell: (s) => (
      <Badge variant={s.status === "open" ? "open" : "secondary"}>
        {s.status}
      </Badge>
    ),
  },
  {
    key: "description",
    header: "Description",
    cell: (s) => s.description ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: "isDefault",
    header: "Default",
    cell: (s) =>
      s.isDefault ? (
        <Star className="h-4 w-4 text-amber-500 fill-amber-500" aria-label="Default" />
      ) : null,
  },
];

export function SubstatusPage() {
  const queryClient = useQueryClient();

  async function handleDelete(sub: Substatus) {
    await api.delete(`/substatus/${sub.id}`);
    queryClient.invalidateQueries({ queryKey: ["substatus"] });
  }

  return (
    <AdminListPage<Substatus>
      title="Substatuses"
      breadcrumb={["Admin", "Substatus"]}
      columns={columns}
      fetchFn={fetchSubstatus}
      queryKey={["substatus"]}
      renderSheet={(item, onClose) => (
        <SubstatusSheet substatus={item} onClose={onClose} />
      )}
      onDelete={handleDelete}
      getDeleteTitle={(s) => `Delete substatus ${s.name}?`}
      getDeleteMessage={(s) => (
        <span>
          {s.isDefault && (
            <span className="block text-amber-600 font-medium mb-2">
              ⚠️ This is the default substatus. Deleting it will leave no default.
            </span>
          )}
          Delete substatus <strong>{s.name}</strong>?
        </span>
      )}
      getDeleteButtonText={() => "Delete Substatus"}
      newButtonLabel="New Substatus"
      searchPlaceholder="Search substatuses..."
    />
  );
}
