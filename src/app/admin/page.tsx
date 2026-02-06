import { listOrganizations } from "@/server/actions/organizations";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function AdminDashboard() {
    const orgs = await listOrganizations();

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gerenciar Organizações</h1>
                    <p className="text-gray-500 mt-1">
                        Crie empresas clientes para gerenciar seus dados.
                    </p>
                </div>
                <Link
                    href="/admin/organizations/new"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 shadow-sm"
                >
                    + Nova Organização
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-gray-700">Nome</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Slug (URL)</th>
                            <th className="px-6 py-4 font-semibold text-gray-700">Criado em</th>
                            <th className="px-6 py-4 font-semibold text-gray-700 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orgs.map((org) => (
                            <tr key={org.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {org.name}
                                </td>
                                <td className="px-6 py-4 text-gray-500 font-mono text-sm">
                                    {org.slug}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {format(org.createdAt, "dd 'de' MMM, yyyy", { locale: ptBR })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-blue-600 hover:underline text-sm font-medium">
                                        Gerenciar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {orgs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    Nenhuma organização encontrada. Crie a primeira!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
