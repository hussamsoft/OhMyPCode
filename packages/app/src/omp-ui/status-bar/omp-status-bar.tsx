import { Fragment, memo, useMemo, type ReactElement } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import type { AgentUsage } from "@ohmypcode/protocol/agent-types";
import { getStatusLinePreset, type OmpStatusLinePresetDef } from "./presets";
import {
  STATUS_LINE_SEGMENT_IDS,
  type StatusLinePreset,
  type StatusLineSegmentId,
  type StatusLineSegmentOptions,
  type StatusLineSeparatorStyle,
} from "./segments";

/**
 * Input for an individual segment that already has data wiring today. The
 * renderer falls back to "—" for any segment whose source is `undefined`,
 * rather than fabricating data -- the catalog stays exhaustive.
 */
export interface OmpStatusBarData {
  preset: StatusLinePreset;
  /**
   * Optional overrides the component will merge with the preset defaults.
   *
   * The presets themselves are a verbatim copy of OMP's own status-line
   * presets and a test pins that, so this app's deliberate deviations live
   * here instead of being edited into the preset table.
   */
  overrides?: {
    leftSegments?: StatusLineSegmentId[];
    rightSegments?: StatusLineSegmentId[];
    separator?: StatusLineSeparatorStyle;
  };
  /** Currently selected model label (e.g. "sonnet"). */
  modelLabel?: string | null;
  /** Current path / cwd (already abbreviated upstream if needed). */
  path?: string | null;
  /** Git branch name; absent / `null` means the workspace is not in a git repo. */
  currentBranch?: string | null;
  /** PR number when the workspace's forge has an open PR; otherwise absent. */
  pullRequestNumber?: number | null;
  /** Last-usage aggregator the composer also reads from the agent store. */
  lastUsage?: AgentUsage | null;
  /** Active session title the agent store exposes for the focused session. */
  sessionName?: string | null;
  /** Subagent count for the focused parent agent (origin: subagent store). */
  subagentCount?: number | null;
  /** Current sub-mode label (plan / build / etc.); absent = no mode. */
  modeLabel?: string | null;
  /** Segments whose data really isn't available yet -- the renderer shows "—". */
  unavailable?: ReadonlySet<StatusLineSegmentId>;
  /** Compose-time customization (24h time, hidden-stage counts, etc.). */
  segmentOptions?: StatusLineSegmentOptions;
}

/** Map from segment id to a human-readable label. */
const SEGMENT_LABELS: Record<StatusLineSegmentId, string> = {
  pi: "π",
  status: "status",
  model: "model",
  mode: "mode",
  path: "path",
  git: "git",
  pr: "pr",
  subagents: "subagents",
  token_in: "in",
  token_out: "out",
  token_total: "tok",
  token_rate: "tok/s",
  cost: "cost",
  context_pct: "ctx",
  context_total: "ctx total",
  time_spent: "active",
  time: "time",
  session: "session",
  hostname: "host",
  cache_read: "cache r",
  cache_write: "cache w",
  cache_hit: "cache hit",
  session_name: "session",
  usage: "usage",
  collab: "collab",
  stream: "stream",
  vim: "vim",
};

const SEPARATORS: Record<StatusLineSeparatorStyle, string> = {
  powerline: "\uE0B0",
  "powerline-thin": "\uE0B1",
  slash: "/",
  pipe: "|",
  block: "\u2588",
  none: "",
  ascii: ">",
};

