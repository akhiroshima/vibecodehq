import { BentoDashboard } from "@/components/bento-dashboard";
import { buildFeedItemsServer } from "@/lib/feed/server";
import { loadHomeMetrics } from "@/lib/metrics/server";
import { getSessionUser } from "@/lib/auth/get-current-user";

export default async function HomePage() {
  const user = await getSessionUser();
  const [items, metrics] = await Promise.all([
    buildFeedItemsServer(),
    loadHomeMetrics(user.id, user.studioId),
  ]);

  return (
    <BentoDashboard
      items={items}
      hq={metrics.hq}
      studioCity={metrics.studioCity}
      draftCount={metrics.draftCount}
    />
  );
}
