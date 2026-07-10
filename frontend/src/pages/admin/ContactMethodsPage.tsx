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

// IDs 1-4 are seeded system records — cannot be deleted
const SEEDED_IDS = new Set([1, 2, 3, 4]);

export interface ContactMethod {
  id: number;
  name: string;
}

async function fetchContactMethods(): Promise<ContactMethod[]> {
  const res = await api.get<ContactMethod[]>("/contact-methods");
  return res.data;
}

interface EditingRow {
  id: number | null;
  name: string;
}

export function ContactMethodsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMethod | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  const { data: contactMethods = [], isLoading } = useQuery<ContactMethod[]>({
    queryKey: ["contact-methods"],
    queryFn: fetchContactMethods,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number | null; name: string }) => {
      if (id === null) {
        await api.post("/contact-methods", { name });
      } else {
        await api.put(`/contact-methods/${id}`, { name });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-methods"] });
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
      await api.delete(`/contact-methods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-methods"] });
      toast({ title: "Deleted" });
      setAlertOpen(false);
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
      setAlertOpen(false);
    },
  });

  function startEdit(method: ContactMethod) {
    setEditingRow({ id: method.id, name: method.name });
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
            <BreadcrumbPage>Contact Methods</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contact Methods</h1>
        <Button onClick={startNew} disabled={editingRow?.id === null}>
          <Plus className="mr-2 h-4 w-4" />
          New Contact Method
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
                  placeholder="Contact method name..."
                  aria-label="New contact method name"
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
            ? Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            : contactMethods.map((cm) => {
                const isSeeded = SEEDED_IDS.has(cm.id);
                const isEditingThis = editingRow?.id === cm.id;

                return (
                  <TableRow key={cm.id}>
                    <TableCell>
                      {isEditingThis ? (
                        <Input
                          autoFocus
                          value={editingRow.name}
                          onChange={(e) =>
                            setEditingRow((r) => r ? { ...r, name: e.target.value } : r)
                          }
                          aria-label={`Edit name for ${cm.name}`}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {cm.name}
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
                              saveMutation.mutate({ id: cm.id, name: editingRow.name })
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
                            onClick={() => startEdit(cm)}
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
                              setDeleteTarget(cm);
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
            <AlertDialogTitle>Delete contact method?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete contact method <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Delete Contact Method
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
