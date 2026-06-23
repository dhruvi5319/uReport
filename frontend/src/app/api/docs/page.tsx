import type { Metadata } from 'next';
import { SwaggerUiClient } from '@/components/api-docs/SwaggerUiClient';

export const metadata: Metadata = {
  title: 'API Documentation — uReport',
};

export default function ApiDocsPage() {
  return (
    <main id="main-content" className="h-full">
      <SwaggerUiClient specUrl="/api/openapi.json" />
    </main>
  );
}
