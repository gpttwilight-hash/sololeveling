# PRD: «Система Пробуждения» — Life Gamification Web App

> **Версия:** 1.0
> **Дата:** 2 марта 2026
> **Автор:** Сергей
> **Статус:** Draft → Ready for Development

---

## 1. Обзор продукта

### 1.1 Суть

«Система Пробуждения» — PWA (Progressive Web App) для геймификации личного развития, вдохновлённая вселенной Solo Leveling. Приложение превращает повседневные привычки, задачи и цели в RPG-систему с прокачкой персонажа, ранговой системой и квестами.

### 1.2 Проблема

Люди хотят развиваться, но:
- Традиционные трекеры привычек скучны и быстро забрасываются
- Существующие геймификации (Habitica и др.) страдают от «эффекта новизны» — 80% пользователей бросают в первые 3 месяца
- Нет системы, которая сочетает эстетику Solo Leveling с научно обоснованными механиками поведенческого дизайна

### 1.3 Решение

Web-приложение, которое:
- Геймифицирует ВСЕ сферы жизни через единую систему атрибутов и рангов
- Построено на принципах Self-Determination Theory (автономия, компетентность, связанность)
- Имеет анти-грайнд механики для предотвращения выгорания
- Предлагает минималистичный, плавный, premium-уровня интерфейс (не пиксельная RPG)

### 1.4 Целевая аудитория

- **Первичная:** Мужчины 18–35 лет, интересующиеся аниме/играми и саморазвитием
- **Вторичная:** Любой пользователь, которому скучно с обычными трекерами привычек
- **Языки:** Русский (MVP), Английский (v2)

### 1.5 Бизнес-модель (будущее)

- **Freemium:** Базовая функциональность бесплатно
- **Pro ($4.99/мес):** Расширенная аналитика, кастомные квесты, AI-рекомендации, темы
- **Lifetime ($49.99):** Всё навсегда

---

## 2. Технический стек

### 2.1 Фронтенд

```
Framework:       Next.js 15 (App Router)
Language:        TypeScript (strict mode)
Styling:         Tailwind CSS 4
Components:      shadcn/ui (базовые) + кастомные компоненты
State:           Zustand
Forms:           React Hook Form + Zod validation
Charts:          Recharts (radar chart, line charts, heat maps)
Animations:      Framer Motion
Icons:           Lucide React
Fonts:           Geist (body) + кастомный display font
```

### 2.2 Бэкенд

```
BaaS:            Supabase (PostgreSQL + Auth + Realtime + Storage)
Auth:            Supabase Auth (email/password + Google OAuth + Magic Links)
Database:        PostgreSQL (через Supabase)
ORM:             Prisma (type-safe queries)
Edge Functions:  Supabase Edge Functions (для cron jobs, XP расчётов)
```

### 2.3 Инфраструктура

```
Hosting:         Vercel
PWA:             next-pwa (service workers, offline support)
CI/CD:           GitHub Actions
Monitoring:      Vercel Analytics + PostHog
Error Tracking:  Sentry
```

### 2.4 Обоснование выбора стека

- **Next.js + Supabase** — самый быстрый путь от идеи до продакшна в 2025–2026. Полный full-stack без отдельного бэкенда
- **PWA** — устанавливается на телефон без App Store, работает офлайн, push-уведомления
- **TypeScript** — type safety на всех уровнях, от базы данных до UI
- **Tailwind + shadcn** — быстрая разработка с консистентным дизайном, легко кастомизировать

---

## 3. Дизайн-система

### 3.1 Философия дизайна

**«Barely-There UI» + Dark Premium**

Вдохновление трендами 2025–2026:
- **Strategic Minimalism** — каждый элемент зарабатывает своё место на экране
- **Soft UI / Responsible Glassmorphism** — стеклянные карточки с мягким blur, subtle depth без визуального шума
- **Fluid Design** — плавные формы, soft gradients, organic layouts вместо жёстких сеток
- **Functional Motion** — анимации направляют, а не отвлекают. Каждое движение осмысленно
- **Content-First** — данные и прогресс на первом месте, UI на втором

**Антипатерны (чего НЕ делаем):**
- ❌ Пиксельная RPG-графика (как в Habitica)
- ❌ Перегруженный интерфейс с 20+ элементами на экране
- ❌ Кричащие неоновые цвета
- ❌ Анимации ради анимаций
- ❌ Generic AI-aesthetic (Inter font, purple gradients)

### 3.2 Цветовая палитра

