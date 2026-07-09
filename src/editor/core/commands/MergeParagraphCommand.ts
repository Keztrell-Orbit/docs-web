export class MergeParagraphCommand {
  readonly type = "MERGE_PARAGRAPH" as const;
  constructor(public readonly direction: "backward" | "forward") {}
}
