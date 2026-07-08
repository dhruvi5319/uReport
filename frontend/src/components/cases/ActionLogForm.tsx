import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Action, ActionResponse, TicketHistory } from '@/types/ticket';

interface ActionLogFormProps {
  ticketId: string;
  departmentId?: number;
}

export function ActionLogForm({ ticketId, departmentId }: ActionLogFormProps) {
  const queryClient = useQueryClient();

  // Fetch action types filtered by department
  const { data: actions = [] } = useQuery<Action[]>({
    queryKey: ['actions', departmentId],
    queryFn: () =>
      fetch(`/api/actions${departmentId ? `?departmentId=${departmentId}` : ''}`).then(r =>
        r.json()
      ),
    enabled: true,
  });

  const [selectedActionId, setSelectedActionId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [notifyAssignee, setNotifyAssignee] = useState(false);
  const [notifyReporter, setNotifyReporter] = useState(false);

  // Fetch templates when action selected
  const { data: templates = [] } = useQuery<ActionResponse[]>({
    queryKey: ['action-templates', ticketId, selectedActionId],
    queryFn: () =>
      fetch(`/api/categories/${ticketId}/action-responses/${selectedActionId}`).then(r =>
        r.json()
      ),
    enabled: !!selectedActionId,
  });

  // When template selected, populate notes field
  useEffect(() => {
    if (selectedTemplateId && templates.length > 0) {
      const t = templates.find(t => String(t.id) === selectedTemplateId);
      if (t) setNotes(t.responseText);
    }
  }, [selectedTemplateId, templates]);

  const submitMutation = useMutation({
    mutationFn: (payload: object) =>
      fetch(`/api/tickets/${ticketId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
    // Optimistic update: prepend new entry to history list immediately
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['ticket-history', ticketId] });
      const prev = queryClient.getQueryData<TicketHistory[]>(['ticket-history', ticketId]);
      const optimisticEntry: TicketHistory = {
        id: Date.now(), // temp ID
        actionName: actions.find(a => String(a.id) === selectedActionId)?.name ?? 'Action',
        notes,
        actorName: 'You', // current user
        createdAt: new Date().toISOString(),
        media: [],
        isPending: true,
      };
      queryClient.setQueryData<TicketHistory[]>(
        ['ticket-history', ticketId],
        old => [optimisticEntry, ...(old ?? [])]
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev)
        queryClient.setQueryData(['ticket-history', ticketId], context.prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-history', ticketId] });
      // Reset form
      setSelectedActionId('');
      setSelectedTemplateId('');
      setNotes('');
      setNotifyAssignee(false);
      setNotifyReporter(false);
    },
  });

  const handleSubmit = () => {
    if (!selectedActionId) return;
    submitMutation.mutate({
      actionId: Number(selectedActionId),
      templateId: selectedTemplateId ? Number(selectedTemplateId) : undefined,
      notes,
      notifyAssignee,
      notifyReporter,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Log Action / Response</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Action type select */}
        <Select value={selectedActionId} onValueChange={setSelectedActionId}>
          <SelectTrigger>
            <SelectValue placeholder="Select action type..." />
          </SelectTrigger>
          <SelectContent>
            {actions.map(a => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Template select — only shown when action selected and templates exist */}
        {selectedActionId && templates.length > 0 && (
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="Use response template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map(t => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Notes textarea */}
        <Textarea
          placeholder="Add notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
        />

        {/* Notify checkboxes */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={notifyAssignee}
              onChange={e => setNotifyAssignee(e.target.checked)}
            />
            Notify assignee
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={notifyReporter}
              onChange={e => setNotifyReporter(e.target.checked)}
            />
            Notify reporter
          </label>
        </div>

        <Button
          className="w-full"
          disabled={!selectedActionId || submitMutation.isPending}
          onClick={handleSubmit}
        >
          {submitMutation.isPending ? 'Submitting...' : 'Submit'}
        </Button>
      </CardContent>
    </Card>
  );
}
