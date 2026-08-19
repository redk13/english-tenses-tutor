import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  API_KEY:    'api_key',
  MODEL:      'selected_model',
  PROGRESS:   'progress',
  STREAK:     'streak',
  FREEZE:     'streak_freeze',
  LAST_OPEN:  'last_open',
  SESSIONS:   'total_sessions',
  MASTERED:   'mastered_tenses',
  WEEKLY:     'weekly_data',
  EARNED:     'achievements',
  JOURNAL:    'mistake_journal',
  SPACED:     'spaced_rep',
  CHALLENGE:  'daily_challenge',
};

export const ACHIEVEMENTS = [
  { id: 'first',      emoji: '🌟', title: 'الخطوة الأولى',       desc: 'أكملت جلستك الأولى',          check: s => s.sessions >= 1 },
  { id: 'streak3',    emoji: '🔥', title: 'ثلاثة أيام',           desc: 'تعلّمت 3 أيام متواصلة',        check: s => s.streak >= 3 },
  { id: 'streak7',    emoji: '🏆', title: 'أسبوع كامل',           desc: 'سبعة أيام متواصلة',            check: s => s.streak >= 7 },
  { id: 'streak30',   emoji: '👑', title: 'بطل الشهر',            desc: '30 يوم متواصل',                check: s => s.streak >= 30 },
  { id: 'correct10',  emoji: '✅', title: 'عشر إجابات صحيحة',     desc: 'أجبت 10 أسئلة صحيحة',         check: s => s.correct >= 10 },
  { id: 'correct50',  emoji: '💎', title: 'خمسون إجابة',          desc: 'نصف المئة',                   check: s => s.correct >= 50 },
  { id: 'correct100', emoji: '🥇', title: 'المئة الذهبية',        desc: '100 إجابة صحيحة',             check: s => s.correct >= 100 },
  { id: 'acc90',      emoji: '🎯', title: 'القنّاص',              desc: 'دقة 90%+ مع 10 أسئلة',        check: s => s.accuracy >= 90 && s.answered >= 10 },
  { id: 'all7',       emoji: '📚', title: 'المتعلم الشامل',       desc: 'تعلّمت جميع الأزمنة السبعة',   check: s => s.mastered >= 7 },
  { id: 'sessions10', emoji: '💪', title: 'عشر جلسات',            desc: 'أكملت 10 جلسات',              check: s => s.sessions >= 10 },
];

class StorageService {
  // API Key
  async saveKey(k) { await AsyncStorage.setItem(K.API_KEY, k); }
  async getKey()   { return await AsyncStorage.getItem(K.API_KEY); }
  async removeKey(){ await AsyncStorage.removeItem(K.API_KEY); }

  // Model
  async saveModel(m) { await AsyncStorage.setItem(K.MODEL, m); }
  async getModel()   { return await AsyncStorage.getItem(K.MODEL); }

  // Progress
  async getProgress() {
    const d = await AsyncStorage.getItem(K.PROGRESS);
    return d ? JSON.parse(d) : { correct: 0, answered: 0, tenses: {} };
  }

  async addAnswer(tense, isCorrect) {
    const p = await this.getProgress();
    p.answered += 1;
    if (isCorrect) p.correct += 1;
    if (!p.tenses[tense]) p.tenses[tense] = { correct: 0, total: 0 };
    p.tenses[tense].total += 1;
    if (isCorrect) p.tenses[tense].correct += 1;
    await AsyncStorage.setItem(K.PROGRESS, JSON.stringify(p));
    await this.addWeeklyPoint(isCorrect);
    await this.updateSpaced(tense, isCorrect);
    return p;
  }

  // Streak
  async updateStreak() {
    const today = new Date().toDateString();
    const last  = await AsyncStorage.getItem(K.LAST_OPEN);
    let streak  = parseInt(await AsyncStorage.getItem(K.STREAK) || '0');
    let froze   = false;

    if (last !== today) {
      const yest = new Date(); yest.setDate(yest.getDate() - 1);
      const day2 = new Date(); day2.setDate(day2.getDate() - 2);
      if (last === yest.toDateString()) {
        streak += 1;
      } else if (last === day2.toDateString()) {
        const hasFreeze = (await AsyncStorage.getItem(K.FREEZE)) === 'true';
        if (hasFreeze) { streak += 1; await AsyncStorage.setItem(K.FREEZE, 'false'); froze = true; }
        else streak = 1;
      } else { streak = 1; }

      await AsyncStorage.setItem(K.STREAK,    streak.toString());
      await AsyncStorage.setItem(K.LAST_OPEN, today);
      if (streak % 7 === 0) await AsyncStorage.setItem(K.FREEZE, 'true');
    }
    return { streak, froze };
  }

  async getStreak()   { return parseInt(await AsyncStorage.getItem(K.STREAK) || '0'); }
  async hasFreeze()   { return (await AsyncStorage.getItem(K.FREEZE)) === 'true'; }

  // Sessions
  async addSession() {
    const n = parseInt(await AsyncStorage.getItem(K.SESSIONS) || '0') + 1;
    await AsyncStorage.setItem(K.SESSIONS, n.toString());
    return n;
  }
  async getSessions() { return parseInt(await AsyncStorage.getItem(K.SESSIONS) || '0'); }

  // Weekly
  async addWeeklyPoint(isCorrect) {
    const day  = new Date().toLocaleDateString('en', { weekday: 'short' });
    const data = await this.getWeekly();
    if (!data[day]) data[day] = { c: 0, t: 0 };
    data[day].t += 1;
    if (isCorrect) data[day].c += 1;
    await AsyncStorage.setItem(K.WEEKLY, JSON.stringify(data));
  }
  async getWeekly() {
    const d = await AsyncStorage.getItem(K.WEEKLY);
    return d ? JSON.parse(d) : {};
  }

