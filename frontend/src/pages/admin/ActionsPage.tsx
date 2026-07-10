import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import api from "@/lib/api";

interface Department {
  id: number;
  name: string;
}

export interface Action {
  id: number;
  name: string;
  type: "DEPARTMENT" | "SYSTEM";
  template?: string;
  replyEmail?: string;
  departmentId?: number;
  departmentName?: string;
}

async function fetchActions(): Promise<Action[]> {
  const res = await api.get<Action[]>("/actions");
  return res.data;
}

async function fetchDepartments(): Promise<Department[]> {
  const res = await api.get<Department[]>("/departments");
  return res.data;
}

function DepartmentActionSheet({
  action,
  departments,
  onClose,
}: {
  action: Action | null;
  departments: Department[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: action?.name ?? "",
    departmentId: action?.departmentId ? String(action.departmentId) : "",
    template: action?.template ?? "",
    replyEmail: action?.replyEmail ?? "",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        type: "DEPARTMENT",
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        template: form.template || null,
        replyEmail: form.replyEmail || null,
      };
      if (action) {
        // DEPARTMENT actions: only template + replyEmail editable
        await api.put(`/actions/${action.id}`, {
          template: form.template || null,
          replyEmail: form.replyEmail || null,
        });
      } else {
        await api.post("/actions", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      toast({ title: "Saved", description: "Action saved successfully." });
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
        <label className="text-sm font-medium" htmlFor="action-name">Name</label>
        <Input
          id="action-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          disabled={!!action} // name not editable for existing actions
        />
      </div>
      {!action && (
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="action-dept">Department</label>
          <Select
            value={form.departmentId}
            onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
          >
            <SelectTrigger id="action-dept">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="action-template">Template</label>
        <Textarea
          id="action-template"
          value={form.template}
          onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}
          rows={5}
          placeholder="Response template text..."
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="action-email">Reply Email</label>
        <Input
          id="action-email"
          type="email"
          value={form.replyEmail}
          onChange={(e) => setForm((f) => ({ ...f, replyEmail: e.target.value }))}
        />
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

function SystemActionSheet({
  action,
  onClose,
}: {
  action: Action;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Name</label>
        <p className="text-sm p-2 border rounded bg-muted">{action.name}</p>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Type</label>
        <Badge variant="secondary">SYSTEM</Badge>
      </div>
      {action.template && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Template</label>
          <p className="text-sm p-2 border rounded bg-muted whitespace-pre-wrap">{action.template}</p>
        </div>
      )}
      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

export function ActionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [isNewAction, setIsNewAction] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Action | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const { data: actions = [], isLoading } = useQuery<Action[]>({
    queryKey: ["actions"],
    queryFn: fetchActions,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/actions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      toast({ title: "Deleted" });
      setAlertOpen(false);
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
      setAlertOpen(false);
    },
  });

  const filteredActions = actions.filter((a) =>
    !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function openNew() {
    setEditingAction(null);
    setIsNewAction(true);
    setSheetOpen(true);
  }

  function openEdit(action: Action) {
    setEditingAction(action);
    setIsNewAction(false);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingAction(null);
    setIsNewAction(false);
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Actions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Actions</h1>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Department Action
        </Button>
      </div>

      <div className="flex">
        <Input
          placeholder="Search actions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          aria-label="Search actions"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Template</TableHead>
            <TableHead>Reply Email</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            : filteredActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No actions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredActions.map((action) => {
                  const isSystem = action.type === "SYSTEM";
                  const truncatedTemplate = action.template
                    ? action.template.length > 60
                      ? action.template.slice(0, 60) + "…"
                      : action.template
                    : null;

                  return (
                    <TableRow key={action.id}>
                      <TableCell>{action.name}</TableCell>
                      <TableCell>
                        <Badge variant={isSystem ? "secondary" : "default"}>
                          {action.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {truncatedTemplate ? (
                          <span className="text-sm text-muted-foreground">{truncatedTemplate}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {action.replyEmail ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(action)}
                          >
                            {isSystem ? "View" : "Edit"}
                          </Button>
                          {!isSystem && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setDeleteTarget(action);
                                setAlertOpen(true);
                              }}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
        </TableBody>
      </Table>

      {/* Sheet for edit/view/create */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetContent side="right" className="w-[40%] min-w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {isNewAction
                ? "New Department Action"
                : editingAction?.type === "SYSTEM"
                ? "View System Action"
                : "Edit Action"}
            </SheetTitle>
          </SheetHeader>
          {editingAction?.type === "SYSTEM" ? (
            <SystemActionSheet action={editingAction} onClose={closeSheet} />
          ) : (
            <DepartmentActionSheet
              action={isNewAction ? null : editingAction}
              departments={departments}
              onClose={closeSheet}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete AlertDialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete action {deleteTarget?.name}
              {deleteTarget?.departmentName ? ` from ${deleteTarget.departmentName}` : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Delete Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