```css
:root {
  /* === БАЗА (Dark Theme) === */
  --bg-primary:       #0A0A0F;       /* Глубокий тёмный — основной фон */
  --bg-secondary:     #12121A;       /* Чуть светлее — карточки, секции */
  --bg-tertiary:      #1A1A25;       /* Третий уровень — hover states, поля ввода */
  --bg-glass:         rgba(255, 255, 255, 0.03);  /* Стеклянные карточки */

  /* === ТЕКСТ === */
  --text-primary:     #F0F0F5;       /* Основной текст — почти белый, но мягче */
  --text-secondary:   #8A8A9A;       /* Вторичный текст — приглушённый */
  --text-tertiary:    #55556A;       /* Третичный — подсказки, disabled */

  /* === АКЦЕНТЫ (по атрибутам) === */
  --color-strength:   #E84855;       /* STR — Сила: тёплый красный */
  --color-intellect:  #3B82F6;       /* INT — Интеллект: чистый синий */
  --color-charisma:   #F59E0B;       /* CHA — Харизма: тёплый янтарный */
  --color-discipline: #8B5CF6;       /* DIS — Дисциплина: глубокий фиолетовый */
  --color-wealth:     #10B981;       /* WLT — Богатство: изумрудный зелёный */

  /* === СИСТЕМНЫЕ === */
  --color-xp:         #6366F1;       /* XP бар — индиго */
  --color-level-up:   #FBBF24;       /* Level Up эффект — золотой */
  --color-success:    #22C55E;       /* Успех — зелёный */
  --color-warning:    #F59E0B;       /* Предупреждение — янтарный */
  --color-danger:     #EF4444;       /* Опасность — красный */
  --color-rest:       #06B6D4;       /* Отдых — cyan */

  /* === РАНГИ (градиент оттенков) === */
  --rank-e:           #6B7280;       /* E-ранг: серый */
  --rank-d:           #3B82F6;       /* D-ранг: синий */
  --rank-c:           #8B5CF6;       /* C-ранг: фиолетовый */
  --rank-b:           #F59E0B;       /* B-ранг: золотой */
  --rank-a:           #EF4444;       /* A-ранг: красный */
  --rank-s:           #FBBF24;       /* S-ранг: яркое золото + glow effect */

  /* === BORDER / DIVIDERS === */
  --border-subtle:    rgba(255, 255, 255, 0.06);
  --border-default:   rgba(255, 255, 255, 0.10);
  --border-active:    rgba(255, 255, 255, 0.20);

  /* === SHADOWS === */
  --shadow-card:      0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-elevated:  0 10px 40px rgba(0, 0, 0, 0.4);
  --shadow-glow:      0 0 20px rgba(99, 102, 241, 0.15);  /* Для активных элементов */
}
```

### 3.3 Типографика

```css
/* Display / Заголовки */
font-family: 'Geist', system-ui, sans-serif;

/* Иерархия */
--text-display:    2.5rem / 700;    /* Главный экран: уровень, ранг */
--text-h1:         1.75rem / 700;   /* Заголовки страниц */
--text-h2:         1.25rem / 600;   /* Заголовки секций */
--text-h3:         1.0rem / 600;    /* Подзаголовки */
--text-body:       0.875rem / 400;  /* Основной текст */
--text-caption:    0.75rem / 400;   /* Подписи, метки */
--text-overline:   0.625rem / 600;  /* Overlines, UPPERCASE метки */

/* Числа: использовать tabular-nums для выравнивания */
font-variant-numeric: tabular-nums;
```

### 3.4 Компоненты

#### Карточки (Cards)

```
Стиль: Glass morphism на тёмном фоне
- background: rgba(255, 255, 255, 0.03)
- backdrop-filter: blur(12px)
- border: 1px solid rgba(255, 255, 255, 0.06)
- border-radius: 16px
- padding: 20px
- Hover: border переходит в rgba(255, 255, 255, 0.12)
- Transition: all 200ms ease
```

#### Кнопки (Buttons)

```
Primary:
- bg: linear-gradient(135deg, var(--color-xp), #4F46E5)
- text: white
- border-radius: 12px
- padding: 12px 24px
- Hover: brightness(1.1) + subtle shadow
- Active: scale(0.98)
- Transition: all 150ms ease

Secondary:
- bg: transparent
- border: 1px solid var(--border-default)
- text: var(--text-secondary)
- Hover: bg var(--bg-tertiary)

Ghost:
- bg: transparent
- text: var(--text-secondary)
- Hover: text var(--text-primary)
```

#### Progress Bars

```
Контейнер:
- bg: var(--bg-tertiary)
- border-radius: 999px (pill)
- height: 8px (default), 4px (compact), 12px (prominent)

Fill:
- gradient по цвету атрибута
- border-radius: 999px
- transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1)
- На заполнении: subtle pulse animation
```

#### Input Fields

```
- bg: var(--bg-tertiary)
- border: 1px solid var(--border-subtle)
- border-radius: 12px
- padding: 12px 16px
- Focus: border-color var(--color-xp), box-shadow var(--shadow-glow)
- Placeholder: var(--text-tertiary)
```

### 3.5 Анимации и переходы

