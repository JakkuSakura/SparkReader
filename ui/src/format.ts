export function formatDate(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function senderLabel(message: { messageFrom: string | null; messageFromMailbox: string | null }): string {
  const name = message.messageFrom?.trim();
  const mailbox = message.messageFromMailbox?.trim();
  if (name && mailbox && name !== mailbox) return `${name} <${mailbox}>`;
  return mailbox || name || "(unknown sender)";
}
