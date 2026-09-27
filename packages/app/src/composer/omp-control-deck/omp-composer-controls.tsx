/**
 * Live-agent wrapper that builds the prop bundle for `OmpControlDeck` from the
 * same session-store reads and provider-snapshot plumbing the legacy
 * `AgentControls` uses for non-OMP providers. Rendered exclusively for OMP
 * sessions in `composer/index.tsx`'s left-content mount; non-OMP sessions
 * continue to flow through `AgentControls`/`DraftAgentControls` unchanged.
 */
import { useCallback, useMemo, useRef, type ReactElement, type ReactNode } from "react";
import { View, type View as ViewType } from "react-native";
import { useShallow } from "zustand/shallow";
import type { AgentFeature, AgentToolDefinition } from "@ohmypcode/protocol/agent-types";
import { CombinedModelSelector } from "@/components/combined-model-selector";
import { formatThinkingOptionLabel } from "@/agent-controls/labels";
import {
  buildAgentProviderDefinitions,
  buildAgentProviderModels,
  selectAgentControlsSlice,
} from "@/composer/agent-controls";
import {
  buildProviderSelectorProviders,
  buildSelectableProviderSelectorProviders,
} from "@/provider-selection/provider-selection";
import { resolveAgentModelSelection } from "@/composer/agent-controls/utils";
import { filterSelectableModels } from "@/provider-selection/model-catalog";
import { useProvidersSnapshot } from "@/hooks/use-providers-snapshot";
import { useOmpCapabilities } from "@/hooks/use-omp-capabilities";
import { useToast } from "@/contexts/toast-context";
import { toErrorMessage } from "@/utils/error-messages";
import { showProviderNoticeToast } from "@/utils/provider-notice-toast";
import { useSessionStore } from "@/stores/session-store";
import { ComposerControlLayoutProvider } from "@/composer/agent-controls/layout-context";
import {
  resolveComposerControlPresentation,
  resolveComposerToolbarGlyphSize,
} from "@/composer/agent-controls/layout";
import { isNative } from "@/constants/platform";
import { OMP_VIBE_FEATURE_ID } from "./model";
import { OmpControlDeck, type OmpVibeControls, type OmpToolControls } from "./index";

const EMPTY_FEATURES: readonly AgentFeature[] = [];
const EMPTY_THINKING_OPTIONS: readonly { id: string; label: string }[] = [];
const EMPTY_TOOL_ROWS: readonly AgentToolDefinition[] = [];

interface OmpComposerControlsProps {
  serverId: string;
  agentId: string;
  onDropdownClose?: () => void;
  isCompactLayout?: boolean;
}

/**
 * Resolves the current value of the `omp_vibe` agent feature (if any). Returns
 * `false` when the feature is missing or the agent has no features list yet.
 */
function resolveOmpVibeEnabled(features: readonly AgentFeature[] | undefined): boolean {
  if (!features) return false;
  for (const feature of features) {
    if (feature.id === OMP_VIBE_FEATURE_ID && feature.type === "toggle") {
      return feature.value === true;
    }
  }
  return false;
}

