const env = import.meta.env;

export const DEFAULTS = {
  endpoint: env.VITE_TABLE_API_ENDPOINT?.trim() || 'https://onelake.table.fabric.microsoft.com',
  workspace: env.VITE_FABRIC_WORKSPACE_ID?.trim() ?? '',
  lakehouse: env.VITE_LAKEHOUSE_ID?.trim() ?? '',
  documentRoot: env.VITE_DOCUMENT_BASE_URL?.trim() ?? '',
};

export const shortId = (id: string) => id.length > 13 ? `${id.slice(0, 8)}…` : id;
