"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@stackframe/stack"

// Types
export interface Category {
    id: string
    name: string
}

export interface CustomColumn {
    id: string
    name: string
    createdAt: string
}

export interface Product {
    id: string
    name: string
    unit: string
    minStock: number
    currentStock: number
    expiresAt: string | null
    categoryId: string
    categoryName: string
    responsible?: string
    lastCountAt?: string | null
    unitPrice?: number // R$ por unidade
    customFields?: Record<string, string>
    hasVariants?: boolean
    variants?: any[] // Simplified type for now to avoid circular deps or complex types in context
}

export interface User {
    id: string
    name: string | null
    email: string
    role: "SUPER_ADMIN" | "ADMIN" | "STAFF"
    createdAt?: string
    password?: string // Helper for passing password during create/update
}

export interface StockHistoryEntry {
    id: string
    productId: string
    productName: string
    previousQuantity: number
    newQuantity: number
    responsible: string
    timestamp: string
}

export interface CompanySettings {
    companyName: string
    companyEmail?: string
    ownerName: string
    theme: "system" | "light" | "dark"
    expiryWarningDays: number // dias para alerta de vencimento
    lowStockThreshold: number // porcentagem para estoque baixo (0.10 = 10%)
    businessType?: "VAREJO_GERAL" | "VESTUARIO"
}

// Initial default settings (fallback)
const defaultSettings: CompanySettings = {
    companyName: "Estoque Pro",
    companyEmail: "",
    ownerName: "Usuário",
    theme: "system",
    expiryWarningDays: 2,
    lowStockThreshold: 0.10
}

// Helper functions that use settings
export function isLowStock(product: Product, threshold: number = 0.10): boolean {
    if (product.currentStock === 0) return false
    const bufferValue = product.minStock * (1 + threshold)
    return product.currentStock <= bufferValue
}

export function isOutOfStock(product: Product): boolean {
    return product.currentStock === 0
}

export function isExpiringSoon(product: Product, days: number = 2): boolean {
    if (!product.expiresAt) return false
    const today = new Date()
    const expDate = new Date(product.expiresAt)
    const diffTime = expDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= days && diffDays >= 0
}

export function isExpired(product: Product): boolean {
    if (!product.expiresAt) return false
    const today = new Date()
    const expDate = new Date(product.expiresAt)
    return expDate < today
}

interface StockContextType {
    categories: Category[]
    products: Product[]
    users: User[]
    customColumns: CustomColumn[]
    settings: CompanySettings
    history: StockHistoryEntry[]
    loading: boolean
    refreshData: () => Promise<void>
    addCategory: (category: Omit<Category, "id">) => Promise<void>
    updateCategory: (id: string, name: string) => Promise<void>
    deleteCategory: (id: string) => Promise<boolean>
    addProduct: (product: Omit<Product, "id">) => Promise<void>
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
    deleteProduct: (id: string) => Promise<void>
    updateStock: (productId: string, quantity: number, expiresAt?: string, responsible?: string) => Promise<void>
    addUser: (user: User) => Promise<void>
    updateUser: (id: string, updates: Partial<User>) => Promise<void>
    deleteUser: (id: string) => Promise<void>
    addCustomColumn: (column: CustomColumn) => Promise<void>
    deleteCustomColumn: (id: string) => Promise<void>
    updateCustomColumn: (id: string, name: string) => Promise<void>
    updateProductCustomField: (productId: string, columnId: string, value: string) => Promise<void>
    updateSettings: (updates: Partial<CompanySettings>) => Promise<void>
    // User role for permissions
    userRole: "SUPER_ADMIN" | "ADMIN" | "STAFF"
    isSuperAdmin: boolean
    isAdmin: boolean
    subscriptionStatus: string | null
    subscriptionExpiresAt: string | null // ISO string from JSON
}

const StockContext = React.createContext<StockContextType | null>(null)

