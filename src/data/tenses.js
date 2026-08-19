export const TENSES = [
  { id: 'past_simple',        ar: 'الماضي البسيط',     en: 'Simple Past',         formula: 'فعل + ed',          icon: '⏮', color: '#6366F1', rule: 'حدث خلص في وقت محدد' },
  { id: 'past_continuous',    ar: 'الماضي المستمر',    en: 'Past Continuous',     formula: 'was/were + ing',    icon: '🔄', color: '#8B5CF6', rule: 'شفته وهو يحدث 👀' },
  { id: 'past_perfect',       ar: 'الماضي التام',      en: 'Past Perfect',        formula: 'had + p.p',         icon: '⏭', color: '#EC4899', rule: 'خلص قبل حدث آخر 👻' },
  { id: 'present_simple',     ar: 'المضارع البسيط',   en: 'Simple Present',      formula: 'فعل / فعل+s',       icon: '🔵', color: '#10B981', rule: 'ثابت ودائم ✅' },
  { id: 'present_continuous', ar: 'المضارع المستمر',  en: 'Present Continuous',  formula: 'am/is/are + ing',   icon: '▶️', color: '#F59E0B', rule: 'الآن أو مؤقت' },
  { id: 'present_perfect',    ar: 'المضارع التام',    en: 'Present Perfect',     formula: 'have/has + p.p',    icon: '✨', color: '#06B6D4', rule: 'أثره موجود الآن' },
  { id: 'simple_future',      ar: 'المستقبل البسيط',  en: 'Simple Future',       formula: 'will / going to',   icon: '🚀', color: '#F97316', rule: 'سيحدث لاحقاً' },
];

export const MODES = [
  { id: 'chat',        icon: '💬', ar: 'محادثة حرة',       desc: 'اسأل المدرّس أي شيء',               color: '#6366F1', prompt: 'ابدأ جلسة تعليمية بسؤال مشوّق باختيارات.' },
  { id: 'analyze',     icon: '🔍', ar: 'حلّل جملتي',       desc: 'أعطِ جملة وسيشرح كل فعل فيها',       color: '#8B5CF6', prompt: 'أخبر الطالب يعطيك جملة إنجليزية لتحليلها.' },
  { id: 'scenario',    icon: '🎭', ar: 'موقف تخيلي',       desc: 'صف موقفاً وتعلم كيف تتكلم عنه',      color: '#10B981', prompt: 'قدّم موقفاً تخيلياً مثيراً وعلّم الطالب الأزمنة المناسبة.' },
  { id: 'quiz',        icon: '⚡', ar: 'اختبار سريع',      desc: 'أسئلة باختيارات',                    color: '#F59E0B', prompt: 'سؤال واحد فقط باختيارات. لا تعطِ أكثر من سؤال.' },
  { id: 'why',         icon: '🤔', ar: 'لماذا هذا الزمن؟', desc: 'اعرف سبب كل زمن في أي جملة',         color: '#EC4899', prompt: 'أخبر الطالب يعطيك جملة وأنت تشرح لماذا استُخدم ذلك الزمن.' },
  { id: 'fix',         icon: '🛠', ar: 'صحّح جملتي',       desc: 'اكتب بالإنجليزي وسيصحح الأزمنة',     color: '#06B6D4', prompt: 'أخبر الطالب يكتب جملاً بالإنجليزي وأنت تصحح الأزمنة فقط مع شرح.' },
];
