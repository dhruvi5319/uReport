import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Lock, Plus } from "lucide-react";
import api from "@/lib/api";

// IDs 1-6 are seeded system records — cannot be deleted
const SEEDED_IDS = new Set([1, 2, 3, 4, 5, 6]);

export interface IssueType {
  id: number;
  name: string;
}

async function fetchIssueTypes(): Promise<IssueType[]> {
  const res = await api.get<IssueType[]>("/issue-types");
  return res.data;
}

interface EditingRow {
  id: number | null; // null = new row
  name: string;
}

export function IssueTypesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IssueType | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  const { data: issueTypes = [], isLoading } = useQuery<IssueType[]>({
    queryKey: ["issue-types"],
    queryFn: fetchIssueTypes,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number | null; name: string }) => {
      if (id === null) {
        await api.post("/issue-types", { name });
      } else {
        await api.put(`/issue-types/${id}`, { name });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue-types"] });
      toast({ title: "Saved" });
      setEditingRow(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/issue-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue-types"] });
      toast({ title: "Deleted" });
      setAlertOpen(false);
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
      setAlertOpen(false);
    },
  });

  function startEdit(issueType: IssueType) {
    setEditingRow({ id: issueType.id, name: issueType.name });
  }

  function startNew() {
    setEditingRow({ id: null, name: "" });
  }

  function cancelEdit() {
    setEditingRow(null);
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
            <BreadcrumbPage>Issue Types</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Issue Types</h1>
        <Button onClick={startNew} disabled={editingRow?.id === null}>
          <Plus className="mr-2 h-4 w-4" />
          New Issue Type
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* New inline row */}
          {editingRow?.id === null && (
            <TableRow>
              <TableCell>
                <Input
                  autoFocus
                  value={editingRow.name}
                  onChange={(e) => setEditingRow((r) => r ? { ...r, name: e.target.value } : r)}
                  placeholder="Issue type name..."
                  aria-label="New issue type name"
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    onClick={() => saveMutation.mutate({ id: null, name: editingRow.name })}
                    disabled={!editingRow.name || saveMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}

          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            : issueTypes.map((it) => {
                const isSeeded = SEEDED_IDS.has(it.id);
                const isEditingThis = editingRow?.id === it.id;

                return (
                  <TableRow key={it.id}>
                    <TableCell>
                      {isEditingThis ? (
                        <Input
                          autoFocus
                          value={editingRow.name}
                          onChange={(e) =>
                            setEditingRow((r) => r ? { ...r, name: e.target.value } : r)
                          }
                          aria-label={`Edit name for ${it.name}`}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {it.name}
                          {isSeeded && (
                            <span
                              title="System record — cannot be deleted"
                              aria-label="System record — cannot be deleted"
                              className="inline-flex items-center"
                            >
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditingThis ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              saveMutation.mutate({ id: it.id, name: editingRow.name })
                            }
                            disabled={!editingRow.name || saveMutation.isPending}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(it)}
                            disabled={!!editingRow}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isSeeded || !!editingRow}
                            title={isSeeded ? "System record — cannot be deleted" : undefined}
                            onClick={() => {
                              setDeleteTarget(it);
                              setAlertOpen(true);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete issue type?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete issue type <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Delete Issue Type
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
