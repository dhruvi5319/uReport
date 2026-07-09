import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  className?: string;
}

export interface AdminListPageProps<T> {
  title: string;
  breadcrumb: string[];
  columns: ColumnDef<T>[];
  fetchFn: () => Promise<T[]>;
  queryKey: string[];
  renderSheet: (item: T | null, onClose: () => void) => React.ReactNode;
  onDelete: (item: T) => Promise<void>;
  getDeleteMessage?: (item: T) => React.ReactNode;
  getDeleteTitle?: (item: T) => string;
  getDeleteButtonText?: (item: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  newButtonLabel?: string;
}

export function AdminListPage<T extends { id?: number | string }>({
  title,
  breadcrumb,
  columns,
  fetchFn,
  queryKey,
  renderSheet,
  onDelete,
  getDeleteMessage,
  getDeleteTitle,
  getDeleteButtonText,
  searchPlaceholder = `Search ${title.toLowerCase()}...`,
  searchFilter,
  newButtonLabel,
}: AdminListPageProps<T>): JSX.Element {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data = [], isLoading } = useQuery<T[]>({
    queryKey,
    queryFn: fetchFn,
  });

  const deleteMutation = useMutation({
    mutationFn: (item: T) => onDelete(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Deleted", description: `${title.slice(0, -1) || title} deleted successfully.` });
      setAlertOpen(false);
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Delete failed";
      toast({ title: "Error", description: message, variant: "destructive" });
      setAlertOpen(false);
    },
  });

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    if (searchFilter) {
      return data.filter((item) => searchFilter(item, q));
    }
    return data.filter((item) =>
      Object.values(item as Record<string, unknown>).some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  }, [data, searchQuery, searchFilter]);

  function openNew() {
    setEditingItem(null);
    setSheetOpen(true);
  }

  function openEdit(item: T) {
    setEditingItem(item);
    setSheetOpen(true);
  }

  function openDelete(item: T) {
    setDeleteTarget(item);
    setAlertOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditingItem(null);
  }

  // Expose openEdit and openDelete for columns to use
  const columnsWithActions = useMemo(() => {
    return columns.map((col) => col);
  }, [columns]);

  // Render columns with action buttons appended
  const allColumns = useMemo(() => {
    const actionCol: ColumnDef<T> = {
      key: "__actions__",
      header: "Actions",
      className: "text-right",
      cell: (item: T) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEdit(item)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => openDelete(item)}
          >
            Delete
          </Button>
        </div>
      ),
    };
    return [...columnsWithActions, actionCol];
  }, [columnsWithActions]);

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumb.map((crumb, idx) => {
            const isLast = idx === breadcrumb.length - 1;
            return (
              <React.Fragment key={idx}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{crumb}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href="#">{crumb}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page heading */}
      <h1 className="text-2xl font-bold">{title}</h1>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            aria-label={searchPlaceholder}
          />
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          {newButtonLabel ?? `New ${title.endsWith("s") ? title.slice(0, -1) : title}`}
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            {allColumns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} aria-label="Loading row">
                {allColumns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={allColumns.length} className="text-center text-muted-foreground py-8">
                {searchQuery ? "No results found." : `No ${title.toLowerCase()} found.`}
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((item, idx) => (
              <TableRow key={String(item.id ?? idx)}>
                {allColumns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Sheet for create / edit */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetContent side="right" className="w-[40%] min-w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingItem ? `Edit ${title.endsWith("s") ? title.slice(0, -1) : title}` : `New ${title.endsWith("s") ? title.slice(0, -1) : title}`}</SheetTitle>
          </SheetHeader>
          {renderSheet(editingItem, closeSheet)}
        </SheetContent>
      </Sheet>

      {/* AlertDialog for delete confirmation */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget && getDeleteTitle
                ? getDeleteTitle(deleteTarget)
                : `Delete ${title.endsWith("s") ? title.slice(0, -1) : title}`}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {deleteTarget && getDeleteMessage
                  ? getDeleteMessage(deleteTarget)
                  : "This action cannot be undone."}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
            >
              {deleteTarget && getDeleteButtonText
                ? getDeleteButtonText(deleteTarget)
                : `Delete ${title.endsWith("s") ? title.slice(0, -1) : title}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
