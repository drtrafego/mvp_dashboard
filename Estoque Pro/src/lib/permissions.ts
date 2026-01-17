// Helper functions for role-based access control (RBAC)

export type Role = "SUPER_ADMIN" | "ADMIN" | "STAFF"

// Check if user can manage product variants
export function canManageVariants(role: Role): boolean {
    return role === "SUPER_ADMIN" || role === "ADMIN"
}

// Check if user can manage variant attributes
export function canManageVariantAttributes(role: Role): boolean {
    return role === "SUPER_ADMIN" || role === "ADMIN"
}

// Check if user can manage organization settings
export function canManageOrganization(role: Role): boolean {
    return role === "SUPER_ADMIN" || role === "ADMIN"
}

// Check if user can view all organizations (super admin only)
export function canViewAllOrganizations(role: Role): boolean {
    return role === "SUPER_ADMIN"
}

// Check if user can add staff to organizations
export function canAddStaff(role: Role): boolean {
    return role === "SUPER_ADMIN" || role === "ADMIN"
}

// Check if user is super admin
export function isSuperAdmin(role: Role): boolean {
    return role === "SUPER_ADMIN"
}

// Check if user is admin or super admin
export function isAdmin(role: Role): boolean {
    return role === "SUPER_ADMIN" || role === "ADMIN"
}

// Get default role for display
export function getRoleLabel(role: Role): string {
    switch (role) {
        case "SUPER_ADMIN":
            return "Super Administrador"
        case "ADMIN":
            return "Administrador"
        case "STAFF":
            return "Funcionário"
        default:
            return "Usuário"
    }
}
