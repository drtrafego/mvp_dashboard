'use server'

import { db } from "@/lib/db";
import { leads, columns } from "@/server/db/schema";
import { eq, asc, desc, and, ne, lt, gt, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { stackServerApp } from "@/stack";

async function getOrgId() {
  // HARDCODED FOR SINGLE TENANT MODE
  // This ensures ALL users see the same data (shared workspace)
  return "bilder_agency_shared";
}

// Helper to unify columns from multiple organizations
async function getCanonicalData() {
    // Fetch ALL columns from ALL organizations
    const allColumns = await db.query.columns.findMany({
        orderBy: [asc(columns.order)],
    });

    const uniqueColumnsMap = new Map<string, typeof columns.$inferSelect>();
    const idMap = new Map<string, string>(); // Original ID -> Canonical ID

    // Prioritize columns from 'org_demo_123' if possible, otherwise first found
    // We sort so that we process 'org_demo_123' first if we want, or just by creation
    // For now, we process by existing order.
    
    for (const col of allColumns) {
        if (!uniqueColumnsMap.has(col.title)) {
            uniqueColumnsMap.set(col.title, col);
        }
        const canonical = uniqueColumnsMap.get(col.title)!;
        idMap.set(col.id, canonical.id);
    }

    const uniqueColumns = Array.from(uniqueColumnsMap.values()).sort((a, b) => a.order - b.order);
    return { uniqueColumns, idMap };
}


export async function getColumns() {
  const { uniqueColumns } = await getCanonicalData();
  const orgId = await getOrgId();
  
  // Define the expected standard columns
  const expectedTitles = ["Novos Leads", "Em Contato", "Não Retornou", "Proposta Enviada", "Fechado", "Perdido"];

  // 1. Handle empty state - Only initialize if NO columns exist AT ALL
  if (uniqueColumns.length === 0) {
      const inserted = await db.insert(columns).values(
          expectedTitles.map((title, i) => ({
              title,
              organizationId: orgId,
              order: i
          }))
      ).returning();
      return inserted.sort((a, b) => a.order - b.order);
  }

  // Return existing columns as-is, just sorted
  return uniqueColumns;
}

export async function deleteLead(id: string) {
    await db.delete(leads).where(eq(leads.id, id));
    revalidatePath('/dashboard/crm');
}

export async function getLeads() {
  const { idMap } = await getCanonicalData();
  
  // Fetch ALL leads from ALL organizations
  const allLeads = await db.query.leads.findMany({
    orderBy: [asc(leads.position), desc(leads.createdAt)],
  });

  // Map leads to canonical columns
  // If a lead points to a column that was merged, point it to the canonical one
  return allLeads.map(lead => {
      if (lead.columnId && idMap.has(lead.columnId)) {
          return { ...lead, columnId: idMap.get(lead.columnId) };
      }
      return lead;
  });
}

export async function updateLeadStatus(id: string, newColumnId: string, newPosition: number) {
  // Allow updating ANY lead regardless of organization
  console.log(`[updateLeadStatus] Lead: ${id} -> Col: ${newColumnId} (Pos: ${newPosition})`);
  
  try {
      // 1. Get Canonical Data to ensure we have the correct target column ID
      const { idMap } = await getCanonicalData();
      
      // If the incoming newColumnId is one of the "merged" ones, we should use the canonical one
      // However, usually the UI should already be using the canonical one if we set it up right.
      // But let's double check:
      let targetColumnId = newColumnId;
      if (idMap.has(newColumnId)) {
          targetColumnId = idMap.get(newColumnId)!;
          console.log(`[updateLeadStatus] Remapped column ${newColumnId} -> ${targetColumnId}`);
      }

      await db.update(leads)
        .set({ 
          columnId: targetColumnId, 
          position: newPosition 
        })
        .where(eq(leads.id, id));
        
      revalidatePath('/dashboard/crm');
      console.log(`[updateLeadStatus] Success`);
  } catch (error) {
      console.error("[updateLeadStatus] Error:", error);
      throw error;
  }
}

export async function createLead(formData: FormData) {
  const name = formData.get("name") as string;
  const company = formData.get("company") as string;
  const email = formData.get("email") as string;
  const whatsapp = formData.get("whatsapp") as string;
  const notes = formData.get("notes") as string;
  const valueStr = formData.get("value") as string;
  const value = valueStr ? valueStr : null;
  const orgId = await getOrgId(); // Use shared ID for new leads

  console.log(`[createLead] Creating lead for Org: ${orgId}`);

  // Get the first column to add the lead to (using canonical logic)
  const columnsList = await getColumns();
  const firstColumn = columnsList[0];

  if (!firstColumn) {
    throw new Error("No columns found");
  }

  await db.insert(leads).values({
    name,
    company,
    email,
    whatsapp,
    notes,
    value,
    status: 'active', // Default status, or use column title if needed
    columnId: firstColumn.id,
    organizationId: orgId,
    position: 0, // Add to top
  });

  revalidatePath('/dashboard/crm');
}

export async function createColumn(title: string) {
    const orgId = await getOrgId();
    console.log(`[createColumn] Org: ${orgId} | Title: ${title}`);
    const existingColumns = await getColumns();
    
    await db.insert(columns).values({
        title,
        organizationId: orgId,
        order: existingColumns.length,
    });
    
    revalidatePath('/dashboard/crm');
}

export async function updateColumn(id: string, title: string) {
    console.log(`[updateColumn] Col: ${id} -> Title: ${title}`);
    // Update potentially multiple columns if we are merging?
    // Ideally we update just the one targeted. 
    // Since UI sees canonical ID, we update that one.
    await db.update(columns)
        .set({ title })
        .where(eq(columns.id, id));
    revalidatePath('/dashboard/crm');
}

export async function updateColumnOrder(orderedIds: string[]) {
    console.log(`[updateColumnOrder] New Order:`, orderedIds);
    
    try {
        // Process updates sequentially
        for (let i = 0; i < orderedIds.length; i++) {
            const result = await db.update(columns)
                .set({ order: i })
                .where(eq(columns.id, orderedIds[i]))
                .returning({ id: columns.id });
            
            if (result.length === 0) {
                console.warn(`[updateColumnOrder] Warning: No column updated for ID ${orderedIds[i]} (Index ${i})`);
            }
        }
        
        revalidatePath('/dashboard/crm');
        console.log(`[updateColumnOrder] Success - Revalidated path`);
        
        return { success: true };
    } catch (error) {
        console.error("[updateColumnOrder] Error:", error);
        throw error;
    }
}

export async function deleteColumn(id: string) {
    const { idMap, uniqueColumns } = await getCanonicalData();
    
    // Get the column being deleted to know its order
    // Use uniqueColumns because UI is based on it
    const columnToDelete = uniqueColumns.find(c => c.id === id);

    if (!columnToDelete) return; // Already deleted

    // Find a fallback column in the canonical list
    let fallbackCol: any = uniqueColumns
        .filter(c => c.id !== id && c.order < columnToDelete.order)
        .sort((a, b) => b.order - a.order)[0]; // Closest predecessor

    if (!fallbackCol) {
        fallbackCol = uniqueColumns
            .filter(c => c.id !== id && c.order > columnToDelete.order)
            .sort((a, b) => a.order - b.order)[0]; // Closest successor
    }
    
    if (!fallbackCol) {
         fallbackCol = uniqueColumns.find(c => c.id !== id);
    }

    if (fallbackCol) {
        // Move leads to fallback column
        // We need to move leads from ALL columns that map to the deleted canonical ID?
        // Actually, if we delete a canonical column, we should probably delete the underlying record.
        // But what about other columns that mapped to it?
        // This is getting complex. Simple approach: Just delete the target column record.
        // And move leads that pointed to it.
        
        await db.update(leads)
            .set({ columnId: fallbackCol.id })
            .where(eq(leads.columnId, id));
    } else {
        await db.delete(leads).where(eq(leads.columnId, id));
    }

    await db.delete(columns).where(eq(columns.id, id));
    revalidatePath('/dashboard/crm');
}

export async function updateLeadContent(id: string, data: Partial<typeof leads.$inferInsert>) {
    // Whitelist allowed fields to prevent accidental overwrites of critical data
    // like columnId, position, organizationId, etc.
    // Removed 'status' from whitelist to prevent any accidental status changes during edit
    const allowedFields: (keyof typeof leads.$inferInsert)[] = [
        'name', 
        'company', 
        'email', 
        'whatsapp', 
        'notes', 
        'value'
    ];
    
    const updatePayload: Partial<typeof leads.$inferInsert> = {};
    
    // Only copy allowed fields
    for (const key of allowedFields) {
        if (data[key] !== undefined) {
            // @ts-ignore - dynamic assignment
            updatePayload[key] = data[key];
        }
    }

    // Handle empty strings or whitespace for value
    if (typeof updatePayload.value === 'string' && updatePayload.value.trim() === '') {
        updatePayload.value = null;
    } else if (updatePayload.value === "") {
        updatePayload.value = null;
    }

    // If nothing to update, return early
    // Note: We might still need to update columnId/position if passed, so check that later or check data keys
    
    console.log(`Updating lead content ${id} with payload:`, updatePayload);
    
    // Verify lead exists first (optional but good for debugging)
    const existingLead = await db.query.leads.findFirst({
        where: eq(leads.id, id),
        columns: { id: true, columnId: true, position: true }
    });

    if (!existingLead) {
        console.error(`Lead ${id} not found for update`);
        return;
    }

    // Handle columnId and position
    // If provided in data (from trusted client source context), use it.
    // Otherwise, preserve existing DB value.
    // This solves the race condition where client has moved the item (optimistic)
    // but DB hasn't updated yet when edit happens.
    if (data.columnId !== undefined) {
        console.log(`[updateLeadContent] Using provided columnId: ${data.columnId}`);
        updatePayload.columnId = data.columnId;
    } else {
        console.log(`[updateLeadContent] Using existing DB columnId: ${existingLead.columnId}`);
        updatePayload.columnId = existingLead.columnId;
    }

    if (data.position !== undefined) {
        updatePayload.position = data.position;
    } else {
        updatePayload.position = existingLead.position;
    }

    console.log(`Final update payload for lead ${id}:`, updatePayload);

    await db.update(leads)
        .set(updatePayload)
        .where(eq(leads.id, id));
        
    revalidatePath('/dashboard/crm');
}
