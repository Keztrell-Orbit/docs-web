import type { LexicalEditor } from "lexical";
import {
  UNDO_COMMAND,
  REDO_COMMAND,
  FORMAT_TEXT_COMMAND,
  $getRoot,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import type { DocSnapshot } from "../../types";

export const HISTORICAL_VERSIONS: DocSnapshot[] = [
  {
    label: "Original Draft (Before AI)",
    timestamp: "25/05/2025 10:00 AM",
    showLogo: false,
    content: `
<h2>Intellectual Property Assignment Agreement</h2>
<p>This Intellectual Property Assignment Agreement (the "Agreement") is entered into as of 25/05/2025, by and between: <strong>John Smith</strong>, an individual residing at 123 Innovation Drive, Suite 400, San Francisco, CA 94105 (the "Assignor"), and <strong>QuantumNova Technologies, Inc</strong> (the "Company").</p>

<h3>1. Assignment of Intellectual Property</h3>
<p>(a) Assignment. For good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Assignor hereby irrevocably assigns, transfers, and conveys to the Company, its successors and assigns, all right, title, and interest worldwide in and to any and all Intellectual Property (as defined below) that the Assignor has conceived, developed, authored, reduced to practice, or otherwise created, in whole or in part, (i) in the course of performing services for or on behalf of the Company, whether as an employee, consultant, or independent contractor, or (ii) using the Company's resources, confidential information, or facilities (collectively, the "Assigned IP").</p>

<h3>2. Further Assurances</h3>
<p>The Assignor agrees to assist the Company, or its designee, in every proper way to secure the Company's rights in the Assigned IP and any copyrights, patents, or other intellectual property rights relating thereto in any and all countries, including the disclosure to the Company of all pertinent information and data with respect thereto, the execution of all applications, specifications, oaths, assignments, and all other instruments which the Company shall deem necessary in order to apply for and obtain such rights.</p>
`
  },
  {
    label: "Added Logo",
    timestamp: "25/05/2025 10:15 AM",
    showLogo: true,
    content: `
<h2>Intellectual Property Assignment Agreement</h2>
<p>This Intellectual Property Assignment Agreement (the "Agreement") is entered into as of 25/05/2025, by and between: <strong>John Smith</strong>, an individual residing at 123 Innovation Drive, Suite 400, San Francisco, CA 94105 (the "Assignor"), and <strong>QuantumNova Technologies, Inc</strong> (the "Company").</p>

<h3>1. Assignment of Intellectual Property</h3>
<p>(a) Assignment. For good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Assignor hereby irrevocably assigns, transfers, and conveys to the Company, its successors and assigns, all right, title, and interest worldwide in and to any and all Intellectual Property (as defined below) that the Assignor has conceived, developed, authored, reduced to practice, or otherwise created, in whole or in part, (i) in the course of performing services for or on behalf of the Company, whether as an employee, consultant, or independent contractor, or (ii) using the Company's resources, confidential information, or facilities (collectively, the "Assigned IP").</p>

<h3>2. Further Assurances</h3>
<p>The Assignor agrees to assist the Company, or its designee, in every proper way to secure the Company's rights in the Assigned IP and any copyrights, patents, or other intellectual property rights relating thereto in any and all countries, including the disclosure to the Company of all pertinent information and data with respect thereto, the execution of all applications, specifications, oaths, assignments, and all other instruments which the Company shall deem necessary in order to apply for and obtain such rights.</p>
`
  },
  {
    label: "Added Governing Law Section",
    timestamp: "25/05/2025 10:20 AM",
    showLogo: true,
    content: `
<h2>Intellectual Property Assignment Agreement</h2>
<p>This Intellectual Property Assignment Agreement (the "Agreement") is entered into as of 25/05/2025, by and between: <strong>John Smith</strong>, an individual residing at 123 Innovation Drive, Suite 400, San Francisco, CA 94105 (the "Assignor"), and <strong>QuantumNova Technologies, Inc</strong> (the "Company").</p>

<h3>1. Assignment of Intellectual Property</h3>
<p>(a) Assignment. For good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Assignor hereby irrevocably assigns, transfers, and conveys to the Company, its successors and assigns, all right, title, and interest worldwide in and to any and all Intellectual Property (as defined below) that the Assignor has conceived, developed, authored, reduced to practice, or otherwise created, in whole or in part, (i) in the course of performing services for or on behalf of the Company, whether as an employee, consultant, or independent contractor, or (ii) using the Company's resources, confidential information, or facilities (collectually, the "Assigned IP").</p>

<h3>2. Governing Law</h3>
<p>This Agreement, and all claims or causes of action (whether in contract, tort or statute) that may be based upon, arise out of or relate to this Agreement, shall be governed by, and enforced in accordance with, the internal laws of the State of California, without regard to its conflict of laws principles.</p>

<h3>3. Further Assurances</h3>
<p>The Assignor agrees to assist the Company, or its designee, in every proper way to secure the Company's rights in the Assigned IP and any copyrights, patents, or other intellectual property rights relating thereto in any and all countries, including the disclosure to the Company of all pertinent information and data with respect thereto, the execution of all applications, specifications, oaths, assignments, and all other instruments which the Company shall deem necessary in order to apply for and obtain such rights.</p>
`
  },
  {
    label: "Updated Assignor (Sebastian Cornelius) [Current]",
    timestamp: "25/05/2025 10:22 AM",
    showLogo: true,
    content: `
<h2>Intellectual Property Assignment Agreement</h2>
<p>This Intellectual Property Assignment Agreement (the "Agreement") is entered into as of 25/05/2025, by and between: <strong>Sebastian Cornelius</strong>, an individual residing at 123 Innovation Drive, Suite 400, San Francisco, CA 94105 (the "Assignor"), and <strong>QuantumNova Technologies, Inc</strong> (the "Company").</p>

<h3>1. Assignment of Intellectual Property</h3>
<p>(a) Assignment. For good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Assignor hereby irrevocably assigns, transfers, and conveys to the Company, its successors and assigns, all right, title, and interest worldwide in and to any and all Intellectual Property (as defined below) that the Assignor has conceived, developed, authored, reduced to practice, or otherwise created, in whole or in part, (i) in the course of performing services for or on behalf of the Company, whether as an employee, consultant, or independent contractor, or (ii) using the Company's resources, confidential information, or facilities (collectively, the "Assigned IP").</p>

<h3>2. Governing Law</h3>
<p>This Agreement, and all claims or causes of action (whether in contract, tort or statute) that may be based upon, arise out of or relate to this Agreement, shall be governed by, and enforced in accordance with, the internal laws of the State of California, without regard to its conflict of laws principles.</p>

<h3>3. Further Assurances</h3>
<p>The Assignor agrees to assist the Company, or its designee, in every proper way to secure the Company's rights in the Assigned IP and any copyrights, patents, or other intellectual property rights relating thereto in any and all countries, including the disclosure to the Company of all pertinent information and data with respect thereto, the execution of all applications, specifications, oaths, assignments, and all other instruments which the Company shall deem necessary in order to apply for and obtain such rights.</p>
`
  },
];

export function createMenuList(
  editor: LexicalEditor | null,
  restoreSnapshot: (snapshot: DocSnapshot) => void,
  setInputText?: (text: string) => void,
  setIsChatOpen?: (open: boolean | ((prev: boolean) => boolean)) => void,
  resetWorkspace?: () => void,
  setIsHistoryOpen?: (open: boolean) => void,
  setZoomLevel?: (level: number) => void,
  highlightDocumentSection?: (keyword: string) => void,
  isHistoryOpen?: boolean,
  docTitle?: string
) {
  return {
    File: [
      { label: "📄 New document", action: () => alert("Created a new blank Hynki template document.") },
      { label: "⏳ Restore initial draft", action: () => restoreSnapshot(HISTORICAL_VERSIONS[0]) },
      {
        label: "📥 Download as TXT file", action: () => {
          const text = editor
            ? editor.getEditorState().read(() => $getRoot().getTextContent())
            : "";
          const blob = new Blob([text], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${docTitle || "document"}.txt`;
          a.click();
        }
      },
      { label: "⚠️ Reset whole workspace", action: () => resetWorkspace?.() }
    ],
    Edit: [
      { label: "↩️ Undo change (Ctrl+Z)", action: () => editor?.dispatchCommand(UNDO_COMMAND, undefined) },
      { label: "↪️ Redo change (Ctrl+Y)", action: () => editor?.dispatchCommand(REDO_COMMAND, undefined) },
      {
        label: "❌ Clear document content", action: () => {
          if (confirm("Clear document content?")) {
            editor?.update(() => $getRoot().clear());
          }
        }
      }
    ],
    View: [
      { label: "📂 Toggle revision logs", action: () => setIsHistoryOpen?.(!isHistoryOpen) },
      { label: "🔍 Reset Zoom to 100%", action: () => setZoomLevel?.(100) },
      { label: "💬 Toggle Hynki", action: () => setIsChatOpen?.(prev => !prev) }
    ],
    Insert: [
      { label: "➖ Insert horizontal divider", action: () => editor?.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined) },
      { label: "⚫ Insert bullet list", action: () => editor?.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined) },
      { label: "🔢 Insert numbered list", action: () => editor?.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined) }
    ],
    Format: [
      { label: "Bold text", action: () => editor?.dispatchCommand(FORMAT_TEXT_COMMAND, "bold") },
      { label: "Italic text", action: () => editor?.dispatchCommand(FORMAT_TEXT_COMMAND, "italic") },
      { label: "Strikethrough text", action: () => editor?.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough") }
    ],
    Tools: [
      {
        label: "📊 Word statistics", action: () => {
          const words = editor
            ? editor.getEditorState().read(() => $getRoot().getTextContent().split(/\s+/).filter(Boolean).length)
            : 0;
          alert(`This document has: ${words} words.`);
        }
      },
      { label: "🔍 Find 'Sebastian Cornelius'", action: () => highlightDocumentSection?.("Sebastian Cornelius") },
      { label: "🔍 Find 'Governing Law'", action: () => highlightDocumentSection?.("Governing Law") }
    ],
    Hynki: [
      {
        label: "✨ Summarize current document", action: () => {
          setInputText?.("Please summarize the current document for me.");
          setIsChatOpen?.(true);
        }
      },
      {
        label: "✍️ Suggest 3 key improvements", action: () => {
          setInputText?.("Identify 3 potential improvements for this agreement.");
          setIsChatOpen?.(true);
        }
      },
      {
        label: "🔄 Rewrite in formal tone", action: () => {
          setInputText?.("Rewrite the selected or current document text in a highly formal legal tone.");
          setIsChatOpen?.(true);
        }
      }
    ],
    Extensions: [
      { label: "⚙️ IndexedDB Storage sync", action: () => alert("Offline sync engine (Dexie IndexedDB) is currently active.") }
    ],
    Help: [
      { label: "⌨️ Keyboard commands", action: () => alert("Use Ctrl+B for bold, Ctrl+I for Italic, Ctrl+Z for undo.") },
      { label: "ℹ️ About build workspace", action: () => alert("A majestic Google Docs high-fidelity workspace with real-time responsive states.") }
    ]
  };
}
