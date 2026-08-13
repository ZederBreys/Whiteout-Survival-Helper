const path = require("path");
const { textSlug } = require("./slug");

const PATTERNS = [
  {
    name: "single",
    regex: /^Описание\s+(\d+)\.(jpg|png|jpeg)\.txt$/i,
    parse: (match) => ({
      type: "single",
      numbers: [parseInt(match[1], 10)],
      extension: match[2].toLowerCase(),
    }),
  },
  {
    name: "range-with-dlya",
    regex: /^Описание\s+для\s+(\d+)-(\d+)\.(jpg|png|jpeg)\.txt$/i,
    parse: (match) => ({
      type: "range",
      numbers: range(parseInt(match[1], 10), parseInt(match[2], 10)),
      extension: match[3].toLowerCase(),
    }),
  },
  {
    name: "range-without-dlya",
    regex: /^Описание\s+(\d+)-(\d+)\.(jpg|png|jpeg)\.txt$/i,
    parse: (match) => ({
      type: "range",
      numbers: range(parseInt(match[1], 10), parseInt(match[2], 10)),
      extension: match[3].toLowerCase(),
    }),
  },
  {
    name: "table-range",
    regex: /^Описание\s+таблицы\s+для\s+(\d+)-(\d+)\.(jpg|png|jpeg)\.txt$/i,
    parse: (match) => ({
      type: "range",
      numbers: range(parseInt(match[1], 10), parseInt(match[2], 10)),
      extension: match[3].toLowerCase(),
    }),
  },
  {
    name: "all-images",
    regex: /^Описание\s+(?:для\s+)?всех\s+\.(jpg|png|jpeg)\.txt$/i,
    parse: (match) => ({
      type: "all",
      numbers: [],
      extension: match[1].toLowerCase(),
    }),
  },
  {
    name: "numbered-info",
    regex: /^Информация\s+(\d+)\.txt$/i,
    parse: (match) => ({
      type: "info",
      numbers: [],
      extension: null,
      number: parseInt(match[1], 10),
    }),
  },
  {
    name: "info",
    regex: /^Информация\.txt$/i,
    parse: () => ({ type: "info", numbers: [], extension: null }),
  },
  {
    name: "intro",
    regex: /^Информация\s+в\s+самом\s+начале\.txt$/i,
    parse: () => ({ type: "intro", numbers: [], extension: null }),
  },
  {
    name: "extra",
    regex: /^Отдельн(?:ое|ая)\s+информация.*\.txt$/i,
    parse: () => ({ type: "extra", numbers: [], extension: null }),
  },
  {
    name: "tip",
    regex: /^Совет\s+(\d+)\.txt$/i,
    parse: (match) => ({ type: "tip", numbers: [], extension: null, number: parseInt(match[1], 10) }),
  },
];

function range(start, end) {
  const result = [];
  for (let i = start; i <= end; i++) {
    result.push(i);
  }
  return result;
}

function parseDescriptionFile(fileName) {
  for (const pattern of PATTERNS) {
    const match = fileName.match(pattern.regex);
    if (match) {
      return pattern.parse(match);
    }
  }

  console.warn(`  [parser] Неизвестный формат файла: "${fileName}" — будет обработан как info`);
  return { type: "info", numbers: [], extension: null };
}

function buildContentBlocks(descriptors, images) {
  const blocks = [];
  const assignedImages = new Set();
  const usedIds = new Set();
  let order = 0;
  let hasSectionInfo = false;

  function uniqueId(base) {
    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${base}-${suffix}`;
      suffix++;
    }
    usedIds.add(id);
    return id;
  }

  for (const desc of descriptors) {
    if (desc.type === "intro") {
      hasSectionInfo = true;
      blocks.push({
        type: "intro",
        text: desc.text,
        image: null,
        images: [],
        order: -1,
        id: uniqueId(`intro-${textSlug(desc.text, "intro")}`),
      });
      continue;
    }

    if (desc.type === "info") {
      hasSectionInfo = true;
      const blockId = desc.number
        ? `info-${desc.number}`
        : `info-${textSlug(desc.text, "info")}`;
      blocks.push({
        type: "info",
        text: desc.text,
        image: null,
        images: [],
        order: desc.number || 0,
        id: uniqueId(blockId),
      });
      continue;
    }

    if (desc.type === "tip") {
      hasSectionInfo = true;
      const blockId = desc.number
        ? `tip-${desc.number}`
        : `tip-${textSlug(desc.text, "tip")}`;
      blocks.push({
        type: "tip",
        text: desc.text,
        image: null,
        images: [],
        order: 0,
        id: uniqueId(blockId),
      });
      continue;
    }

    if (desc.type === "extra") {
      hasSectionInfo = true;
      blocks.push({
        type: "extra",
        text: desc.text,
        image: null,
        images: [],
        order: 999,
        id: uniqueId(`extra-${textSlug(desc.text, "extra")}`),
      });
      continue;
    }

    if (desc.type === "all") {
      blocks.push({
        type: "all",
        text: desc.text,
        image: null,
        images: [...images],
        order: 0,
        id: uniqueId(`all-${textSlug(desc.text, "all")}`),
      });
      images.forEach((img) => assignedImages.add(img.fileName));
      continue;
    }

    const matchedImages = desc.numbers
      .map((n) => images.find((img) => img.number === n))
      .filter(Boolean);

    desc.numbers.forEach((n) => {
      const found = images.find((img) => img.number === n);
      if (!found) {
        console.warn(`  [parser] Изображение ${n}.${desc.extension} не найдено для "${desc.rawFileName}"`);
      }
    });

    if (matchedImages.length > 0) {
      const firstNumber = desc.numbers[0];
      const lastNumber = desc.numbers[desc.numbers.length - 1];
      const blockId =
        desc.type === "single"
          ? `single-${firstNumber}`
          : `range-${firstNumber}-${lastNumber}`;
      order++;
      blocks.push({
        type: desc.type,
        text: desc.text,
        image: matchedImages.length === 1 ? matchedImages[0] : null,
        images: matchedImages,
        order: order,
        id: uniqueId(blockId),
      });
      matchedImages.forEach((img) => assignedImages.add(img.fileName));
    }
  }

  for (const img of images) {
    if (!assignedImages.has(img.fileName)) {
      if (img.isNamed) {
        continue;
      }
      if (hasSectionInfo) {
        continue;
      }
      const relativePath = path.relative(process.cwd(), img.sourcePath).replace(/\\/g, "/");

      console.warn(`  [parser] Изображение без описания: "${relativePath}"`);
    }
  }

  blocks.sort((a, b) => a.order - b.order);
  return blocks;
}

function determineLayoutType(blocks) {
  const types = blocks.map((b) => b.type);

  if (types.every((t) => ["info", "intro", "extra", "tip"].includes(t))) {
    return "text-only";
  }

  if (types.includes("all")) {
    return "single-image";
  }

  if (types.includes("range")) {
    return "grouped";
  }

  if (types.includes("single")) {
    const hasRanges = types.includes("range");
    const hasInfo = types.some((t) => ["info", "intro", "extra"].includes(t));
    return hasRanges || hasInfo ? "grouped" : "multi-image";
  }

  return "text-only";
}

module.exports = {
  PATTERNS,
  parseDescriptionFile,
  buildContentBlocks,
  determineLayoutType,
};
