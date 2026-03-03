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
