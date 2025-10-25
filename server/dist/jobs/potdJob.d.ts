export declare function refreshPotdOnce(): Promise<{
    leetcode?: {
        title: string;
        slug: string;
    };
    gfg?: {
        title: string;
        slug: string;
    };
    date: string;
}>;
/**
 * Schedule: Every day at 05:00 AM IST
 * Cron string is "0 5 * * *" and we pin timezone to Asia/Kolkata.
 */
export declare function schedulePotdJob(): void;
//# sourceMappingURL=potdJob.d.ts.map