export function StockProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const user = useUser()
    const [categories, setCategories] = React.useState<Category[]>([])
    const [products, setProducts] = React.useState<Product[]>([])
    // Users state will be managed via API, primarily for display
    const [users, setUsers] = React.useState<User[]>([])
    const [customColumns, setCustomColumns] = React.useState<CustomColumn[]>([])
    const [settings, setSettings] = React.useState<CompanySettings>(defaultSettings)
    const [history, setHistory] = React.useState<StockHistoryEntry[]>([])
    const [loading, setLoading] = React.useState(true)
    const [userRole, setUserRole] = React.useState<"SUPER_ADMIN" | "ADMIN" | "STAFF">("STAFF")
    const [isSuperAdmin, setIsSuperAdmin] = React.useState(false)
    const [isAdmin, setIsAdmin] = React.useState(false)
    const [subscriptionStatus, setSubscriptionStatus] = React.useState<string | null>(null)
    const [subscriptionExpiresAt, setSubscriptionExpiresAt] = React.useState<string | null>(null)

    const fetchData = React.useCallback(async () => {
        try {
            const response = await fetch("/api/data")
            if (response.status === 401) {
                // Not authenticated
                return
            }
            if (!response.ok) {
                console.error(`Failed to fetch data: ${response.status} ${response.statusText}`)
                const text = await response.text()
                console.error("Response body:", text)
                return
            }

            const data = await response.json()

            if (data.needsOnboarding) {
                router.push("/onboarding")
                return
            }

            setCategories(data.categories || [])
            setProducts(data.products || [])
            setCustomColumns(data.customColumns || [])
            if (data.settings) setSettings(data.settings)
            if (data.users) {
                setUsers(data.users)
            } else if (data.user) {
                setUsers([data.user])
            }

            // Handle Subscription
            if (data.organization) {
                setSubscriptionStatus(data.organization.subscriptionStatus)
                setSubscriptionExpiresAt(data.organization.subscriptionExpiresAt)

                // Note: We no longer auto-redirect to settings for inactive subscriptions.
                // Users can access the dashboard and will see a banner or prompt to subscribe.
                // The subscription check can be handled at the feature level or with a soft prompt.
            }

            // Fetch user context for role/permissions
            try {
                const userContextRes = await fetch("/api/user-context")
                if (userContextRes.ok) {
                    const userContext = await userContextRes.json()
                    setUserRole(userContext.role || "STAFF")
                    setIsSuperAdmin(userContext.isSuperAdmin || false)
                    setIsAdmin(userContext.isAdmin || false)
                }
            } catch (e) {
                console.error("Error fetching user context:", e)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }, [router, pathname, isSuperAdmin])

    React.useEffect(() => {
        // Só buscar dados se o usuário estiver autenticado e não estiver na página de login
        const isAuthPage = pathname === "/login" || pathname === "/onboarding"
        if (user && !isAuthPage) {
            fetchData()
        } else if (!user && !isAuthPage) {
            // Se não está logado e não está em página de auth, definir loading como false
            setLoading(false)
        }
    }, [fetchData, user, pathname])

    const fetchHistory = React.useCallback(async () => {
        try {
            const response = await fetch("/api/stock?limit=20")
            if (response.ok) {
                const data = await response.json()
                setHistory(data.history || [])
            }
        } catch (error) {
            console.error("Error fetching history:", error)
        }
    }, [])

    React.useEffect(() => {
        // Only fetch history if not loading AND user is authenticated
        if (!loading && user) {
            fetchHistory()
        }
    }, [loading, fetchHistory, user])

    const addCategory = async (category: Omit<Category, "id">) => {
        try {
            const response = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(category)
            })
            if (response.ok) {
                const data = await response.json()
                setCategories(prev => [...prev, data.category])
            }
        } catch (error) {
            console.error("Error adding category:", error)
            throw error
        }
    }

    const updateCategory = async (id: string, name: string) => {
        try {
            const response = await fetch("/api/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, name })
            })
            if (response.ok) {
                const data = await response.json()
                setCategories(prev => prev.map(c =>
                    c.id === id ? data.category : c
                ))
            }
        } catch (error) {
            console.error("Error updating category:", error)
            throw error
        }
    }

    const deleteCategory = async (id: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/categories?id=${id}`, {
                method: "DELETE"
            })
            if (response.ok) {
                setCategories(prev => prev.filter(c => c.id !== id))
                return true
            } else {
                const data = await response.json()
                console.error("Failed to delete category:", data.error)
                return false
            }
        } catch (error) {
            console.error("Error deleting category:", error)
            return false
        }
    }

    const addProduct = async (product: Omit<Product, "id">) => {
        try {
            const response = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(product)
            })
            if (response.ok) {
                const data = await response.json()
                // Ensure categoryName is present for the UI grouping
                const newProduct = {
                    ...data.product,
                    categoryName: data.product.category?.name || "Sem categoria",
                    customFields: (data.product.customData as Record<string, string>) || product.customFields || {}
                }
                setProducts(prev => [...prev, newProduct])
            } else {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                console.error("Failed to add product API:", errorData)
                throw new Error(errorData.error || "Failed to add product")
            }
        } catch (error) {
            console.error("Error adding product:", error)
            throw error
        }
    }

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        try {
            const response = await fetch("/api/products", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...updates })
            })
            if (response.ok) {
                const data = await response.json()
                const updatedProduct = {
                    ...data.product,
                    categoryName: data.product.category?.name || updates.categoryName || "Sem categoria",
                    // Map Prisma's customData to frontend's customFields
                    customFields: (data.product.customData as Record<string, string>) || updates.customFields || {},
                    // Map dates properly
                    expiresAt: data.product.expiresAt ? new Date(data.product.expiresAt).toISOString().split("T")[0] : null,
                    lastCountAt: data.product.lastCountAt ? new Date(data.product.lastCountAt).toISOString().split("T")[0] : null
                }
                setProducts(prev => prev.map(p =>
                    p.id === id ? updatedProduct : p
                ))
            }
        } catch (error) {
            console.error("Error updating product:", error)
            throw error
        }
    }

    const deleteProduct = async (id: string) => {
        try {
            const response = await fetch(`/api/products?id=${id}`, {
                method: "DELETE"
            })
            if (response.ok) {
                setProducts(prev => prev.filter(p => p.id !== id))
            }
        } catch (error) {
            console.error("Error deleting product:", error)
            throw error
        }
    }

    const updateStock = async (productId: string, quantity: number, expiresAt?: string, responsible?: string) => {
        try {
            const response = await fetch("/api/stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, quantity, expiresAt })
            })
            if (response.ok) {
                const data = await response.json()
                const updatedProduct = {
                    ...data.product,
                    categoryName: data.product.category?.name || "Sem categoria"
                }
                setProducts(prev => prev.map(p =>
                    p.id === productId ? updatedProduct : p
                ))
                fetchHistory()
            } else {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                console.error("Failed to update stock:", errorData)
                throw new Error(errorData.error || "Failed to update stock")
            }
        } catch (error) {
            console.error("Error updating stock:", error)
            throw error
        }
    }

    const addUser = async (user: User) => {
        // Find organization ID from current user
        // Note: fetchUserContext sets userRole/isAdmin but doesn't store orgId in state explicitly except in users list
        // We need organizationId to call the API.
        // Let's assume the API route can infer orgId via context if we call a generic endpoint, 
        // OR we need to fetch context first.
        // Actually, the API /api/admin/organizations/[id]/staff requires ID.
        // Let's rely on the fact that for ADMIN, they can only manage their own org.

        // Better strategy: Use a new endpoint /api/settings/users that infers org from context OR
        // fetch organizationId from context at startup and store it.

        // For now, let's look at getTenantContext in the backend. 
        // Admin creates user:
        try {
            // We need the org ID. Let's fetch it from /api/user-context if not available, 
            // but efficiently we should store it.
            // Quick fix: fetch from user-context then call api, or safer:
            // Call a new wrapper API /api/admin/staff that redirects logic?
            // No, let's use the valid API.
            const contextRes = await fetch("/api/user-context")
            const context = await contextRes.json()
            if (!context.organizationId) throw new Error("No org id")

            const response = await fetch(`/api/admin/organizations/${context.organizationId}/staff`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    password: user.password
                })
            })

            if (response.ok) {
                const data = await response.json()
                // The API returns { user: ... }
                setUsers(prev => [...prev, data.user])
            } else {
                const errorData = await response.json()
                console.error("Failed to add user:", errorData)
                throw new Error(errorData.error || "Failed to add user")
            }
        } catch (e) {
            console.error("Error adding user:", e)
            throw e
        }
    }

    const deleteUser = async (id: string) => {
        try {
            const contextRes = await fetch("/api/user-context")
            const context = await contextRes.json()

            // We need email to delete. The UI passes ID and Email usually?
            // The deleteUser signature in this file is (id: string).
            // We need to look up the email from 'users' state.
            const userToDelete = users.find(u => u.id === id)
            if (!userToDelete) return

            const response = await fetch(`/api/admin/organizations/${context.organizationId}/staff`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userToDelete.email })
            })

            if (response.ok) {
                setUsers(prev => prev.filter(u => u.id !== id))
            }
        } catch (e) {
            console.error("Error deleting user:", e)
        }
    }

    const updateUser = async (id: string, updates: Partial<User>) => {
        try {
            const contextRes = await fetch("/api/user-context")
            const context = await contextRes.json()

            const response = await fetch(`/api/admin/organizations/${context.organizationId}/staff`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: id,
                    ...updates,
                    password: updates.password
                })
            })

            if (response.ok) {
                const data = await response.json()
                setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data.user } : u))
            } else {
                const errorData = await response.json()
                console.error("Failed to update user:", errorData)
                throw new Error(errorData.error || "Failed to update user")
            }
        } catch (e) {
            console.error("Error updating user:", e)
            throw e
        }
    }

    const addCustomColumn = async (column: CustomColumn) => {
        try {
            const response = await fetch("/api/custom-columns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: column.name })
            })
            if (response.ok) {
                const data = await response.json()
                setCustomColumns(prev => [...prev, data.column])
            }
        } catch (error) {
            console.error("Error creating custom column:", error)
        }
    }

    const deleteCustomColumn = async (id: string) => {
        try {
            console.log("[deleteCustomColumn] Deleting column with ID:", id)
            const response = await fetch(`/api/custom-columns?id=${id}`, {
                method: "DELETE"
            })
            console.log("[deleteCustomColumn] Response status:", response.status)
            if (response.ok) {
                setCustomColumns(prev => prev.filter(c => c.id !== id))
                console.log("[deleteCustomColumn] Column removed from state")
            } else {
                const errorData = await response.json().catch(() => ({}))
                console.error("[deleteCustomColumn] Delete failed:", response.status, errorData)
            }
        } catch (error) {
            console.error("[deleteCustomColumn] Error:", error)
        }
    }

    const updateCustomColumn = async (id: string, name: string) => {
        try {
            const response = await fetch("/api/custom-columns", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, name })
            })
            if (response.ok) {
                const data = await response.json()
                setCustomColumns(prev => prev.map(c =>
                    c.id === id ? data.column : c
                ))
            }
        } catch (error) {
            console.error("Error updating custom column:", error)
        }
    }

    const updateProductCustomField = async (productId: string, columnId: string, value: string) => {
        // TODO: Implement custom fields API
        setProducts(prev => prev.map(p =>
            p.id === productId
                ? { ...p, customFields: { ...p.customFields, [columnId]: value } }
                : p
        ))
    }

    const updateSettings = async (updates: Partial<CompanySettings>) => {
        try {
            const response = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            })
            if (response.ok) {
                const data = await response.json()
                setSettings(data.settings)
            }
        } catch (error) {
            console.error("Error updating settings:", error)
            throw error
        }
    }

    return (
        <StockContext.Provider value={{
            categories,
            products,
            users,
            customColumns,
            settings,
            history,
            loading,
            refreshData: fetchData,
            addCategory,
            updateCategory,
            deleteCategory,
            addProduct,
            updateProduct,
            deleteProduct,
            updateStock,
            addUser,
            deleteUser,
            updateUser,
            addCustomColumn,
            deleteCustomColumn,
            updateCustomColumn,
            updateProductCustomField,
            updateSettings,
            userRole,
            isSuperAdmin,
            isAdmin,
            subscriptionStatus,
            subscriptionExpiresAt
        }}>
            {children}
        </StockContext.Provider>
    )
}

export function useStock() {
    const context = React.useContext(StockContext)
    if (!context) {
        throw new Error("useStock must be used within a StockProvider")
    }
    return context
}
