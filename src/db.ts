import Dexie, { type Table } from 'dexie';

export interface Document {
  id: string;
  title: string;
  content: string; // Lexical JSON string for editor state
  contentHtml: string; // Derived HTML for outline and AI context
  showLogo: boolean;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  widget?: {
    type: 'governing-law' | 'assignor-set';
    label: string;
    payload?: any;
  };
  timestamp: number;
}

class AppDatabase extends Dexie {
  documents!: Table<Document, string>;
  chats!: Table<ChatMessage, string>;

  constructor() {
    super('AIDocumentEditorDB');
    this.version(1).stores({
      documents: 'id, title, updatedAt',
      chats: 'id, sender, timestamp',
    });
  }
}

export const db = new AppDatabase();

const INITIAL_CHATS: ChatMessage[] = [
  {
    id: 'welcome-msg',
    sender: 'assistant',
    text: "Hello! I am Hynki. Ask me to help write sections, analyze legal terms, or customize the formatting of your document.",
    timestamp: Date.now()
  }
];

export async function seedDatabase() {
  const docCount = await db.documents.count();
  if (docCount === 0) {
    await db.documents.add({
      id: 'doc-default',
      title: 'Untitled Document',
      content: '',
      contentHtml: '',
      showLogo: true,
      updatedAt: Date.now(),
    });
  }

  // Clear existing mock chats if they are found in the DB (for users with existing DB states)
  const firstChat = await db.chats.get('chat-1');
  if (firstChat) {
    await db.chats.clear();
  }

  const chatCount = await db.chats.count();
  if (chatCount === 0) {
    await db.chats.bulkAdd(INITIAL_CHATS);
  }
}