```
/* Принцип: motion guides, not decorates */

/* Page transitions */
--transition-page: 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Micro-interactions */
--transition-fast: 150ms ease;
--transition-default: 200ms ease;
--transition-slow: 300ms ease;

/* Специальные */
--transition-xp-fill: 600ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-level-up: 800ms cubic-bezier(0.2, 0, 0, 1);  /* Для level-up анимации */

/* Stagger для списков */
--stagger-delay: 50ms;  /* Задержка между элементами при появлении */
```

**Ключевые анимации:**

1. **XP Gain** — число «+15 XP» плавно поднимается вверх и растворяется (fade up + fade out)
2. **Level Up** — золотая вспышка + shake + particles (только при повышении уровня — редко и ценно)
3. **Rank Up** — полноэкранный overlay с новым рангом, dramatic entrance (ещё реже — максимальный импакт)
4. **Quest Complete** — чекмарк с confetti-burst (subtle, не overwhelming)
5. **Card Appear** — fade in + slight translate Y (staggered для списков)
6. **Stat Change** — числа анимируются counting up/down (tabular nums для стабильности)

### 3.6 Адаптивность

```
/* Mobile-first подход */

Breakpoints:
- sm: 640px   (большие телефоны)
- md: 768px   (планшеты)
- lg: 1024px  (десктоп)
- xl: 1280px  (широкий десктоп)

/* Мобильный: bottom navigation bar */
/* Планшет: sidebar collapsed + bottom nav */
/* Десктоп: sidebar expanded */

/* Touch targets: минимум 44x44px */
/* Spacing scale: 4px base (4, 8, 12, 16, 20, 24, 32, 40, 48, 64) */
```

---

## 4. Информационная архитектура

### 4.1 Навигация

```
📱 Mobile (Bottom Nav):
┌─────────────────────────────────────┐
│  🏠 Home  │  ⚔️ Quests  │  📊 Stats  │  ⚙️ More  │
└─────────────────────────────────────┘

🖥️ Desktop (Sidebar):
┌──────────────┬──────────────────────┐
│  🏠 Dashboard │                     │
│  ⚔️ Квесты   │     Main Content     │
│  📊 Статистика│                     │
│  🏆 Достижения│                     │
│  🛒 Магазин   │                     │
│  ⚙️ Настройки │                     │
└──────────────┴──────────────────────┘
```

### 4.2 Экраны (Screens)

#### 4.2.1 Онбординг (3 экрана)

**Screen: Welcome**
```
- Тёмный фон с subtle particle effect
- Логотип + название «Система Пробуждения»
- Текст: «Ты получил Систему. Готов к пробуждению?»
- CTA: «Начать» → Регистрация
```

**Screen: Character Setup**
```
- Ввод имени (имя охотника)
- Выбор аватара (6-8 минималистичных стилизованных силуэтов)
- Выбор фокуса (мульти-выбор):
  □ Физическая форма
  □ Интеллект и навыки
  □ Коммуникация и влияние
  □ Дисциплина и привычки
  □ Карьера и финансы
```

**Screen: First Quests Setup**
```
- На основе выбранного фокуса предлагаются 5-7 стартовых квестов
- Пользователь выбирает 3-5 (не больше!)
- Система предупреждает: «Начни с малого. E-ранг охотник не берёт S-ранг данжи»
- CTA: «Начать путь»
```

#### 4.2.2 Dashboard (Главный экран)

**Структура сверху вниз:**

```
┌─────────────────────────────────────┐
│ [Аватар]  SERGEY              [⚙️]  │
│ Уровень 3 · E-ранг                 │
│ ████████░░░░░░ 145/300 XP           │
├─────────────────────────────────────┤
│                                     │
│  ┌─── Сегодня ───┐                 │
│  │ Пн, 2 марта   │                 │
│  │ 3/5 квестов ✓  │                 │
│  └────────────────┘                 │
│                                     │
│  📋 Ежедневные квесты              │
│  ┌─────────────────────────────────┐│
│  │ ☐ Тренировка 30 мин  +15 STR   ││
│  │ ☐ Чтение 30 мин      +10 INT   ││
│  │ ✅ Подъём до 7:00     +10 DIS   ││
│  │ ☐ Работа над контентом +20 CHA  ││
│  │ ✅ Без вредных привычек +5 DIS   ││
│  └─────────────────────────────────┘│
│                                     │
│  📊 Атрибуты (radar chart mini)    │
│  ┌─────────────────────────────────┐│
│  │        INT: 12                  ││
│  │    STR ◆───◆ CHA               ││
│  │        │                        ││
│  │   DIS ◆───◆ WLT                ││
│  └─────────────────────────────────┘│
│                                     │
│  🔥 Streak: 7 дней                 │
│  💰 Монеты: 340                    │
│                                     │
└─────────────────────────────────────┘
```

#### 4.2.3 Квесты (Quests)

**Три вкладки (tabs):**

```
[ Ежедневные ] [ Еженедельные ] [ Эпические ]
```

