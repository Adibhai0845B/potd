import { api } from "./http";
export type Potd = { date: string; leetcode?: { title: string; slug: string }; gfg?: { title: string; slug: string } };
export function getTodayPotd() { return api<Potd>("/potd/today"); }
