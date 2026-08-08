const fs = require("fs");
const path = require("path");
const { readDir, isImage, isText, extractNumber } = require("./scanner");
const {
  parseDescriptionFile,
  buildContentBlocks,
  determineLayoutType,
} = require("./descriptors");
const {
  getSectionSlug,
  getEventSlug,
  extractEventName,
  SLUG_MAP,
} = require("./slug");

function parseDataSetW(rootPath) {
  console.log("\n=== PARSER START ===");
  console.log(`Root: ${rootPath}`);

  const stats = {
    sections: 0,
    events: 0,
    images: 0,
    texts: 0,
    warnings: 0,
  };

  const originalWarn = console.warn;
  console.warn = function (...args) {
    stats.warnings++;
    originalWarn.apply(console, args);
  };

  const { dirs } = readDir(rootPath);

  const sections = [];
  let eventsCategory = null;

  for (const dir of dirs) {
    if (dir.name.startsWith(".")) continue;

    const subEntries = readDir(dir.path);

    const hasSubdirs = subEntries.dirs.length > 0;
    const isEventsCategory = dir.name === "Информация по событиях";

    if (isEventsCategory) {
      eventsCategory = parseEventsCategory(dir, rootPath, stats);
      continue;
    }

    if (hasSubdirs) {
      console.warn(`  [parser] Папка "${dir.name}" имеет подпапки, но не является категорией событий`);
      continue;
    }

    const section = parseSection(dir, rootPath, "section", stats);
    if (section) {
      sections.push(section);
      stats.sections++;
    }
  }

  const sectionOrder = getSectionOrder();
  sections.sort((a, b) => {
    const ai = sectionOrder.indexOf(a.id);
    const bi = sectionOrder.indexOf(b.id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  for (let i = 0; i < sections.length; i++) {
    const prev = i > 0 ? sections[i - 1] : null;
    const next = i < sections.length - 1 ? sections[i + 1] : null;
    sections[i].nextSection = next ? next.id : null;
    sections[i].prevSection = prev ? prev.id : null;
    sections[i].nextUrl = next ? next.url : null;
    sections[i].prevUrl = prev ? prev.url : null;
    sections[i].nextLabel = next ? next.title : null;
    sections[i].prevLabel = prev ? prev.title : null;
  }

  if (eventsCategory && eventsCategory.children.length > 0) {
    const evts = eventsCategory.children;
    for (let i = 0; i < evts.length; i++) {
      const prev = i > 0 ? evts[i - 1] : null;
      const next = i < evts.length - 1 ? evts[i + 1] : null;
      evts[i].nextEvent = next ? next.id : null;
      evts[i].prevEvent = prev ? prev.id : null;
      evts[i].nextUrl = next ? next.url : null;
      evts[i].prevUrl = prev ? prev.url : null;
      evts[i].nextLabel = next ? next.title : null;
      evts[i].prevLabel = prev ? prev.title : null;
    }
  }

  console.warn = originalWarn;

  console.log("\n=== PARSER COMPLETE ===");
  console.log(`Разделов:      ${stats.sections}`);
  console.log(`Событий:       ${stats.events}`);
  console.log(`Изображений:   ${stats.images}`);
  console.log(`Описаний:      ${stats.texts}`);
  console.log(`Предупреждений: ${stats.warnings}`);
  console.log("========================\n");

  return {
    sections,
    eventsCategory,
    stats,
  };
}

function parseSection(dirEntry, rootPath, type, stats) {
  const { files } = readDir(dirEntry.path);

  const images = [];
  const descriptorFiles = [];
  let heroData = null;

  for (const file of files) {
    if (isImage(file.name)) {
      const num = extractNumber(file.name);
      images.push({
        fileName: file.name,
        sourcePath: file.path,
        baseName: path.basename(file.name, path.extname(file.name)),
        extension: path.extname(file.name).slice(1).toLowerCase(),
        number: num,
        isNamed: num === null,
        outputPath: null,
        width: null,
        height: null,
      });
      stats.images++;
    } else if (isText(file.name)) {
      const content = fs.readFileSync(file.path, "utf-8").trim();
      const parsed = parseDescriptionFile(file.name);
      parsed.rawFileName = file.name;
      parsed.text = content;
      descriptorFiles.push(parsed);
      stats.texts++;
    } else if (file.name === "heroes.json") {
      const raw = fs.readFileSync(file.path, "utf-8").trim();
      heroData = JSON.parse(raw);
    }
  }

  const numberedImages = images.filter((img) => img.number !== null);
  const namedImages = images.filter((img) => img.isNamed);

  const blocks = buildContentBlocks(descriptorFiles, images);
  const layoutType = determineLayoutType(blocks);

  const id = type === "event"
    ? getEventSlug(dirEntry.name, "Информация по событиях")
    : getSectionSlug(dirEntry.name);

  const title = type === "event" ? extractEventName(dirEntry.name) : dirEntry.name;
  const folderName = type === "event" ? extractEventName(dirEntry.name) : dirEntry.name;

  const section = {
    id: id,
    title: title,
    type: type,
    sourceFolderName: dirEntry.name,
    sourcePath: dirEntry.path,
    url: type === "event" ? `/e/${id}/` : `/s/${id}/`,
    images: images,
    numberedImages: numberedImages,
    namedImages: namedImages,
    body: {
      layoutType: layoutType,
      blocks: blocks,
    },
    hasImages: images.length > 0,
    hasText: blocks.length > 0,
  };

  if (type === "event") {
    section.parentId = "sobytiya";
  }

  if (heroData) {
    section.heroData = heroData;
  }

  return section;
}

function parseEventsCategory(dirEntry, rootPath, stats) {
  const { dirs } = readDir(dirEntry.path);

  const children = [];

  for (const subdir of dirs) {
    const event = parseSection(subdir, rootPath, "event", stats);
    if (event) {
      children.push(event);
      stats.events++;
    }
  }

  children.sort((a, b) => a.title.localeCompare(b.title, "ru"));

  return {
    id: "sobytiya",
    title: "События",
    type: "category",
    sourcePath: dirEntry.path,
    url: "/sobytiya/",
    children: children,
  };
}

function getSectionOrder() {
  return Object.values(SLUG_MAP).filter((s) => s !== "sobytiya");
}

module.exports = { parseDataSetW };
