import { getAdAccountSettings } from "@/server/actions/ad-account-settings";
import LaunchDashboardPage from "./launch/page";
import MetaAdsCapturePage from "./captacao/page";
import MetaAdsEcommercePage from "./ecommerce/page";

export default async function MetaAdsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
    const settings = await getAdAccountSettings();
    const dashboardType = settings?.metaDashboardType || "ecommerce";
    const params = await searchParams;

    if (dashboardType === "lancamento") {
        return <LaunchDashboardPage searchParams={Promise.resolve(params)} />;
    } else if (dashboardType === "captacao") {
        return <MetaAdsCapturePage searchParams={Promise.resolve(params)} />;
    } else {
        // Default to ecommerce
        return <MetaAdsEcommercePage searchParams={Promise.resolve(params)} />;
    }
}

