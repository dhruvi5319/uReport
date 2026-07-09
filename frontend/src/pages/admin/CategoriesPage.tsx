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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/use-toast";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import api from "@/lib/api";

interface Department {
  id: number;
  name: string;
}

interface CategoryGroup {
  id: number;
  name: string;
}

interface ActionResponse {
  id?: number;
  actionId: number;
  actionName?: string;
  template: string;
}

export interface Category {
  id: number;
  name: string;
  categoryGroupId?: number;
  categoryGroupName?: string;
  departmentId?: number;
  departmentName?: string;
  active: boolean;
  postingPermission: "PUBLIC" | "STAFF" | "ADMIN";
  slaDays?: number;
  autoClose: boolean;
  actionResponses?: ActionResponse[];
}

async function fetchCategories(): Promise<Category[]> {
  const res = await api.get<Category[]>("/categories");
  return res.data;
}

async function fetchCategoryGroups(): Promise<CategoryGroup[]> {
  const res = await api.get<CategoryGroup[]>("/category-groups");
  return res.data;
}

async function fetchDepartments(): Promise<Department[]> {
  const res = await api.get<Department[]>("/departments");
  return res.data;
}

function permissionBadgeVariant(p: string): "outline" | "default" | "secondary" {
  if (p === "PUBLIC") return "outline";
  if (p === "STAFF") return "default";
  return "secondary";
}

