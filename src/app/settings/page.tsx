"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    getAdAccountSettings,
    updateAdAccountSettings,
    checkIsAdmin,
} from "@/server/actions/ad-account-settings";
import { inviteUser, getMembers, removeMember, revokeInvitation, updateMemberRole } from "@/server/actions/team";
import { syncMetaAds } from "@/server/actions/sync";
import { syncGoogleAds, syncGA4 } from "@/server/actions/sync-google";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, UserPlus, Mail, Shield, User, Loader2, Edit2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const adAccountSchema = z.object({
    googleAdsCustomerId: z
        .string()
        .regex(/^\d{3}-\d{3}-\d{4}$/, "Formato inválido. Use: 000-000-0000")
        .or(z.literal(""))
        .optional(),
    facebookAdAccountId: z
        .string()
        .regex(/^act_\d+$/, "Formato inválido. Use: act_xxxxxxxx")
        .or(z.literal(""))
        .optional(),
    ga4PropertyId: z
        .string()
        .regex(/^\d+$/, "Use apenas o ID numérico (ex: 123456789), não o Measurement ID (G-XXXX)")
        .or(z.literal(""))
        .optional(),
});

type AdAccountFormData = z.infer<typeof adAccountSchema>;

const inviteSchema = z.object({
    email: z.string().email("E-mail inválido"),
    role: z.enum(["admin", "member"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function SettingsPage() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState("integrations");

    // Team Data
    const [members, setMembers] = useState<any[]>([]);
    const [pendingInvites, setPendingInvites] = useState<any[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<string>("member");
    const [editingMember, setEditingMember] = useState<string | null>(null);
    const [editingRole, setEditingRole] = useState<"admin" | "member">("member");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AdAccountFormData>({
        resolver: zodResolver(adAccountSchema),
    });

    const {
        register: registerInvite,
        handleSubmit: handleSubmitInvite,
        reset: resetInvite,
        formState: { errors: inviteErrors, isSubmitting: isInviting },
    } = useForm<InviteFormData>({
        resolver: zodResolver(inviteSchema),
        defaultValues: { role: "member" },
    });

    const reloadTeamData = useCallback(async () => {
        try {
            const teamData = await getMembers();
            if (teamData) {
                setMembers(teamData.members);
                setPendingInvites(teamData.pendingInvites);
                setCurrentUserRole(teamData.currentUserRole || "member");
            }
        } catch (error) {
            console.error("Erro ao recarregar dados da equipe:", error);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function loadInitialData() {
            setIsLoading(true);
            try {
                const [adminCheck, settings, teamData] = await Promise.all([
                    checkIsAdmin(),
                    getAdAccountSettings(),
                    getMembers()
                ]);

                if (!isMounted) return;

                setIsAdmin(adminCheck);

                if (settings) {
                    reset({
                        googleAdsCustomerId: settings.googleAdsCustomerId || "",
                        facebookAdAccountId: settings.facebookAdAccountId || "",
                        ga4PropertyId: settings.ga4PropertyId || "",
                    });
                }

                if (teamData) {
                    setMembers(teamData.members);
                    setPendingInvites(teamData.pendingInvites);
                    setCurrentUserRole(teamData.currentUserRole || "member");
                }

            } catch (error) {
                console.error("Erro ao carregar dados iniciais:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadInitialData();
        // The original loadData() was called here, but now we have loadInitialData for the first load
        // and reloadTeamData for subsequent team data updates.
        // setIsLoading(false); // This was redundant here as it's in finally block of loadInitialData
    }, [reset, reloadTeamData]);


    const onSubmitSettings = async (data: AdAccountFormData) => {
        setIsSaving(true);
        setMessage(null);
        try {
            await updateAdAccountSettings({
                googleAdsCustomerId: data.googleAdsCustomerId || null,
                facebookAdAccountId: data.facebookAdAccountId || null,
                ga4PropertyId: data.ga4PropertyId || null,
            });
            setMessage({ type: "success", text: "Configurações salvas!" });
        } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao salvar" });
        } finally {
            setIsSaving(false);
        }
    };

    const onInvite = async (data: InviteFormData) => {
        setMessage(null);
        try {
            const res = await inviteUser(data.email, data.role);
            if (res.success) {
                setMessage({ type: "success", text: "Convite enviado!" });
                resetInvite();
                await reloadTeamData();
            } else {
                setMessage({ type: "error", text: res.error || "Erro ao convidar" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Erro inesperado" });
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Remover este membro?")) return;
        try {
            const res = await removeMember(userId);
            if (res.success) await reloadTeamData();
            else alert(res.error);
        } catch (e) {
            alert("Erro ao remover");
        }
    };

    const handleRevokeInvite = async (inviteId: string) => {
        if (!confirm("Cancelar convite?")) return;
        try {
            const res = await revokeInvitation(inviteId);
            if (res.success) await reloadTeamData();
            else alert(res.error);
        } catch (e) {
            alert("Erro ao cancelar");
        }
    };

    const handleUpdateRole = async (userId: string) => {
        try {
            const res = await updateMemberRole(userId, editingRole);
            if (res.success) {
                setEditingMember(null);
                await reloadTeamData();
                setMessage({ type: "success", text: "Cargo atualizado!" });
            } else {
                alert(res.error);
            }
        } catch (e) {
            alert("Erro ao atualizar cargo");
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isAdmin === false) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
                    <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-red-800">Acesso Restrito</h2>
                    <p className="mt-2 text-red-600">Apenas administradores podem acessar as configurações.</p>
                </div>
            </div>
        );
    }

    const canManageTeam = currentUserRole === "admin" || currentUserRole === "owner";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">Gerencie integrações e equipe.</p>
                    </div>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
                        {message.text}
                    </div>
                )}

                <Tabs defaultValue="integrations" className="space-y-6" onValueChange={setActiveTab}>
                    <TabsList className="bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                        <TabsTrigger value="integrations" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-300">Integrações</TabsTrigger>
                        <TabsTrigger value="team" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-300">Equipe</TabsTrigger>
                        <TabsTrigger value="appearance" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-300">Aparência</TabsTrigger>
                    </TabsList>

                    {/* INTEGRATIONS TAB */}
                    <TabsContent value="integrations" className="space-y-6">
                        <form onSubmit={handleSubmit(onSubmitSettings)} className="space-y-6">
                            {/* Google Ads */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Google Ads</h2>
                                        <p className="text-sm text-gray-500">ID da conta de anúncios do Google</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="000-000-0000"
                                        {...register("googleAdsCustomerId")}
                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            alert("Testando Google Ads...");
                                            const res = await syncGoogleAds();
                                            alert(res.success ? "✅ Sucesso!" : `❌ Info: ${res.error}`);
                                        }}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                                    >
                                        Testar
                                    </button>
                                </div>
                                {errors.googleAdsCustomerId && <p className="mt-1 text-sm text-red-600">{errors.googleAdsCustomerId.message}</p>}
                            </div>

                            {/* Meta Ads */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C15.9 21.59 18.03 20.37 19.59 18.52C21.15 16.67 22.04 14.32 22.04 11.89C21.92 6.44 17.42 2.04 12 2.04Z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Meta Ads</h2>
                                        <p className="text-sm text-gray-500">ID da conta de anúncios do Facebook</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="act_xxxxxxxx"
                                        {...register("facebookAdAccountId")}
                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            alert("Testando Meta Ads...");
                                            const res = await syncMetaAds();
                                            alert(res.success ? `✅ Sucesso! ${res.count} itens.` : `❌ Info: ${res.error}`);
                                        }}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                                    >
                                        Testar
                                    </button>
                                </div>
                                {errors.facebookAdAccountId && <p className="mt-1 text-sm text-red-600">{errors.facebookAdAccountId.message}</p>}
                            </div>

                            {/* GA4 */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.29 16.29L5.7 12.7c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L10 14.17l6.88-6.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-7.59 7.59c-.38.39-1.02.39-1.41 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Google Analytics 4</h2>
                                        <p className="text-sm text-gray-500">ID da propriedade do GA4</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="123456789"
                                        {...register("ga4PropertyId")}
                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            alert("Testando GA4...");
                                            const res = await syncGA4();
                                            alert(res.success ? `✅ Sucesso! ${res.count} registros.` : `❌ Info: ${res.error}`);
                                        }}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                                    >
                                        Testar
                                    </button>
                                </div>
                                {errors.ga4PropertyId && <p className="mt-1 text-sm text-red-600">{errors.ga4PropertyId.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : "Salvar Configurações"}
                            </button>
                        </form>
                    </TabsContent>

                    {/* TEAM TAB */}
                    <TabsContent value="team" className="space-y-6">
                        {canManageTeam && (
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5" />
                                    Convidar Novo Membro
                                </h2>
                                <form onSubmit={handleSubmitInvite(onInvite)} className="flex flex-col md:flex-row gap-4 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                                        <input
                                            type="email"
                                            placeholder="nome@empresa.com"
                                            {...registerInvite("email")}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:border-blue-500"
                                        />
                                        {inviteErrors.email && <p className="text-red-600 text-xs mt-1">{inviteErrors.email.message}</p>}
                                    </div>
                                    <div className="w-full md:w-48">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Função</label>
                                        <select
                                            {...registerInvite("role")}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:border-blue-500"
                                        >
                                            <option value="member">Membro</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isInviting}
                                        className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:bg-blue-400 whitespace-nowrap"
                                    >
                                        {isInviting ? "Enviando..." : "Enviar Convite"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* PENDING INVITES */}
                        {pendingInvites.length > 0 && (
                            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Mail className="w-4 h-4" /> Convites Pendentes</h3>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {pendingInvites.map((invite) => (
                                        <div key={invite.id} className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{invite.email}</p>
                                                <div className="text-xs text-gray-500 flex gap-2">
                                                    <span>{invite.role === 'admin' ? 'Admin' : 'Membro'}</span>
                                                    <span>•</span>
                                                    <span>{format(new Date(invite.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                                                </div>
                                            </div>
                                            {canManageTeam && (
                                                <button onClick={() => handleRevokeInvite(invite.id)} className="text-red-500 hover:text-red-700 p-2" title="Cancelar">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* MEMBERS LIST */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><User className="w-4 h-4" /> Membros ({members.length})</h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {members.map((member) => (
                                    <div key={member.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {member.image ? (
                                                <img src={member.image} alt="" className="w-10 h-10 rounded-full" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-gray-500" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{member.name || "Sem nome"}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {editingMember === member.id ? (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={editingRole}
                                                        onChange={(e) => setEditingRole(e.target.value as "admin" | "member")}
                                                        className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-700"
                                                    >
                                                        <option value="member">Membro</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <button onClick={() => handleUpdateRole(member.id)} className="text-green-600 p-1"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingMember(null)} className="text-gray-500 p-1"><X className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium 
                                                        ${member.role === 'owner' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                            member.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                                                        {member.role === 'owner' ? 'Dono' : member.role === 'admin' ? 'Admin' : 'Membro'}
                                                    </span>
                                                    {canManageTeam && member.role !== 'owner' && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingMember(member.id);
                                                                setEditingRole(member.role as "admin" | "member");
                                                            }}
                                                            className="text-gray-400 hover:text-blue-600 transition"
                                                            title="Editar Cargo"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {canManageTeam && member.role !== 'owner' && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="text-gray-400 hover:text-red-500 transition"
                                                    title="Remover membro"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* APPEARANCE TAB */}
                    <TabsContent value="appearance">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tema</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Escolha entre modo claro e escuro para a interface.</p>
                            </div>
                            <ModeToggle />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
