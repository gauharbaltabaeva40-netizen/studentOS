import { localDate, type Collection } from '../models';
export function demoRecords(): [
    Collection,
    any
][] {
    const today = localDate();
    const tomorrow = localDate(new Date(Date.now() + 86400000));
    const day = (new Date().getDay() + 6) % 7;
    const names = ['Linear Algebra', 'Programming', 'English', 'Math Analysis'];
    const colors = ['#7562ec', '#3897e8', '#e89b40', '#39ad90'];
    return [
        ...names.map((title, i) => ['subjects', { title, color: colors[i], notes: '', exams: '', resources: '', progress: 0 }] as [
            Collection,
            any
        ]),
        ...names.slice(0, 3).map((title, i) => ['schedule', { title, day, start: ['09:00', '11:00', '14:00'][i], end: ['10:20', '12:20', '15:20'][i], room: ['C1.2.314', 'C1.1.206', 'C1.2.101'][i], teacher: '', color: colors[i] }] as [
            Collection,
            any
        ]),
        ...['Math Homework', 'React Project', 'English Essay'].map((title, i) => ['tasks', { title, subject: names[i], deadline: tomorrow, priority: i === 0 ? 'high' : 'medium', status: i === 1 ? 'progress' : 'todo', description: '' }] as [
            Collection,
            any
        ]),
        ['transactions', { title: 'Stipend', amount: 52000, category: 'stipend', date: today, type: 'income', description: '' }], ['transactions', { title: 'Lunch', amount: 3500, category: 'food', date: today, type: 'expense', description: '' }], ['transactions', { title: 'Taxi', amount: 2000, category: 'transport', date: today, type: 'expense', description: '' }],
        ['budgets', { title: 'food', amount: 50000 }], ['budgets', { title: 'transport', amount: 15000 }], ['budgets', { title: 'fun', amount: 20000 }],
        ['goals', { title: 'IELTS 7.5', deadline: localDate(new Date(Date.now() + 86400000 * 90)), progress: 0, description: '' }], ['goals', { title: 'React үйрену', deadline: localDate(new Date(Date.now() + 86400000 * 60)), progress: 0, description: '' }],
        ...[
            { title: 'Frontend Intern', company: 'Orbit Studio', salary: '120 000–180 000 ₸', location: 'Астана', skills: 'React · TypeScript', kind: 'Internship' },
            { title: 'Junior UI Designer', company: 'Forma', salary: '150 000–220 000 ₸', location: 'Remote', skills: 'Figma · UI/UX', kind: 'Remote' },
            { title: 'English tutor', company: 'Campus Lab', salary: '3 000–5 000 ₸ / h', location: 'Астана', skills: 'English · IELTS', kind: 'Part-time' },
            { title: 'Landing page developer', company: 'Digital Step', salary: '80 000 ₸ / project', location: 'Remote', skills: 'HTML · CSS · React', kind: 'Freelance' }
        ].map(v => ['jobs', { ...v, applied: false }] as [
            Collection,
            any
        ])
    ];
}