**Карточка квеста:**
```
┌─────────────────────────────────────┐
│ ☐ Тренировка 30+ минут             │
│                                     │
│ 🏋️ STR +15 XP  · ⚡ Средняя       │
│                                     │
│ Streak: 7 дней 🔥                  │
│ ░░░░░░░░░░░░░░░░ 0/30 мин          │
│                                     │
│        [ Выполнено ✓ ]              │
└─────────────────────────────────────┘
```

**Эпический квест (Boss Raid):**
```
┌─────────────────────────────────────┐
│ ⚔️ ДАНЖ: «YouTube 1K»             │
│ Набрать 1000 подписчиков            │
│                                     │
│ Прогресс: 247/1000 (24.7%)         │
│ █████░░░░░░░░░░░░░░░               │
│                                     │
│ Награда: +500 XP · 🏆 «Создатель» │
│ Дедлайн: ~90 дней                  │
│                                     │
│ Подквесты:                          │
│  ✅ Опубликовать 5 видео           │
│  ☐ Опубликовать 15 видео           │
│  ☐ Получить 100 подписчиков        │
│  ☐ Получить 500 подписчиков        │
└─────────────────────────────────────┘
```

#### 4.2.4 Статистика (Stats)

```
┌─────────────────────────────────────┐
│ 📊 Мой профиль                     │
│                                     │
│  [Radar Chart — полноразмерный]     │
│  5 атрибутов на паутинке            │
│                                     │
│  STR ████████░░ 24                  │
│  INT █████████░ 31                  │
│  CHA ██████░░░░ 18                  │
│  DIS ███████░░░ 22                  │
│  WLT █████░░░░░ 15                  │
│                                     │
│  📅 Heat Map (последние 90 дней)   │
│  [Календарная сетка как GitHub]     │
│                                     │
│  📈 Графики                        │
│  [XP gained over time — line chart] │
│  [Completion rate — bar chart]      │
│                                     │
│  🏆 Timeline достижений            │
│  День 1: Пробуждение               │
│  День 7: Первый streak 7 дней      │
│  День 14: Уровень 5                │
│  День 30: D-ранг!                  │
└─────────────────────────────────────┘
```

#### 4.2.5 Достижения (Achievements)

```
┌─────────────────────────────────────┐
│ 🏆 Достижения    12/48 открыто     │
│                                     │
│ Категории:                          │
│ [Все] [Привычки] [Ранги] [Особые]  │
│                                     │
│ ✅ Первый шаг — Заверши 1 квест    │
│ ✅ Неделя огня — 7 дней streak     │
│ ✅ D-ранг — Пройди ранговое        │
│    испытание E→D                    │
│ 🔒 Марафонец — 30 дней streak      │
│ 🔒 Мастер утра — 30 ранних подъёмов│
│ 🔒 ??? — Скрытое достижение        │
└─────────────────────────────────────┘
```

#### 4.2.6 Магазин наград (Reward Shop)

```
┌─────────────────────────────────────┐
│ 🛒 Магазин          💰 340 монет   │
│                                     │
│ Мои награды:                        │
│ ┌──────────┐ ┌──────────┐          │
│ │ 🍕 100   │ │ 🎮 200   │          │
│ │ Заказать │ │ Час      │          │
│ │ еду      │ │ игр      │          │
│ └──────────┘ └──────────┘          │
│ ┌──────────┐ ┌──────────┐          │
│ │ 😴 500   │ │ 🎁 1000  │          │
│ │ День     │ │ Крупная  │          │
│ │ отдыха   │ │ покупка  │          │
│ └──────────┘ └──────────┘          │
│                                     │
│       [ + Добавить награду ]        │
└─────────────────────────────────────┘
```

#### 4.2.7 Настройки (Settings)

```
- Профиль (имя, аватар)
- Квесты (добавить/удалить/изменить)
- Уведомления (время напоминаний)
- Тема (dark по умолчанию, light опционально)
- Данные (экспорт JSON, удаление аккаунта)
- О приложении
```

---

## 5. Игровые механики (Game Design)

### 5.1 Система атрибутов

```typescript
interface Attributes {
  strength: number;     // STR — Физическое здоровье
  intellect: number;    // INT — Знания и навыки
  charisma: number;     // CHA — Коммуникация и влияние
  discipline: number;   // DIS — Воля и самоконтроль
  wealth: number;       // WLT — Финансы и карьера
  hidden?: number;      // ??? — Открывается на уровне 10
}

// Начальные значения: все по 1
// Максимум: 100 (для каждого атрибута)
// 1 атрибут-поинт = ~10 XP в соответствующем атрибуте
```

### 5.2 Система уровней и XP

```typescript
// XP для следующего уровня рассчитывается по формуле:
// requiredXP = baseXP * (level ^ scalingFactor)
const XP_CONFIG = {
  baseXP: 100,           // XP для уровня 2
  scalingFactor: 1.3,    // Рост сложности
  maxLevel: 100,
};

// Пример прогрессии:
// Уровень 1 → 2:  100 XP
// Уровень 2 → 3:  160 XP
// Уровень 5 → 6:  371 XP
// Уровень 10 → 11: 1000 XP
// Уровень 20 → 21: 4000 XP
// Уровень 50 → 51: 35000 XP

// Общий уровень = суммарный XP по всем атрибутам
```

