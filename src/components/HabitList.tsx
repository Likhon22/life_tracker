import { useHabits } from "@/components/HabitProvider";
import { format, isToday, isYesterday, startOfMonth, eachDayOfInterval } from "date-fns";
import { Check, Edit2, Trash2, Plus, X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
import { toast } from "react-hot-toast";

interface HabitItemProps {
    habit: any;
    todayStr: string;
    isCompleted: boolean;
    editingId: string | null;
    editName: string;
    setEditingId: (id: string | null) => void;
    setEditName: (name: string) => void;
    handleEdit: (id: string) => void;
    toggleHabit: (date: string, id: string) => void;
    removeHabit: (id: string) => void;
}

function SortableHabitItem({
    habit,
    todayStr,
    isCompleted,
    editingId,
    editName,
    setEditingId,
    setEditName,
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

    const confirmDelete = () => {
        toast((t) => (
            <div className="flex flex-col gap-3 min-w-[200px]">
                <p className="text-sm font-medium text-[#ededed]">
                    Delete &quot;{habit.name}&quot;?
                    <span className="block text-xs text-[#888888] font-normal mt-1 italic">This will also remove all its completion history.</span>
                </p>
                <div className="flex justify-end gap-2 border-t border-[#2d2d2d] pt-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-2 py-1 text-xs text-[#888888] hover:text-[#ededed] cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            removeHabit(habit.id);
                            toast.dismiss(t.id);
                        }}
                        className="px-2 py-1 text-xs bg-red-500/10 text-red-500 border border-red-500/20 rounded hover:bg-red-500 hover:text-white transition-all cursor-pointer font-medium"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 6000,
            position: 'top-center'
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
                    <div className="flex items-center gap-2 w-full">
                        <input
                            autoFocus
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

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

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
        if (!newName.trim()) return;
        await addHabit(newName.trim());
        setNewName("");
        setIsAdding(false);
    };

    const handleEdit = async (id: string) => {
        if (!editName.trim()) return;
        await editHabit(id, editName.trim());
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

    return (
        <div className="flex flex-col gap-6">
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
                            isCurrentToday ? "ring-1 ring-blue-500/30 bg-[#1c1c1c]" : "opacity-80 hover:opacity-100"
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
                                            editingId={editingId}
                                            editName={editName}
                                            setEditingId={setEditingId}
                                            setEditName={setEditName}
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
                                        <div className="flex items-center gap-2 px-2 py-1.5 mt-2">
                                            <input
                                                autoFocus
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
                                    ) : (
                                        <button
                                            onClick={() => setIsAdding(true)}
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
        </div>
    );
}
