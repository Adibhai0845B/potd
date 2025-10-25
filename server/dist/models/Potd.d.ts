import mongoose from "mongoose";
declare const _default: mongoose.Model<{
    date?: string | null;
    leetcode?: {
        title?: string | null;
        slug?: string | null;
    } | null;
    gfg?: {
        title?: string | null;
        slug?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    date?: string | null;
    leetcode?: {
        title?: string | null;
        slug?: string | null;
    } | null;
    gfg?: {
        title?: string | null;
        slug?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    date?: string | null;
    leetcode?: {
        title?: string | null;
        slug?: string | null;
    } | null;
    gfg?: {
        title?: string | null;
        slug?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    date?: string | null;
    leetcode?: {
        title?: string | null;
        slug?: string | null;
    } | null;
    gfg?: {
        title?: string | null;
        slug?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    date?: string | null;
    leetcode?: {
        title?: string | null;
        slug?: string | null;
    } | null;
    gfg?: {
        title?: string | null;
        slug?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & mongoose.FlatRecord<{
    date?: string | null;
    leetcode?: {
        title?: string | null;
        slug?: string | null;
    } | null;
    gfg?: {
        title?: string | null;
        slug?: string | null;
    } | null;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
export default _default;
//# sourceMappingURL=Potd.d.ts.map