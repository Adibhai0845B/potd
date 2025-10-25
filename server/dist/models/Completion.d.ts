import mongoose, { Types } from "mongoose";
declare const _default: mongoose.Model<{
    createdAt: NativeDate;
    awarded: boolean;
    date?: string | null;
    userId?: {
        prototype?: Types.ObjectId | null;
        cacheHexString?: unknown;
        generate?: {} | null;
        createFromTime?: {} | null;
        createFromHexString?: {} | null;
        createFromBase64?: {} | null;
        isValid?: {} | null;
    } | null;
    problemSlug?: string | null;
    problemTitle?: string | null;
    site?: "leetcode" | "gfg" | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    createdAt: NativeDate;
    awarded: boolean;
    date?: string | null;
    userId?: {
        prototype?: Types.ObjectId | null;
        cacheHexString?: unknown;
        generate?: {} | null;
        createFromTime?: {} | null;
        createFromHexString?: {} | null;
        createFromBase64?: {} | null;
        isValid?: {} | null;
    } | null;
    problemSlug?: string | null;
    problemTitle?: string | null;
    site?: "leetcode" | "gfg" | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    createdAt: NativeDate;
    awarded: boolean;
    date?: string | null;
    userId?: {
        prototype?: Types.ObjectId | null;
        cacheHexString?: unknown;
        generate?: {} | null;
        createFromTime?: {} | null;
        createFromHexString?: {} | null;
        createFromBase64?: {} | null;
        isValid?: {} | null;
    } | null;
    problemSlug?: string | null;
    problemTitle?: string | null;
    site?: "leetcode" | "gfg" | null;
} & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    createdAt: NativeDate;
    awarded: boolean;
    date?: string | null;
    userId?: {
        prototype?: Types.ObjectId | null;
        cacheHexString?: unknown;
        generate?: {} | null;
        createFromTime?: {} | null;
        createFromHexString?: {} | null;
        createFromBase64?: {} | null;
        isValid?: {} | null;
    } | null;
    problemSlug?: string | null;
    problemTitle?: string | null;
    site?: "leetcode" | "gfg" | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    createdAt: NativeDate;
    awarded: boolean;
    date?: string | null;
    userId?: {
        prototype?: Types.ObjectId | null;
        cacheHexString?: unknown;
        generate?: {} | null;
        createFromTime?: {} | null;
        createFromHexString?: {} | null;
        createFromBase64?: {} | null;
        isValid?: {} | null;
    } | null;
    problemSlug?: string | null;
    problemTitle?: string | null;
    site?: "leetcode" | "gfg" | null;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    createdAt: NativeDate;
    awarded: boolean;
    date?: string | null;
    userId?: {
        prototype?: Types.ObjectId | null;
        cacheHexString?: unknown;
        generate?: {} | null;
        createFromTime?: {} | null;
        createFromHexString?: {} | null;
        createFromBase64?: {} | null;
        isValid?: {} | null;
    } | null;
    problemSlug?: string | null;
    problemTitle?: string | null;
    site?: "leetcode" | "gfg" | null;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
//# sourceMappingURL=Completion.d.ts.map