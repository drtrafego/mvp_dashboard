"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createOrganization } from "@/server/actions/organizations";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const orgSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    slug: z.string()
        .min(3, "Slug muito curto")
        .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
});

type OrgFormData = z.infer<typeof orgSchema>;

export default function NewOrganizationPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<OrgFormData>({
        resolver: zodResolver(orgSchema),
    });

    const onSubmit = async (data: OrgFormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await createOrganization(data);
            router.push("/admin");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Link href="/admin" className="text-gray-500 hover:text-gray-800 mb-6 inline-block">
                ← Voltar
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 mb-8">Nova Organização</h1>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
                        <input
                            {...register("name")}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Ex: Bilder AI"
                        />
                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Slug (Identificador)</label>
                        <input
                            {...register("slug")}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Ex: bilder-ai"
                        />
                        <p className="text-xs text-gray-500 mt-1">Usado na URL e identificação interna.</p>
                        {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50"
                    >
                        {isSubmitting ? "Criando..." : "Criar Organização"}
                    </button>
                </form>
            </div>
        </div>
    );
}
