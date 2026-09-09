import { z } from 'zod';
export const collections = ['profiles', 'subjects', 'schedule', 'tasks', 'transactions', 'budgets', 'goals', 'focus_sessions', 'jobs', 'notifications', 'ai_messages'] as const;
export type Collection = typeof collections[number];
const title = z.string().trim().min(1).max(160);
const note = z.string().max(10000).default('');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const schemas = {
    profiles: z.object({ name: title, surname: title, university: title, major: title, course: z.coerce.number().int().min(1).max(8), onboarded: z.boolean().default(false), demoSeeded: z.boolean().default(false), interests: z.array(z.string().max(80)).max(8).default([]), language: z.enum(['kk', 'ru']).default('kk'), notifications: z.boolean().default(true), avatar: z.string().max(8).default('') }),
    subjects: z.object({ title, color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#7562ec'), notes: note, exams: note, resources: note, progress: z.coerce.number().min(0).max(100).default(0) }),
    schedule: z.object({ title, day: z.coerce.number().int().min(0).max(6), start: time, end: time, room: z.string().max(80).default(''), teacher: z.string().max(100).default(''), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#7562ec') }).refine(v => v.end > v.start, 'End time must be after start'),
    tasks: z.object({ title, subject: z.string().max(160).default(''), deadline: date, priority: z.enum(['low', 'medium', 'high']), status: z.enum(['todo', 'progress', 'done']), description: note, completedAt: z.string().nullable().optional() }),
    transactions: z.object({ title, amount: z.coerce.number().positive().max(1e10), category: title, date, type: z.enum(['income', 'expense', 'saving']), description: note }),
    budgets: z.object({ title, amount: z.coerce.number().positive().max(1e10) }),
    goals: z.object({ title, deadline: date, progress: z.coerce.number().min(0).max(100), description: note }),
    focus_sessions: z.object({ startedAt: z.number(), duration: z.number(), completed: z.boolean(), endedAt: z.number().nullable() }),
    jobs: z.object({ title, company: title, salary: title, location: title, skills: title, kind: z.enum(['Internship', 'Part-time', 'Freelance', 'Remote']), applied: z.boolean().default(false) }),
    notifications: z.object({ title, read: z.boolean().default(false) }),
    ai_messages: z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(12000) })
};
export type Item = {
    id: string;
    [key: string]: any;
};
export type Data = Record<Collection, Item[]>;
export const blankData = (): Data => Object.fromEntries(collections.map(x => [x, []])) as unknown as Data;
export function localDate(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export const categoryPairs: Record<string, [
    string,
    string
]> = { food: ['Тамақ', 'Еда'], transport: ['Көлік', 'Транспорт'], housing: ['Тұрғын үй', 'Жильё'], study: ['Оқу', 'Учёба'], clothes: ['Киім', 'Одежда'], fun: ['Ойын-сауық', 'Развлечения'], subscription: ['Жазылым', 'Подписки'], other: ['Басқа', 'Другое'], stipend: ['Стипендия', 'Стипендия'], salary: ['Жалақы', 'Зарплата'], freelance: ['Фриланс', 'Фриланс'], parents: ['Ата-анадан', 'От родителей'], business: ['Бизнес', 'Бизнес'], saving: ['Жинақ', 'Накопления'] };
