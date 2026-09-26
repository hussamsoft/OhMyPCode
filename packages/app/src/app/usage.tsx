import { Redirect } from "expo-router";
import { isWeb } from "@/constants/platform";
import { HostRouteBootstrapBoundary } from "@/components/host-route-bootstrap-boundary";
import { UsageScreen } from "@/screens/usage-screen";

export default function UsageRoute() {
  if (!isWeb) return <Redirect href="/" />;
  return (
    <HostRouteBootstrapBoundary>
      <UsageScreen />
    </HostRouteBootstrapBoundary>
  );
}
