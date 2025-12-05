"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  closestCorners,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { Column } from "./column";
import { LeadCard } from "./lead-card";
import { Lead, Column as ColumnType } from "@/server/db/schema";
import { updateLeadStatus, updateColumnOrder, createColumn } from "@/server/actions/leads";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const SENSORS_CONFIG = {
  activationConstraint: {
    distance: 5,
  },
};

interface BoardProps {
  columns: ColumnType[];
  initialLeads: Lead[];
}

export function Board({ columns: initialColumns, initialLeads }: BoardProps) {
  const [columns, setColumns] = useState<ColumnType[]>(initialColumns);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Add Column State
  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  
  // Ref to track local updates and prevent race conditions from server revalidation
  const ignoreExternalUpdatesRef = useRef(false);

  useEffect(() => {
      if (ignoreExternalUpdatesRef.current) {
          const timer = setTimeout(() => {
              ignoreExternalUpdatesRef.current = false;
          }, 2000); // Ignore server updates for 2s after a local move
          return () => clearTimeout(timer);
      }
      setColumns(initialColumns);
  }, [initialColumns]);

  useEffect(() => {
      if (ignoreExternalUpdatesRef.current) return;
      setLeads(initialLeads);
  }, [initialLeads]);

  const sensors = useSensors(
    useSensor(PointerSensor, SENSORS_CONFIG),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }
    if (event.active.data.current?.type === "Lead") {
      setActiveLead(event.active.data.current.lead);
      return;
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const isActiveALead = active.data.current?.type === "Lead";
    const isOverALead = over.data.current?.type === "Lead";
    const isOverAColumn = over.data.current?.type === "Column";

    if (!isActiveALead) return;

    // Scenario 1: Dragging Lead over Lead
    if (isActiveALead && isOverALead) {
      setLeads((leads) => {
        const activeIndex = leads.findIndex((l) => l.id === activeId);
        const overIndex = leads.findIndex((l) => l.id === overId);
        
        if (leads[activeIndex].columnId !== leads[overIndex].columnId) {
          const newLeads = [...leads];
          newLeads[activeIndex].columnId = leads[overIndex].columnId; 
          return arrayMove(newLeads, activeIndex, overIndex - 1);
        }
        return leads;
      });
    }

    // Scenario 2: Dragging Lead over Column (empty or header)
    if (isActiveALead && isOverAColumn) {
      setLeads((leads) => {
        const activeIndex = leads.findIndex((l) => l.id === activeId);
        const activeLead = leads[activeIndex];
        
        if (activeLead.columnId === overId) return leads;

        const newLeads = [...leads];
        newLeads[activeIndex].columnId = overId as string;
        return arrayMove(newLeads, activeIndex, activeIndex);
      });
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveLead(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Moving Columns
    if (active.data.current?.type === "Column") {
      if (activeId !== overId) {
        setColumns((columns) => {
          const oldIndex = columns.findIndex((col) => col.id === activeId);
          const newIndex = columns.findIndex((col) => col.id === overId);
          const newOrder = arrayMove(columns, oldIndex, newIndex);
          
          // Set ignore flag BEFORE calling server action to prevent race condition
          ignoreExternalUpdatesRef.current = true;
          
          // Call server action and handle potential errors
          updateColumnOrder(newOrder.map(c => c.id))
            .catch(err => {
                console.error("Failed to update column order:", err);
                // Optional: Revert changes or show toast
                ignoreExternalUpdatesRef.current = false;
            });

          return newOrder;
        });
      }
      return;
    }

    // Moving Leads
    if (active.data.current?.type === "Lead") {
      setLeads((leads) => {
        const activeIndex = leads.findIndex((l) => l.id === activeId);
        const overIndex = leads.findIndex((l) => l.id === overId);
        
        const newOrderedLeads = arrayMove(leads, activeIndex, overIndex);
        const movedLead = newOrderedLeads[overIndex];
        
        // Calculate new position within the specific column
        const columnLeads = newOrderedLeads.filter(l => l.columnId === movedLead.columnId);
        const newPosition = columnLeads.findIndex(l => l.id === movedLead.id);
        
        // Set ignore flag BEFORE calling server action
        ignoreExternalUpdatesRef.current = true;
        
        updateLeadStatus(movedLead.id, movedLead.columnId!, newPosition)
             .catch(err => {
                console.error("Failed to update lead status:", err);
                ignoreExternalUpdatesRef.current = false;
             });
          
        return newOrderedLeads;
      });
    }
  }

  const getLeadsByColumn = (columnId: string) => {
    return leads.filter((lead) => lead.columnId === columnId);
  };

  async function handleCreateColumn() {
    if (!newColumnName.trim()) return;
    await createColumn(newColumnName);
    setNewColumnName("");
    setIsCreateColumnOpen(false);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto p-4 items-start">
        <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
          {columns.map((col) => (
            <Column 
                key={col.id} 
                column={col} 
                leads={getLeadsByColumn(col.id)} 
            />
          ))}
        </SortableContext>
        
        <Dialog open={isCreateColumnOpen} onOpenChange={setIsCreateColumnOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-[50px] min-w-[300px] border-dashed border-2 hover:border-solid hover:bg-slate-50 dark:hover:bg-slate-900">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Adicionar Coluna
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Coluna</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome da Coluna</Label>
                        <Input id="name" value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} placeholder="Ex: Aguardando Resposta" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreateColumn}>Criar Coluna</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      {createPortal(
        <DragOverlay>
          {activeColumn && (
             <div className="opacity-80 rotate-2 cursor-grabbing">
                <Column column={activeColumn} leads={getLeadsByColumn(activeColumn.id)} />
             </div>
          )}
          {activeLead && (
             <div className="opacity-80 rotate-2 cursor-grabbing">
                 <LeadCard lead={activeLead} />
             </div>
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
