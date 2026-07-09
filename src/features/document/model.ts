import type { Document, Block } from "./types.ts";

let idCounter = 0;
function nextId(): string {
  return `block-${idCounter++}`;
}

function heading(level: 1 | 2 | 3, text: string): Block {
  return { type: "heading", id: nextId(), level, text };
}

function paragraph(text: string): Block {
  return { type: "paragraph", id: nextId(), text };
}

function image(src: string, alt: string, width: number, height: number): Block {
  return { type: "image", id: nextId(), src, alt, width, height };
}

function table(rows: number, columns: number, cells: string[][]): Block {
  return { type: "table", id: nextId(), rows, columns, cells };
}

export function createSampleDocument(): Document {
  return {
    id: "doc-1",
    title: "Sample Document",
    version: 0,
    blocks: [
      heading(1, "Introduction"),

      paragraph(
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      ),

      paragraph(
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      ),

      heading(2, "Section 1: Background"),

      paragraph(
        "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
      ),

      paragraph(
        "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
      ),

      paragraph(
        "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.",
      ),

      paragraph(
        "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.",
      ),

      heading(2, "Section 2: Analysis"),

      paragraph(
        "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
      ),

      paragraph(
        "Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.",
      ),

      paragraph(
        "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est.",
      ),

      paragraph(
        "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.",
      ),

      heading(2, "Section 3: Results"),

      paragraph(
        "Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.",
      ),

      image(
        "https://placehold.co/600x400/EEE/31343C",
        "Chart showing analysis results",
        451,
        300,
      ),

      heading(3, "Data Summary"),

      table(
        4,
        3,
        [
          ["Metric", "Value", "Change"],
          ["Revenue", "$12,000", "+15%"],
          ["Users", "1,240", "+22%"],
          ["Satisfaction", "94%", "+3%"],
        ],
      ),

      paragraph(
        "The data indicates a consistent upward trend across all key performance indicators, with user growth accelerating in the most recent quarter.",
      ),

      heading(2, "Section 4: Discussion"),

      paragraph(
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.",
      ),

      paragraph(
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      ),

      paragraph(
        "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
      ),

      heading(2, "Conclusion"),

      paragraph(
        "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
      ),

      paragraph(
        "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.",
      ),

      paragraph(
        "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.",
      ),

      paragraph(
        "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
      ),
    ],
  };
}
