import { getLeads, getColumns } from "../../../server/actions/leads";
import { getSettings } from "../../../server/actions/settings";
import { CrmView } from "../../../components/features/crm/crm-view";

export const dynamic = 'force-dynamic';

export default async function CRMPage() {
  const [leads, columns, settings] = await Promise.all([
    getLeads(),
    getColumns(),
    getSettings()
  ]);

  return (
    <div className="min-h-[calc(100vh-100px)] pb-8">
      <CrmView 
        initialLeads={leads as any[]}  
        columns={columns} 
        companyName={settings?.companyName} 
        initialViewMode={settings?.viewMode || 'kanban'}
      />
      <div className="text-xs text-gray-300 text-center mt-2">
        CRM Global View - v2.0 (Updated)
      </div>
    </div>
  );
}
