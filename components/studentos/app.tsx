'use client';
import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, GraduationCap, CalendarDays, CheckCheck, Wallet, Briefcase, Target, Sparkles, UserRound, Bell, Sun, Moon, ChevronDown, ChartNoAxesCombined, ArrowUpRight, Menu, RefreshCw, LogOut, Search, Check, Clock } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarTrigger } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Context, Brand, Button, Empty, type Page, useApp } from './shared';
import { Landing, Auth, Onboarding } from './access';
import { Dashboard, GoalSummary, LevelCard } from './dashboard';
import { Schedule } from './schedule';
import { Tasks } from './tasks';
import { Finance, financeTotals } from './finance';
import { Study, Goals } from './goals-study';
import { Analytics } from './analytics';
import { Jobs, Assistant, Profile } from './extras';
import { Focus, type TimerState } from './focus';
import { blankData, localDate, categoryPairs, type Data, type Collection } from '@/lib/models';
const nav: [
    Page,
    any,
    string,
    string
][] = [['dashboard', LayoutDashboard, 'Басты бет', 'Главная'], ['study', GraduationCap, 'Оқу', 'Учёба'], ['schedule', CalendarDays, 'Кесте', 'Расписание'], ['tasks', CheckCheck, 'Тапсырмалар', 'Задачи'], ['finance', Wallet, 'Қаржы', 'Финансы'], ['jobs', Briefcase, 'Жұмыс', 'Работа'], ['goals', Target, 'Мақсаттар', 'Цели'], ['ai', Sparkles, 'AI көмекші', 'AI помощник'], ['analytics', ChartNoAxesCombined, 'Аналитика', 'Аналитика']];
const errorText: Record<string, [
    string,
    string
]> = { invalid_login: ['Email/телефон немесе құпиясөз қате.', 'Неверный email/телефон или пароль.'], contact_exists: ['Бұл email/телефон тіркелген. Кіруді таңда.', 'Этот email/телефон уже зарегистрирован. Выбери вход.'], invalid_contact: ['Дұрыс email немесе 10–15 цифрлы телефон енгіз.', 'Введи email или телефон из 10–15 цифр.'], validation: ['Мәліметтерді тексер. Құпиясөз кемінде 8 таңба болуы керек.', 'Проверь данные. Пароль должен содержать минимум 8 символов.'], unauthorized: ['Сессия аяқталды. Қайта кір.', 'Сессия истекла. Войди снова.'], server_error: ['Сақтау орындалмады. Қайта көр.', 'Не удалось сохранить. Попробуй снова.'], too_many_attempts: ['Әрекет тым көп. 15 минуттан кейін қайтала.', 'Слишком много попыток. Повтори через 15 минут.'] };
export default function StudentApp() {
    const [data, setData] = useState<Data>(blankData);
    const [loaded, setLoaded] = useState(false);
    const [user, setUser] = useState<string | null>(null);
    const [auth, setAuth] = useState<boolean | null>(null);
    const [page, setPage] = useState<Page>('dashboard');
    const [language, setLang] = useState<'kk' | 'ru'>('kk');
    const [theme, setThemeState] = useState('light');
    const [busy, setBusy] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [timer, setTimer] = useState<TimerState>({ mode: 'focus', remaining: 1500, running: false, target: null, id: null });
    const t = (kk: string, ru: string) => language === 'kk' ? kk : ru;
    async function api(url: string, body?: any) { const res = await fetch(url, { method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined }); let result: any; try {
        result = await res.json();
    }
    catch {
        throw new Error(t('Серверге қосылу мүмкін болмады.', 'Не удалось подключиться к серверу.'));
    } if (!res.ok) {
        if (res.status === 401 && url !== '/api/auth') {
            setUser(null);
            setData(blankData());
            setAuth(false);
        }
        const msg = errorText[result.error];
        throw new Error(msg ? t(...msg) : t('Әрекет орындалмады. Деректерді тексер.', 'Не удалось выполнить действие. Проверь данные.'));
    } return result; }
    async function refresh() { const d = await api('/api/data'); setData(d); }
    async function bootstrap() { setLoadError(''); try {
        const r = await api('/api/auth');
        if (r.user) {
            const d = await api('/api/data');
            setData(d);
            const stored = localStorage.getItem('studentos-timer-' + r.user);
            if (stored) {
                try {
                    const timerValue = JSON.parse(stored);
                    if (timerValue.id && d.focus_sessions.some((v: any) => v.id === timerValue.id && !v.completed))
                        setTimer(timerValue);
                }
                catch { }
            }
            setUser(r.user);
            if (d.profiles[0]?.language)
                setLang(d.profiles[0].language);
            setAuth(null);
        }
    }
    catch (e) {
        setLoadError((e as Error).message);
    }
    finally {
        setLoaded(true);
    } }
    useEffect(() => { setLang(localStorage.getItem('studentos-language') === 'ru' ? 'ru' : 'kk'); setThemeState(localStorage.getItem('studentos-theme') || 'light'); void bootstrap(); const hash = location.hash.slice(1); if (nav.some(v => v[0] === hash) || hash === 'profile')
        setPage(hash as Page); const onHash = () => { const key = location.hash.slice(1); if (nav.some(v => v[0] === key) || key === 'profile')
        setPage(key as Page); }; window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash); }, []);
    useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); localStorage.setItem('studentos-theme', theme); }, [theme]);
    useEffect(() => { document.documentElement.lang = language; localStorage.setItem('studentos-language', language); }, [language]);
    useEffect(() => { if (user)
        localStorage.setItem('studentos-timer-' + user, JSON.stringify(timer)); }, [timer, user]);
    async function save(table: Collection, value: any, id?: string) { setBusy(true); try {
        await api('/api/data', { action: 'save', table, data: value, id });
        await refresh();
        toast.success(t('Сақталды', 'Сохранено'));
    }
    catch (e) {
        toast.error((e as Error).message);
        throw e;
    }
    finally {
        setBusy(false);
    } }
    async function remove(table: Collection, id: string) { setBusy(true); try {
        await api('/api/data', { action: 'delete', table, id });
        await refresh();
        toast.success(t('Өшірілді', 'Удалено'));
    }
    catch (e) {
        toast.error((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    function go(p: Page) { setPage(p); location.hash = p; window.scrollTo({ top: 0, behavior: 'smooth' }); }
    function setLanguage(l: 'kk' | 'ru') { setLang(l); const p = data.profiles[0]; if (user && p)
        void save('profiles', { ...p, language: l }, p.id).catch(() => { }); }
    async function logout() { try {
        await api('/api/auth', { action: 'logout' });
        setUser(null);
        setData(blankData());
        setAuth(null);
        setTimer({ mode: 'focus', remaining: 1500, running: false, target: null, id: null });
        history.replaceState(null, '', location.pathname);
    }
    catch (e) {
        toast.error((e as Error).message);
    } }
    const context = { data, language, t, refresh, save, remove, go, busy, theme, setTheme: setThemeState, setLanguage };
    return <Context.Provider value={context}><Toaster position="bottom-right" richColors/>{!loaded ? <div className="loading-page"><Brand /><div className="loading-layout"><Skeleton className="h-20 w-full"/><Skeleton className="h-60 w-full"/><Skeleton className="h-40 w-full"/></div></div> : loadError ? <div className="loading-page"><Brand /><p className="error">{loadError}</p><Button onClick={() => void bootstrap()}><RefreshCw size={17}/>{t('Қайталау', 'Повторить')}</Button></div> : !user ? (auth === null ? <Landing enter={register => setAuth(register)}/> : <Auth register={auth} onBack={() => setAuth(null)} onSuccess={bootstrap} api={api}/>) : !data.profiles[0]?.onboarded ? <Onboarding api={api}/> : <Shell page={page} api={api} logout={logout} timer={timer} setTimer={setTimer}/>}</Context.Provider>;
}
function Shell({ page, api, logout, timer, setTimer }: {
    page: Page;
    api: (u: string, b?: any) => Promise<any>;
    logout: () => void;
    timer: TimerState;
    setTimer: React.Dispatch<React.SetStateAction<TimerState>>;
}) {
    const { t, data, go, language, setLanguage, theme, setTheme } = useApp();
    const [notifications, setNotifications] = useState(false);
    const p = data.profiles[0];
    const tasks = data.tasks.filter(v => v.status !== 'done');
    const title = nav.find(n => n[0] === page);
    const f = financeTotals(data);
    const notices = [...tasks.filter(v => v.deadline <= localDate(new Date(Date.now() + 86400000 * 2))).map(v => ({ id: 'task-' + v.id, title: v.title, detail: t('Тапсыру мерзімі', 'Срок сдачи') + ': ' + v.deadline, page: 'tasks' as Page })), ...data.budgets.filter(b => f.items.filter(v => v.type === 'expense' && v.category === b.title).reduce((a, v) => a + v.amount, 0) >= b.amount * .85).map(b => ({ id: 'budget-' + b.id, title: (categoryPairs[b.title]?.[language === 'kk' ? 0 : 1] || b.title), detail: t('Бюджет лимитінің 85%-ынан асты', 'Использовано более 85% бюджета'), page: 'finance' as Page })), ...data.schedule.filter(v => Number(v.day) === (new Date().getDay() + 6) % 7).filter(v => { const start = new Date(); const [h, m] = v.start.split(':').map(Number); start.setHours(h, m, 0, 0); return start.getTime() - Date.now() >= 0 && start.getTime() - Date.now() <= 1800000; }).map(v => ({ id: 'class-' + v.id, title: v.title, detail: t('Сабақ жақында басталады', 'Занятие скоро начнётся') + ' · ' + v.start, page: 'schedule' as Page }))];
    return <SidebarProvider style={{ '--sidebar-width': '236px' } as React.CSSProperties}><Sidebar className="app-sidebar"><SidebarHeader><button onClick={() => go('dashboard')}><Brand /></button><div className="workspace-label"><span className="workspace-avatar"><GraduationCap size={18}/></span><span>{t('Менің кеңістігім', 'Моё пространство')}<small>{p.university}</small></span><ChevronDown size={14}/></div></SidebarHeader><SidebarContent><SidebarGroup><SidebarGroupLabel>{t('КҮНДЕЛІКТІ', 'ПОВСЕДНЕВНОЕ')}</SidebarGroupLabel><SidebarMenu>{nav.slice(0, 7).map(([key, I, kk, ru]) => <SidebarMenuItem key={key}><SidebarMenuButton className="nav-link" isActive={page === key} onClick={() => go(key)}><I size={19}/><span>{t(kk, ru)}</span>{key === 'tasks' && tasks.length > 0 && <b className="nav-count">{tasks.length}</b>}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroup><SidebarGroup><SidebarGroupLabel>{t('ӨЗІҢДІ ДАМЫТ', 'РАЗВИВАЙСЯ')}</SidebarGroupLabel><SidebarMenu>{nav.slice(7).map(([key, I, kk, ru]) => <SidebarMenuItem key={key}><SidebarMenuButton className="nav-link" isActive={page === key} onClick={() => go(key)}><I size={19}/><span>{t(kk, ru)}</span>{key === 'ai' && <small className="ai-label">DEMO</small>}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroup></SidebarContent><SidebarFooter><div className="sidebar-motivation"><Sparkles size={23}/><h3>{t('Кішкентай қадам.', 'Маленький шаг.')}</h3><p>{t('Күн сайын үлкен нәтижеге.', 'Каждый день к большому результату.')}</p><button onClick={() => go('goals')}>{t('Мақсатыма қарай', 'К моей цели')}<ArrowUpRight size={15}/></button></div><button className={`sidebar-profile ${page === 'profile' ? 'active' : ''}`} onClick={() => go('profile')}><span className="avatar">{p.avatar || p.name[0] + p.surname[0]}</span><span><b>{p.name} {p.surname}</b><small>{p.course} {t('курс · Студент', 'курс · Студент')}</small></span><ChevronDown size={14}/></button></SidebarFooter></Sidebar><div className="app-main"><header className="topbar"><div className="row"><SidebarTrigger className="mobile-trigger"/><span className="breadcrumb">StudentOS <span>/</span> <strong>{title ? t(title[2], title[3]) : t('Профиль', 'Профиль')}</strong></span></div><div className="row top-actions"><span className="top-date"><CalendarDays size={15}/>{new Date().toLocaleDateString(t('kk-KZ', 'ru-RU'), { day: 'numeric', month: 'long', year: 'numeric' })}</span><span className="top-divider"/><button className="lang-toggle" onClick={() => setLanguage(language === 'kk' ? 'ru' : 'kk')}>{language.toUpperCase()}<ChevronDown size={12}/></button><button className="icon-btn" aria-label={t('Түсті өзгерту', 'Сменить тему')} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}</button><button className="icon-btn notification-toggle" aria-label={t('Хабарландырулар', 'Уведомления')} onClick={() => setNotifications(true)}><Bell size={19}/>{p.notifications && notices.length > 0 && <span />}</button><button className="avatar top-avatar" onClick={() => go('profile')}>{p.avatar || p.name[0] + p.surname[0]}</button></div></header><div className={`workspace ${page === 'dashboard' ? 'dashboard-layout' : ''}`}><article className="page-content" key={page}>{page === 'dashboard' ? <Dashboard /> : page === 'study' ? <Study /> : page === 'schedule' ? <Schedule /> : page === 'tasks' ? <Tasks /> : page === 'finance' ? <Finance /> : page === 'goals' ? <Goals /> : page === 'jobs' ? <Jobs /> : page === 'ai' ? <Assistant api={api}/> : page === 'analytics' ? <Analytics /> : <Profile api={api} logout={logout}/>}</article><aside className="right-rail" style={page === 'dashboard' ? undefined : { display: 'none' }}><LevelCard /><Focus api={api} state={timer} setState={setTimer}/><GoalSummary /><button className="ai-prompt-card" onClick={() => go('ai')}><Sparkles size={24}/><div><strong>{t('Күнге жоспар керек пе?', 'Нужен план на день?')}</strong><p>{t('StudentOS AI-дан сұра', 'Спроси StudentOS AI')}</p></div><ArrowUpRight size={17}/></button></aside></div>{page !== 'dashboard' && timer.running && <button className="floating-timer" onClick={() => go('dashboard')}><Clock size={18}/>{Math.floor(timer.remaining / 60)}:{String(timer.remaining % 60).padStart(2, '0')} · {t('Назар', 'Фокус')}</button>}<footer className="app-footer"><span>StudentOS <span>·</span> {t('Бір күн. Бір қадам.', 'Один день. Один шаг.')}</span><span>{t('Өзіңе уақыт қалдыр ✦', 'Оставляй время для себя ✦')}</span></footer><nav className="bottom-nav">{(['dashboard', 'tasks', 'schedule', 'finance', 'profile'] as Page[]).map(key => { const v = nav.find(x => x[0] === key); const I = v?.[1] || UserRound; return <button key={key} className={key === page ? 'active' : ''} onClick={() => go(key)}><I size={21}/><span>{v ? t(v[2], v[3]) : t('Профиль', 'Профиль')}</span></button>; })}</nav></div><Sheet open={notifications} onOpenChange={setNotifications}><SheetContent className="notification-sheet"><SheetHeader><SheetTitle>{t('Хабарландырулар', 'Уведомления')}</SheetTitle><SheetDescription>{t('Жақын мерзімдер мен маңызды ескертулер.', 'Ближайшие сроки и важные напоминания.')}</SheetDescription></SheetHeader>{!p.notifications ? <Empty text={t('Хабарландырулар өшірілген', 'Уведомления отключены')}/> : notices.length ? notices.map(n => <button className="notification-item" key={n.id} onClick={() => { go(n.page); setNotifications(false); }}><span><Bell size={17}/></span><div><strong>{n.title}</strong><p>{n.detail}</p></div><ArrowUpRight size={15}/></button>) : <Empty text={t('Бәрі тыныш. Жаңа ескерту жоқ.', 'Всё спокойно. Новых уведомлений нет.')}/>}</SheetContent></Sheet></SidebarProvider>;
}
