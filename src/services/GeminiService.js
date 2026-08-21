// ═══════════════════════════════════════════════════
//   English Tenses Tutor — Gemini AI Service
//   النماذج الحالية (أغسطس 2026) — موثقة من ai.google.dev
//   الافتراضي: 2.5 Flash-Lite = الأسرع + مجاني بالكامل
// ═══════════════════════════════════════════════════

export const FREE_MODELS = [
  { id: 'gemini-2.5-flash-lite', label: '2.5 Flash-Lite 🟡', desc: 'الأسرع — موصى به',       recommended: true  },
  { id: 'gemini-2.5-flash',      label: '2.5 Flash 🔵',      desc: 'سريع ومستقر',            recommended: false },
  { id: 'gemini-3.5-flash-lite', label: '3.5 Flash-Lite 🚀', desc: 'أذكى وأسرع',             recommended: false },
  { id: 'gemini-3.5-flash',      label: '3.5 Flash 🟢',      desc: 'قوي',                    recommended: false },
  { id: 'gemini-3.6-flash',      label: '3.6 Flash 🔵',      desc: 'أحدث',                   recommended: false },
  { id: 'gemini-3.7-flash',      label: '3.7 Flash ⚡',      desc: 'الأذكى (أبطأ — تفكير)',  recommended: false },
];

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT = 45000; // 45 ثانية كحد أقصى للطلب

const SYSTEM_PROMPT = `أنت أفضل مدرّس لغة إنجليزية في العالم، متخصص حصراً في الأزمنة الإنجليزية.
شخصيتك: صبور، مشجع، ذكي، لا تكرر نفسك أبداً.
لغة الشرح: العربية دائماً. الأمثلة والجمل: بالإنجليزية.

تنسيق الرد (مهم جداً):
- اكتب نصاً عادياً فقط. ممنوع استخدام رموز الماركداون مثل ** أو # أو - أو الأقواس المائلة للتنسيق.
- لا تضع كلمة أو جملة بين نجمتين ** للتوكيد؛ إن أردت التوكيد استخدم علامة تعجب أو رمزاً تعبيرياً بدلاً من ذلك.

قواعد التدريس:
١. فكرة واحدة في كل رد.
٢. بعد كل شرح: سؤال واحد باختيارين أو ثلاثة.
٣. لا تكمل حتى يجيب الطالب.
٤. إذا أجاب صح: جملة واحدة تشرح لماذا، ثم انتقل.
٥. إذا أجاب خطأ: قل "تقريباً!" وصحح بهدوء.
٦. إذا قال "لم أفهم": غيّر الأسلوب والمثال تماماً.
٧. أمثلة من الحياة اليومية فقط.
٨. ردودك قصيرة ومركزة. لا تتجاوز 4-5 أسطر في كل رد.

الأزمنة:
١. الماضي البسيط: فعل+ed | انتهى في وقت محدد | yesterday/ago/last
٢. الماضي المستمر: was/were+ing | شفته وهو يحدث 👀 | while/when
٣. الماضي التام: had+p.p | خلص قبل حدث آخر 👻 | already/before
٤. المضارع البسيط: فعل/فعل+s | ثابت ودائم | every/always
   - فعل be: I=am | He,She,It=is | You,We,They=are
٥. المضارع المستمر: am/is/are+ing | الآن أو مؤقت | now/these days
٦. المضارع التام: have/has+p.p | أثره موجود الآن | just/already/ever
٧. المستقبل: will=فجأي/وعد | going to=مخطط/دليل

أنواع التمارين:
- لماذا هذا الزمن؟ | اختر الصحيح | خطأ في جملة؟ | محادثة وتصحيح | دمج أزمنة | موقف تخيلي

بعد كل إجابة:
✅ صح + سبب + انتقل
❌ "تقريباً!" + تصحيح + سبب`;

class GeminiService {
  constructor() {
    this.apiKey = null;
    this.model = DEFAULT_MODEL;
    this.history = [];
  }

  setApiKey(key) { this.apiKey = key; this.history = []; }
  setModel(id) { this.model = id; this.history = []; }
  getModel() { return this.model; }
  resetHistory() { this.history = []; }

  async send(userMessage, mode = 'chat', retries = 2) {
    if (!this.apiKey) throw new Error('NO_API_KEY');

    const extras = {
      analyze: '\n[حلّل كل فعل في هذه الجملة واشرح زمنه]',
      quiz:    '\n[سؤال واحد باختيارات فقط]',
      why:     '\n[لماذا استُخدم هذا الزمن؟ اشرح بالتفصيل]',
      scenario:'\n[موقف تخيلي — كيف نتكلم عنه بالأزمنة الصحيحة؟]',
      fix:     '\n[هل في هذه الجملة خطأ في الزمن؟ صحّحه واشرح]',
    };

    const msg = userMessage + (extras[mode] || '');
    this.history.push({ role: 'user', parts: [{ text: msg }] });

    const url = `${BASE_URL}/${this.model}:generateContent?key=${this.apiKey}`;
    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: this.history,
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
    };

    for (let i = 0; i < retries; i++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (res.status === 429) {
          if (i < retries - 1) { await new Promise(r => setTimeout(r, 2000)); continue; }
          throw new Error('RATE_LIMIT');
        }
        if (res.status === 400 || res.status === 403) throw new Error('INVALID_KEY');
        if (res.status === 404) throw new Error('MODEL_GONE');
        if (!res.ok) throw new Error('API_ERROR');

        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!reply) throw new Error('EMPTY');

        this.history.push({ role: 'model', parts: [{ text: reply }] });
        if (this.history.length > 30) this.history = this.history.slice(-30);
        return reply;
      } catch (e) {
        clearTimeout(timer);
        if (e.name === 'AbortError') throw new Error('TIMEOUT');
        if (i < retries - 1 && (e.message === 'API_ERROR' || e.message === 'EMPTY')) continue;
        throw e;
      } finally {
        clearTimeout(timer);
      }
    }
  }

  // التحقق من المفتاح — نموذج حي خفيف
  async validateKey(key) {
    try {
      const url = `${BASE_URL}/gemini-2.5-flash-lite:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });
      return res.ok || res.status === 429;
    } catch { return false; }
  }

  async testModel(key, modelId) {
    try {
      const url = `${BASE_URL}/${modelId}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });
      return { ok: res.ok || res.status === 429, status: res.status };
    } catch { return { ok: false, status: 0 }; }
  }
}

export default new GeminiService();
