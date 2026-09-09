'use client';
import { useEffect, useRef, useState } from 'react';
import { Timer, Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp, Panel, Button } from './shared';
export type TimerState = {
    mode: 'focus' | 'break';
    remaining: number;
    running: boolean;
    target: number | null;
    id: string | null;
};
export function Focus({ api, state, setState }: {
    api: (u: string, b: any) => Promise<any>;
    state: TimerState;
    setState: React.Dispatch<React.SetStateAction<TimerState>>;
}) {
    const { t, data, refresh } = useApp();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const finishing = useRef(false);
    const completed = data.focus_sessions.filter(v => v.completed && new Date(v.endedAt).toDateString() === new Date().toDateString()).length;
    useEffect(() => { if (!state.running || !state.target)
        return; const tick = setInterval(() => { const remaining = Math.max(0, Math.ceil((state.target! - Date.now()) / 1000)); setState(s => ({ ...s, remaining })); if (remaining === 0 && !finishing.current) {
        finishing.current = true;
        setState(s => ({ ...s, running: false, target: null }));
        void (async () => { try {
            if (state.mode === 'focus' && state.id) {
                await api('/api/focus', { action: 'complete', id: state.id });
                await refresh();
            }
            setState(s => ({ ...s, id: null }));
            setError(t('Сессия аяқталды. Жарайсың!', 'Сессия завершена. Отлично!'));
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            finishing.current = false;
        } })();
    } }, 400); return () => clearInterval(tick); }, [state.running, state.target, state.id, state.mode]);
    async function reset(mode = state.mode) { setBusy(true); try {
        if (state.id)
            await api('/api/focus', { action: 'cancel', id: state.id });
        setState({ mode, remaining: mode === 'focus' ? 1500 : 300, running: false, target: null, id: null });
        setError('');
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function toggle() { setBusy(true); setError(''); try {
        if (state.running) {
            setState(s => ({ ...s, running: false, target: null, remaining: Math.max(0, Math.ceil((s.target! - Date.now()) / 1000)) }));
        }
        else {
            let id = state.id;
            if (state.mode === 'focus' && !id)
                id = (await api('/api/focus', { action: 'start' })).id;
            const remaining = state.remaining || (state.mode === 'focus' ? 1500 : 300);
            setState(s => ({ ...s, id, remaining, running: true, target: Date.now() + remaining * 1000 }));
        }
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    return <Panel title={t('Назар уақыты', 'Время фокуса')} icon={Timer} className="focus-panel" action={<span className="tag">POMODORO</span>}><Tabs value={state.mode} onValueChange={v => void reset(v as 'focus' | 'break')}><TabsList><TabsTrigger value="focus">{t('Назар', 'Фокус')} · 25{t('м', 'м')}</TabsTrigger><TabsTrigger value="break">{t('Үзіліс', 'Перерыв')} · 5{t('м', 'м')}</TabsTrigger></TabsList></Tabs><div className="timer-ring" style={{ '--timer-progress': `${state.remaining / (state.mode === 'focus' ? 1500 : 300) * 100}%` } as React.CSSProperties}><div><span>{state.mode === 'focus' ? t('МАҢЫЗДЫҒА НАЗАР БӨЛ', 'ФОКУС НА ВАЖНОМ') : t('ДЕМАЛЫП АЛ', 'ОТДОХНИ')}</span><strong>{String(Math.floor(state.remaining / 60)).padStart(2, '0')}<b>:</b>{String(state.remaining % 60).padStart(2, '0')}</strong><small>{state.running ? t('Кішкентай қадам — үлкен нәтиже', 'Маленький шаг — большой результат') : t('Дайын болғанда баста', 'Начни, когда будешь готов')}</small></div></div><div className="timer-actions"><Button disabled={busy} onClick={toggle}>{state.running ? <Pause size={16}/> : <Play size={16} fill="currentColor"/>}{state.running ? t('Үзіліс', 'Пауза') : t('Бастау', 'Начать')}</Button><button disabled={busy} className="icon-btn reset" onClick={() => void reset()} aria-label={t('Қайта бастау', 'Сброс')}><RotateCcw size={18}/></button></div>{error && <p className="caption" role="status">{error}</p>}<div className="focus-footer"><span>{t('Бүгін', 'Сегодня')}: <b>{completed}</b> {t('сессия', 'сессий')}</span><span className="purple">+5 XP / {t('сессия', 'сессия')}</span></div></Panel>;
}
