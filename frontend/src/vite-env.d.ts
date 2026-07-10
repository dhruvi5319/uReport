/// <reference types="vite/client" />

// Typed access to the app's Vite env flags. Without this, `import.meta.env`
// is untyped and `tsc` (run by `npm run build`) fails — which also breaks the
// Docker frontend build. See LoginPage.tsx (VITE_USE_DEV_LOGIN dev-login switch).
interface ImportMetaEnv {
  readonly VITE_USE_DEV_LOGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
