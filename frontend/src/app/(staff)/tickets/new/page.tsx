import { CreateTicketForm } from '@/components/tickets/CreateTicketForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewTicketPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <h1 className="text-lg font-semibold">New Ticket</h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/tickets">✕ Cancel</Link>
        </Button>
      </div>
      <CreateTicketForm />
    </div>
  );
}
