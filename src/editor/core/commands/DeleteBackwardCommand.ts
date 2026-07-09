export class DeleteBackwardCommand {
  readonly type = "DELETE_BACKWARD" as const;
  constructor(public readonly unit: "character" | "word") {}
}
