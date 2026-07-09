export class ReplaceSelectionCommand {
  readonly type = "REPLACE_SELECTION" as const;
  constructor(public readonly text: string) {}
}
