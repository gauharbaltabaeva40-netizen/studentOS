import type { Data } from '../models';
// Replace this provider with a server-side OpenAI call. Never expose provider keys to the browser.
export interface AssistantProvider {
    reply(prompt: string, data: Data, language: 'kk' | 'ru'): Promise<string>;
}
export const demoAssistant: AssistantProvider = { async reply(prompt, data, language) {
        const ru = language === 'ru';
        const pending = data.tasks.filter(t => t.status !== 'done').sort((a, b) => a.deadline.localeCompare(b.deadline));
        const expense = data.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        if (/ақша|шығын|қаржы|расход|бюджет/i.test(prompt))
            return ru ? `Расходы в журнале: ${expense.toLocaleString()} ₸. Сравни категории с месячными лимитами на странице «Финансы». Начни с подписок и необязательных поездок; необходимые расходы оставь в бюджете. Выдели конкретную сумму на накопления.` : `Журналдағы шығын: ${expense.toLocaleString()} ₸. «Қаржы» бөлімінде санаттарды айлық лимитпен салыстыр. Алдымен пайдаланбайтын жазылымдар мен міндетті емес сапарларды қарастыр. Жинаққа нақты сома бөл.`;
        return (ru ? 'План на основе твоих данных:\n\n' : 'Деректерің бойынша жоспар:\n\n') + (pending.length ? pending.slice(0, 4).map((t, i) => `${i + 1}. ${t.title} — ${t.deadline}. ${ru ? 'Выдели 25 минут фокуса.' : '25 минут назар бөл.'}`).join('\n') : (ru ? '1. Добавь ближайшую учебную задачу.' : '1. Ең жақын оқу тапсырмаңды қос.')) + '\n\n' + (ru ? `В расписании ${data.schedule.length} занятий. Проверь сегодняшние пары, затем начни с ближайшего дедлайна. После 25 минут сделай 5 минут перерыва.` : `Кестеде ${data.schedule.length} сабақ бар. Бүгінгі сабақтарыңды қарап, мерзімі жақын тапсырмадан баста. 25 минуттан кейін 5 минут демал.`);
    } };
