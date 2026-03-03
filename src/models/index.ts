import mongoose, { Schema } from "mongoose";

export interface IHabit {
    name: string;
    userId: string;
    order: number;
    createdAt: Date;
}

const HabitSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        userId: { type: String, required: true, index: true },
        order: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now }
    },
    {
        // Important: Convert _id to id when sending to frontend
        toJSON: {
            virtuals: true,
            versionKey: false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transform: function (doc: any, ret: any) {
                delete ret._id;
            }
        }
    }
);

// Virtual for id
// eslint-disable-next-line @typescript-eslint/no-explicit-any
HabitSchema.virtual('id').get(function (this: any) {
    return this._id.toHexString();
});

export const Habit = mongoose.models.Habit || mongoose.model<IHabit>("Habit", HabitSchema);

export interface IDailyRecord {
    date: string; // YYYY-MM-DD
    userId: string;
    habitIds: mongoose.Types.ObjectId[];
}

const DailyRecordSchema: Schema = new Schema(
    {
        date: { type: String, required: true },
        userId: { type: String, required: true },
        habitIds: [{ type: Schema.Types.ObjectId, ref: "Habit" }]
    },
    {
        toJSON: {
            virtuals: true,
            versionKey: false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transform: function (doc: any, ret: any) {
                delete ret._id;
            }
        }
    }
);

// Compound index to ensure one record per user per date
DailyRecordSchema.index({ date: 1, userId: 1 }, { unique: true });

export const DailyRecord = mongoose.models.DailyRecord || mongoose.model<IDailyRecord>("DailyRecord", DailyRecordSchema);

// --- Finance Models ---

export interface IFinanceBudget {
    userId: string;
    month: string; // YYYY-MM
    amount: number;
}

const FinanceBudgetSchema = new Schema({
    userId: { type: String, required: true, index: true },
    month: { type: String, required: true },
    amount: { type: Number, default: 0 }
}, {
    toJSON: { virtuals: true, versionKey: false, transform: (doc: any, ret: any) => { delete ret._id; } }
});
FinanceBudgetSchema.index({ userId: 1, month: 1 }, { unique: true });
export const FinanceBudget = mongoose.models.FinanceBudget || mongoose.model<IFinanceBudget>("FinanceBudget", FinanceBudgetSchema);

export interface IFinanceCategory {
    userId: string;
    name: string;
    icon: string;
}

const FinanceCategorySchema = new Schema({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    icon: { type: String, required: true }
}, {
    toJSON: { virtuals: true, versionKey: false, transform: (doc: any, ret: any) => { delete ret._id; } }
});
FinanceCategorySchema.index({ userId: 1, name: 1 });
FinanceCategorySchema.virtual('id').get(function (this: any) { return this._id.toHexString(); });
export const FinanceCategory = mongoose.models.FinanceCategory || mongoose.model<IFinanceCategory>("FinanceCategory", FinanceCategorySchema);

export interface IFinanceExpense {
    userId: string;
    date: string; // YYYY-MM-DD
    month: string; // YYYY-MM for faster filtering
    amount: number;
    categoryId: mongoose.Types.ObjectId;
    note?: string;
}

const FinanceExpenseSchema = new Schema({
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    month: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "FinanceCategory", required: true },
    note: { type: String }
}, {
    toJSON: { virtuals: true, versionKey: false, transform: (doc: any, ret: any) => { delete ret._id; } }
});
FinanceExpenseSchema.virtual('id').get(function (this: any) { return this._id.toHexString(); });
export const FinanceExpense = mongoose.models.FinanceExpense || mongoose.model<IFinanceExpense>("FinanceExpense", FinanceExpenseSchema);

export interface IFinanceFixedCost {
    userId: string;
    month: string; // YYYY-MM
    name: string;
    amount: number;
}

const FinanceFixedCostSchema = new Schema({
    userId: { type: String, required: true, index: true },
    month: { type: String, required: true, index: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true }
}, {
    toJSON: { virtuals: true, versionKey: false, transform: (doc: any, ret: any) => { delete ret._id; } }
});
FinanceFixedCostSchema.virtual('id').get(function (this: any) { return this._id.toHexString(); });
export const FinanceFixedCost = mongoose.models.FinanceFixedCost || mongoose.model<IFinanceFixedCost>("FinanceFixedCost", FinanceFixedCostSchema);

// --- Daily Goals / Todo Model ---

export interface IDailyGoal {
    userId: string;
    text: string;
    completed: boolean;
    date: string; // YYYY-MM-DD
    order: number;
}

const DailyGoalSchema = new Schema({
    userId: { type: String, required: true, index: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    date: { type: String, required: true, index: true },
    order: { type: Number, default: 0 }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (doc: any, ret: any) => { delete ret._id; }
    }
});

DailyGoalSchema.virtual('id').get(function (this: any) { return this._id.toHexString(); });
export const DailyGoal = mongoose.models.DailyGoal || mongoose.model<IDailyGoal>("DailyGoal", DailyGoalSchema);

// --- AI Resume Architect Model ---

export interface IResume {
    userId: string;
    name: string;
    content: string; // LaTeX code or Raw Text
    format: 'latex' | 'text';
    actsAsBase: boolean; // If true, used in experience pooling
    isMasterTemplate: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ResumeSchema = new Schema({
    userId: { type: String, required: false, index: true }, // Optional for master templates
    name: { type: String, required: true },
    content: { type: String, required: true },
    format: { type: String, enum: ['latex', 'text'], default: 'latex' },
    actsAsBase: { type: Boolean, default: true },
    isMasterTemplate: { type: Boolean, default: false }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (doc: any, ret: any) => { delete ret._id; }
    }
});

ResumeSchema.virtual('id').get(function (this: any) { return this._id.toHexString(); });
export const Resume = mongoose.models.Resume || mongoose.model<IResume>("Resume", ResumeSchema);
