import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminListPage, type ColumnDef } from "@/components/admin/AdminListPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Copy } from "lucide-react";
import api from "@/lib/api";

export interface Client {
  id: number;
  name: string;
  url?: string;
  contactPerson?: string;
  contactMethod?: string;
  apiKey?: string;
}

interface CreateClientResponse {
  id: number;
  name: string;
  apiKey: string;
}

async function fetchClients(): Promise<Client[]> {
  const res = await api.get<Client[]>("/clients");
  return res.data;
}

function ClientSheet({
  client,
  onClose,
  onNewApiKey,
}: {
  client: Client | null;
  onClose: () => void;
  onNewApiKey?: (key: string) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: client?.name ?? "",
    url: client?.url ?? "",
    contactPerson: client?.contactPerson ?? "",
    contactMethod: client?.contactMethod ?? "",
  });

  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (client) {
        await api.put(`/clients/${client.id}`, form);
        return null;
      } else {
        const res = await api.post<CreateClientResponse>("/clients", form);
        return res.data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      if (data?.apiKey) {
        setNewApiKey(data.apiKey);
        if (onNewApiKey) onNewApiKey(data.apiKey);
        toast({ title: "Saved", description: "Client created. Save the API key now — it cannot be retrieved again." });
      } else {
        toast({ title: "Saved", description: "Client saved successfully." });
        onClose();
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  function copyApiKey() {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey);
      toast({ title: "Copied", description: "API key copied to clipboard." });
    }
  }

  function handleClose() {
    setNewApiKey(null);
    onClose();
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="client-name">Name <span className="text-destructive">*</span></label>
        <Input
          id="client-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="client-url">URL</label>
        <Input
          id="client-url"
          type="url"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="client-contact">Contact Person</label>
        <Input
          id="client-contact"
          value={form.contactPerson}
          onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="client-method">Contact Method</label>
        <Input
          id="client-method"
          value={form.contactMethod}
          onChange={(e) => setForm((f) => ({ ...f, contactMethod: e.target.value }))}
        />
      </div>

      {/* API key shown once after creation */}
      {newApiKey && (
        <div className="space-y-2 border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
            ⚠️ Save this API key now — it cannot be retrieved again.
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={newApiKey}
              className="font-mono text-xs"
              aria-label="API key"
            />
            <Button variant="outline" size="sm" onClick={copyApiKey} aria-label="Copy API key">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={handleClose}>
          {newApiKey ? "Close" : "Cancel"}
        </Button>
        {!newApiKey && (
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!form.name || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        )}
      </div>
    </div>
  );
}

const columns: ColumnDef<Client>[] = [
  {
    key: "name",
    header: "Name",
    cell: (c) => c.name,
  },
  {
    key: "contactPerson",
    header: "Contact Person",
    cell: (c) => c.contactPerson ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: "contactMethod",
    header: "Contact Method",
    cell: (c) => c.contactMethod ?? <span className="text-muted-foreground">—</span>,
  },
  {
    key: "url",
    header: "URL",
    cell: (c) =>
      c.url ? (
        <span className="max-w-[180px] truncate block" title={c.url}>
          {c.url}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "apiKey",
    header: "API Key",
    cell: (c) => (
      <span className="font-mono text-xs text-muted-foreground">
        {c.apiKey ?? "••••••••"}
      </span>
    ),
  },
];

export function ClientsPage() {
  const queryClient = useQueryClient();

  async function handleDelete(client: Client) {
    await api.delete(`/clients/${client.id}`);
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  }

  return (
    <AdminListPage<Client>
      title="Clients"
      breadcrumb={["Admin", "Clients"]}
      columns={columns}
      fetchFn={fetchClients}
      queryKey={["clients"]}
      renderSheet={(item, onClose) => (
        <ClientSheet
          client={item}
          onClose={onClose}
        />
      )}
      onDelete={handleDelete}
      getDeleteTitle={(c) => `Delete client ${c.name}?`}
      getDeleteMessage={(c) => (
        <span>
          Delete client <strong>{c.name}</strong>? Their API key will be immediately revoked.
        </span>
      )}
      getDeleteButtonText={() => "Revoke & Delete"}
      searchPlaceholder="Search clients..."
    />
  );
}
