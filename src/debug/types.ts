export type WarningLevel = "INFO" | "WARNING" | "ERROR" | "FATAL";

export interface DebugMetrics {
  layoutContentHeight: number;
  layoutOuterHeight: number;
  domContentHeight: number;
  domOuterHeight: number;
  marginTop: number;
  marginBottom: number;
  paddingTop: number;
  paddingBottom: number;
  borderTop: number;
  borderBottom: number;
}

export interface DebugBlockReport {
  blockId: string;
  pageId: string;
  snapshotType: string;
  yLayout: number;
  yDom: number;
  deltaY: number;
  metrics: DebugMetrics;
  level: WarningLevel;
  issues: string[];
}
