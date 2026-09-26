import type { ComponentType } from "react";
import {
  BookOpen,
  Bot,
  Brain,
  Compass,
  Expand,
  Feather,
  Footprints,
  ListTodo,
  Map,
  Monitor,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldEllipsis,
  ShieldOff,
  ShieldPlus,
  ShieldQuestionMark,
  Turtle,
  UserCheck,
  Zap,
} from "lucide-react-native";
import {
  getModeVisuals,
  type AgentProviderDefinition,
} from "@ohmypcode/protocol/provider-manifest";

export interface AgentControlIconProps {
  size: number;
  color: string;
}

export type AgentControlIcon = ComponentType<AgentControlIconProps>;

export const ThinkingIcon = Brain;
export const PlanModeIcon = ListTodo;

const MODE_ICONS: Record<string, AgentControlIcon> = {
  Bot,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldEllipsis,
  ShieldOff,
  ShieldPlus,
  ShieldQuestionMark,
};

const FEATURE_ICONS: Record<string, AgentControlIcon> = {
  "book-open": BookOpen,
  "list-todo": ListTodo,
  "shield-check": ShieldCheck,
  "user-check": UserCheck,
  compass: Compass,
  expand: Expand,
  feather: Feather,
  footprints: Footprints,
  map: Map,
  monitor: Monitor,
  turtle: Turtle,
  zap: Zap,
};

export function getAgentModeIcon(
  provider: string,
  modeId: string,
  providerDefinitions: AgentProviderDefinition[],
): AgentControlIcon {
  const icon = getModeVisuals(provider, modeId, providerDefinitions)?.icon;
  return (icon ? MODE_ICONS[icon] : undefined) ?? Bot;
}

export function getAgentModeOptionIcon(
  provider: string,
  modeId: string,
  providerDefinitions: AgentProviderDefinition[],
): AgentControlIcon | undefined {
  const icon = getModeVisuals(provider, modeId, providerDefinitions)?.icon;
  return icon ? MODE_ICONS[icon] : undefined;
}

export function getAgentFeatureIcon(icon?: string): AgentControlIcon {
  return (icon ? FEATURE_ICONS[icon] : undefined) ?? Settings2;
}
