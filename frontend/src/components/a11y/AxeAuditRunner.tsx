'use client';

import { useEffect } from 'react';

export function AxeAuditRunner() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    import('@axe-core/react')
      .then(({ default: axe }) => {
        import('react').then((React) => {
          import('react-dom').then((ReactDOM) => {
            axe(React.default, ReactDOM.default, 1000);
          });
        });
      })
      .catch(() => {
        // axe-core not installed — skip silently
      });
  }, []);
  return null;
}