### 5.3 Ранговая система

```typescript
interface Rank {
  id: string;
  name: string;
  levelRange: [number, number];
  color: string;
  trialRequired: boolean;
  trialDescription?: string;
}

const RANKS: Rank[] = [
  {
    id: 'E',
    name: 'Пробуждённый',
    levelRange: [1, 5],
    color: '#6B7280',
    trialRequired: false,
  },
  {
    id: 'D',
    name: 'Охотник',
    levelRange: [6, 15],
    color: '#3B82F6',
    trialRequired: true,
    trialDescription: 'Продержать все базовые привычки 30 дней подряд',
  },
  {
    id: 'C',
    name: 'Ветеран',
    levelRange: [16, 30],
    color: '#8B5CF6',
    trialRequired: true,
    trialDescription: 'Заработать первые деньги с нового навыка ИЛИ пробежать 10 км',
  },
  {
    id: 'B',
    name: 'Элита',
    levelRange: [31, 50],
    color: '#F59E0B',
    trialRequired: true,
    trialDescription: 'Стабильный доход 3 месяца подряд ИЛИ завершить трансформацию тела',
  },
  {
    id: 'A',
    name: 'Мастер',
    levelRange: [51, 75],
    color: '#EF4444',
    trialRequired: true,
    trialDescription: 'Менторить других ИЛИ создать продукт с 1000+ пользователями',
  },
  {
    id: 'S',
    name: 'Монарх',
    levelRange: [76, 100],
    color: '#FBBF24',
    trialRequired: true,
    trialDescription: 'Определяешь сам. S-ранг знает свой путь.',
  },
];
```

### 5.4 Система квестов

```typescript
type QuestType = 'daily' | 'weekly' | 'epic';
type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

interface Quest {
  id: string;
  title: string;
  description?: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  attribute: keyof Attributes;     // Какой атрибут прокачивает
  xpReward: number;
  coinReward: number;
  isCompleted: boolean;
  streak?: number;                  // Для daily квестов
  
  // Для epic квестов
  subquests?: Subquest[];
  progress?: number;                // 0-100%
  deadline?: Date;
  titleReward?: string;             // Титул за выполнение
}

// XP по сложности:
// easy: 5-10 XP
// medium: 10-20 XP
// hard: 20-50 XP
// legendary: 50-150 XP

// Монеты = XP * 0.5 (округление вверх)
```

### 5.5 Анти-грайнд механики

```typescript
interface AntiGrindSystem {
  
  // 1. Rest Day Protocol
  restDaysPerWeek: 1;               // 1 день без штрафа
  restDayMessage: string;           // Мотивационное сообщение
  
  // 2. Recovery Mechanic
  recoveryThreshold: 2;             // Через 2 пропущенных дня
  recoveryMission: {
    tasksToComplete: 3;             // Из 5 квестов
    timeLimit: '24h';               // В течение суток
  };
  
  // 3. Debuff System (вместо жёстких наказаний)
  debuffs: {
    laziness: {
      trigger: '3 consecutive missed days';
      effect: 'XP gain -25% for 7 days';
      removal: 'Complete all daily quests for 3 consecutive days';
    };
    burnout: {
      trigger: '100% completion for 14+ days without rest';
      effect: 'System suggests rest day';
      removal: 'Take a rest day';
    };
  };
  
  // 4. Adaptive Difficulty
  consistentCompletion: {
    threshold: '90% for 14 days';
    suggestion: 'Increase difficulty or add quest';
  };
  consistentFailure: {
    threshold: '< 50% for 7 days';
    suggestion: 'Reduce quests or lower difficulty (no shame)';
  };
}
```

### 5.6 Система наград

```typescript
interface Reward {
  id: string;
  title: string;
  description?: string;
  cost: number;                     // В монетах
  emoji: string;
  isCustom: boolean;                // Пользовательская награда
  cooldown?: string;                // '24h', '7d' — как часто можно использовать
}

// Предустановленные награды (пользователь может редактировать):
const DEFAULT_REWARDS = [
  { title: 'Заказать еду', cost: 100, emoji: '🍕' },
  { title: 'Час развлечений', cost: 200, emoji: '🎮' },
  { title: 'Покупка для хобби', cost: 300, emoji: '🎁' },
  { title: 'День полного отдыха', cost: 500, emoji: '😴' },
  { title: 'Крупная покупка', cost: 1000, emoji: '🛍️' },
];
```

---

## 6. Структура базы данных

### 6.1 Схема (PostgreSQL / Supabase)

