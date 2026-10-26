import { useHabits } from "./HabitProvider";
import { format, isToday, isYesterday, startOfMonth, eachDayOfInterval } from "date-fns";
import { Check, Edit2, Trash2, Plus, X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
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
import { confirmToast } from "@/lib/confirmToast";
import { CategorySelect } from "./CategorySelect";
import type { HabitCategory } from "./HabitProvider";

interface HabitItemProps {
    habit: any;
    todayStr: string;
    isCompleted: boolean;
    categories: HabitCategory[];
    editingId: string | null;
    editName: string;
    editCategoryId: string;
    setEditingId: (id: string | null) => void;
    setEditName: (name: string) => void;
    setEditCategoryId: (id: string) => void;
    handleEdit: (id: string) => void;
    toggleHabit: (date: string, id: string) => void;
    removeHabit: (id: string) => void;
}

function SortableHabitItem({
    habit,
    todayStr,
    isCompleted,
    categories,
    editingId,
    editName,
    editCategoryId,
    setEditingId,
    setEditName,
    setEditCategoryId,
    handleEdit,
    toggleHabit,
    removeHabit,
}: HabitItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: habit.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    const isEditing = editingId === habit.id;

    const editInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (isEditing) editInputRef.current?.focus({ preventScroll: true });
    }, [isEditing]);

    const confirmDelete = () => {
        confirmToast({
            message: `Delete "${habit.name}"?`,
            description: "This will also remove all its completion history.",
            onConfirm: () => removeHabit(habit.id),
        });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center justify-between px-2 py-1.5 hover:bg-[#2d2d2d] rounded-md transition-colors group",
                isDragging && "bg-[#2d2d2d] shadow-lg"
            )}
        >
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                {!isEditing && (
                    <div
                        {...attributes}
                        {...listeners}
                        className="p-1 text-[#444444] hover:text-[#888888] cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <GripVertical className="w-3.5 h-3.5" />
                    </div>
                )}

                {isEditing ? (
                    <div className="flex flex-col gap-1.5 w-full py-0.5">
                        <div className="flex items-center gap-2">
                            <input
                                ref={editInputRef}
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleEdit(habit.id);
                                    if (e.key === "Escape") setEditingId(null);
                                }}
                                className="flex-1 bg-transparent border-b border-[#555555] text-sm text-[#ededed] focus:outline-none focus:border-blue-500 py-0.5"
                            />
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleEdit(habit.id)} className="text-blue-500 hover:text-blue-400 p-1 cursor-pointer">
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingId(null)} className="text-[#888888] hover:text-[#aaaaaa] p-1 cursor-pointer">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <CategorySelect
                            categories={categories}
                            value={editCategoryId}
                            onChange={setEditCategoryId}
                        />
                    </div>
                ) : (
                    <>
                        <label className="flex items-center gap-3 cursor-pointer flex-1 overflow-hidden">
                            <button
                                type="button"
                                role="checkbox"
                                aria-checked={isCompleted}
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleHabit(todayStr, habit.id);
                                }}
                                className={cn(
                                    "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors shadow-sm shrink-0 cursor-pointer",
                                    isCompleted
                                        ? "bg-blue-500 border-blue-500 text-white"
                                        : "border-[#555555] group-hover:border-[#888888] bg-transparent"
                                )}
                            >
                                {isCompleted && <Check className="w-3 h-3" strokeWidth={3} />}
                            </button>
                            <span className={cn(
                                "text-sm select-none transition-colors cursor-pointer truncate",
                                isCompleted ? "text-[#888888] line-through" : "text-[#ededed]"
                            )}>
                                {habit.name}
                            </span>
                        </label>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditingId(habit.id);
                                    setEditName(habit.name);
                                    setEditCategoryId(habit.categoryId);
                                }}
                                className="text-[#888888] hover:text-[#ededed] p-1 rounded transition-colors cursor-pointer"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    confirmDelete();
                                }}
                                className="text-[#888888] hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export function HabitList() {
    const {
        habits,
        records,
        categories,
        toggleHabit,
        getDailyCompletionRate,
        addHabit,
        editHabit,
        removeHabit,
        reorderHabits
    } = useHabits();

    const today = new Date();
    const start = startOfMonth(today);
    const dateRange = eachDayOfInterval({ start, end: today }).reverse();

    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [newCategoryId, setNewCategoryId] = useState("");
    const addInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (isAdding) addInputRef.current?.focus({ preventScroll: true });
    }, [isAdding]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editCategoryId, setEditCategoryId] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleAdd = async () => {
        if (!newName.trim() || !newCategoryId) return;
        await addHabit(newName.trim(), newCategoryId);
        setNewName("");
        setIsAdding(false);
    };

    const handleEdit = async (id: string) => {
        if (!editName.trim() || !editCategoryId) return;
        await editHabit(id, editName.trim(), editCategoryId);
        setEditingId(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = habits.findIndex((h) => h.id === active.id);
            const newIndex = habits.findIndex((h) => h.id === over.id);

            const newHabits = arrayMove(habits, oldIndex, newIndex);
            reorderHabits(newHabits);
        }
    };

    const [showHistoryMobile, setShowHistoryMobile] = useState(false);

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            {dateRange.map((date, index) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const isCurrentToday = isToday(date);
                const isCurrentYesterday = isYesterday(date);
                const rate = getDailyCompletionRate(dateStr);

                let dateHeading = format(date, "EEEE, MMM d");
                if (isCurrentToday) dateHeading = "Today";
                if (isCurrentYesterday) dateHeading = "Yesterday";

                return (
                    <div
                        key={dateStr}
                        className={cn(
                            "bg-[#191919] border border-[#2d2d2d] rounded-lg p-4 transition-all",
                            isCurrentToday ? "ring-1 ring-blue-500/30 bg-[#1c1c1c]" : "opacity-80 hover:opacity-100",
                            !isCurrentToday && !showHistoryMobile && "hidden md:block"
                        )}
                    >
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h2 className={cn(
                                "font-bold text-base tracking-tight",
                                isCurrentToday ? "text-white" : "text-[#aaaaaa]"
                            )}>
                                {dateHeading}
                            </h2>
                            {!isCurrentToday && (
                                <span className="text-[10px] font-bold text-[#555555] uppercase tracking-widest bg-[#222222] px-2 py-0.5 rounded">
                                    History
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col space-y-[2px]">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={habits.map((h) => h.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {habits.map((habit) => (
                                        <SortableHabitItem
                                            key={`${dateStr}-${habit.id}`}
                                            habit={habit}
                                            todayStr={dateStr}
                                            isCompleted={records[dateStr]?.includes(habit.id) || false}
                                            categories={categories}
                                            editingId={editingId}
                                            editName={editName}
                                            editCategoryId={editCategoryId}
                                            setEditingId={setEditingId}
                                            setEditName={setEditName}
                                            setEditCategoryId={setEditCategoryId}
                                            handleEdit={handleEdit}
                                            toggleHabit={toggleHabit}
                                            removeHabit={removeHabit}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>

                            {/* Add New Habit Section (Only on Today) */}
                            {isCurrentToday && (
                                <>
                                    {isAdding ? (
                                        <div className="flex flex-col gap-1.5 px-2 py-1.5 mt-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    ref={addInputRef}
                                                    type="text"
                                                    placeholder="New habit name..."
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleAdd();
                                                        if (e.key === "Escape") {
                                                            setIsAdding(false);
                                                            setNewName("");
                                                        }
                                                    }}
                                                    className="flex-1 bg-transparent border-b border-[#555555] text-sm text-[#ededed] focus:outline-none focus:border-blue-500 py-0.5"
                                                />
                                                <div className="flex items-center gap-1">
                                                    <button onClick={handleAdd} className="text-blue-500 hover:text-blue-400 p-1 cursor-pointer">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => { setIsAdding(false); setNewName(""); }} className="text-[#888888] hover:text-[#aaaaaa] p-1 cursor-pointer">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <CategorySelect
                                                categories={categories}
                                                value={newCategoryId}
                                                onChange={setNewCategoryId}
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsAdding(true);
                                                setNewCategoryId(
                                                    categories.find((c) => c.name === "Productivity")?.id ?? categories[0]?.id ?? ""
                                                );
                                            }}
                                            className="flex items-center gap-2 px-2 py-2 mt-2 text-sm text-[#888888] hover:text-[#ededed] transition-colors rounded-md hover:bg-[#2d2d2d] w-full text-left cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Habit
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Daily Progress Bar */}
                        <div className="px-2 mt-4 pt-4 border-t border-[#2d2d2d]">
                            <div className="flex items-center justify-between text-xs text-[#888888] mb-2 font-medium">
                                <span className="uppercase tracking-widest text-[10px]">Completion</span>
                                <span className={cn(rate === 100 ? "text-green-500" : "text-[#888888]")}>{rate}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#2d2d2d] rounded-full overflow-hidden shadow-inner">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]",
                                        rate === 100 ? "bg-green-500" : "bg-blue-500"
                                    )}
                                    style={{ width: `${rate}%` }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}

            {!showHistoryMobile && dateRange.length > 1 && (
                <button
                    onClick={() => setShowHistoryMobile(true)}
                    className="md:hidden w-full py-3 px-4 rounded-xl border border-white/5 bg-white/5 text-[#888888] font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all active:scale-[0.98] cursor-pointer"
                >
                    Show Monthly History
                </button>
            )}
        </div>
    );
}
