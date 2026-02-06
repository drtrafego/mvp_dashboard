import { biDb } from "@/server/db";
import { systemLogs } from "@/server/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
    const logs = await biDb.select()
        .from(systemLogs)
        .orderBy(desc(systemLogs.createdAt))
        .limit(100);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Logs do Sistema</h1>
                <form action={async () => {
                    "use server";
                    // Just revalidates the page
                }}>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
                        Atualizar
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-3 text-left">Data</th>
                                <th className="px-4 py-3 text-left">Level</th>
                                <th className="px-4 py-3 text-left">Componente</th>
                                <th className="px-4 py-3 text-left">Mensagem</th>
                                <th className="px-4 py-3 text-left">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium
                                            ${log.level === 'ERROR' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            }`}>
                                            {log.level}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium">{log.component}</td>
                                    <td className="px-4 py-3">{log.message}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">
                                        {log.details ? (
                                            <details className="cursor-pointer group">
                                                <summary className="font-medium text-blue-600 dark:text-blue-400 hover:underline list-none">
                                                    Ver Detalhes
                                                </summary>
                                                <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 overflow-x-auto">
                                                    <pre className="whitespace-pre-wrap font-mono text-[10px] leading-tight text-slate-800 dark:text-slate-300">
                                                        {JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </div>
                                            </details>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
