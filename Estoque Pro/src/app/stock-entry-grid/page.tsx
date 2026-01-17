import { AppLayout } from "@/components/app-layout"
import { StockEntryGridContent } from "@/components/stock-entry-grid-content"
import { getTenantContext } from "@/lib/tenant"

export const metadata = {
    title: "Entrada em Grade | Estoque Pro",
    description: "Gerenciamento de estoque por grade",
}

export default async function StockEntryGridPage() {
    const context = await getTenantContext()

    return (
        <AppLayout
            userName={context?.userName || undefined}
            userRole={context?.role || undefined}
        >
            <StockEntryGridContent />
        </AppLayout>
    )
}