```sql
-- Пользователи (расширение Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hunter_name TEXT NOT NULL,
  avatar_id TEXT DEFAULT 'default',
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'E',
  coins INTEGER DEFAULT 0,
  
  -- Атрибуты
  str_xp INTEGER DEFAULT 0,
  int_xp INTEGER DEFAULT 0,
  cha_xp INTEGER DEFAULT 0,
  dis_xp INTEGER DEFAULT 0,
  wlt_xp INTEGER DEFAULT 0,
  hidden_xp INTEGER DEFAULT 0,
  
  -- Стрики и статистика
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_quests_completed INTEGER DEFAULT 0,
  rest_days_used_this_week INTEGER DEFAULT 0,
  
  -- Debuffs
  active_debuffs JSONB DEFAULT '[]',
  
  -- Настройки
  settings JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Квесты (шаблоны)
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'epic')),
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
  attribute TEXT NOT NULL CHECK (attribute IN ('str', 'int', 'cha', 'dis', 'wlt', 'hidden')),
  xp_reward INTEGER NOT NULL,
  coin_reward INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  
  -- Для epic квестов
  target_value FLOAT,           -- Цель (1000 подписчиков)
  current_value FLOAT DEFAULT 0,
  deadline TIMESTAMPTZ,
  title_reward TEXT,             -- Титул за выполнение
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Субквесты (для epic квестов)
CREATE TABLE subquests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0
);

-- Логи выполнения квестов
CREATE TABLE quest_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id) ON DELETE SET NULL,
  quest_title TEXT NOT NULL,        -- Денормализация на случай удаления квеста
  quest_type TEXT NOT NULL,
  attribute TEXT NOT NULL,
  xp_earned INTEGER NOT NULL,
  coins_earned INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE    -- Для группировки по дням
);

-- Дневной прогресс (агрегация)
CREATE TABLE daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quests_total INTEGER DEFAULT 0,
  quests_completed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  is_rest_day BOOLEAN DEFAULT FALSE,
  completion_rate FLOAT DEFAULT 0,
  
  UNIQUE(user_id, date)
);

-- Достижения
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,              -- 'first_step', 'week_streak', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,           -- 'habits', 'ranks', 'special', 'hidden'
  icon TEXT NOT NULL,               -- emoji
  condition JSONB NOT NULL          -- Условие в JSON
);

-- Разблокированные достижения
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- Награды (магазин)
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cost INTEGER NOT NULL,
  emoji TEXT DEFAULT '🎁',
  cooldown_hours INTEGER,           -- NULL = без ограничений
  last_redeemed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- Лог покупки наград
CREATE TABLE reward_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
  reward_title TEXT NOT NULL,
  cost INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Титулы
CREATE TABLE user_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT NOT NULL,             -- 'rank', 'epic_quest', 'achievement'
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свои данные
CREATE POLICY "Users can view own data" ON profiles
  FOR ALL USING (auth.uid() = id);
  
CREATE POLICY "Users can manage own quests" ON quests
  FOR ALL USING (auth.uid() = user_id);

-- (аналогичные policies для всех таблиц)
```

### 6.2 Индексы

```sql
CREATE INDEX idx_quest_logs_user_date ON quest_logs(user_id, date);
CREATE INDEX idx_quest_logs_date ON quest_logs(date);
CREATE INDEX idx_daily_progress_user_date ON daily_progress(user_id, date);
CREATE INDEX idx_quests_user_type ON quests(user_id, type);
CREATE INDEX idx_quests_user_active ON quests(user_id, is_active);
```

---

## 7. Структура проекта

