import mongoose from "mongoose";
declare const _default: mongoose.Model<{
    coins: number;
    streak: number;
    lastStreakDay: string;
    leetcodeUsername: string;
    gfgUsername: string;
    username?: string | null;
    passwordHash?: string | null;
    email?: string | null;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    coins: number;
    streak: number;
    lastStreakDay: string;
    leetcodeUsername: string;
    gfgUsername: string;
    username?: string | null;
    passwordHash?: string | null;
    email?: string | null;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    coins: number;
    streak: number;
    lastStreakDay: string;
    leetcodeUsername: string;
    gfgUsername: string;
    username?: string | null;
    passwordHash?: string | null;
    email?: string | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    coins: number;
    streak: number;
    lastStreakDay: string;
    leetcodeUsername: string;
    gfgUsername: string;
    username?: string | null;
    passwordHash?: string | null;
    email?: string | null;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    coins: number;
    streak: number;
    lastStreakDay: string;
    leetcodeUsername: string;
    gfgUsername: string;
    username?: string | null;
    passwordHash?: string | null;
    email?: string | null;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & mongoose.FlatRecord<{
    coins: number;
    streak: number;
    lastStreakDay: string;
    leetcodeUsername: string;
    gfgUsername: string;
    username?: string | null;
    passwordHash?: string | null;
    email?: string | null;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
//# sourceMappingURL=User.d.ts.map