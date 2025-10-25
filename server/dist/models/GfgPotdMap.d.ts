import mongoose from "mongoose";
export interface IGfgPotdMap {
    articleSlug: string;
    problemSlug: string;
    title?: string;
    date?: string;
    createdAt?: Date;
}
declare const Model: mongoose.Model<any, {}, {}, {}, any, any> | mongoose.Model<IGfgPotdMap, {}, {}, {}, mongoose.Document<unknown, {}, IGfgPotdMap, {}, {}> & IGfgPotdMap & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>;
export default Model;
//# sourceMappingURL=GfgPotdMap.d.ts.map