export function OmpComposerControls({
  serverId,
  agentId,
  onDropdownClose,
  isCompactLayout,
}: OmpComposerControlsProps): ReactElement | null {
  const toast = useToast();
  const anchorRef = useRef<ViewType | null>(null);

  const agentSlice = useSessionStore(
    useShallow((state) => selectAgentControlsSlice(state, serverId, agentId)),
  );
  const client = useSessionStore((state) => state.sessions[serverId]?.client ?? null);

  const { entries: snapshotEntries, refetchIfStale: refetchSnapshotIfStale } = useProvidersSnapshot(
    serverId,
    { cwd: agentSlice?.cwd },
  );

  const agentProvider = agentSlice?.provider;
  const snapshotSelectedEntry = useMemo(
    () => snapshotEntries?.find((e) => e.provider === agentProvider) ?? null,
    [snapshotEntries, agentProvider],
  );
  const models = filterSelectableModels(snapshotSelectedEntry?.models ?? null);
  const selectedProviderIsLoading = snapshotSelectedEntry?.status === "loading";

  const agentProviderDefinitions = useMemo(
    () => buildAgentProviderDefinitions(agentProvider, snapshotEntries),
    [agentProvider, snapshotEntries],
  );
  const agentProviderModels = useMemo(
    () => buildAgentProviderModels(agentProvider, models),
    [agentProvider, models],
  );
  const agentModelSelectorProviders = useMemo(() => {
    if (snapshotSelectedEntry) {
      return buildSelectableProviderSelectorProviders([snapshotSelectedEntry]);
    }
    return buildProviderSelectorProviders({
      providerDefinitions: agentProviderDefinitions,
      modelsByProvider: agentProviderModels,
    });
  }, [agentProviderDefinitions, agentProviderModels, snapshotSelectedEntry]);

  const modelSelection = useMemo(
    () =>
      resolveAgentModelSelection({
        models,
        runtimeModelId: agentSlice?.runtimeModelId ?? null,
        configuredModelId: agentSlice?.model ?? null,
        explicitThinkingOptionId: agentSlice?.thinkingOptionId ?? null,
      }),
    [agentSlice?.model, agentSlice?.runtimeModelId, agentSlice?.thinkingOptionId, models],
  );

  const thinkingOptions = useMemo<readonly { id: string; label: string }[]>(() => {
    const raw = modelSelection.thinkingOptions;
    const empty: { id: string; label: string }[] = [];
    if (!raw) return empty;
    return raw.map((option) => ({
      id: option.id,
      label: formatThinkingOptionLabel(option),
    }));
  }, [modelSelection.thinkingOptions]);
  const selectedThinkingId = modelSelection.selectedThinkingId ?? undefined;
  const activeModelId = modelSelection.activeModelId ?? "";

  const handleSelectModel = useCallback(
    async (modelId: string) => {
      if (!client || !agentProvider) return;
      try {
        await client.setAgentModel(agentId, modelId);
      } catch (error) {
        console.warn("[OmpComposerControls] setAgentModel failed", error);
        toast.error(toErrorMessage(error));
      }
    },
    [agentId, agentProvider, client, toast],
  );

  const handleSelectThinkingOption = useCallback(
    (thinkingOptionId: string) => {
      if (!client || !agentProvider) return;
      void client
        .setAgentThinkingOption(agentId, thinkingOptionId)
        .then((notice) => showProviderNoticeToast(toast, notice))
        .catch((error) => {
          console.warn("[OmpComposerControls] setAgentThinkingOption failed", error);
          toast.error(toErrorMessage(error));
        });
    },
    [agentId, agentProvider, client, toast],
  );

  const handleSetFeature = useCallback(
    (featureId: string, value: unknown) => {
      if (!client || !agentProvider) return;
      void client.setAgentFeature(agentId, featureId, value).catch((error) => {
        console.warn("[OmpComposerControls] setAgentFeature failed", error);
        toast.error(toErrorMessage(error));
      });
    },
    [agentId, agentProvider, client, toast],
  );

  const handleModelSelectorOpen = useCallback(() => {
    if (agentProvider) refetchSnapshotIfStale(agentProvider);
  }, [agentProvider, refetchSnapshotIfStale]);

  const ompCapabilities = useOmpCapabilities(serverId, agentId);

  const vibe = useMemo<OmpVibeControls>(
    () => ({
      enabled: resolveOmpVibeEnabled(agentSlice?.features),
      canUse: ompCapabilities.canUseVibe,
      setEnabled: (enabled) => {
        handleSetFeature(OMP_VIBE_FEATURE_ID, enabled);
      },
    }),
    [agentSlice?.features, handleSetFeature, ompCapabilities.canUseVibe],
  );

  const tools = useMemo<OmpToolControls>(() => {
    const canUseTools = ompCapabilities.canSelectTools;
    return {
      rows: EMPTY_TOOL_ROWS,
      canUse: canUseTools,
      list: async (): Promise<AgentToolDefinition[]> => {
        if (!client || !canUseTools) {
          return [];
        }
        const payload = await client.listAgentTools(agentId);
        return payload.tools;
      },
      set: async (enabledTools: readonly string[]): Promise<AgentToolDefinition[]> => {
        if (!client || !canUseTools) {
          return [];
        }
        const payload = await client.setAgentTools(agentId, [...enabledTools]);
        return payload.tools;
      },
    };
  }, [agentId, client, ompCapabilities.canSelectTools]);

  const layoutContextValue = useMemo(
    () => ({
      glyphSize: resolveComposerToolbarGlyphSize(isNative ? "native" : "web"),
      presentation: resolveComposerControlPresentation(isCompactLayout ? "tight" : "full"),
    }),
    [isCompactLayout],
  );

  const features = agentSlice?.features ?? EMPTY_FEATURES;

  const modelSelectorElement = useMemo<ReactNode>(() => {
    return (
      <View ref={anchorRef} collapsable={false}>
        <CombinedModelSelector
          providers={agentModelSelectorProviders}
          selectedProvider={agentProvider ?? ""}
          selectedModel={activeModelId}
          onSelect={handleSelectModel}
          isLoading={selectedProviderIsLoading}
          onOpen={handleModelSelectorOpen}
          onClose={onDropdownClose}
          serverId={serverId}
          desktopPlacement="top-start"
          desktopMinWidth={360}
        />
      </View>
    );
  }, [
    activeModelId,
    agentModelSelectorProviders,
    agentProvider,
    handleModelSelectorOpen,
    handleSelectModel,
    onDropdownClose,
    selectedProviderIsLoading,
    serverId,
  ]);

  if (!agentSlice) {
    return null;
  }

  return (
    <ComposerControlLayoutProvider value={layoutContextValue}>
      <OmpControlDeck
        source="live"
        serverId={serverId}
        agentId={agentId}
        modelSelector={modelSelectorElement}
        thinkingOptions={thinkingOptions.length > 0 ? thinkingOptions : EMPTY_THINKING_OPTIONS}
        selectedThinkingId={selectedThinkingId}
        onSelectThinking={handleSelectThinkingOption}
        features={features}
        onSetFeature={handleSetFeature}
        vibe={vibe}
        tools={tools}
        disabled={!client}
        onDropdownClose={onDropdownClose}
      />
    </ComposerControlLayoutProvider>
  );
}
