import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminListPage, type ColumnDef } from "@/components/admin/AdminListPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Plus } from "lucide-react";
import api from "@/lib/api";

interface Department {
  id: number;
  name: string;
}

interface Email {
  id: number;
  email: string;
  type?: string;
}

interface Phone {
  id: number;
  phone: string;
  type?: string;
}

interface Address {
  id: number;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  organization?: string;
  departmentId?: number;
  departmentName?: string;
  role: "STAFF" | "ADMIN" | "PUBLIC";
  username: string;
  emailCount?: number;
  emails?: Email[];
}

async function fetchPeople(): Promise<Person[]> {
  const res = await api.get<Person[]>("/people");
  return res.data;
}

async function fetchDepartments(): Promise<Department[]> {
  const res = await api.get<Department[]>("/departments");
  return res.data;
}

function roleBadgeVariant(role: string): "destructive" | "default" | "secondary" {
  if (role === "ADMIN") return "destructive";
  if (role === "STAFF") return "default";
  return "secondary";
}

// Sub-tab: Emails
function EmailsTab({ personId }: { personId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");

  const { data: emails = [] } = useQuery<Email[]>({
    queryKey: ["people", personId, "emails"],
    queryFn: async () => {
      const res = await api.get<Email[]>(`/people/${personId}/emails`);
      return res.data;
    },
    enabled: !!personId,
  });

  const addMutation = useMutation({
    mutationFn: async (email: string) => {
      await api.post(`/people/${personId}/emails`, { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people", personId, "emails"] });
      setNewEmail("");
      toast({ title: "Email added" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add email", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (emailId: number) => {
      await api.delete(`/people/${personId}/emails/${emailId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people", personId, "emails"] });
      toast({ title: "Email removed" });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove email", variant: "destructive" }),
  });

  return (
    <div className="space-y-2">
      {emails.map((e) => (
        <div key={e.id} className="flex items-center justify-between gap-2 p-2 border rounded">
          <span className="text-sm">{e.email}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate(e.id)}
            aria-label={`Remove email ${e.email}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Input
          placeholder="Add email..."
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          type="email"
        />
        <Button
          size="sm"
          onClick={() => newEmail && addMutation.mutate(newEmail)}
          disabled={!newEmail || addMutation.isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Sub-tab: Phones
function PhonesTab({ personId }: { personId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPhone, setNewPhone] = useState("");

  const { data: phones = [] } = useQuery<Phone[]>({
    queryKey: ["people", personId, "phones"],
    queryFn: async () => {
      const res = await api.get<Phone[]>(`/people/${personId}/phones`);
      return res.data;
    },
    enabled: !!personId,
  });

  const addMutation = useMutation({
    mutationFn: async (phone: string) => {
      await api.post(`/people/${personId}/phones`, { phone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people", personId, "phones"] });
      setNewPhone("");
      toast({ title: "Phone added" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add phone", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (phoneId: number) => {
      await api.delete(`/people/${personId}/phones/${phoneId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people", personId, "phones"] });
      toast({ title: "Phone removed" });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove phone", variant: "destructive" }),
  });

  return (
    <div className="space-y-2">
      {phones.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2 p-2 border rounded">
          <span className="text-sm">{p.phone}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate(p.id)}
            aria-label={`Remove phone ${p.phone}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Input
          placeholder="Add phone..."
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          type="tel"
        />
        <Button
          size="sm"
          onClick={() => newPhone && addMutation.mutate(newPhone)}
          disabled={!newPhone || addMutation.isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Sub-tab: Addresses
function AddressesTab({ personId }: { personId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAddress, setNewAddress] = useState("");

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ["people", personId, "addresses"],
    queryFn: async () => {
      const res = await api.get<Address[]>(`/people/${personId}/addresses`);
      return res.data;
    },
    enabled: !!personId,
  });

  const addMutation = useMutation({
    mutationFn: async (address: string) => {
      await api.post(`/people/${personId}/addresses`, { address });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people", personId, "addresses"] });
      setNewAddress("");
      toast({ title: "Address added" });
    },
    onError: () => toast({ title: "Error", description: "Failed to add address", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (addressId: number) => {
      await api.delete(`/people/${personId}/addresses/${addressId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people", personId, "addresses"] });
      toast({ title: "Address removed" });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove address", variant: "destructive" }),
  });

  return (
    <div className="space-y-2">
      {addresses.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-2 p-2 border rounded">
          <span className="text-sm">{a.address}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate(a.id)}
            aria-label={`Remove address ${a.address}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Input
          placeholder="Add address..."
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
        />
        <Button
          size="sm"
          onClick={() => newAddress && addMutation.mutate(newAddress)}
          disabled={!newAddress || addMutation.isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Sheet form for Person create/edit
function PersonSheet({ person, onClose }: { person: Person | null; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const [form, setForm] = useState({
    firstName: person?.firstName ?? "",
    lastName: person?.lastName ?? "",
    organization: person?.organization ?? "",
    departmentId: person?.departmentId ? String(person.departmentId) : "",
    role: person?.role ?? "STAFF",
    username: person?.username ?? "",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
      };
      if (person) {
        await api.put(`/people/${person.id}`, payload);
      } else {
        await api.post("/people", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      toast({ title: "Saved", description: "Person saved successfully." });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="person-firstName">First Name</label>
          <Input
            id="person-firstName"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="person-lastName">Last Name</label>
          <Input
            id="person-lastName"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="person-org">Organization (optional)</label>
        <Input
          id="person-org"
          value={form.organization}
          onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="person-dept">Department</label>
        <Select
          value={form.departmentId}
          onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
        >
          <SelectTrigger id="person-dept">
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
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="person-role">Role</label>
        <Select
          value={form.role}
          onValueChange={(v) => setForm((f) => ({ ...f, role: v as Person["role"] }))}
        >
          <SelectTrigger id="person-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STAFF">Staff</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="PUBLIC">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="person-username">Username</label>
        <Input
          id="person-username"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
        />
      </div>

      {/* Sub-tabs for existing person */}
      {person && (
        <div className="mt-4 border-t pt-4">
          <Tabs defaultValue="emails">
            <TabsList>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="phones">Phones</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
            </TabsList>
            <TabsContent value="emails" className="mt-3">
              <EmailsTab personId={person.id} />
            </TabsContent>
            <TabsContent value="phones" className="mt-3">
              <PhonesTab personId={person.id} />
            </TabsContent>
            <TabsContent value="addresses" className="mt-3">
              <AddressesTab personId={person.id} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export function PeoplePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const columns: ColumnDef<Person>[] = [
    {
      key: "name",
      header: "Name",
      cell: (p) => `${p.lastName}, ${p.firstName}`,
    },
    {
      key: "department",
      header: "Department",
      cell: (p) => p.departmentName ? <Badge variant="outline">{p.departmentName}</Badge> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "role",
      header: "Role",
      cell: (p) => <Badge variant={roleBadgeVariant(p.role)}>{p.role}</Badge>,
    },
    {
      key: "username",
      header: "Username",
      cell: (p) => <span className="font-mono text-sm">{p.username}</span>,
    },
    {
      key: "emails",
      header: "Emails",
      cell: (p) => (
        <Badge variant="secondary">{p.emailCount ?? 0}</Badge>
      ),
    },
  ];

  async function handleDelete(person: Person) {
    // Check if department default warning needed
    if (person.departmentId) {
      toast({
        title: "Warning",
        description: "This person is a default assignee for a department",
        variant: "destructive",
      });
    }
    await api.delete(`/people/${person.id}`);
    queryClient.invalidateQueries({ queryKey: ["people"] });
  }

  return (
    <AdminListPage<Person>
      title="People"
      breadcrumb={["Admin", "People"]}
      columns={columns}
      fetchFn={fetchPeople}
      queryKey={["people"]}
      renderSheet={(item, onClose) => (
        <PersonSheet person={item} onClose={onClose} />
      )}
      onDelete={handleDelete}
      getDeleteTitle={(p) => `Delete ${p.lastName}, ${p.firstName}?`}
      getDeleteMessage={(p) => (
        <span>
          This will permanently delete{" "}
          <strong>
            {p.firstName} {p.lastName}
          </strong>{" "}
          and all their contact records.
        </span>
      )}
      getDeleteButtonText={() => "Delete Person"}
      searchPlaceholder="Search people..."
      searchFilter={(p, q) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q)
      }
    />
  );
}
