export interface Account {
  pk: number;
  accountType: number;
  accountTitle: string | null;
  ownerFullName: string | null;
  ownerPictureURL: string | null;
  additionalInfo: string | null;
}

export interface Folder {
  pk: number;
  accountPk: number;
  parentPk: number | null;
  folderName: string;
  folderPath: string | null;
  imapPath: string | null;
  imapMessageCount: number | null;
}

export interface Message {
  pk: number;
  accountPk: number;
  messageType: number;
  creationDate: number;
  receivedDate: number;
  messageFrom: string | null;
  messageFromMailbox: string | null;
  messageTo: string | null;
  messageCc: string | null;
  messageBcc: string | null;
  subject: string | null;
  shortBody: string | null;
  conversationPk: number;
  numberOfFileAttachments: number;
  starred: number;
  unseen: number;
  inInbox: number;
  inSent: number;
  inDrafts: number;
  snoozed: number;
  category: number;
  messageId: string | null;
  meta: unknown;
}

export interface MessageDetail extends Message {
  bodyHtml: string | null;
}

export interface Attachment {
  pk: number;
  attachmentType: number;
  attachmentMIMEType: string;
  attachmentSize: number;
  attachmentName: string | null;
  attachmentURL: string | null;
  remoteURL: string | null;
  imageDimensions: string | null;
}

export interface AttachmentSummary {
  messagePk: number;
  attachmentMIMEType: string;
  attachmentSize: number;
  attachmentName: string | null;
}

export interface SearchResponse {
  total: number;
  count: number;
  results: Message[];
}

export interface AttachmentSearchResponse {
  count: number;
  results: AttachmentSummary[];
}
