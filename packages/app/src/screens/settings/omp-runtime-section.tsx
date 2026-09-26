import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import { settingsStyles } from "@/styles/settings";
import { formatVersionWithPrefix } from "@/desktop/updates/desktop-updates";
import { useOmpRuntimeStatus } from "@/desktop/updates/use-omp-runtime-status";

/** The "OMP runtime" and "OMP source" rows of the desktop About section --
 * extracted from settings-screen.tsx to keep it independently testable,
 * matching the per-section file convention used elsewhere in this
 * directory (editor-section.tsx, providers-section.tsx, etc.). */
export function OmpRuntimeRows() {
  const { t } = useTranslation();
  const { status, isLoading } = useOmpRuntimeStatus();
  if (isLoading || !status) return null;

  let runtimeValueText: string;
  if (status.kind === "bundled") {
    runtimeValueText = status.ompVersion
      ? formatVersionWithPrefix(status.ompVersion)
      : t("settings.about.ompRuntimeUnavailable");
  } else if (status.kind === "system") {
    runtimeValueText = status.ompVersion
      ? `${t("settings.about.ompRuntimeSystem")} ${formatVersionWithPrefix(status.ompVersion)}`
      : t("settings.about.ompRuntimeSystem");
  } else {
    runtimeValueText = t("settings.about.ompRuntimeUnavailable");
  }

  const shortSourceCommit = status.sourceCommit ? status.sourceCommit.slice(0, 7) : null;

  return (
    <>
      <View style={[settingsStyles.row, settingsStyles.rowBorder]}>
        <View style={settingsStyles.rowContent}>
          <Text style={settingsStyles.rowTitle}>{t("settings.about.ompRuntime")}</Text>
        </View>
        <Text style={[styles.value, status.isStale && styles.valueWarning]}>
          {runtimeValueText}
        </Text>
      </View>
      {status.isStale ? (
        <View style={[settingsStyles.row, settingsStyles.rowBorder]}>
          <Text style={[settingsStyles.rowHint, styles.valueWarning]}>
            {t("settings.about.ompRuntimeStaleWarning")}
          </Text>
        </View>
      ) : null}
      {status.kind === "bundled" ? (
        <View style={[settingsStyles.row, settingsStyles.rowBorder]}>
          <View style={settingsStyles.rowContent}>
            <Text style={settingsStyles.rowTitle}>{t("settings.about.ompSource")}</Text>
          </View>
          <Text style={styles.value}>
            {shortSourceCommit ?? t("settings.about.ompSourceUnavailable")}
          </Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  value: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.base,
  },
  valueWarning: {
    color: theme.colors.palette.amber[500],
  },
}));
