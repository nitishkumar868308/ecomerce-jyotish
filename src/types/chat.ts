export interface Message {
  id: number;
  sessionId: number;
  senderId: number;
  content: string;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  isRead: boolean;
  createdAt: string;
}

export interface ChatSessionInfo {
  id: number;
  participants: { id: number; name: string; avatar?: string }[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}
