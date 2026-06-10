/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Relay Worker URL (built-in translation). Empty disables the relay option. */
  readonly VITE_RELAY_URL?: string;
  /** Shared secret sent to the relay (Authorization: Bearer ...). */
  readonly VITE_RELAY_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
