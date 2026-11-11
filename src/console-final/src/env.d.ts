/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TABLE_API_ENDPOINT?: string;
  readonly VITE_FABRIC_WORKSPACE_ID?: string;
  readonly VITE_LAKEHOUSE_ID?: string;
  readonly VITE_DOCUMENT_BASE_URL?: string;
}
