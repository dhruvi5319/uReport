'use client';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { postResponse, postComment } from '@/lib/api/tickets';
import { useToast } from '@/components/ui/use-toast';

interface ComposePanelProps {
  ticketId: number;
  onSent: () => void;
}

export function ComposePanel({ ticketId, onSent }: ComposePanelProps) {
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'response' | 'comment'>('response');
  const { toast } = useToast();

  const send = async () => {
    if (!body.trim()) return;
    setLoading(true);
    try {
      if (tab === 'response') {
        await postResponse(ticketId, { body });
        toast({ title: 'Response sent' });
      } else {
        await postComment(ticketId, { body });
        toast({ title: 'Internal comment added' });
      }
      setBody('');
      onSent();
    } catch (err: unknown) {
      const error = err as { status?: number };
      if (error?.status === 0) {
        toast({ variant: 'destructive', title: 'Email delivery failed — will retry automatically' });
      } else {
        toast({ variant: 'destructive', title: 'Failed to send' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-md p-3 space-y-2">
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'response' | 'comment')}>
        <TabsList className="w-full">
          <TabsTrigger value="response" className="flex-1">Response</TabsTrigger>
          <TabsTrigger value="comment" className="flex-1">Comment</TabsTrigger>
        </TabsList>

        <TabsContent value="response">
          <p className="text-xs text-gray-500 mb-1">Sent to reporter via email</p>
        </TabsContent>

        <TabsContent value="comment">
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs mb-1" role="status">
            🔒 <span>Internal — staff only. This note will NOT be sent to the reporter.</span>
          </div>
        </TabsContent>
      </Tabs>

      <Textarea
        placeholder={tab === 'response' ? 'Write a response to the reporter…' : 'Write an internal staff note…'}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        aria-label={tab === 'response' ? 'Response body' : 'Comment body'}
        className="resize-none"
      />

      <Button
        className="w-full"
        disabled={!body.trim() || loading}
        onClick={send}
      >
        {loading ? 'Sending…' : tab === 'response' ? 'Send Response' : 'Add Comment'}
      </Button>
    </div>
  );
}
