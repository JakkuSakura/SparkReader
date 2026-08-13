import type {
  Account,
  Attachment,
  AttachmentSearchResponse,
  Folder,
  MessageDetail,
  SearchResponse,
} from "./types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`request failed: ${res.status} ${detail}`);
  }
  return (await res.json()) as T;
}

export function searchMessages(params: Record<string, string | number | boolean>): Promise<SearchResponse> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === "" || v === null || v === undefined) continue;
    qs.set(k, String(v));
  }
  const query = qs.toString();
  return getJson<SearchResponse>(`/messages/search${query ? `?${query}` : ""}`);
}

export function getMessage(pk: number): Promise<MessageDetail> {
  return getJson<MessageDetail>(`/messages/${pk}`);
}

export function getMessageAttachments(pk: number): Promise<Attachment[]> {
  return getJson<Attachment[]>(`/messages/${pk}/attachments`);
}

export function getConversationMessages(pk: number): Promise<MessageDetail[]> {
  return getJson<MessageDetail[]>(`/conversations/${pk}/messages`);
}

export function getAccounts(): Promise<Account[]> {
  return getJson<Account[]>("/accounts");
}

export function getFolders(account?: number): Promise<Folder[]> {
  const qs = account !== undefined ? `?account=${account}` : "";
  return getJson<Folder[]>(`/folders${qs}`);
}

export function searchAttachments(params: Record<string, string | number>): Promise<AttachmentSearchResponse> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === "" || v === null || v === undefined) continue;
    qs.set(k, String(v));
  }
  const query = qs.toString();
  return getJson<AttachmentSearchResponse>(`/attachments/search${query ? `?${query}` : ""}`);
}