function formatTokenCount(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  if (value < 1000) return String(Math.round(value));
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

function formatUsd(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  if (value === 0) return "$0";
  if (value < 0.01) return "<$0.01";
  return `$${value.toFixed(2)}`;
}

function formatTokensPerSecond(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return "—";
  if (value < 10) return value.toFixed(1);
  return String(Math.round(value));
}

function formatPercent(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function formatContextPercent(used: number | undefined, max: number | undefined): string {
  if (
    used === undefined ||
    max === undefined ||
    !Number.isFinite(used) ||
    !Number.isFinite(max) ||
    max <= 0
  ) {
    return "—";
  }
  return formatPercent((used / max) * 100);
}

interface SegmentView {
  text: string;
  /** Highlight key (`success` / `warning` / `error`) for status styling. */
  tone?: "muted" | "success" | "warning" | "error";
}

interface RenderContext {
  data: OmpStatusBarData;
  unavailable: Set<StatusLineSegmentId>;
}

interface SegmentInputs {
  lastUsage?: AgentUsage | null;
  modelLabel?: string | null;
  path?: string | null;
  currentBranch?: string | null;
  pullRequestNumber?: number | null;
  sessionName?: string | null;
  subagentCount?: number | null;
  modeLabel?: string | null;
}

type SegmentRenderer = (inputs: SegmentInputs) => SegmentView | null;

function constant(value: SegmentView | null): SegmentRenderer {
  return () => value;
}

const SEGMENT_RENDERERS: Record<StatusLineSegmentId, SegmentRenderer> = {
  pi: constant({ text: SEGMENT_LABELS.pi }),
  // Stand-in for terminal "idle / working" -- wired later via InteractiveModeContext.
  status: constant({ text: "●", tone: "success" }),
  model: (i) => ({ text: i.modelLabel ?? "—" }),
  mode: (i) => ({ text: i.modeLabel ?? "—" }),
  path: (i) => ({ text: i.path ?? "—" }),
  git: (i) => (i.currentBranch ? { text: i.currentBranch } : null),
  pr: (i) =>
    i.pullRequestNumber === undefined || i.pullRequestNumber === null
      ? null
      : { text: `#${i.pullRequestNumber}` },
  subagents: (i) =>
    i.subagentCount === undefined || i.subagentCount === null || i.subagentCount === 0
      ? null
      : { text: `${i.subagentCount}` },
  token_in: (i) => ({ text: formatTokenCount(i.lastUsage?.inputTokens) }),
  token_out: (i) => ({ text: formatTokenCount(i.lastUsage?.outputTokens) }),
  token_total: (i) => {
    const input = i.lastUsage?.inputTokens ?? 0;
    const output = i.lastUsage?.outputTokens ?? 0;
    if (!input && !output) return null;
    return { text: formatTokenCount(input + output) };
  },
  // tokensPerSecond not yet exposed by AgentUsage; render dash rather than fabricate.
  token_rate: constant({ text: formatTokensPerSecond(undefined) }),
  cost: (i) => ({ text: formatUsd(i.lastUsage?.totalCostUsd) }),
  context_pct: (i) => ({
    text: formatContextPercent(
      i.lastUsage?.contextWindowUsedTokens,
      i.lastUsage?.contextWindowMaxTokens,
    ),
  }),
  context_total: (i) =>
    i.lastUsage?.contextWindowMaxTokens === undefined
      ? null
      : { text: formatTokenCount(i.lastUsage.contextWindowMaxTokens) },
  // The remaining segments don't yet have data sources in the app store. Skipping
  // them keeps the catalog exhaustive without fabricating values.
  time_spent: constant(null),
  time: constant(null),
  session: constant(null),
  hostname: constant(null),
  cache_read: (i) => ({ text: formatTokenCount(i.lastUsage?.cachedInputTokens) }),
  // The aggregate exposes only the cache read total today.
  cache_write: constant(null),
  cache_hit: (i) => {
    const read = i.lastUsage?.cachedInputTokens ?? 0;
    const total = (i.lastUsage?.inputTokens ?? 0) + read;
    if (!total) return null;
    const pct = (read / total) * 100;
    return { text: `${pct.toFixed(0)}%` };
  },
  session_name: (i) => (i.sessionName ? { text: i.sessionName } : null),
  // Provider quota windows live in `@/provider-usage`; no inline wiring yet.
  usage: constant(null),
  collab: constant(null),
  stream: constant(null),
  vim: constant(null),
};

function renderSegment(id: StatusLineSegmentId, ctx: RenderContext): SegmentView | null {
  if (ctx.unavailable.has(id)) return null;
  const {
    lastUsage,
    modelLabel,
    path,
    currentBranch,
    pullRequestNumber,
    sessionName,
    subagentCount,
    modeLabel,
  } = ctx.data;
  const renderer = SEGMENT_RENDERERS[id];
  return renderer({
    lastUsage,
    modelLabel,
    path,
    currentBranch,
    pullRequestNumber,
    sessionName,
    subagentCount,
    modeLabel,
  });
}

function buildRenderList(
  ids: readonly StatusLineSegmentId[],
  ctx: RenderContext,
): { id: StatusLineSegmentId; segment: SegmentView }[] {
  const out: { id: StatusLineSegmentId; segment: SegmentView }[] = [];
  for (const id of ids) {
    const segment = renderSegment(id, ctx);
    if (!segment?.text) continue;
    out.push({ id, segment });
  }
  return out;
}

const TONE_COLORS: Record<NonNullable<SegmentView["tone"]>, string | undefined> = {
  muted: undefined,
  success: "#15803d",
  warning: "#d97706",
  error: "#b91c1c",
};

interface SegmentChipProps {
  id: StatusLineSegmentId;
  segment: SegmentView;
}

function SegmentChip({ id, segment }: SegmentChipProps): ReactElement {
  const toneColor = TONE_COLORS[segment.tone ?? "muted"];
  return (
    <Text
      style={[styles.chip, toneColor ? { color: toneColor } : null]}
      accessibilityLabel={`${SEGMENT_LABELS[id]}: ${segment.text}`}
      accessibilityRole="text"
      numberOfLines={1}
    >
      {segment.text}
    </Text>
  );
}

interface SegmentRowProps {
  ids: readonly StatusLineSegmentId[];
  separator: StatusLineSeparatorStyle;
  data: OmpStatusBarData;
  unavailable: Set<StatusLineSegmentId>;
  side: "left" | "right";
}

function SegmentRow({
  ids,
  separator,
  data,
  unavailable,
  side,
}: SegmentRowProps): ReactElement | null {
  const list = useMemo(() => buildRenderList(ids, { data, unavailable }), [ids, data, unavailable]);
  if (list.length === 0) return null;
  const sepText = SEPARATORS[separator];
  return (
    <View
      style={[styles.row, side === "right" ? styles.rowRight : styles.rowLeft]}
      accessibilityRole="summary"
    >
      {list.map((entry, index) => (
        <Fragment key={entry.id}>
          {index > 0 && sepText ? (
            <Text
              style={styles.separator}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {sepText}
            </Text>
          ) : null}
          <SegmentChip id={entry.id} segment={entry.segment} />
        </Fragment>
      ))}
    </View>
  );
}

export interface OmpStatusBarProps {
  data: OmpStatusBarData;
}

function OmpStatusBarComponent({ data }: OmpStatusBarProps): ReactElement {
  const { t } = useTranslation();
  const preset: OmpStatusLinePresetDef = getStatusLinePreset(data.preset);
  const separator = data.overrides?.separator ?? preset.separator;
  const leftSegments = data.overrides?.leftSegments ?? preset.leftSegments;
  const rightSegments = data.overrides?.rightSegments ?? preset.rightSegments;
  const unavailable = useMemo(
    () => new Set<StatusLineSegmentId>(data.unavailable ?? []),
    [data.unavailable],
  );

  return (
    <View
      style={styles.root}
      accessibilityRole="summary"
      accessibilityLabel={t("ompUi.statusBar.rootLabel")}
      testID="omp-status-bar"
    >
      <SegmentRow
        ids={leftSegments}
        separator={separator}
        data={data}
        unavailable={unavailable}
        side="left"
      />
      <View style={styles.spacer} accessibilityElementsHidden importantForAccessibility="no" />
      <SegmentRow
        ids={rightSegments}
        separator={separator}
        data={data}
        unavailable={unavailable}
        side="right"
      />
    </View>
  );
}

export const OmpStatusBar = memo(OmpStatusBarComponent);

const styles = StyleSheet.create((theme) => ({
  root: {
    // Reads as a quiet footnote on the composer, not a band of its own. It
    // used to be a filled surface2 slab with a border above *and* below,
    // sandwiched between the transcript and the composer, which read as a
    // stray ribbon cutting the pane in half. No fill, and a single hairline
    // on the transcript side, keeps the information without the interruption.
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing[3],
    paddingBottom: theme.spacing[1],
    borderTopWidth: theme.borderWidth[1],
    borderTopColor: theme.colors.border,
    gap: theme.spacing[2],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    flexShrink: 1,
    minWidth: 0,
  },
  rowLeft: {
    justifyContent: "flex-start",
  },
  rowRight: {
    justifyContent: "flex-end",
  },
  spacer: {
    flex: 1,
    minWidth: theme.spacing[1],
  },
  chip: {
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  separator: {
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.fontSize.sm,
    color: theme.colors.foregroundMuted,
  },
}));

// Re-export segment ids so callers can build an `unavailable` set without
// importing the schema module separately.
export { STATUS_LINE_SEGMENT_IDS };
