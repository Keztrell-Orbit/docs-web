export class DeleteForwardCommand {
  readonly type = "DELETE_FORWARD" as const;
  constructor(public readonly unit: "character" | "word") {}
}
