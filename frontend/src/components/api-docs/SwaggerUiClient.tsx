'use client';

import { useEffect, useRef } from 'react';

interface SwaggerUiClientProps {
  specUrl: string;
}

export function SwaggerUiClient({ specUrl }: SwaggerUiClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Load Swagger UI from CDN
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
    script.onload = () => {
      // @ts-expect-error SwaggerUIBundle is loaded from CDN
      const SwaggerUIBundle = window.SwaggerUIBundle;
      if (SwaggerUIBundle && containerRef.current) {
        SwaggerUIBundle({
          url: specUrl,
          domNode: containerRef.current,
          presets: [SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout',
          deepLinking: true,
          tryItOutEnabled: true,
        });
      }
    };
    document.body.appendChild(script);
  }, [specUrl]);

  return (
    <div
      ref={containerRef}
      id="swagger-ui"
      aria-label="uReport API documentation — interactive OpenAPI spec"
      className="min-h-screen"
    />
  );
}
