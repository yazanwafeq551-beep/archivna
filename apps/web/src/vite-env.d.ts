/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the API. Empty means same-origin, which only holds in a browser. */
  readonly VITE_API_URL?: string;
  /** Where the site lives for other people: printed on certificates, copied by share buttons. */
  readonly VITE_PUBLIC_WEB_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
