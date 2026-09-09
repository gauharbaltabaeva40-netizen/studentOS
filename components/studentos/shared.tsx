'use client';
import React, { createContext, useContext, useState } from 'react';
import { Plus, ArrowUpRight, Inbox, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Empty as EmptyRoot, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import type { Collection, Data, Item } from '@/lib/models';
export type Page = 'dashboard' | 'study' | 'schedule' | 'tasks' | 'finance' | 'jobs' | 'goals' | 'ai' | 'profile' | 'analytics';
export type AppContext = {
    data: Data;
    language: 'kk' | 'ru';
    t: (kk: string, ru: string) => string;
    refresh: () => Promise<void>;
    save: (table: Collection, data: any, id?: string) => Promise<void>;
    remove: (table: Collection, id: string) => Promise<void>;
    go: (p: Page) => void;
    busy: boolean;
    theme: string;
    setTheme: (t: string) => void;
    setLanguage: (l: 'kk' | 'ru') => void;
};
export const Context = createContext<AppContext>(null!);
export const useApp = () => useContext(Context);
export function Brand() { return <div className="brand"><span className="brand-icon">S<span>✦</span></span><span>Student<span className="brand-os">OS</span><sup>beta</sup></span></div>; }
export function Button({ children, onClick, kind = '', type = 'button', disabled = false, className = '' }: {
    children: React.ReactNode;
    onClick?: () => void;
    kind?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
}) { return <button type={type} className={`btn ${kind} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>; }
export function AddButton({ onClick, label }: {
    onClick: () => void;
    label?: string;
}) { const { t } = useApp(); return <Button onClick={onClick}><Plus size={17}/>{label || t('Қосу', 'Добавить')}</Button>; }
export function Panel({ title, icon: Icon, children, action, className = '' }: {
    title?: string;
    icon?: any;
    children: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}) { return <section className={`panel ${className}`}>{title && <div className="panel-head"><h2>{Icon && <Icon size={18}/>} {title}</h2>{action}</div>}{children}</section>; }
export function Empty({ text, action }: {
    text: string;
    action?: React.ReactNode;
}) { return <EmptyRoot className="empty-state"><EmptyHeader><Inbox size={27}/><EmptyTitle>{text}</EmptyTitle><EmptyDescription>{action}</EmptyDescription></EmptyHeader></EmptyRoot>; }
export function Bar({ value, color }: {
    value: number;
    color?: string;
}) { return <Progress value={Math.max(0, Math.min(100, value))} className="meter" style={color ? { '--meter-color': color } as React.CSSProperties : undefined}/>; }
export function More({ page }: {
    page: Page;
}) { const { go, t } = useApp(); return <button className="text-btn" onClick={() => go(page)}>{t('Барлығы', 'Все')}<ArrowUpRight size={15}/></button>; }
export function SelectField({ value, onChange, options }: {
    value: string;
    onChange: (v: string) => void;
    options: [
        string,
        string
    ][];
}) { return <Select value={value} onValueChange={onChange}><SelectTrigger className="field-select"><SelectValue /></SelectTrigger><SelectContent>{options.map(([v, l]) => <SelectItem value={v} key={v}>{l}</SelectItem>)}</SelectContent></Select>; }
export type Field = {
    key: string;
    label: string;
    type?: string;
    options?: [
        string,
        string
    ][];
    required?: boolean;
    min?: number;
    max?: number;
};
export function Editor({ title, fields, initial, onSave, onClose }: {
    title: string;
    fields: Field[];
    initial: Item | Record<string, any>;
    onSave: (v: any) => Promise<void>;
    onClose: () => void;
}) { const { t } = useApp(); const [v, set] = useState({ ...initial }); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); return <Dialog open onOpenChange={o => !o && onClose()}><DialogContent className="editor"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{t('Өзгерістер аккаунтыңда сақталады.', 'Изменения сохранятся в аккаунте.')}</DialogDescription></DialogHeader><form onSubmit={async (e) => { e.preventDefault(); setBusy(true); try {
    await onSave(v);
    onClose();
}
catch (e) {
    setErr(e instanceof Error ? e.message : 'Error');
}
finally {
    setBusy(false);
} }}><div className="form-fields">{fields.map(f => <label className={f.type === 'textarea' ? 'wide' : ''} key={f.key}>{f.label}{f.options ? <SelectField value={String(v[f.key] ?? f.options[0][0])} onChange={s => set({ ...v, [f.key]: s })} options={f.options}/> : f.type === 'slider' ? <div className="slider-field"><Slider min={0} max={100} step={5} value={[Number(v[f.key]) || 0]} onValueChange={s => set({ ...v, [f.key]: s[0] })}/><strong>{v[f.key] || 0}%</strong></div> : f.type === 'textarea' ? <textarea value={v[f.key] || ''} onChange={e => set({ ...v, [f.key]: e.target.value })} rows={4} maxLength={10000}/> : <input type={f.type || 'text'} required={f.required !== false} min={f.min} max={f.max} maxLength={f.type === 'text' || !f.type ? 160 : undefined} value={v[f.key] ?? ''} onChange={e => set({ ...v, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}/>}</label>)}</div>{err && <p className="error">{err}</p>}<div className="form-actions"><Button kind="secondary" onClick={onClose}>{t('Бас тарту', 'Отмена')}</Button><Button type="submit" disabled={busy}>{busy ? t('Сақталуда…', 'Сохранение…') : t('Сақтау', 'Сохранить')}</Button></div></form></DialogContent></Dialog>; }
export function DeleteButton({ table, id }: {
    table: Collection;
    id: string;
}) { const { remove, t } = useApp(); const [open, set] = useState(false); return <><button className="icon-btn delete" title={t('Өшіру', 'Удалить')} onClick={() => set(true)}><Trash2 size={16}/></button><AlertDialog open={open} onOpenChange={set}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('Жазбаны өшіру керек пе?', 'Удалить запись?')}</AlertDialogTitle><AlertDialogDescription>{t('Бұл әрекетті кері қайтару мүмкін емес.', 'Это действие нельзя отменить.')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('Бас тарту', 'Отмена')}</AlertDialogCancel><AlertDialogAction onClick={() => remove(table, id)}>{t('Өшіру', 'Удалить')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>; }
export function money(v: number) { return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(v) + ' ₸'; }
