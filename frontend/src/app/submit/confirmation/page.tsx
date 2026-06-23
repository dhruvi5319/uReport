'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ConfirmationContent() {
  const sp = useSearchParams();
  const id = sp.get('id');
  const category = sp.get('category') ?? '';
  const address = sp.get('address') ?? '';
  const email = sp.get('email') ?? '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 max-w-sm mx-auto text-center gap-6">
      <div className="text-5xl">✅</div>
      <h1 className="text-2xl font-semibold">Report submitted!</h1>

      {id && (
        <p className="text-muted-foreground">
          Report #{id}
          <br />
          {category && <span>{category}<br /></span>}
          {address && <span className="text-sm">{address}</span>}
        </p>
      )}

      {id && (
        <Link
          href={`/track/${id}`}
          className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-11 px-6 font-medium"
        >
          Check report status →
        </Link>
      )}

      {email && (
        <p className="text-sm text-muted-foreground">
          📧 Confirmation email sent to {email}
        </p>
      )}

      <Link href="/submit" className="text-sm underline text-muted-foreground">
        Submit another report
      </Link>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
