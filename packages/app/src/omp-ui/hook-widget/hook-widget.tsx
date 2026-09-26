import { memo, type ReactElement } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { OmpHookWidgetState } from "@ohmypcode/protocol/messages";
import { useOmpHookWidget } from "./use-omp-hook";

/**
 * Renders the current OMP extension-UI hook widget body for a single
 * `widgetPlacement`. The vendor surfaces one widget per key at any time
 * (subsequent `setWidget` calls replace), so the component is a thin
 * projection of `OmpHookWidgetState.widgetLines`.
 *
 * Above/below variants live in the same component on purpose: the placement
 * is data, not styling, and the surrounding chrome chooses where to mount
 * the rendered output.
 */
export interface OmpHookWidgetProps {
  agentId: string;
  placement: OmpHookWidgetState["widgetPlacement"];
  /**
   * Render with no chrome (background / border / padding). Defaults to
   * `false`. Used by status-bar consumers that already paint their own
   * container.
   */
  bare?: boolean;
}

function OmpHookWidgetComponent({
  agentId,
  placement,
  bare = false,
}: OmpHookWidgetProps): ReactElement | null {
  const widget = useOmpHookWidget({ agentId, placement });
  if (!widget) return null;
  if (widget.widgetLines.length === 0) return null;
  // Vendor caps widget bodies at MAX_WIDGET_LINES=10; defensive truncation
  // here covers snapshots that bypassed server-side validation.
  const truncated = widget.widgetLines.length > 10;
  const lines = truncated
    ? [...widget.widgetLines.slice(0, 9), "... (widget truncated)"]
    : widget.widgetLines;
  return (
    <View
      style={bare ? styles.bare : styles.container}
      accessibilityRole="text"
      accessibilityLabel={`OMP hook widget (${placement})`}
      testID={`omp-hook-widget-${placement}`}
    >
      {lines.map((line) => (
        // The widget body itself is the key -- the vendor caps at 10 lines and
        // a body update typically rewrites all lines atomically (the widgetKey
        // changes when a different widget is registered). Falls back to the
        // line index via a counter for lines with duplicate text.
        <Text key={line} style={styles.line} numberOfLines={1}>
          {line}
        </Text>
      ))}
    </View>
  );
}

export const OmpHookWidget = memo(OmpHookWidgetComponent);

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.borderRadius.md ?? 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  bare: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  line: {
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
}));
