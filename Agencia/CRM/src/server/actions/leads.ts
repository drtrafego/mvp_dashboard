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


export async function getColumns() {
  const orgId = await getOrgId();
  
  // First, fetch all existing columns
  const existing = await db.query.columns.findMany({
    where: eq(columns.organizationId, orgId),
    orderBy: [asc(columns.order)],
  });

  // Define the expected standard columns
  const expectedTitles = ["Novos Leads", "Em Contato", "Não Retornou", "Proposta Enviada", "Fechado", "Perdido"];

  // 1. Handle empty state - Only initialize if NO columns exist
  if (existing.length === 0) {
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
  return existing.sort((a, b) => a.order - b.order);
}

export async function deleteLead(id: string) {
    await db.delete(leads).where(eq(leads.id, id));
    revalidatePath('/dashboard/crm');
}

export async function getLeads() {
  // In real app: const user = await stackServerApp.getUser();
  // const orgId = user.selectedTeam?.id || user.id;
  const orgId = await getOrgId();
  
  return await db.query.leads.findMany({
    where: eq(leads.organizationId, orgId),
    orderBy: [asc(leads.position), desc(leads.createdAt)],
  });
}

export async function updateLeadStatus(id: string, newColumnId: string, newPosition: number) {
  const orgId = await getOrgId();
  console.log(`[updateLeadStatus] Org: ${orgId} | Lead: ${id} -> Col: ${newColumnId} (Pos: ${newPosition})`);
  
  try {
      await db.update(leads)
        .set({ 
          columnId: newColumnId, 
          position: newPosition 
        })
        .where(and(eq(leads.id, id), eq(leads.organizationId, orgId)));
        
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
  const orgId = await getOrgId();

  console.log(`[createLead] Creating lead for Org: ${orgId}`);

  // Get the first column to add the lead to
  const firstColumn = await db.query.columns.findFirst({
    where: eq(columns.organizationId, orgId),
    orderBy: [asc(columns.order)],
  });

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
    const orgId = await getOrgId();
    console.log(`[updateColumn] Org: ${orgId} | Col: ${id} -> Title: ${title}`);
    await db.update(columns)
        .set({ title })
        .where(and(eq(columns.id, id), eq(columns.organizationId, orgId)));
    revalidatePath('/dashboard/crm');
}

export async function updateColumnOrder(orderedIds: string[]) {
    const orgId = await getOrgId();
    console.log(`[updateColumnOrder] Org: ${orgId} | New Order:`, orderedIds);
    
    try {
        // Process updates sequentially
        for (let i = 0; i < orderedIds.length; i++) {
            const result = await db.update(columns)
                .set({ order: i })
                .where(and(eq(columns.id, orderedIds[i]), eq(columns.organizationId, orgId)))
                .returning({ id: columns.id });
            
            if (result.length === 0) {
                console.warn(`[updateColumnOrder] Warning: No column updated for ID ${orderedIds[i]} (Index ${i})`);
            }
        }
        
        revalidatePath('/dashboard/crm');
        console.log(`[updateColumnOrder] Success - Revalidated path`);
        
        // Fetch and return the verified new order
        const updatedColumns = await db.query.columns.findMany({
            where: eq(columns.organizationId, orgId),
            orderBy: [asc(columns.order)],
        });

        return { success: true, columns: updatedColumns };
    } catch (error) {
        console.error("[updateColumnOrder] Error:", error);
        throw error;
    }
}

export async function deleteColumn(id: string) {
    const orgId = await getOrgId();
    
    // Get the column being deleted to know its order
    const columnToDelete = await db.query.columns.findFirst({
        where: eq(columns.id, id)
    });

    if (!columnToDelete) return; // Already deleted

    // Find a fallback column:
    // 1. Try to find the immediate predecessor (order < deleted.order)
    let fallbackCol = await db.query.columns.findFirst({
        where: and(
            eq(columns.organizationId, orgId),
            ne(columns.id, id),
            lt(columns.order, columnToDelete.order) // Less than
        ),
        orderBy: [desc(columns.order)] // Highest order less than current (closest predecessor)
    });

    // 2. If no predecessor (was first column), find immediate successor
    if (!fallbackCol) {
        fallbackCol = await db.query.columns.findFirst({
            where: and(
                eq(columns.organizationId, orgId),
                ne(columns.id, id),
                gt(columns.order, columnToDelete.order) // Greater than
            ),
            orderBy: [asc(columns.order)] // Lowest order greater than current (closest successor)
        });
    }
    
    // 3. If still nothing, just pick ANY other column
    if (!fallbackCol) {
        fallbackCol = await db.query.columns.findFirst({
            where: and(
                eq(columns.organizationId, orgId),
                ne(columns.id, id)
            ),
            orderBy: [asc(columns.order)]
        });
    }

    if (fallbackCol) {
        // Move leads to fallback column
        await db.update(leads)
            .set({ columnId: fallbackCol.id })
            .where(eq(leads.columnId, id));
    } else {
        // If no other column exists, delete the leads to avoid orphans
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
