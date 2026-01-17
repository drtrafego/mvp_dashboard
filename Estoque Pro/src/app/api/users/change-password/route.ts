import { NextRequest, NextResponse } from "next/server";
import { getTenantContext, hasRole } from "@/lib/tenant";
import { stackServerApp } from "@/lib/stack";
import { prisma } from "@/lib/db";

// POST /api/users/change-password - Change user password
export async function POST(request: NextRequest) {
    try {
        const context = await getTenantContext();
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { userId, newPassword, currentPassword } = body;

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json(
                { error: "A nova senha deve ter pelo menos 6 caracteres" },
                { status: 400 }
            );
        }

        // Get the target user
        const targetUser = await prisma.user.findFirst({
            where: {
                id: userId || context.userId,
                organizationId: context.organizationId
            }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
        }

        // If changing another user's password, must be admin
        const isChangingOwnPassword = targetUser.id === context.userId;

        if (!isChangingOwnPassword && !hasRole(context, "ADMIN")) {
            return NextResponse.json(
                { error: "Apenas administradores podem alterar senhas de outros usuários" },
                { status: 403 }
            );
        }

        // Get Stack Auth user by email
        const stackUsers = await stackServerApp.listUsers();
        const stackUser = stackUsers.find(
            (u: any) => u.primaryEmail?.toLowerCase() === targetUser.email.toLowerCase()
        );

        if (!stackUser) {
            return NextResponse.json(
                { error: "Usuário não encontrado no sistema de autenticação. O usuário pode precisar ativar a conta primeiro." },
                { status: 404 }
            );
        }

        // Update password in Stack Auth
        try {
            await stackUser.update({
                password: newPassword
            });
        } catch (error: any) {
            console.error("Stack Auth password update error:", error);
            return NextResponse.json(
                { error: "Erro ao atualizar senha: " + (error.message || "Erro desconhecido") },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: isChangingOwnPassword
                ? "Sua senha foi alterada com sucesso!"
                : `Senha do usuário ${targetUser.name} alterada com sucesso!`
        });

    } catch (error) {
        console.error("Error changing password:", error);
        return NextResponse.json(
            { error: "Erro interno ao alterar senha" },
            { status: 500 }
        );
    }
}
