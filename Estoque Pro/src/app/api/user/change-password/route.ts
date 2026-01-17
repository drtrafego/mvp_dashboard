import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
    try {
        const context = await getTenantContext();
        if (!context || !context.userId) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({
                error: "A nova senha deve ter pelo menos 6 caracteres"
            }, { status: 400 });
        }

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: context.userId }
        });

        if (!user) {
            return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
        }

        // If user has a password, verify current password
        if (user.passwordHash && currentPassword) {
            const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
            }
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update user password
        await prisma.user.update({
            where: { id: context.userId },
            data: {
                passwordHash,
                passwordChangedAt: new Date(),
                tempPasswordExpiresAt: null // Clear temp password expiration
            }
        });

        return NextResponse.json({
            message: "Senha alterada com sucesso"
        });

    } catch (error) {
        console.error("[CHANGE PASSWORD] Error:", error);
        return NextResponse.json({ error: "Erro ao alterar senha" }, { status: 500 });
    }
}
