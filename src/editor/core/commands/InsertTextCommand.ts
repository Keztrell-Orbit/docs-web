export class InsertTextCommand {
  readonly type = "INSERT_TEXT" as const;
  constructor(public readonly text: string) {}
}
