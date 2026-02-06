"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { switchOrganization } from "@/server/actions/super-admin";
import { Button } from "@/components/ui/button";

export function OrgSwitcher({ orgId, orgName, currentOrgId }: { orgId: string, orgName: string, currentOrgId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const isActive = orgId === currentOrgId;

    async function handleSwitch() {
        if (isActive) return;
        setLoading(true);
        try {
            await switchOrganization(orgId);
            router.refresh(); // Refresh server components
            setTimeout(() => {
                window.location.href = "/dashboard"; // Force full reload to dashboard
            }, 500);
        } catch (error) {
            console.error(error);
            alert("Erro ao trocar organização");
            setLoading(false);
        }
    }

    return (
        <Button
            variant={isActive ? "secondary" : "default"}
            size="sm"
            onClick={handleSwitch}
            disabled={loading || isActive}
        >
            {loading ? "Trocando..." : isActive ? "Atual" : "Acessar Dashboard"}
        </Button>
    );
}
