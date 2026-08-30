import type { ChatState } from "@/lib/chatbot";

export interface ChatMessage {
  id: number;
  role: "bot" | "user";
  text: string;
}

export interface ChatCar {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceFormatted: string;
  km: number;
  fuel: string;
  city: string;
  image: string;
  photos?: string[];
  source: string;
  url: string;
  score: number;
  inventoryType?: "new" | "used";
  bodyType?: string;
  contact?: {
    name?: string;
    phone?: string;
    phoneHref?: string;
    whatsappHref?: string;
    url?: string;
  };
  reputation?: {
    verified?: boolean;
    trustBadge?: boolean;
    views?: number;
    label?: string;
  };
}

export interface ChatSessionSnapshot {
  messages: ChatMessage[];
  botState: ChatState;
  results: ChatCar[] | null;
  resultLimit: number;
  quickReplies: string[];
}

const STORAGE_KEY = "thiqti_chat_session";
const PERSISTENT_KEY = "thiqti_chat_session_persistent";

export function saveChatSession(snapshot: ChatSessionSnapshot, persistent = false): void {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(snapshot);
  try {
    sessionStorage.setItem(STORAGE_KEY, json);
  } catch { /* ignore */ }
  if (persistent) {
    try {
      localStorage.setItem(PERSISTENT_KEY, json);
    } catch { /* ignore */ }
  }
}

export function loadChatSession(): ChatSessionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    // Priorité au localStorage (session persistante pour les connectés)
    const raw = localStorage.getItem(PERSISTENT_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatSessionSnapshot;
    if (!parsed || !Array.isArray(parsed.messages) || !parsed.botState) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearChatSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PERSISTENT_KEY);
  } catch { /* ignore */ }
}

/** Chasse l'ID max des messages réhydratés pour que `idRef` ne entre en collision. */
export function maxMessageId(messages: ChatMessage[]): number {
  return messages.reduce((max, m) => Math.max(max, m.id), -1) + 1;
}
