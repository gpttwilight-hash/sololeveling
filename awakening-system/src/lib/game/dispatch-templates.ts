export type RankTier = "E" | "D" | "C" | "B" | "A" | "S";
export type StreakBand = "zero" | "early" | "growing" | "strong" | "veteran" | "legend";
export type AttributeKey = "str" | "int" | "cha" | "dis" | "wlt";

export interface DispatchTemplate {
  id: string;
  rankTier: RankTier | "any";
  streakBand: StreakBand | "any";
  narrativeText: string;
  bonusQuestTitle: string;
  bonusQuestAttribute: AttributeKey | "focus";
}

export const ATTRIBUTE_CYCLE: AttributeKey[] = ["str", "int", "cha", "dis", "wlt"];

export function getAttributeOfDay(date: Date): AttributeKey {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return ATTRIBUTE_CYCLE[dayOfYear % 5];
}

export const ATTR_NAMES: Record<AttributeKey, string> = {
  str: "Силы",
  int: "Интеллекта",
  cha: "Харизмы",
  dis: "Дисциплины",
  wlt: "Богатства",
};

export const DISPATCH_TEMPLATES: DispatchTemplate[] = [
  // streak=0
  { id: "d-zero-1", rankTier: "any", streakBand: "zero", narrativeText: "Система фиксирует паузу. Это не конец — каждый великий охотник падал. Разница в том, кто встаёт.", bonusQuestTitle: "Сделай одно простое дело прямо сейчас", bonusQuestAttribute: "dis" },
  { id: "d-zero-2", rankTier: "any", streakBand: "zero", narrativeText: "Система не наказывает за паузу. Но Система ждёт твоего возвращения. Сегодня — первый шаг.", bonusQuestTitle: "Напиши одну цель на этот день", bonusQuestAttribute: "int" },
  { id: "d-zero-3", rankTier: "any", streakBand: "zero", narrativeText: "Охотник без движения — это охотник, которого обгоняют другие. Система открывает новый цикл.", bonusQuestTitle: "Выйди на улицу на 10 минут", bonusQuestAttribute: "str" },

  // streak=1-2
  { id: "d-early-1", rankTier: "any", streakBand: "early", narrativeText: "Система фиксирует активность. Первые дни — фундамент. Не останавливайся.", bonusQuestTitle: "Выполни одну задачу, которую откладывал", bonusQuestAttribute: "focus" },
  { id: "d-early-2", rankTier: "any", streakBand: "early", narrativeText: "Охотник начал движение. Система наблюдает. День второй — ключевой для формирования привычки.", bonusQuestTitle: "Установи время для главной привычки дня", bonusQuestAttribute: "dis" },
  { id: "d-early-3", rankTier: "E", streakBand: "early", narrativeText: "Ранг E — начало пути. Система регистрирует потенциал. Докажи, что ты не остановишься на первых днях.", bonusQuestTitle: "Сделай 20 отжиманий или их замену", bonusQuestAttribute: "str" },
  { id: "d-early-4", rankTier: "D", streakBand: "early", narrativeText: "Охотник ранга D знает цену последовательности. Продолжай — путь к рангу C требует стабильности.", bonusQuestTitle: "Потрать 15 минут на обучение новому навыку", bonusQuestAttribute: "int" },
  { id: "d-early-5", rankTier: "any", streakBand: "early", narrativeText: "Два дня подряд. Система видит паттерн. Третий день — точка невозврата к хорошей привычке.", bonusQuestTitle: "Медитируй или практикуй дыхательные упражнения 5 минут", bonusQuestAttribute: "dis" },

  // streak=3-6
  { id: "d-growing-1", rankTier: "any", streakBand: "growing", narrativeText: "Система фиксирует формирование паттерна. Три дня — порог осознания. Семь дней — привычка.", bonusQuestTitle: "Сделай что-то, что развивает атрибут дня", bonusQuestAttribute: "focus" },
  { id: "d-growing-2", rankTier: "any", streakBand: "growing", narrativeText: "Охотник набирает темп. Система анализирует траекторию роста. Результаты формируются сейчас.", bonusQuestTitle: "Запиши прогресс за последние 3 дня", bonusQuestAttribute: "int" },
  { id: "d-growing-3", rankTier: "E", streakBand: "growing", narrativeText: "Ранг E с устойчивым стриком — редкость. Система отмечает твою настойчивость.", bonusQuestTitle: "Медитируй или практикуй осознанность 10 минут", bonusQuestAttribute: "dis" },
  { id: "d-growing-4", rankTier: "D", streakBand: "growing", narrativeText: "Пять дней подряд — это уже характер, а не случайность. Ранг C становится ближе.", bonusQuestTitle: "Пообщайся с кем-то, кто вдохновляет тебя", bonusQuestAttribute: "cha" },
  { id: "d-growing-5", rankTier: "C", streakBand: "growing", narrativeText: "Ветеран не теряет темп. Система ожидает стабильного роста всех пяти атрибутов.", bonusQuestTitle: "Уделите 20 минут самому слабому атрибуту", bonusQuestAttribute: "focus" },
  { id: "d-growing-7", rankTier: "B", streakBand: "growing", narrativeText: "Элита с растущим стриком — это сила. Система повышает ожидания соответственно.", bonusQuestTitle: "Работай над долгосрочным проектом 20 минут", bonusQuestAttribute: "wlt" },

  // streak=7-13
  { id: "d-strong-1", rankTier: "any", streakBand: "strong", narrativeText: "Семь дней непрерывного роста. Система активирует расширенный мониторинг. Ты становишься заметным.", bonusQuestTitle: "Сделай что-то за пределами зоны комфорта", bonusQuestAttribute: "cha" },
  { id: "d-strong-2", rankTier: "any", streakBand: "strong", narrativeText: "Неделя позади. Большинство сдаются раньше. Ты — в меньшинстве, которое меняет жизнь.", bonusQuestTitle: "Установи амбициозную цель на следующую неделю", bonusQuestAttribute: "int" },
  { id: "d-strong-3", rankTier: "D", streakBand: "strong", narrativeText: "Охотник ранга D с недельным стриком показывает признаки ранга C. Система оценивает готовность.", bonusQuestTitle: "Прочитай 10 страниц книги по своей цели", bonusQuestAttribute: "int" },
  { id: "d-strong-4", rankTier: "C", streakBand: "strong", narrativeText: "Ветеран держит темп. Система повышает сложность испытаний — это знак уважения.", bonusQuestTitle: "Выполни тренировку на 30+ минут", bonusQuestAttribute: "str" },
  { id: "d-strong-5", rankTier: "B", streakBand: "strong", narrativeText: "Элита не знает случайных дней. Каждое действие — инвестиция. Система это видит.", bonusQuestTitle: "Проведи 30 минут в работе над долгосрочным проектом", bonusQuestAttribute: "wlt" },
  { id: "d-strong-6", rankTier: "A", streakBand: "strong", narrativeText: "Мастер на пике формы. Система фиксирует: 10 дней без остановки — это уже образ жизни.", bonusQuestTitle: "Наставь или помоги кому-то сегодня", bonusQuestAttribute: "cha" },
  { id: "d-strong-7", rankTier: "E", streakBand: "strong", narrativeText: "Пробуждённый с сильным стриком — редкость. Система подтверждает: ты готов к следующему рангу.", bonusQuestTitle: "Запиши свои достижения за эту неделю", bonusQuestAttribute: "int" },

  // streak=14-29
  { id: "d-veteran-1", rankTier: "any", streakBand: "veteran", narrativeText: "Две недели. Система фиксирует: это уже не эксперимент — это образ жизни.", bonusQuestTitle: "Помоги кому-то или поделись знанием", bonusQuestAttribute: "cha" },
  { id: "d-veteran-2", rankTier: "any", streakBand: "veteran", narrativeText: "Охотник с 14+ днями стрика входит в категорию Стойких. Система присваивает особый статус.", bonusQuestTitle: "Инвестируй время или деньги в своё развитие", bonusQuestAttribute: "wlt" },
  { id: "d-veteran-3", rankTier: "B", streakBand: "veteran", narrativeText: "Элита с ветеранским стриком — это Мастер в становлении. Дистанция до ранга A сокращается.", bonusQuestTitle: "Наставь кого-то в своей области", bonusQuestAttribute: "cha" },
  { id: "d-veteran-4", rankTier: "A", streakBand: "veteran", narrativeText: "Мастер не останавливается. Система наблюдает за охотником, который превзошёл 99% начавших.", bonusQuestTitle: "Работай над главным проектом 45 минут без отвлечений", bonusQuestAttribute: "dis" },
  { id: "d-veteran-5", rankTier: "C", streakBand: "veteran", narrativeText: "Три недели непрерывной работы. Ветеран доказывает: стабильность важнее интенсивности.", bonusQuestTitle: "Проанализируй свой прогресс и скорректируй план", bonusQuestAttribute: "int" },
  { id: "d-veteran-6", rankTier: "D", streakBand: "veteran", narrativeText: "Охотник ранга D, продержавшийся 20 дней — это уже Ветеран в душе. Ранг C ждёт тебя.", bonusQuestTitle: "Сделай что-то, что раньше казалось слишком сложным", bonusQuestAttribute: "focus" },
  { id: "d-veteran-7", rankTier: "S", streakBand: "veteran", narrativeText: "Монарх с ветеранским стриком. Система напоминает: величие измеряется ежедневными действиями.", bonusQuestTitle: "Определи следующий рубеж своего пути", bonusQuestAttribute: "focus" },

  // streak=30+
  { id: "d-legend-1", rankTier: "any", streakBand: "legend", narrativeText: "Тридцать дней. Система фиксирует трансформацию. Ты больше не тот, кто начинал этот путь.", bonusQuestTitle: "Запиши три способа, которыми ты изменился за месяц", bonusQuestAttribute: "int" },
  { id: "d-legend-2", rankTier: "any", streakBand: "legend", narrativeText: "Легенда не нуждается в мотивации — у неё есть система. Ты стал системой.", bonusQuestTitle: "Сделай что-то, что удивит тебя самого", bonusQuestAttribute: "focus" },
  { id: "d-legend-3", rankTier: "S", streakBand: "legend", narrativeText: "Монарх с легендарным стриком. Система больше не ставит тебе задачи — ты ставишь их сам.", bonusQuestTitle: "Определи свою миссию на следующий месяц", bonusQuestAttribute: "wlt" },
  { id: "d-legend-4", rankTier: "A", streakBand: "legend", narrativeText: "Мастер-легенда. Порог ранга S виден отчётливо. Система ждёт финального шага.", bonusQuestTitle: "Создай что-то, что переживёт этот день", bonusQuestAttribute: "int" },
  { id: "d-legend-5", rankTier: "B", streakBand: "legend", narrativeText: "Элита с легендарным стриком показывает: дисциплина — это не черта характера, а навык.", bonusQuestTitle: "Поделись своим методом с кем-то, кто только начинает", bonusQuestAttribute: "cha" },
  { id: "d-legend-6", rankTier: "C", streakBand: "legend", narrativeText: "Ветеран-легенда. Система признаёт: ты преодолел барьер, о котором большинство только мечтает.", bonusQuestTitle: "Поставь цель на следующие 30 дней", bonusQuestAttribute: "int" },
  { id: "d-legend-7", rankTier: "E", streakBand: "legend", narrativeText: "Ранг E — но стрик легенды. Система знает: ранг — это временное. Характер — постоянное.", bonusQuestTitle: "Запиши что изменилось в тебе за этот месяц", bonusQuestAttribute: "int" },

  // День недели
  { id: "d-monday-1", rankTier: "any", streakBand: "any", narrativeText: "Новая неделя. Система обнуляет возможности. Как ты используешь эти семь дней?", bonusQuestTitle: "Запланируй три главных цели на эту неделю", bonusQuestAttribute: "int" },
  { id: "d-monday-2", rankTier: "any", streakBand: "any", narrativeText: "Понедельник — день, когда разрыв между теми, кто планирует и теми, кто действует, становится виден.", bonusQuestTitle: "Начни неделю с физической активности", bonusQuestAttribute: "str" },

  { id: "d-friday-1", rankTier: "any", streakBand: "any", narrativeText: "Пятница. Финальный рывок рабочей недели. Система оценивает твою последовательность.", bonusQuestTitle: "Закрой одно незавершённое дело этой недели", bonusQuestAttribute: "dis" },
  { id: "d-friday-2", rankTier: "any", streakBand: "any", narrativeText: "Неделя подходит к концу. Что ты сделал? Что осталось? Система ждёт честного ответа.", bonusQuestTitle: "Проведи 15-минутный обзор недели", bonusQuestAttribute: "int" },

  { id: "d-sunday-1", rankTier: "any", streakBand: "any", narrativeText: "Воскресенье — день, когда легенды планируют следующую неделю, пока другие отдыхают.", bonusQuestTitle: "Подготовь план и расставь приоритеты на завтра", bonusQuestAttribute: "int" },

  // Атрибутные
  { id: "d-str-1", rankTier: "any", streakBand: "any", narrativeText: "Сегодня Система фокусируется на Силе. Физическое тело — фундамент всех остальных атрибутов.", bonusQuestTitle: "Тренировка минимум 20 минут — любой формат", bonusQuestAttribute: "str" },
  { id: "d-str-2", rankTier: "any", streakBand: "any", narrativeText: "День Силы. Система активирует усиленный режим для STR-квестов.", bonusQuestTitle: "Пройди пешком более 5000 шагов", bonusQuestAttribute: "str" },

  { id: "d-int-1", rankTier: "any", streakBand: "any", narrativeText: "День Интеллекта. Система усиливает INT-квесты. Разум — инструмент охотника.", bonusQuestTitle: "Изучи что-то новое и запиши ключевые выводы", bonusQuestAttribute: "int" },
  { id: "d-int-2", rankTier: "any", streakBand: "any", narrativeText: "Сегодня Система фокусируется на Интеллекте. Каждый прочитанный абзац — XP для разума.", bonusQuestTitle: "Читай книгу или статью по профессиональной теме 20 минут", bonusQuestAttribute: "int" },

  { id: "d-cha-1", rankTier: "any", streakBand: "any", narrativeText: "День Харизмы. Система оценивает не только то, что ты делаешь — но и как ты взаимодействуешь.", bonusQuestTitle: "Инициируй позитивное общение с кем-то важным для тебя", bonusQuestAttribute: "cha" },
  { id: "d-cha-2", rankTier: "any", streakBand: "any", narrativeText: "Харизма — это навык, а не дар. Сегодня Система усиливает CHA-квесты.", bonusQuestTitle: "Скажи комплимент или слова благодарности трём людям", bonusQuestAttribute: "cha" },

  { id: "d-dis-1", rankTier: "any", streakBand: "any", narrativeText: "День Дисциплины. Система знает: это самый сложный атрибут. И самый ценный.", bonusQuestTitle: "Работай в фокусе без телефона 25 минут (техника Помодоро)", bonusQuestAttribute: "dis" },
  { id: "d-dis-2", rankTier: "any", streakBand: "any", narrativeText: "Дисциплина отличает охотника от мечтателя. Сегодня — день доказать это.", bonusQuestTitle: "Выполни самое нежелательное задание первым", bonusQuestAttribute: "dis" },
  { id: "d-dis-3", rankTier: "any", streakBand: "any", narrativeText: "Система тестирует волю. Откажись от одного отвлечения сегодня.", bonusQuestTitle: "Проведи 2 часа без социальных сетей", bonusQuestAttribute: "dis" },

  { id: "d-wlt-1", rankTier: "any", streakBand: "any", narrativeText: "День Богатства. Система отслеживает не только деньги — но и инвестиции в будущее.", bonusQuestTitle: "Изучи одну финансовую или карьерную возможность", bonusQuestAttribute: "wlt" },
  { id: "d-wlt-2", rankTier: "any", streakBand: "any", narrativeText: "Богатство строится ежедневными решениями. Сегодня Система усиливает WLT-квесты.", bonusQuestTitle: "Запланируй или проверь свой бюджет/доходы за неделю", bonusQuestAttribute: "wlt" },
  { id: "d-wlt-3", rankTier: "any", streakBand: "any", narrativeText: "Каждый навык — это актив. Сегодня инвестируй в себя.", bonusQuestTitle: "Потрать 30 минут на развитие навыка, который повысит твой доход", bonusQuestAttribute: "wlt" },

  // Высокие ранги
  { id: "d-s-rank-1", rankTier: "S", streakBand: "any", narrativeText: "Монарх. Система не даёт тебе задачи — ты сам знаешь, что нужно делать. Делай.", bonusQuestTitle: "Работай над тем, что имеет наибольшее значение для тебя", bonusQuestAttribute: "focus" },
  { id: "d-a-rank-1", rankTier: "A", streakBand: "any", narrativeText: "Мастер на пороге монаршества. Система фиксирует: ты почти там. Не замедляйся.", bonusQuestTitle: "Продвинься на один шаг к своей главной цели этого года", bonusQuestAttribute: "focus" },
  { id: "d-b-rank-1", rankTier: "B", streakBand: "any", narrativeText: "Элита понимает: успех — не событие, а серия ежедневных решений. Сегодняшнее решение — ключевое.", bonusQuestTitle: "Сделай одно действие, которое продвинет тебя к рангу A", bonusQuestAttribute: "focus" },

  // Универсальные
  { id: "d-generic-1", rankTier: "any", streakBand: "any", narrativeText: "Система активна. Охотник активен. Это всё, что нужно для начала.", bonusQuestTitle: "Выполни одну задачу, которая важна именно сегодня", bonusQuestAttribute: "focus" },
  { id: "d-generic-2", rankTier: "any", streakBand: "any", narrativeText: "Каждый день — это новая страница. Система ждёт, что ты напишешь на ней.", bonusQuestTitle: "Запиши одну вещь, за которую благодарен сегодня", bonusQuestAttribute: "int" },
  { id: "d-generic-3", rankTier: "any", streakBand: "any", narrativeText: "Охотник, который действует сегодня — завтра будет впереди тех, кто только думает.", bonusQuestTitle: "Помоги кому-то — даже маленьким действием", bonusQuestAttribute: "cha" },
  { id: "d-generic-4", rankTier: "any", streakBand: "any", narrativeText: "Система наблюдает за паттернами. Твои паттерны говорят о тебе больше, чем слова.", bonusQuestTitle: "Пройди свои квесты дня без отвлечений на телефон", bonusQuestAttribute: "dis" },
  { id: "d-generic-5", rankTier: "any", streakBand: "any", narrativeText: "Малые шаги, сделанные ежедневно, создают то, что кажется невозможным в начале пути.", bonusQuestTitle: "Сделай физическое упражнение — любое, прямо сейчас", bonusQuestAttribute: "str" },
];
