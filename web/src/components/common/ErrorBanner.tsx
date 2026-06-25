import React from 'react';

interface ErrorBannerProps { error: string | null; }
const ErrorBanner: React.FC<ErrorBannerProps> = ({ error }) => {
  if (!error) return null;
  return (
    <div role="alert" style={{ background: '#fee', border: '1px solid #f88', padding: '0.75rem 1rem', borderRadius: 4, color: '#900', marginBottom: '1rem' }}>
      {error}
    </div>
  );
};
export default ErrorBanner;
