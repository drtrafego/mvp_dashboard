// Email helper using Resend
import { Resend } from 'resend';

interface WelcomeEmailParams {
    to: string;
    customerName: string;
}

export async function sendWelcomeEmail({ to, customerName }: WelcomeEmailParams) {
    try {
        // Only send if we have an API key
        if (!process.env.RESEND_API_KEY) {
            console.log("[EMAIL] RESEND_API_KEY not configured, skipping email");
            return { success: false, error: "Email not configured" };
        }

        // Initialize Resend lazily to avoid build-time errors
        const resend = new Resend(process.env.RESEND_API_KEY);

        const activationLink = `https://chefcontrol.online/login?email=${encodeURIComponent(to)}&flow=signup`;

        const { data, error } = await resend.emails.send({
            from: 'ChefControl <noreply@chefcontrol.online>',
            to: [to],
            subject: '🎉 Bem-vindo ao ChefControl! Ative sua conta',
            html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="color: #ea580c; font-size: 28px; margin: 0;">🍳 ChefControl</h1>
                    </div>
                    
                    <h2 style="color: #18181b; font-size: 24px; margin-bottom: 16px;">
                        Olá, ${customerName}! 👋
                    </h2>
                    
                    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">
                        Seu pagamento foi confirmado e sua conta PRO já está reservada!
                    </p>
                    
                    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 12px; padding: 24px; margin: 24px 0;">
                        <p style="color: #92400e; font-size: 16px; margin: 0 0 12px 0;">
                            <strong>📧 Conta liberada para:</strong><br/>
                            <span style="font-size: 18px;">${to}</span>
                        </p>
                        <p style="color: #92400e; font-size: 16px; margin: 0;">
                            <strong>⚡ Próximo passo:</strong><br/>
                            Para acessar, você só precisa ativar seu cadastro clicando no botão abaixo.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${activationLink}" 
                           style="display: inline-block; background: #ea580c; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Ativar Minha Conta →
                        </a>
                    </div>
                    
                    <p style="color: #71717a; font-size: 14px; text-align: center; line-height: 1.5;">
                        Ao clicar, se você usar Gmail, escolha "Continuar com Google".<br/>
                        Se usar outro email, poderá definir sua senha na hora.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
                    
                    <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 24px;">
                        © 2026 ChefControl. Todos os direitos reservados.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("[EMAIL] Error sending welcome email:", error);
            return { success: false, error };
        }

        console.log("[EMAIL] Welcome email sent successfully:", data?.id);
        return { success: true, id: data?.id };

    } catch (error) {
        console.error("[EMAIL] Error sending email:", error);
        return { success: false, error };
    }
}
