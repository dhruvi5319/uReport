// frontend/src/app/(staff)/map/components/TicketPinLayer.tsx
'use client';

import { Marker, Popup } from 'react-leaflet';
import Link from 'next/link';
import type { TicketPin } from '@/types/geo';

interface TicketPinLayerProps {
  pins: TicketPin[];
}

export function TicketPinLayer({ pins }: TicketPinLayerProps) {
  return (
    <>
      {pins.map((pin) => (
        <Marker
          key={`pin-${pin.id}`}
          position={[pin.lat, pin.lng]}
          title={`Ticket #${pin.id}: ${pin.title}`}
        >
          <Popup>
            <div className="min-w-40 text-sm">
              <p className="font-semibold text-gray-900">#{pin.id}</p>
              <p className="text-gray-700 mt-0.5 leading-snug">{pin.title}</p>
              <span
                className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                  pin.status === 'open'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {pin.status}
              </span>
              <div className="mt-2">
                <Link
                  href={`/tickets/${pin.id}`}
                  className="text-blue-600 hover:underline text-xs"
                >
                  View ticket →
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
