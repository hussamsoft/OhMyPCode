/**
 * Keybindings screen for OMP.
 *
 * Reads the live keybinding table via `omp.keybindings.get.request` and
 * writes through `omp.keybindings.set.request`
 * (`useOmpKeybindings`/`useOmpKeybindingSetter` in `use-omp-rpc.ts`). Unlike
 * the generated settings form's text fields (which commit on every
 * keystroke), a keybinding string is only meaningful once fully typed, so
 * edits commit on submit/blur rather than per-character.
 */
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
  useOmpKeybindingSetter,
  useOmpKeybindings,
  type OmpKeybindingEntry,
} from "@/composer/omp-control-deck/use-omp-rpc";
import { EditingTextInput } from "@/components/ui/text-input";

export interface OmpKeybindingsFormProps {
  serverId?: string | null;
  agentId?: string | null;
}

function matchesFilter(entry: OmpKeybindingEntry, filter: string): boolean {
  if (!filter) return true;
  const needle = filter.toLowerCase();
  return (
    entry.id.toLowerCase().includes(needle) ||
    entry.action.toLowerCase().includes(needle) ||
    (entry.description?.toLowerCase().includes(needle) ?? false) ||
    entry.keys.toLowerCase().includes(needle)
  );
}

function OmpKeybindingRow({
  entry,
  pending,
  onSet,
}: {
  entry: OmpKeybindingEntry;
  pending: boolean;
  onSet: (id: string, keys: string) => void;
}) {
  const [draft, setDraft] = useState(entry.keys);
  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== entry.keys) {
      onSet(entry.id, trimmed);
    } else if (!trimmed) {
      setDraft(entry.keys);
    }
  }, [draft, entry.id, entry.keys, onSet]);
  return (
    <View style={styles.row} testID={`omp-keybinding-row-${entry.id}`}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{entry.id}</Text>
        <Text style={styles.rowAction}>{entry.action}</Text>
      </View>
      {entry.description ? <Text style={styles.rowDescription}>{entry.description}</Text> : null}
      <EditingTextInput
        accessibilityLabel={entry.id}
        editable={!pending}
        initialValue={entry.keys}
        onChangeText={setDraft}
        onBlur={commit}
        onSubmitEditing={commit}
        style={styles.valueInput}
        testID={`omp-keybinding-input-${entry.id}`}
      />
    </View>
  );
}

export function OmpKeybindingsForm({ serverId, agentId }: OmpKeybindingsFormProps) {
  const { t } = useTranslation();
  const enabled = Boolean(serverId && agentId);
  const { keybindings, isLoading, error } = useOmpKeybindings(serverId, agentId, { enabled });
  const { setKeybinding, isPending } = useOmpKeybindingSetter(serverId, agentId);
  const [filter, setFilter] = useState("");

  const onSet = useCallback(
    (id: string, keys: string) => {
      void setKeybinding({ id, keys });
    },
    [setKeybinding],
  );

  const filtered = useMemo(
    () => keybindings.filter((entry) => matchesFilter(entry, filter)),
    [keybindings, filter],
  );

  if (!enabled) {
    return (
      <View style={styles.placeholder} testID="omp-keybindings-form-placeholder">
        <Text style={styles.message}>{t("agentControls.omp.keybindingsUnavailable")}</Text>
      </View>
    );
  }

  if (isLoading && keybindings.length === 0) {
    return (
      <View style={styles.placeholder} testID="omp-keybindings-form-loading">
        <Text style={styles.message}>{t("agentControls.omp.keybindingsLoading")}</Text>
      </View>
    );
  }

  if (error && keybindings.length === 0) {
    return (
      <View style={styles.placeholder} testID="omp-keybindings-form-error">
        <Text style={styles.error}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.form} testID="omp-keybindings-form">
      <EditingTextInput
        accessibilityLabel={t("agentControls.omp.keybindingsFilterLabel")}
        placeholder={t("agentControls.omp.keybindingsFilterPlaceholder")}
        initialValue={filter}
        onChangeText={setFilter}
        style={styles.filterInput}
        testID="omp-keybindings-filter"
      />
      <ScrollView style={styles.body} testID="omp-keybindings-form-body">
        {filtered.length > 0 ? (
          filtered.map((entry) => (
            <OmpKeybindingRow key={entry.id} entry={entry} pending={isPending} onSet={onSet} />
          ))
        ) : (
          <Text style={styles.message}>{t("agentControls.omp.noKeybindings")}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  form: {
    flex: 1,
  },
  filterInput: {
    margin: theme.spacing[3],
  },
  body: {
    flex: 1,
  },
  row: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing[1],
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing[2],
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.foreground,
    fontFamily: theme.fontFamily.mono,
  },
  rowAction: {
    fontSize: 11,
    color: theme.colors.foregroundMuted,
    fontFamily: theme.fontFamily.mono,
  },
  rowDescription: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
  },
  valueInput: {
    marginTop: theme.spacing[1],
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing[4],
  },
  message: {
    fontSize: 13,
    color: theme.colors.foregroundMuted,
    textAlign: "center",
    padding: theme.spacing[4],
  },
  error: {
    fontSize: 13,
    color: theme.colors.palette.red[500],
    textAlign: "center",
    padding: theme.spacing[4],
  },
}));
