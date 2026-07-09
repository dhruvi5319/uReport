import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminListPage, type ColumnDef } from "@/components/admin/AdminListPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Check } from "lucide-react";
import api from "@/lib/api";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
}

interface Action {
  id: number;
  name: string;
  type: "DEPARTMENT" | "SYSTEM";
}

export interface Department {
  id: number;
  name: string;
  defaultPersonId?: number;
  defaultPersonName?: string;
  categoryCount?: number;
  actionCount?: number;
}

async function fetchDepartments(): Promise<Department[]> {
  const res = await api.get<Department[]>("/departments");
  return res.data;
}

// Combobox-style people search
function PersonCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const { data: people = [] } = useQuery<Person[]>({
    queryKey: ["people-search", q],
    queryFn: async () => {
      const res = await api.get<Person[]>("/people", { params: q ? { q } : {} });
      return res.data;
    },
  });

  const selectedLabel = value
    ? people.find((p) => String(p.id) === value)
      ? (() => {
          const p = people.find((p) => String(p.id) === value)!;
          return `${p.lastName}, ${p.firstName}`;
        })()
      : "Unknown"
    : "None";

  return (
    <div className="relative">
      <Input
        placeholder={value ? selectedLabel : "Search people..."}
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="Search for a person"
      />
      {open && people.length > 0 && (
        <div className="absolute z-50 w-full border bg-background rounded shadow mt-1 max-h-48 overflow-y-auto">
          <div
            className="px-3 py-2 text-sm cursor-pointer hover:bg-muted"
            onMouseDown={() => { onChange(""); setQ(""); setOpen(false); }}
          >
            None
          </div>
          {people.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted"
              onMouseDown={() => {
                onChange(String(p.id));
                setQ(`${p.lastName}, ${p.firstName}`);
                setOpen(false);
              }}
            >
              {String(p.id) === value && <Check className="h-3 w-3" />}
              {p.lastName}, {p.firstName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DepartmentSheet({
  department,
  onClose,
}: {
  department: Department | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: actions = [] } = useQuery<Action[]>({
    queryKey: ["actions"],
    queryFn: async () => {
      const res = await api.get<Action[]>("/actions");
      return res.data;
    },
  });

  const [form, setForm] = useState({
    name: department?.name ?? "",
    defaultPersonId: department?.defaultPersonId ? String(department.defaultPersonId) : "",
    selectedActionIds: [] as string[],
  });

  // Fetch department detail to get associated actions
  const { data: deptDetail } = useQuery<Department & { actionIds?: number[] }>({
    queryKey: ["department-detail", department?.id],
    queryFn: async () => {
      const res = await api.get<Department & { actionIds?: number[] }>(`/departments/${department!.id}`);
      return res.data;
    },
    enabled: !!department?.id,
  });

  useEffect(() => {
    if (deptDetail?.actionIds) {
      setForm((f) => ({ ...f, selectedActionIds: deptDetail.actionIds!.map(String) }));
    }
  }, [deptDetail]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        defaultPersonId: form.defaultPersonId ? Number(form.defaultPersonId) : null,
        actionIds: form.selectedActionIds.map(Number),
      };
      if (department) {
        await api.put(`/departments/${department.id}`, payload);
      } else {
        await api.post("/departments", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({ title: "Saved", description: "Department saved successfully." });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  function toggleAction(id: string) {
    setForm((f) => ({
      ...f,
      selectedActionIds: f.selectedActionIds.includes(id)
        ? f.selectedActionIds.filter((a) => a !== id)
        : [...f.selectedActionIds, id],
    }));
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="dept-name">Name <span className="text-destructive">*</span></label>
        <Input
          id="dept-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="dept-person">Default Person</label>
        <PersonCombobox
          value={form.defaultPersonId}
          onChange={(v) => setForm((f) => ({ ...f, defaultPersonId: v }))}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Associated Actions</label>
        <div className="border rounded p-3 space-y-2 max-h-48 overflow-y-auto">
          {actions.map((action) => (
            <label key={action.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.selectedActionIds.includes(String(action.id))}
                onChange={() => toggleAction(String(action.id))}
                className="rounded border-input"
              />
              <span>{action.name}</span>
              <Badge variant={action.type === "SYSTEM" ? "secondary" : "default"} className="text-xs">
                {action.type}
              </Badge>
            </label>
          ))}
          {actions.length === 0 && (
            <p className="text-sm text-muted-foreground">No actions available</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!form.name || saveMutation.isPending}
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

const columns: ColumnDef<Department>[] = [
  {
    key: "name",
    header: "Name",
    cell: (d) => d.name,
  },
  {
    key: "defaultPerson",
    header: "Default Person",
    cell: (d) =>
      d.defaultPersonName ? (
        <Badge variant="outline">{d.defaultPersonName}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "categoryCount",
    header: "Categories",
    cell: (d) => d.categoryCount ?? 0,
  },
  {
    key: "actionCount",
    header: "Actions",
    cell: (d) => d.actionCount ?? 0,
  },
];

export function DepartmentsPage() {
  const queryClient = useQueryClient();

  async function handleDelete(dept: Department) {
    await api.delete(`/departments/${dept.id}`);
    queryClient.invalidateQueries({ queryKey: ["departments"] });
  }

  return (
    <AdminListPage<Department>
      title="Departments"
      breadcrumb={["Admin", "Departments"]}
      columns={columns}
      fetchFn={fetchDepartments}
      queryKey={["departments"]}
      renderSheet={(item, onClose) => (
        <DepartmentSheet department={item} onClose={onClose} />
      )}
      onDelete={handleDelete}
      getDeleteTitle={(d) => `Delete ${d.name} department?`}
      getDeleteMessage={(d) => (
        <span>
          Delete <strong>{d.name}</strong> department? Tickets assigned to this department will become unassigned.
        </span>
      )}
      getDeleteButtonText={() => "Delete Department"}
      searchPlaceholder="Search departments..."
    />
  );
}
