import type { ReactNode } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export interface DesktopShellProps {
  rail?: ReactNode;
  context?: ReactNode;
  content: ReactNode;
  topOverlay?: ReactNode;
}

/** Presentation-only frame for the desktop app's persistent chrome and routed content. */
export function DesktopShell({ rail, context, content, topOverlay }: DesktopShellProps) {
  return (
    <View style={styles.shell}>
      {rail}
      {context}
      <View role="main" style={styles.content}>
        {content}
      </View>
      {topOverlay ? (
        <View pointerEvents="box-none" style={styles.topOverlay}>
          {topOverlay}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  shell: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    flexDirection: "row",
    overflow: "hidden",
    backgroundColor: theme.colors.surface0,
    borderRadius: theme.desktopShell.radius.pane,
  },
  content: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  topOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
}));
