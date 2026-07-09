import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapWidget } from '@/components/dashboard/MapWidget';
import { CloseDialog } from './CloseDialog';
import { ReopenDialog } from './ReopenDialog';
import { SlaProgressBar } from './SlaProgressBar';
import { MediaGallery } from './MediaGallery';
import type { Ticket, Media } from '@/types/ticket';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
}

interface IssueType {
  id: number;
  name: string;
}

interface ContactMethod {
  id: number;
  name: string;
}

interface MetadataPanelProps {
  ticket: Ticket;
  media: Media[];
  ticketId: string;
}

// Skeleton loader for MetadataPanel
export function MetadataPanelSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

export function MetadataPanel({ ticket, media, ticketId }: MetadataPanelProps) {
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch options for editable select fields
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories-public'],
    queryFn: () => fetch('/api/categories/public').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
  });

  const { data: issueTypes = [] } = useQuery<IssueType[]>({
    queryKey: ['issue-types'],
    queryFn: () => fetch('/api/issue-types').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
  });

  const { data: contactMethods = [] } = useQuery<ContactMethod[]>({
    queryKey: ['contact-methods'],
    queryFn: () => fetch('/api/contact-methods').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
  });

  // PATCH mutation with optimistic update
  const patchMutation = useMutation({
    mutationFn: (updates: Partial<Ticket>) =>
      fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['ticket', ticketId] });
      const prev = queryClient.getQueryData<Ticket>(['ticket', ticketId]);
      queryClient.setQueryData<Ticket>(['ticket', ticketId], old =>
        old ? { ...old, ...updates } : old
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['ticket', ticketId], context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setEditField(null);
    },
  });

  const startEdit = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue ?? '');
  };

  const cancelEdit = () => {
    setEditField(null);
    setEditValue('');
  };

  const saveEdit = (fieldKey: string, value: unknown) => {
    patchMutation.mutate({ [fieldKey]: value } as Partial<Ticket>);
  };

  // Build GeoJSON for mini-map pin
  const miniGeoJSON: GeoJSON.FeatureCollection | null =
    ticket.lat && ticket.lon
      ? {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [ticket.lon, ticket.lat] },
              properties: { id: ticket.id, ticketId: ticket.ticketId },
            },
          ],
        }
      : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        {/* Status badge + case ID */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={ticket.status === 'open' ? 'open' : 'default'}>{ticket.status}</Badge>
          {ticket.substatus && (
            <Badge variant="outline">{ticket.substatus}</Badge>
          )}
          <CardTitle className="text-lg">Case #{ticket.ticketId}</CardTitle>
        </div>

        {/* Status action buttons */}
        <div className="flex gap-2 mt-2">
          {ticket.status !== 'closed' ? (
            <CloseDialog ticketId={ticketId} />
          ) : (
            <ReopenDialog ticketId={ticketId} />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category */}
        <EditableField
          label="Category"
          displayValue={ticket.categoryName}
          isEditing={editField === 'categoryId'}
          onEdit={() => startEdit('categoryId', String(ticket.categoryId ?? ''))}
          onCancel={cancelEdit}
          onSave={() => saveEdit('categoryId', Number(editValue))}
          isSaving={patchMutation.isPending}
          editControl={
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        {/* Location */}
        <EditableField
          label="Location"
          displayValue={ticket.location ?? '—'}
          isEditing={editField === 'location'}
          onEdit={() => startEdit('location', ticket.location ?? '')}
          onCancel={cancelEdit}
          onSave={() => saveEdit('location', editValue)}
          isSaving={patchMutation.isPending}
          editControl={
            <Input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              placeholder="Enter location..."
            />
          }
        />

        {/* Description */}
        <EditableField
          label="Description"
          displayValue={ticket.description ?? '—'}
          isEditing={editField === 'description'}
          onEdit={() => startEdit('description', ticket.description ?? '')}
          onCancel={cancelEdit}
          onSave={() => saveEdit('description', editValue)}
          isSaving={patchMutation.isPending}
          editControl={
            <Textarea
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              rows={3}
              placeholder="Enter description..."
            />
          }
        />

        {/* Issue Type */}
        <EditableField
          label="Issue Type"
          displayValue={ticket.issueType ?? '—'}
          isEditing={editField === 'issueTypeId'}
          onEdit={() => startEdit('issueTypeId', String(ticket.issueTypeId ?? ''))}
          onCancel={cancelEdit}
          onSave={() => saveEdit('issueTypeId', Number(editValue))}
          isSaving={patchMutation.isPending}
          editControl={
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type..." />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map(it => (
                  <SelectItem key={it.id} value={String(it.id)}>
                    {it.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        {/* Contact Method */}
        <EditableField
          label="Contact Method"
          displayValue={ticket.contactMethod ?? '—'}
          isEditing={editField === 'contactMethodId'}
          onEdit={() => startEdit('contactMethodId', String(ticket.contactMethodId ?? ''))}
          onCancel={cancelEdit}
          onSave={() => saveEdit('contactMethodId', Number(editValue))}
          isSaving={patchMutation.isPending}
          editControl={
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger>
                <SelectValue placeholder="Select contact method..." />
              </SelectTrigger>
              <SelectContent>
                {contactMethods.map(cm => (
                  <SelectItem key={cm.id} value={String(cm.id)}>
                    {cm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        {/* Reporter info (read-only) */}
        {ticket.reporterName && (
          <div className="text-sm">
            <span className="text-muted-foreground">Reporter: </span>
            <span>{ticket.reporterName}</span>
            {ticket.reporterEmail && (
              <span className="text-muted-foreground ml-1">({ticket.reporterEmail})</span>
            )}
          </div>
        )}

        {/* Department (read-only) */}
        <div className="text-sm">
          <span className="text-muted-foreground">Department: </span>
          <span>{ticket.departmentName}</span>
        </div>

        {/* SLA Progress Bar */}
        {ticket.slaDays && (
          <SlaProgressBar
            slaDays={ticket.slaDays}
            enteredDate={ticket.enteredDate}
            isOverdue={ticket.isOverdue}
          />
        )}

        {/* Mini-map (static single marker) */}
        {miniGeoJSON && (
          <div className="h-40 rounded-md overflow-hidden">
            <MapWidget clusters={miniGeoJSON} loading={false} />
          </div>
        )}

        {/* Media Gallery */}
        <MediaGallery media={media} ticketId={ticketId} />
      </CardContent>
    </Card>
  );
}

// ---- EditableField sub-component ----

interface EditableFieldProps {
  label: string;
  displayValue: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  editControl: React.ReactNode;
}

function EditableField({
  label,
  displayValue,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  isSaving,
  editControl,
}: EditableFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {!isEditing && (
          <button
            aria-label={`Edit ${label}`}
            onClick={onEdit}
            className={cn(
              'p-1 rounded hover:bg-accent transition-colors',
              'text-muted-foreground hover:text-foreground'
            )}
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          {editControl}
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={isSaving}
              onClick={onSave}
              className="h-7 px-3 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="h-7 px-3 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm">{displayValue}</p>
      )}
    </div>
  );
}