```
awakening-system/
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker
│   ├── icons/                      # App icons (192, 512)
│   └── sounds/                     # Quest complete, level up sounds
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Auth routes group
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/                  # Authenticated routes group
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── quests/page.tsx
│   │   │   ├── stats/page.tsx
│   │   │   ├── achievements/page.tsx
│   │   │   ├── shop/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx          # App shell with nav
│   │   ├── onboarding/
│   │   │   ├── page.tsx            # Multi-step onboarding
│   │   │   └── layout.tsx
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing/redirect
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── bottom-nav.tsx
│   │   │   ├── header.tsx
│   │   │   └── app-shell.tsx
│   │   ├── dashboard/
│   │   │   ├── profile-card.tsx
│   │   │   ├── daily-quests.tsx
│   │   │   ├── mini-radar.tsx
│   │   │   ├── streak-badge.tsx
│   │   │   └── xp-bar.tsx
│   │   ├── quests/
│   │   │   ├── quest-card.tsx
│   │   │   ├── quest-list.tsx
│   │   │   ├── epic-quest-card.tsx
│   │   │   ├── quest-form.tsx
│   │   │   └── complete-animation.tsx
│   │   ├── stats/
│   │   │   ├── radar-chart.tsx
│   │   │   ├── heat-map.tsx
│   │   │   ├── xp-line-chart.tsx
│   │   │   ├── attribute-bars.tsx
│   │   │   └── timeline.tsx
│   │   ├── achievements/
│   │   │   ├── achievement-card.tsx
│   │   │   └── achievement-grid.tsx
│   │   ├── shop/
│   │   │   ├── reward-card.tsx
│   │   │   └── reward-form.tsx
│   │   ├── effects/
│   │   │   ├── xp-popup.tsx        # +15 XP floating text
│   │   │   ├── level-up-overlay.tsx
│   │   │   ├── rank-up-overlay.tsx
│   │   │   ├── confetti.tsx
│   │   │   └── particles.tsx
│   │   └── shared/
│   │       ├── loading-skeleton.tsx
│   │       ├── empty-state.tsx
│   │       ├── error-boundary.tsx
│   │       └── rank-badge.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   ├── middleware.ts       # Auth middleware
│   │   │   └── types.ts           # Generated DB types
│   │   ├── game/
│   │   │   ├── xp-calculator.ts    # XP formulas
│   │   │   ├── level-system.ts     # Level progression
│   │   │   ├── rank-system.ts      # Rank logic
│   │   │   ├── achievement-checker.ts
│   │   │   ├── debuff-manager.ts
│   │   │   ├── streak-tracker.ts
│   │   │   └── constants.ts        # Game balance constants
│   │   ├── utils.ts                # General utilities
│   │   └── cn.ts                   # className helper
│   │
│   ├── hooks/
│   │   ├── use-profile.ts
│   │   ├── use-quests.ts
│   │   ├── use-quest-complete.ts   # Mutation hook
│   │   ├── use-achievements.ts
│   │   ├── use-rewards.ts
│   │   ├── use-daily-progress.ts
│   │   └── use-media-query.ts
│   │
│   ├── stores/
│   │   ├── app-store.ts            # Zustand global state
│   │   └── notification-store.ts   # Toast/notification state
│   │
│   ├── types/
│   │   ├── database.ts             # Supabase generated types
│   │   ├── game.ts                 # Game mechanic types
│   │   └── ui.ts                   # UI-specific types
│   │
│   └── styles/
│       └── fonts.ts                # Font configuration
│
├── supabase/
│   ├── migrations/                 # Database migrations
│   │   └── 001_initial_schema.sql
│   ├── functions/                  # Edge Functions
│   │   ├── daily-reset/index.ts    # Cron: reset daily quests
│   │   ├── check-achievements/index.ts
│   │   └── weekly-summary/index.ts
│   └── seed.sql                    # Default achievements, starter data
│
├── .env.local                      # Supabase keys (local dev)
├── .env.example
├── next.config.js                  # Next.js + PWA config
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 8. API / Server Actions

### 8.1 Server Actions (Next.js)

```typescript
// src/app/(app)/actions.ts

'use server'

// Выполнить квест
export async function completeQuest(questId: string): Promise<{
  xpEarned: number;
  coinsEarned: number;
  leveledUp: boolean;
  newLevel?: number;
  rankedUp: boolean;
  newRank?: string;
  achievementsUnlocked: string[];
  debuffRemoved?: string;
}>

// Создать новый квест
export async function createQuest(data: QuestFormData): Promise<Quest>

// Обновить квест
export async function updateQuest(questId: string, data: Partial<QuestFormData>): Promise<Quest>

// Удалить квест
export async function deleteQuest(questId: string): Promise<void>

// Использовать награду
export async function redeemReward(rewardId: string): Promise<{
  success: boolean;
  remainingCoins: number;
}>

// Объявить день отдыха
export async function declareRestDay(): Promise<void>

// Обновить прогресс epic квеста
export async function updateEpicProgress(questId: string, value: number): Promise<void>

// Подтвердить ранговое испытание
export async function confirmRankTrial(): Promise<{
  newRank: string;
  achievementsUnlocked: string[];
}>
```

### 8.2 Edge Functions (Supabase)

```typescript
// supabase/functions/daily-reset/index.ts
// Cron: каждый день в 00:00 UTC
// - Сбрасывает выполнение daily квестов
// - Обновляет стрики
// - Проверяет дебаффы
// - Записывает daily_progress

// supabase/functions/check-achievements/index.ts
// Trigger: вызывается после completeQuest
// - Проверяет все условия достижений
// - Разблокирует новые