  // Mastered
  async getMastered() {
    const d = await AsyncStorage.getItem(K.MASTERED);
    return d ? JSON.parse(d) : [];
  }
  async addMastered(t) {
    const m = await this.getMastered();
    if (!m.includes(t)) { m.push(t); await AsyncStorage.setItem(K.MASTERED, JSON.stringify(m)); }
  }

  // Achievements
  async getEarned() {
    const d = await AsyncStorage.getItem(K.EARNED);
    return d ? JSON.parse(d) : [];
  }
  async checkAchievements() {
    const p  = await this.getProgress();
    const s  = await this.getStreak();
    const n  = await this.getSessions();
    const m  = await this.getMastered();
    const earned = await this.getEarned();
    const acc = p.answered > 0 ? Math.round((p.correct / p.answered) * 100) : 0;
    const stats = { streak: s, sessions: n, correct: p.correct, answered: p.answered, accuracy: acc, mastered: m.length };
    const newOnes = [];
    for (const a of ACHIEVEMENTS) {
      if (!earned.includes(a.id) && a.check(stats)) { earned.push(a.id); newOnes.push(a); }
    }
    if (newOnes.length > 0) await AsyncStorage.setItem(K.EARNED, JSON.stringify(earned));
    return newOnes;
  }

  // Mistake Journal
  async addMistake(tense, context) {
    const j = await this.getJournal();
    j.push({ id: Date.now().toString(), tense, context, date: new Date().toLocaleDateString('ar') });
    await AsyncStorage.setItem(K.JOURNAL, JSON.stringify(j.slice(-50)));
  }
  async getJournal() {
    const d = await AsyncStorage.getItem(K.JOURNAL);
    return d ? JSON.parse(d) : [];
  }

  // Spaced Repetition (SM-2)
  async updateSpaced(tense, isCorrect) {
    const d   = await AsyncStorage.getItem(K.SPACED);
    const rep = d ? JSON.parse(d) : {};
    if (!rep[tense]) rep[tense] = { interval: 1, ease: 2.5 };
    const r  = isCorrect ? 5 : 1;
    const ef = Math.max(1.3, rep[tense].ease + 0.1 - (5 - r) * (0.08 + (5 - r) * 0.02));
    const iv = isCorrect ? Math.max(1, Math.round(rep[tense].interval * ef)) : 1;
    const next = new Date(); next.setDate(next.getDate() + iv);
    rep[tense] = { interval: iv, ease: ef, next: next.toISOString() };
    await AsyncStorage.setItem(K.SPACED, JSON.stringify(rep));
  }
  async getDueForReview() {
    const d = await AsyncStorage.getItem(K.SPACED);
    if (!d) return [];
    const rep = JSON.parse(d);
    const now = new Date();
    return Object.entries(rep).filter(([, v]) => !v.next || new Date(v.next) <= now).map(([t]) => t);
  }

  // Daily Challenge
  async getDailyChallenge() {
    const today = new Date().toDateString();
    const d = await AsyncStorage.getItem(K.CHALLENGE);
    if (d) { const p = JSON.parse(d); if (p.date === today) return p; }
    const list = [
      { tense: 'past_simple',       prompt: 'تحدث عن يوم أمس كاملاً' },
      { tense: 'past_continuous',   prompt: 'صف ماذا كنت تفعل الساعة 8 مساء أمس' },
      { tense: 'present_simple',    prompt: 'اشرح روتينك الصباحي' },
      { tense: 'present_continuous',prompt: 'صف ما يحدث حولك الآن' },
      { tense: 'present_perfect',   prompt: 'اذكر 3 تجارب من حياتك' },
      { tense: 'past_perfect',      prompt: 'احك عن موقف فاجأك' },
      { tense: 'simple_future',     prompt: 'خطط لأسبوعك القادم' },
    ];
    const c = { ...list[new Date().getDay()], date: today, done: false };
    await AsyncStorage.setItem(K.CHALLENGE, JSON.stringify(c));
    return c;
  }
  async completeChallenge() {
    const c = await this.getDailyChallenge();
    c.done = true;
    await AsyncStorage.setItem(K.CHALLENGE, JSON.stringify(c));
  }

  // Full Report
  async getReport() {
    const p   = await this.getProgress();
    const w   = await this.getWeekly();
    const s   = await this.getStreak();
    const n   = await this.getSessions();
    const m   = await this.getMastered();
    const ea  = await this.getEarned();
    const j   = await this.getJournal();
    const due = await this.getDueForReview();
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const chart = days.map(d => ({ day: d, c: w[d]?.c || 0, t: w[d]?.t || 0 }));
    const wt = chart.reduce((a, b) => a + b.t, 0);
    const wc = chart.reduce((a, b) => a + b.c, 0);
    const acc = p.answered > 0 ? Math.round((p.correct / p.answered) * 100) : 0;
    let weak = null, weakRate = 101, strong = null, strongRate = -1;
    Object.entries(p.tenses).forEach(([t, d]) => {
      if (d.total >= 3) {
        const r = (d.correct / d.total) * 100;
        if (r < weakRate) { weakRate = r; weak = t; }
        if (r > strongRate) { strongRate = r; strong = t; }
      }
    });
    return {
      chart, wt, wc, weekAcc: wt > 0 ? Math.round((wc / wt) * 100) : 0,
      streak: s, sessions: n, mastered: m.length, achievements: ea.length,
      correct: p.correct, answered: p.answered, accuracy: acc,
      weak, strong, journal: j.slice(-5), due, tenses: p.tenses,
    };
  }

  async resetAll() { await AsyncStorage.clear(); }
}

export default new StorageService();
