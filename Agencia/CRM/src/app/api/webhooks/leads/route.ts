import { db } from "@/lib/db";
import { leads, columns } from "@/server/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, whatsapp, phone, company, notes, campaignSource, organizationId } = body;

    // Support both phone and whatsapp fields in payload
    const finalWhatsapp = whatsapp || phone;

    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Use the SHARED org ID regardless of input
    // This ensures all incoming leads go to the shared workspace
    const orgId = "bilder_agency_shared";

    // Find ANY "Novos Leads" column regardless of organization
    // Since we are in Single Tenant Shared Mode, we accept any column.
    let targetColumn = await db.query.columns.findFirst({
      where: (cols, { eq }) => eq(cols.title, "Novos Leads"),
    });

    if (!targetColumn) {
      // Fallback to ANY first column by order
      targetColumn = await db.query.columns.findFirst({
        orderBy: [asc(columns.order)],
      });
    }

    if (!targetColumn) {
      return NextResponse.json(
        { error: "No columns found for this organization" },
        { status: 500 }
      );
    }

    // Create the lead
    const newLead = await db.insert(leads).values({
      name,
      email,
      whatsapp: finalWhatsapp,
      company,
      notes,
      campaignSource,
      organizationId: orgId,
      columnId: targetColumn.id,
      status: "active",
      position: 0, // Add to top
    }).returning();

    return NextResponse.json({ success: true, lead: newLead[0] });
  } catch (error) {
    console.error("Error processing lead webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
