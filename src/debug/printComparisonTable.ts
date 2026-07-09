import type { LayoutTree } from "../layout/types.ts";
import type { DomBlockMeasurement } from "../renderer/hooks/useDomMeasurements.ts";
import { buildDebugReport } from "./report.ts";

export function printComparisonTable(
  tree: LayoutTree,
  domMeasurements: DomBlockMeasurement[],
): void {
  const domMap = new Map(domMeasurements.map((d) => [d.blockId, d]));
  const treeBlockIds = new Set<string>();

  type ReportWithLevel = ReturnType<typeof buildDebugReport> & { overlap?: boolean };
  const reports: ReportWithLevel[] = [];

  for (const page of tree.pages) {
    const sorted = [...page.blocks].sort((a, b) => a.y - b.y);

    for (let i = 0; i < sorted.length; i++) {
      const block = sorted[i];
      treeBlockIds.add(block.blockId);
      const dom = domMap.get(block.blockId);

      if (!dom) {
        reports.push({
          blockId: block.blockId,
          pageId: block.pageId,
          snapshotType: block.snapshot.type,
          yLayout: block.y,
          yDom: 0,
          deltaY: 0,
          metrics: {
            layoutContentHeight: 0,
            layoutOuterHeight: block.height,
            domContentHeight: 0,
            domOuterHeight: 0,
            marginTop: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0,
            borderTop: 0,
            borderBottom: 0,
          },
          level: "FATAL",
          issues: ["Renderer mismatch — block in tree but missing from DOM"],
        });
        continue;
      }

      const report = buildDebugReport(block, dom);

      if (i > 0) {
        const prev = sorted[i - 1];
        const prevBottom = prev.y + prev.height;
        if (prevBottom > block.y + 0.5) {
          report.level = "FATAL";
          report.issues.push(
            `Overlaps ${prev.blockId}: ${prev.blockId} bottom=${Math.round(prevBottom * 10) / 10} > ${block.blockId} top=${block.y}`,
          );
          (report as ReportWithLevel).overlap = true;
        }
      }

      reports.push(report);
    }
  }

  for (const dom of domMeasurements) {
    if (!treeBlockIds.has(dom.blockId)) {
      console.warn(
        `⚠ DOM has block ${dom.blockId} not in current tree (may be stale)`,
      );
    }
  }

  const fatal = reports.filter((r) => r.level === "FATAL");
  const errors = reports.filter((r) => r.level === "ERROR");
  const warnings = reports.filter((r) => r.level === "WARNING");
  const info = reports.filter((r) => r.level === "INFO");

  console.group("🔍 Layout Engine Report");

  const hasIssues = fatal.length > 0 || errors.length > 0 || warnings.length > 0;
  console.log(
    `${hasIssues ? "❌" : "✅"} ` +
      `FATAL:${fatal.length} ERROR:${errors.length} WARNING:${warnings.length} INFO:${info.length}`,
  );

  for (const r of fatal) {
    console.error(`🔴 FATAL [${r.blockId}] ${r.issues.join(" | ")}`);
  }
  for (const r of errors) {
    console.error(`🟠 ERROR [${r.blockId}] ${r.issues.join(" | ")}`);
  }
  for (const r of warnings) {
    console.warn(`🟡 WARNING [${r.blockId}] ${r.issues.join(" | ")}`);
  }

  const awaitingMeasure = info.filter((r) =>
    r.issues.includes("awaiting offscreen measurement"),
  );
  if (awaitingMeasure.length > 0) {
    console.log(`⏳ ${awaitingMeasure.length} blocks awaiting offscreen measurement`);
  }

  const cleanBlocks =
    reports.length - fatal.length - errors.length - warnings.length;
  console.log(`✅ ${cleanBlocks}/${reports.length} blocks clean`);

  const within1px = reports.filter((r) => r.deltaY < 1).length;
  console.log(`📍 ${within1px}/${reports.length} blocks within 1px Y position`);

  console.groupEnd();
}
