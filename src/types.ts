export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64 encoding or raw text content
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string; // e.g. 'College' | 'AI' | 'Startup' | 'Fitness' | 'Travel' | 'Uncategorized'
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
  userId?: string;
}

export interface Message {
  id: string;
  role: "user" | "model" | "system";
  content: string;
  actionUsed?: string | null;
  timestamp: string;
}

export type FolderType = "College" | "AI" | "Startup" | "Fitness" | "Travel" | "Uncategorized";
