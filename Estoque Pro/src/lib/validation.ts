"use server"

import { z } from "zod"

// ==============================
// PRODUCT SCHEMAS
// ==============================

export const createProductSchema = z.object({
    name: z.string()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(100, "Nome deve ter no máximo 100 caracteres")
        .transform(val => val.trim()),
    unit: z.enum(["kg", "g", "L", "ml", "un"], { message: "Unidade inválida" }),
    minStock: z.number()
        .min(0, "Estoque mínimo não pode ser negativo")
        .max(999999, "Estoque mínimo muito alto"),
    currentStock: z.number()
        .min(0, "Estoque atual não pode ser negativo")
        .max(999999, "Estoque atual muito alto"),
    expiresAt: z.date().nullable().optional(),
    categoryId: z.string().cuid("ID de categoria inválido"),
    unitPrice: z.number().min(0).max(999999).nullable().optional(),
})

export const updateProductSchema = createProductSchema.partial().extend({
    id: z.string().cuid("ID de produto inválido"),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>

// ==============================
// CATEGORY SCHEMAS
// ==============================

export const createCategorySchema = z.object({
    name: z.string()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(50, "Nome deve ter no máximo 50 caracteres")
        .transform(val => val.trim()),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

// ==============================
// USER SCHEMAS
// ==============================

export const createUserSchema = z.object({
    name: z.string()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(100, "Nome deve ter no máximo 100 caracteres")
        .transform(val => val.trim()),
    email: z.string()
        .email("Email inválido")
        .max(255, "Email muito longo")
        .transform(val => val.toLowerCase().trim()),
    role: z.enum(["ADMIN", "STAFF"], { message: "Role inválida" }),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// ==============================
// STOCK SCHEMAS
// ==============================

export const updateStockSchema = z.object({
    productId: z.string().cuid("ID de produto inválido"),
    currentStock: z.number()
        .min(0, "Estoque não pode ser negativo")
        .max(999999, "Estoque muito alto"),
    expiresAt: z.date().nullable().optional(),
    userId: z.string().cuid("ID de usuário inválido"),
})

export const batchUpdateStockSchema = z.array(updateStockSchema)
    .min(1, "Pelo menos um item é necessário")
    .max(100, "Máximo de 100 itens por vez")

export type UpdateStockInput = z.infer<typeof updateStockSchema>
export type BatchUpdateStockInput = z.infer<typeof batchUpdateStockSchema>

// ==============================
// ORGANIZATION SCHEMAS
// ==============================

export const createOrganizationSchema = z.object({
    name: z.string()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(100, "Nome deve ter no máximo 100 caracteres")
        .transform(val => val.trim()),
    userEmail: z.string().email("Email inválido"),
    userId: z.string().min(1, "ID de usuário obrigatório"),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

// ==============================
// SETTINGS SCHEMAS
// ==============================

export const updateSettingsSchema = z.object({
    companyName: z.string()
        .min(2, "Nome da empresa deve ter pelo menos 2 caracteres")
        .max(100, "Nome da empresa muito longo")
        .optional(),
    ownerName: z.string()
        .min(2, "Nome do proprietário deve ter pelo menos 2 caracteres")
        .max(100, "Nome do proprietário muito longo")
        .optional(),
    expiryWarningDays: z.number()
        .int()
        .min(1, "Mínimo de 1 dia")
        .max(365, "Máximo de 365 dias")
        .optional(),
    lowStockThreshold: z.number()
        .min(0.01, "Mínimo de 1%")
        .max(1, "Máximo de 100%")
        .optional(),
    theme: z.enum(["light", "dark", "system"]).optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

// ==============================
// VARIANT ATTRIBUTE SCHEMAS
// ==============================

export const createVariantAttributeSchema = z.object({
    name: z.string()
        .min(1, "Nome obrigatório")
        .max(50, "Nome muito longo")
        .transform(val => val.trim()),
    values: z.array(z.string().min(1).max(50)).optional(),
})

export const createVariantAttributeValueSchema = z.object({
    attributeId: z.string().cuid("ID de atributo inválido"),
    value: z.string()
        .min(1, "Valor obrigatório")
        .max(50, "Valor muito longo")
        .transform(val => val.trim()),
})

export type CreateVariantAttributeInput = z.infer<typeof createVariantAttributeSchema>
export type CreateVariantAttributeValueInput = z.infer<typeof createVariantAttributeValueSchema>

// ==============================
// PURCHASE REQUEST SCHEMAS
// ==============================

export const purchaseRequestItemSchema = z.object({
    productId: z.string().cuid("ID de produto inválido"),
    quantity: z.number()
        .positive("Quantidade deve ser maior que zero")
        .max(999999, "Quantidade muito alta"),
    estimatedCost: z.number().min(0).max(9999999).optional(),
})

export const createPurchaseRequestSchema = z.object({
    supplier: z.string()
        .max(100, "Nome do fornecedor muito longo")
        .optional(),
    notes: z.string()
        .max(1000, "Observações muito longas")
        .optional(),
    items: z.array(purchaseRequestItemSchema)
        .min(1, "Pelo menos um item é necessário")
        .max(100, "Máximo de 100 itens por requisição"),
})

export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>

// ==============================
// HELPER FUNCTION
// ==============================

/**
 * Validates data against a Zod schema and returns a standardized result
 */
export function validateData<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data)

    if (!result.success) {
        const firstError = result.error.issues[0]
        return {
            success: false,
            error: firstError?.message || "Dados inválidos"
        }
    }

    return { success: true, data: result.data }
}