function CategorySheet({
  category,
  groups,
  departments,
  onClose,
}: {
  category: Category | null;
  groups: CategoryGroup[];
  departments: Department[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: category?.name ?? "",
    categoryGroupId: category?.categoryGroupId ? String(category.categoryGroupId) : "",
    departmentId: category?.departmentId ? String(category.departmentId) : "",
    active: category?.active ?? true,
    postingPermission: category?.postingPermission ?? "PUBLIC" as "PUBLIC" | "STAFF" | "ADMIN",
    slaDays: category?.slaDays ? String(category.slaDays) : "",
    autoClose: category?.autoClose ?? false,
  });

  const [actionResponses, setActionResponses] = useState<ActionResponse[]>(
    category?.actionResponses ?? []
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        categoryGroupId: form.categoryGroupId ? Number(form.categoryGroupId) : null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        active: form.active,
        postingPermission: form.postingPermission,
        slaDays: form.slaDays ? Number(form.slaDays) : null,
        autoClose: form.autoClose,
        actionResponses,
      };
      if (category) {
        await api.put(`/categories/${category.id}`, payload);
      } else {
        await api.post("/categories", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Saved", description: "Category saved successfully." });
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
        <label className="text-sm font-medium" htmlFor="cat-name">Name <span className="text-destructive">*</span></label>
        <Input
          id="cat-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="cat-group">Category Group</label>
        <Select
          value={form.categoryGroupId}
          onValueChange={(v) => setForm((f) => ({ ...f, categoryGroupId: v }))}
        >
          <SelectTrigger id="cat-group">
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="cat-dept">Department</label>
        <Select
          value={form.departmentId}
          onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
        >
          <SelectTrigger id="cat-dept">
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
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="rounded"
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={form.autoClose}
            onChange={(e) => setForm((f) => ({ ...f, autoClose: e.target.checked }))}
            className="rounded"
          />
          Auto Close
        </label>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="cat-perm">Posting Permission</label>
        <Select
          value={form.postingPermission}
          onValueChange={(v) => setForm((f) => ({ ...f, postingPermission: v as "PUBLIC" | "STAFF" | "ADMIN" }))}
        >
          <SelectTrigger id="cat-perm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">Public</SelectItem>
            <SelectItem value="STAFF">Staff</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="cat-sla">SLA Days (optional)</label>
        <Input
          id="cat-sla"
          type="number"
          value={form.slaDays}
          onChange={(e) => setForm((f) => ({ ...f, slaDays: e.target.value }))}
          min={0}
        />
      </div>

      {/* Response Templates */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Response Templates</label>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setActionResponses((r) => [
                ...r,
                { actionId: 0, template: "" },
              ])
            }
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Response Template
          </Button>
        </div>
        {actionResponses.map((ar, idx) => (
          <div key={idx} className="space-y-1 p-3 border rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {ar.actionName ?? `Template ${idx + 1}`}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setActionResponses((r) => r.filter((_, i) => i !== idx))
                }
              >
                Remove
              </Button>
            </div>
            <Textarea
              value={ar.template}
              onChange={(e) =>
                setActionResponses((r) =>
                  r.map((item, i) =>
                    i === idx ? { ...item, template: e.target.value } : item
                  )
                )
              }
              placeholder="Response template text..."
              rows={3}
              aria-label={`Response template ${idx + 1}`}
            />
          </div>
        ))}
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

function CategoryGroupSheet({
  group,
  onClose,
}: {
  group: CategoryGroup | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(group?.name ?? "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (group) {
        await api.put(`/category-groups/${group.id}`, { name });
      } else {
        await api.post("/category-groups", { name });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-groups"] });
      toast({ title: "Saved", description: "Category group saved." });
      onClose();
    },
    onError: () => toast({ title: "Error", description: "Save failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="cg-name">Name <span className="text-destructive">*</span></label>
        <Input
          id="cg-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => saveMutation.mutate()} disabled={!name || saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export function CategoriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sheet state for category
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Sheet state for category group
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "group"; item: Category | CategoryGroup } | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: groups = [] } = useQuery<CategoryGroup[]>({
    queryKey: ["category-groups"],
    queryFn: fetchCategoryGroups,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) return;
      if (deleteTarget.type === "category") {
        await api.delete(`/categories/${deleteTarget.item.id}`);
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else {
        await api.delete(`/category-groups/${deleteTarget.item.id}`);
        queryClient.invalidateQueries({ queryKey: ["category-groups"] });
      }
    },
    onSuccess: () => {
      toast({ title: "Deleted" });
      setAlertOpen(false);
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
      setAlertOpen(false);
    },
  });

  function toggleGroup(id: number) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Group categories by categoryGroupId
  const categoriesByGroup = categories.reduce<Record<string, Category[]>>((acc, cat) => {
    const key = cat.categoryGroupId ? String(cat.categoryGroupId) : "ungrouped";
    if (!acc[key]) acc[key] = [];
    acc[key].push(cat);
    return acc;
  }, {});

  const ungrouped = categoriesByGroup["ungrouped"] ?? [];

  return (
    <div className="flex flex-col gap-4 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Categories</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingGroup(null);
              setGroupSheetOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Category Group
          </Button>
          <Button
            onClick={() => {
              setEditingCat(null);
              setCatSheetOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        </div>
      </div>

      {/* Accordion of category groups */}
      <div className="space-y-2">
        {groups.map((group) => {
          const groupCats = categoriesByGroup[String(group.id)] ?? [];
          const isExpanded = expandedGroups.has(group.id);
          return (
            <div key={group.id} className="border rounded-lg">
              <div className="flex items-center justify-between p-2 pr-4">
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 p-2 hover:bg-muted/50 rounded text-left"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`group-content-${group.id}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                  <span className="font-medium">{group.name}</span>
                  <Badge variant="secondary">{groupCats.length}</Badge>
                </button>
                <div className="flex gap-2 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingGroup(group);
                      setGroupSheetOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeleteTarget({ type: "group", item: group });
                      setAlertOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t" id={`group-content-${group.id}`}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Posting Permission</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupCats.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                            No categories in this group.
                          </TableCell>
                        </TableRow>
                      ) : (
                        groupCats.map((cat) => (
                          <TableRow key={cat.id}>
                            <TableCell>{cat.name}</TableCell>
                            <TableCell>
                              {cat.departmentName ? (
                                <Badge variant="outline">{cat.departmentName}</Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={cat.active ? "text-green-600" : "text-muted-foreground"}>
                                {cat.active ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={permissionBadgeVariant(cat.postingPermission)}>
                                {cat.postingPermission}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCat(cat);
                                    setCatSheetOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteTarget({ type: "category", item: cat });
                                    setAlertOpen(true);
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          );
        })}

        {/* Ungrouped categories */}
        {ungrouped.length > 0 && (
          <div className="border rounded-lg">
            <div className="flex items-center p-2">
              <button
                type="button"
                className="flex flex-1 items-center gap-2 p-2 hover:bg-muted/50 rounded text-left"
                onClick={() => toggleGroup(-1)}
                aria-expanded={expandedGroups.has(-1)}
                aria-controls="group-content-ungrouped"
              >
                {expandedGroups.has(-1) ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                <span className="font-medium text-muted-foreground">Ungrouped</span>
                <Badge variant="secondary">{ungrouped.length}</Badge>
              </button>
            </div>
            {expandedGroups.has(-1) && (
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Posting Permission</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ungrouped.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell>
                          {cat.departmentName ? (
                            <Badge variant="outline">{cat.departmentName}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={cat.active ? "text-green-600" : "text-muted-foreground"}>
                            {cat.active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={permissionBadgeVariant(cat.postingPermission)}>
                            {cat.postingPermission}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCat(cat);
                                setCatSheetOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setDeleteTarget({ type: "category", item: cat });
                                setAlertOpen(true);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Sheet */}
      <Sheet open={catSheetOpen} onOpenChange={(open) => { if (!open) { setCatSheetOpen(false); setEditingCat(null); } }}>
        <SheetContent side="right" className="w-[40%] min-w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingCat ? "Edit Category" : "New Category"}</SheetTitle>
          </SheetHeader>
          <CategorySheet
            category={editingCat}
            groups={groups}
            departments={departments}
            onClose={() => { setCatSheetOpen(false); setEditingCat(null); }}
          />
        </SheetContent>
      </Sheet>

      {/* Category Group Sheet */}
      <Sheet open={groupSheetOpen} onOpenChange={(open) => { if (!open) { setGroupSheetOpen(false); setEditingGroup(null); } }}>
        <SheetContent side="right" className="w-[40%] min-w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingGroup ? "Edit Category Group" : "New Category Group"}</SheetTitle>
          </SheetHeader>
          <CategoryGroupSheet
            group={editingGroup}
            onClose={() => { setGroupSheetOpen(false); setEditingGroup(null); }}
          />
        </SheetContent>
      </Sheet>

      {/* Delete AlertDialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === "group" ? "Category Group" : "Category"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
