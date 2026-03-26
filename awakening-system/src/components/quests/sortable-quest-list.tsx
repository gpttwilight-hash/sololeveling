"use client";

import { useState, useTransition } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { QuestCard } from "./quest-card";
import { EpicQuestCard } from "./epic-quest-card";
import { reorderQuests } from "@/app/(app)/actions";
import type { Quest, HabitWeek } from "@/types/game";

interface SortableQuestListProps {
    initialQuests: Quest[];
    habitWeeks?: Record<string, HabitWeek>;
}

export function SortableQuestList({ initialQuests, habitWeeks }: SortableQuestListProps) {
    const [items, setItems] = useState(initialQuests);
    const [, startTransition] = useTransition();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Avoid accidental drags on click
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);

            startTransition(async () => {
                await reorderQuests(newItems.map((i) => i.id));
            });
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-3">
                    {items.map((quest, index) => (
                        <SortableItem key={quest.id} id={quest.id}>
                            {quest.type === "epic" ? (
                                <EpicQuestCard quest={quest} index={index} />
                            ) : (
                                <QuestCard quest={quest} index={index} habitWeek={habitWeeks?.[quest.id]} />
                            )}
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}
