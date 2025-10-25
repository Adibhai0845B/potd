export declare function recordCompletionAndAward(userId: string, site: "leetcode" | "gfg", problem: {
    title: string;
    slug: string;
}): Promise<{
    ok: boolean;
    coinsAdded: number;
    streak: number;
    message?: never;
} | {
    ok: boolean;
    coinsAdded: number;
    streak: undefined;
    message: string;
}>;
//# sourceMappingURL=award.d.ts.map