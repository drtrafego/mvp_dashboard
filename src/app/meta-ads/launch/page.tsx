import DashboardLaunch from "./dashboard-launch";
import { getLaunchMetrics } from "@/server/actions/launch-dashboard";
import DateRangeHeader from "@/components/layout/date-range-header";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function LaunchDashboardPage(props: { searchParams: SearchParams }) {
    const searchParams = await props.searchParams
    const from = typeof searchParams.from === 'string' ? searchParams.from : undefined
    const to = typeof searchParams.to === 'string' ? searchParams.to : undefined

    let metrics;
    let error;

    try {
        metrics = await getLaunchMetrics(from, to);
    } catch (e: any) {
        console.error("Error fetching launch metrics:", e);
        error = e.message;
    }

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 font-sans">
            <DateRangeHeader title="Meta Lançamento" />

            <div className="p-6 md:p-8">
                {error ? (
                    <div className="p-8 text-white flex flex-col items-center justify-center h-[50vh] gap-4">
                        <div className="text-red-500 text-xl font-bold">Erro ao carregar dados</div>
                        <div className="text-gray-400 font-mono bg-black/50 p-4 rounded border border-red-900/50">
                            {error}
                        </div>
                    </div>
                ) : metrics ? (
                    <DashboardLaunch metrics={metrics} />
                ) : (
                    <div className="flex items-center justify-center h-[50vh]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}
            </div>
        </div>
    );
}
