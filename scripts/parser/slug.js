const fs = require("fs");
const path = require("path");

const SLUG_MAP = {
  "Арена и Освоение": "arena-i-osvoenie",
  "Бонусы(Баффы)": "bonusy-baffy",
  "Военное Бюро": "voennoe-byuro",
  "Информация по событиях": "sobytiya",
  "Комплекс": "kompleks",
  "Лабиринт": "labirint",
  "Ловушка на Медведя": "lovushka-na-medvedya",
  "Все герои": "vse-geroi",
  "Научный центр": "nauchnyj-tsentr",
  "Облики": "obliki",
  "Переход в другое государство": "perekhod-v-drugoe-gosudarstvo",
  "Питомцы": "pitomtsy",
  "Путь в тундру": "put-v-tundru",
  "Рейды": "rejdy",
  "Снаряжение героев и губернатора": "snaryazhenie-geroev-i-gubernatora",
  "Советы": "sovety",
  "Таблицы": "tablitsy",
  "Учебный лагерь героев": "uchebnyj-lager-geroev",
  "Чемпионат Альянса": "chempionat-alyansa",
  "Эксперты": "eksperty",
};

const EVENT_SLUG_MAP = {
  "Воспоминания о грезах": "vospominaniya-o-grezah",
  "Морозное сокровище": "moroznoe-sokrovishe",
  "Приключение звёзд-близнецов": "priklyuchenie-zvyozd-bliznetsov",
  "Снегоуборщики": "snegouborshiki",
  "Безумная Джо": "bezumnaya-dzho",
  "Битва за Литейную": "bitva-za-litejnuyu",
  "Путь Света": "put-sveta",
  "Рыболовный турнир": "rybolovnyj-turnir",
  "Рудник ледяного огня": "rudnik-ledyanogo-ognya",
  "Форты и Крепости": "forty-i-kreposti",
  "Зал Губернатора": "zal-gubernatora",
  "Король ледяного поля": "korol-ledyanogo-polya",
  "Битва в каньоне": "bitva-v-kanone",
  "Мощь Государства(СВС)": "moshch-gosudarstva-svs",
  "Пламя и Клыки": "flame_and_fangs",
  "Сражение альянсов": "srazhenie-alyansov",
  "Гонка вооружения": "arms_race",
  "Зимняя осада": "winter_siege"
};

const TRANSLIT_MAP = {
  "а": "a", "б": "b", "в": "v", "г": "g", "д": "d",
  "е": "e", "ё": "yo", "ж": "zh", "з": "z", "и": "i",
  "й": "j", "к": "k", "л": "l", "м": "m", "н": "n",
  "о": "o", "п": "p", "р": "r", "с": "s", "т": "t",
  "у": "u", "ф": "f", "х": "kh", "ц": "ts", "ч": "ch",
  "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "",
  "э": "e", "ю": "yu", "я": "ya",
  "А": "a", "Б": "b", "В": "v", "Г": "g", "Д": "d",
  "Е": "e", "Ё": "yo", "Ж": "zh", "З": "z", "И": "i",
  "Й": "j", "К": "k", "Л": "l", "М": "m", "Н": "n",
  "О": "o", "П": "p", "Р": "r", "С": "s", "Т": "t",
  "У": "u", "Ф": "f", "Х": "kh", "Ц": "ts", "Ч": "ch",
  "Ш": "sh", "Щ": "shch", "Ъ": "", "Ы": "y", "Ь": "",
  "Э": "e", "Ю": "yu", "Я": "ya",
};

function autoSlug(text) {
  let result = "";
  for (const char of text) {
    result += TRANSLIT_MAP[char] || char;
  }
  result = result
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return result || "unknown";
}

function textSlug(text, fallback) {
  const plain = String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  const slug = autoSlug(plain);

  if (!slug || slug === "unknown") {
    return String(fallback || "block");
  }

  return slug.length > 64 ? slug.slice(0, 64).replace(/-+$/g, "") : slug;
}

function getSectionSlug(folderName) {
  if (SLUG_MAP[folderName]) {
    return SLUG_MAP[folderName];
  }
  const slug = autoSlug(folderName);
  console.warn(`  [slug] Автоматический slug для "${folderName}": "${slug}"`);
  return slug;
}

function getEventSlug(eventFolderName, parentDir) {
  const eventName = extractEventName(eventFolderName);
  if (EVENT_SLUG_MAP[eventName]) {
    return EVENT_SLUG_MAP[eventName];
  }
  const slug = autoSlug(eventName);
  console.warn(`  [slug] Автоматический slug для события "${eventName}": "${slug}"`);
  return slug;
}

function extractEventName(folderName) {
  return folderName
    .replace(/^Информация по событию\s*/i, "")
    .replace(/^Информация по\s*/i, "")
    .replace(/[«»]/g, "")
    .trim();
}

module.exports = {
  SLUG_MAP,
  EVENT_SLUG_MAP,
  getSectionSlug,
  getEventSlug,
  extractEventName,
  autoSlug,
  textSlug,
};
