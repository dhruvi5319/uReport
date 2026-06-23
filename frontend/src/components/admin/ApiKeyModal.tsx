'use client';

import React, { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ApiKeyModalProps {
  open: boolean;
  apiKey: string;
  clientName: string;
  onConfirm: () => void;
}

/**
 * One-time API key display modal.
 * 
 * Critical UX requirements:
 * - ONLY exit is the "I've saved my key — Close" confirm button
 * - NO X close button
 * - NO dismiss on outside click or Escape key
 * - Copy to clipboard with accessible live announcement
 * 
 * Per UX-Mockup Flow-05 exact design.
 */
export function ApiKeyModal({ open, apiKey, clientName, onConfirm }: ApiKeyModalProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  // Reset copy status when modal opens
  useEffect(() => {
    if (open) {
      setCopyStatus('idle');
    }
  }, [open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopyStatus('copied');
      // Reset after 2 seconds
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
    }
  }

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        {/* Overlay — non-dismissable */}
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        />

        {/* Dialog content */}
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]',
            'rounded-lg border border-gray-200 bg-white p-6 shadow-xl',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          )}
          aria-labelledby="apikey-modal-title"
          aria-describedby="apikey-modal-desc"
          // CRITICAL: Prevent ALL dismiss behaviors — only confirm button exits
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          // NO close button (no DialogClose)
        >
          {/* Title */}
          <DialogPrimitive.Title
            id="apikey-modal-title"
            className="text-lg font-semibold text-gray-900 mb-1"
          >
            API Key Generated
          </DialogPrimitive.Title>

          <p className="text-sm text-gray-600 mb-4">
            For client: <strong>{clientName}</strong>
          </p>

          {/* Key display — monospace, selectable */}
          <div className="rounded-md border border-gray-300 bg-gray-50 px-4 py-3 mb-3">
            <code
              className="block text-sm font-mono text-gray-900 break-all select-all"
              aria-label="API key value"
            >
              {apiKey}
            </code>
          </div>

          {/* Copy button */}
          <div className="mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleCopy()}
              aria-label="Copy API key to clipboard"
            >
              📋 Copy to clipboard
            </Button>

            {/* Live region for copy status announcement */}
            <span
              aria-live="polite"
              aria-atomic="true"
              className={cn(
                'ml-2 text-sm transition-opacity',
                copyStatus === 'idle' ? 'opacity-0' : 'opacity-100',
                copyStatus === 'copied' ? 'text-green-600' : 'text-red-600',
              )}
            >
              {copyStatus === 'copied'
                ? '✅ Copied!'
                : copyStatus === 'error'
                  ? 'Unable to copy — select and copy manually'
                  : ''}
            </span>
          </div>

          {/* Warning */}
          <DialogPrimitive.Description
            id="apikey-modal-desc"
            className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 mb-6"
          >
            <span aria-hidden="true" className="text-amber-500 text-base leading-5 shrink-0">
              ⚠️
            </span>
            <span>
              <strong>This key will not be shown again.</strong>
              <br />
              Store it securely before closing.
            </span>
          </DialogPrimitive.Description>

          {/* Confirm — ONLY exit */}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={onConfirm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              I&apos;ve saved my key — Close
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