// supabase/functions/weekly-summary/index.ts
// Cron: каждое воскресенье
// - Считает статистику недели
// - Сбрасывает weekly квесты
// - Сбрасывает rest_days_used_this_week
```

---

## 9. Фазы разработки

### Phase 1: MVP (2-3 недели)

**Цель: рабочий прототип для одного пользователя**

- [ ] Настройка проекта (Next.js + Supabase + Tailwind)
- [ ] Аутентификация (email/password)
- [ ] Онбординг (3 экрана)
- [ ] Dashboard с профилем и XP баром
- [ ] Daily квесты (создание, выполнение, список)
- [ ] Базовая система XP и уровней
- [ ] Ранговая система (без испытаний)
- [ ] Radar chart (статичный)
- [ ] Базовый мобильный layout
- [ ] PWA manifest + иконки

### Phase 2: Core Game Loop (1-2 недели)

**Цель: полноценный игровой цикл**

- [ ] Weekly квесты
- [ ] Epic квесты с субквестами
- [ ] Streak система с REST days
- [ ] Debuff система
- [ ] Recovery mechanic
- [ ] Система монет и магазин наград
- [ ] Анимации: XP popup, quest complete
- [ ] Heat map (calendar)
- [ ] Sound effects (опционально)

### Phase 3: Polish & Engagement (1-2 недели)

**Цель: retention и удовольствие**

- [ ] Достижения (20+ штук)
- [ ] Level-up и Rank-up анимации
- [ ] Ранговые испытания
- [ ] Timeline достижений
- [ ] Скрытый атрибут
- [ ] Push-уведомления (утренние/вечерние)
- [ ] Offline support (service worker)
- [ ] Адаптивная сложность
- [ ] XP графики во времени
- [ ] Экспорт данных

### Phase 4: Scale (будущее)

- [ ] Google OAuth
- [ ] Локализация EN
- [ ] Социальные функции (гильдии, совместные квесты)
- [ ] AI-генерация квестов
- [ ] Интеграция с фитнес-трекерами
- [ ] Платная подписка
- [ ] Landing page

---

## 10. Метрики успеха

### 10.1 Для себя (первый пользователь)

- Использую приложение ежедневно 30+ дней подряд
- Не чувствую приложение как «ещё один чеклист»
- Реальный прогресс в привычках подтверждается результатами

### 10.2 Для продукта (когда публичный)

- **D1 Retention:** > 60%
- **D7 Retention:** > 35%
- **D30 Retention:** > 20% (средний показатель для habit trackers ~12%)
- **DAU/MAU:** > 40%
- **Avg. session time:** > 3 min
- **Quest completion rate:** 60-80% (не 100% — это значит система слишком лёгкая)

---

## 11. Открытые вопросы

1. **Скрытый атрибут:** Какой именно? Варианты: Духовность, Творчество, Наставничество, Социальные связи. Решение: позволить пользователю назвать самому при разблокировке.

2. **Звуки:** Добавлять ли звуковые эффекты? Плюс: усиливают feedback. Минус: могут раздражать. Решение: опционально, выключены по умолчанию.

3. **Мультиязычность:** Когда добавлять английский? Решение: после MVP, когда структура текстов стабилизируется.

4. **Социальные функции:** Нужны ли гильдии/лидерборды? Наука говорит: социальное сравнение может демотивировать. Решение: начать без них, добавить опциональные «группы поддержки» позже.

5. **Монетизация:** Когда вводить? Решение: после 100+ пользователей и подтверждённого retention.

---

## Приложение A: Научные обоснования дизайн-решений

| Решение | Обоснование |
|---|---|
| Max 5-7 daily quests | Cognitive overload снижает completion rate. Исследования: оптимум 3-7 привычек одновременно |
| Rest days без штрафа | Self-Determination Theory: принуждение убивает intrinsic motivation |
| Debuffs вместо наказаний | Потеря прогресса — главная причина abandonment в gamified apps |
| Recovery mechanic | Исследования: пользователи с механизмом восстановления в 3x чаще сохраняют привычки |
| Скрытый контент | Curiosity gap (Loewenstein, 1994) — один из сильнейших мотиваторов |
| Ранговые испытания | Competence need (SDT) — реальные достижения ценнее набитых очков |
| Самоназначенные награды | Autonomy need (SDT) — контроль над наградами повышает intrinsic motivation |
| Adaptive difficulty | Flow theory (Csikszentmihalyi) — оптимальный вызов = максимальная вовлечённость |
| Нет публичных лидербордов | Социальное сравнение часто демотивирует, особенно новичков |

---

## Приложение B: Дизайн-референсы

### Стиль интерфейса

Комбинация трёх трендов 2025-2026:

1. **Barely-There UI** — минимальный интерфейс, где данные говорят сами за себя. Один-два шрифта, 2-3 основных цвета, структурный whitespace
2. **Responsible Glassmorphism** — стеклянные карточки с мягким blur на тёмном фоне. Глубина без визуального шума. Используем точечно — для основных карточек, не для всего
3. **Functional Motion** — анимации осмысленные: XP бар плавно заполняется, числа анимированно считают, карточки появляются с мягким stagger

### Вдохновение (не копировать, а взять дух)

- **Vercel Dashboard** — минимализм, скорость, тёмная тема
- **Linear App** — плавность переходов, attention to detail
- **Arc Browser** — нестандартные UI решения, feels alive
- **Apple Fitness** — визуализация прогресса кольцами, celebration moments
- **Solo Leveling Manhwa** — эстетика «системных окон»: полупрозрачные панели на тёмном фоне с glow-акцентами
