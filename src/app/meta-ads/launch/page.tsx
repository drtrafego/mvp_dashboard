import DashboardLaunch from "./dashboard-launch";
import { getLaunchMetrics } from "@/server/actions/launch-dashboard";


type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function LaunchDashboardPage(props: { searchParams: SearchParams }) {
    const searchParams = await props.searchParams
    const from = typeof searchParams.from === 'string' ? searchParams.from : undefined
    const to = typeof searchParams.to === 'string' ? searchParams.to : undefined

    let metrics;
    let error;

    try {
        metrics = await getLaunchMetrics(from, to);
    } catch (e: unknown) {
        console.error("Error fetching launch metrics:", e);
        error = (e as Error).message;
    }

    return (
        <div className="space-y-6">
            <div className="p-0">
                {error ? (
                    <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg text-red-500">
                        Erro: {error}
                    </div>
                ) : metrics ? (
                    <DashboardLaunch metrics={metrics} />
                ) : (
                    <div className="flex items-center justify-center h-[50vh]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
