import Dexie, { type Table } from 'dexie';

export interface Document {
  id: string;
  title: string;
  content: string; // HTML string for rich text editor
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

const DEFAULT_CONTENT = `
<h2>Intellectual Property Assignment Agreement</h2>
<p>This Intellectual Property Assignment Agreement (the "Agreement") is entered into as of 25/05/2025, by and between: <strong>Sebastian Cornelius</strong>, an individual residing at 123 Innovation Drive, Suite 400, San Francisco, CA 94105 (the "Assignor"), and <strong>QuantumNova Technologies, Inc</strong> (the "Company").</p>

<h3>1. Assignment of Intellectual Property</h3>
<p>(a) Assignment. For good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Assignor hereby irrevocably assigns, transfers, and conveys to the Company, its successors and assigns, all right, title, and interest worldwide in and to any and all Intellectual Property (as defined below) that the Assignor has conceived, developed, authored, reduced to practice, or otherwise created, in whole or in part, (i) in the course of performing services for or on behalf of the Company, whether as an employee, consultant, or independent contractor, or (ii) using the Company's resources, confidential information, or facilities (collectively, the "Assigned IP").</p>

<h3>2. Governing Law</h3>
<p>This Agreement, and all claims or causes of action (whether in contract, tort or statute) that may be based upon, arise out of or relate to this Agreement, shall be governed by, and enforced in accordance with, the internal laws of the State of California, without regard to its conflict of laws principles.</p>

<h3>3. Further Assurances</h3>
<p>The Assignor agrees to assist the Company, or its designee, in every proper way to secure the Company's rights in the Assigned IP and any copyrights, patents, or other intellectual property rights relating thereto in any and all countries, including the disclosure to the Company of all pertinent information and data with respect thereto, the execution of all applications, specifications, oaths, assignments, and all other instruments which the Company shall deem necessary in order to apply for and obtain such rights.</p>
`;

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
      title: 'Intellectual Property Assignment Agreement',
      content: DEFAULT_CONTENT,
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

