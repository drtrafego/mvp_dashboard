"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, X, Loader2, Store, Shirt } from "lucide-react"

interface VariantAttribute {
    id: string
    name: string
    values: { id: string; value: string }[]
}

interface BusinessTypeSettingsProps {
    isAdmin: boolean
}

export function BusinessTypeSettings({ isAdmin }: BusinessTypeSettingsProps) {
    const [businessType, setBusinessType] = React.useState<string>("VAREJO_GERAL")
    const [attributes, setAttributes] = React.useState<VariantAttribute[]>([])
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [newAttributeName, setNewAttributeName] = React.useState("")
    const [newValueInputs, setNewValueInputs] = React.useState<Record<string, string>>({})
    const [message, setMessage] = React.useState("")

    // Fetch initial data
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [typeRes, attrRes] = await Promise.all([
                    fetch("/api/organization/business-type"),
                    fetch("/api/variant-attributes")
                ])

                if (typeRes.ok) {
                    const typeData = await typeRes.json()
                    setBusinessType(typeData.businessType)
                }

                if (attrRes.ok) {
                    const attrData = await attrRes.json()
                    setAttributes(attrData.attributes || [])
                }
            } catch (error) {
                console.error("Error fetching business type data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleBusinessTypeChange = async (value: string) => {
        setSaving(true)
        try {
            const res = await fetch("/api/organization/business-type", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessType: value })
            })

            if (res.ok) {
                const data = await res.json()
                setBusinessType(data.businessType)
                setMessage(data.message)
                setTimeout(() => setMessage(""), 3000)
            }
        } catch (error) {
            console.error("Error updating business type:", error)
        } finally {
            setSaving(false)
        }
    }

    const handleAddAttribute = async () => {
        if (!newAttributeName.trim()) return

        setSaving(true)
        try {
            const res = await fetch("/api/variant-attributes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newAttributeName.trim() })
            })

            if (res.ok) {
                const data = await res.json()
                setAttributes(prev => [...prev, data.attribute])
                setNewAttributeName("")
            } else {
                const error = await res.json()
                alert(error.error)
            }
        } catch (error) {
            console.error("Error adding attribute:", error)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteAttribute = async (id: string) => {
        if (!confirm("Excluir este atributo? Isso afetará todas as variantes que o utilizam.")) return

        try {
            const res = await fetch(`/api/variant-attributes?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                setAttributes(prev => prev.filter(a => a.id !== id))
            }
        } catch (error) {
            console.error("Error deleting attribute:", error)
        }
    }

    const handleAddValue = async (attributeId: string) => {
        const value = newValueInputs[attributeId]?.trim()
        if (!value) return

        try {
            const res = await fetch(`/api/variant-attributes/${attributeId}/values`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ value })
            })

            if (res.ok) {
                const data = await res.json()
                setAttributes(prev => prev.map(a =>
                    a.id === attributeId
                        ? { ...a, values: [...a.values, data.value] }
                        : a
                ))
                setNewValueInputs(prev => ({ ...prev, [attributeId]: "" }))
            } else {
                const error = await res.json()
                alert(error.error)
            }
        } catch (error) {
            console.error("Error adding value:", error)
        }
    }

    const handleDeleteValue = async (attributeId: string, valueId: string) => {
        try {
            const res = await fetch(`/api/variant-attributes/${attributeId}/values?valueId=${valueId}`, {
                method: "DELETE"
            })

            if (res.ok) {
                setAttributes(prev => prev.map(a =>
                    a.id === attributeId
                        ? { ...a, values: a.values.filter(v => v.id !== valueId) }
                        : a
                ))
            }
        } catch (error) {
            console.error("Error deleting value:", error)
        }
    }

    if (loading) {
        return (
            <Card className="bg-card border-border mt-6">
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-card border-border mt-6">
            <CardHeader>
                <CardTitle className="text-foreground">Tipo de Negócio</CardTitle>
                <CardDescription>
                    Configure o tipo de negócio para habilitar recursos específicos
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Business Type Selector */}
                <div className="space-y-2">
                    <Label className="text-foreground">Segmento</Label>
                    <Select
                        value={businessType}
                        onValueChange={handleBusinessTypeChange}
                        disabled={!isAdmin || saving}
                    >
                        <SelectTrigger className="w-[280px] bg-background border-input text-foreground">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="VAREJO_GERAL">
                                <div className="flex items-center gap-2">
                                    <Store className="w-4 h-4" />
                                    Varejo Geral
                                </div>
                            </SelectItem>
                            <SelectItem value="VESTUARIO">
                                <div className="flex items-center gap-2">
                                    <Shirt className="w-4 h-4" />
                                    Vestuário
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {businessType === "VESTUARIO"
                            ? "Modo Vestuário: produtos podem ter variantes de cor, tamanho, etc."
                            : "Modo Varejo: produtos simples sem variantes."
                        }
                    </p>
                </div>

                {message && (
                    <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
                )}

                {/* Variant Attributes Section - Only show for Vestuário */}
                {businessType === "VESTUARIO" && (
                    <div className="space-y-4 pt-4 border-t border-border">
                        <div>
                            <Label className="text-foreground text-lg">Atributos de Variante</Label>
                            <p className="text-xs text-muted-foreground">
                                Configure os atributos (ex: Cor, Tamanho) usados para criar variantes de produtos
                            </p>
                        </div>

                        {/* Existing Attributes */}
                        {attributes.map(attr => (
                            <div key={attr.id} className="p-4 border border-border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-foreground">{attr.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteAttribute(attr.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Values */}
                                <div className="flex flex-wrap gap-2">
                                    {attr.values.map(v => (
                                        <Badge
                                            key={v.id}
                                            variant="secondary"
                                            className="flex items-center gap-1 pr-1"
                                        >
                                            {v.value}
                                            <button
                                                onClick={() => handleDeleteValue(attr.id, v.id)}
                                                className="ml-1 hover:bg-muted rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>

                                {/* Add Value Input */}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={`Novo valor para ${attr.name}...`}
                                        value={newValueInputs[attr.id] || ""}
                                        onChange={(e) => setNewValueInputs(prev => ({
                                            ...prev,
                                            [attr.id]: e.target.value
                                        }))}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddValue(attr.id)}
                                        className="flex-1 bg-background border-input text-foreground"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAddValue(attr.id)}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Add New Attribute */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nome do novo atributo (ex: Cor, Tamanho)"
                                value={newAttributeName}
                                onChange={(e) => setNewAttributeName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddAttribute()}
                                className="flex-1 bg-background border-input text-foreground"
                            />
                            <Button onClick={handleAddAttribute} disabled={saving || !newAttributeName.trim()}>
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                Adicionar Atributo
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
