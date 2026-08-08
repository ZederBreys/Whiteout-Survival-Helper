const fs = require("fs");
const path = require("path");

const DATASETW = path.resolve(__dirname, "..", "DataSetW");

const stats = {
  total: 0, changed: 0, unchanged: 0,
  htmlNormalized: 0, restored: 0,
  tagsP: 0, tagsH2: 0, tagsUl: 0, tagsOl: 0, tagsLi: 0, tagsStrong: 0,
};

function countTags(html, tag) {
  const re = new RegExp(`<${tag}[\\s>/]`, "gi");
  return (html.match(re) || []).length;
}

function findTxtFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...findTxtFiles(full));
    else if (e.name.endsWith(".txt")) results.push(full);
  }
  return results;
}

function hasOriginalHtml(text) {
  return /<\/?(span|div)\b/i.test(text);
}

function hasV3Formatting(text) {
  return /<\/?(h2|h3|h4|ol|p|br)\b/i.test(text) && !hasOriginalHtml(text);
}

function stripFormatting(text) {
  let result = text;
  result = result.replace(/<\s*\/?\s*h2\s*>/gi, "");
  result = result.replace(/<\s*\/?\s*h3\s*>/gi, "");
  result = result.replace(/<\s*\/?\s*h4\s*>/gi, "");
  result = result.replace(/<\s*\/?\s*p\s*>/gi, "");
  result = result.replace(/<\s*\/?\s*(ul|ol|li)\s*>/gi, "");
  result = result.replace(/<\s*br\s*\/?\s*>/gi, "\n");
  result = result.replace(/<\s*\/?\s*strong\s*>/gi, "");
  result = result.replace(/\n{3,}/g, "\n\n");
  result = result.split("\n").map(l => l.trimEnd()).join("\n");
  return result.trim();
}

function normalizeExistingHtml(text) {
  let result = text;
  result = result.replace(/<strong\s+>/g, "<strong>");
  result = result.replace(/<b>/gi, "<strong>");
  result = result.replace(/<\/b>/gi, "</strong>");
  result = result.replace(/\s+>/g, ">");
  return result;
}

function isAsciiArt(line) {
  const m = line.trim().match(/^[-=]{3,}\s*(.+?)\s*[-=]{3,}$/);
  return m ? m[1].trim() : null;
}

function isHeading(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.length > 80) return false;
  if (!/[а-яёa-z]/i.test(trimmed)) return false;
  // Exclude KVs
  if (/ - | — /.test(trimmed)) return false;
  // Exclude list markers
  if (/^[-•\u2022\u25CF]\s?/.test(trimmed)) return false;
  if (/^\d+\.\s/.test(trimmed)) return false;
  // Exclude bold-prefix paragraph lines
  if (/^(Важно|Совет|Примечание|Рекомендуется|Уровень|Этап|Внимание|Итог|Стратегия|Тактика)\s*:/i.test(trimmed))
    return false;
  // Game data exclusions (compositions like Сергей/Молли, "+2 любых", etc.)
  // But allow if ends with heading signal (: or ?)
  const hasHeadingSignal = trimmed.endsWith(":") || trimmed.endsWith("?");
  if (!hasHeadingSignal) {
    if (/\//.test(trimmed)) return false;
    if (/\+[0-9]/.test(trimmed)) return false;
  }
  // Strong signals
  if (hasHeadingSignal) return true;
  // Short titles with period
  if (trimmed.endsWith(".") && trimmed.length <= 40) return true;
  // Short phrases without sentence-ending punctuation
  if (trimmed.length <= 60 && !/[.?!]$/.test(trimmed) && !trimmed.includes(","))
    return true;
  return false;
}

function isListItem(line) {
  return /^[-•\u2022\u25CF]\s?/.test(line.trim());
}

function isNumberedItem(line) {
  return /^\d+\.\s/.test(line.trim());
}

function isKeyValue(line) {
  const trimmed = line.trim();
  const m = trimmed.match(/^([^-—]+?)\s*[-—]\s*(.+)$/);
  if (!m) return null;
  const key = m[1].trim();
  const value = m[2].trim();
  if (!key || !value) return null;
  if (!/[а-яёa-z]/i.test(key)) return null;
  if (key.length > 40) return null;
  if (/^\d+[-—]\d+/.test(trimmed)) return null;
  if (/\//.test(key) || /\//.test(value)) return null;
  return { key, value };
}

function applyBoldToPrefixes(text) {
  return text.replace(
    /^(Важно|Совет|Примечание|Рекомендуется|Уровень|Этап|Внимание|Итог|Стратегия|Тактика)\s*:/gi,
    (match, word) =>
      `<strong>${word.charAt(0).toUpperCase() + word.slice(1)}:</strong>`
  );
}

function classifyLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return { type: "empty" };

  const ascii = isAsciiArt(trimmed);
  if (ascii) return { type: "heading", text: ascii };

  const kv = isKeyValue(trimmed);
  if (kv) return { type: "kv", key: kv.key, value: kv.value };

  if (isListItem(trimmed)) {
    let text = trimmed.replace(/^[-•\u2022\u25CF]\s?/, "");
    text = applyBoldToPrefixes(text);
    return { type: "list-item", text };
  }

  if (isNumberedItem(trimmed)) {
    let text = trimmed.replace(/^\d+\.\s*/, "");
    text = applyBoldToPrefixes(text);
    return { type: "list-item", text };
  }

  if (isHeading(trimmed)) {
    return { type: "heading", text: trimmed };
  }

  return { type: "text", text: trimmed };
}

function formatLines(lines) {
  const classified = lines.map(classifyLine);
  const result = [];
  const buffer = [];
  let bufType = null;

  function flush() {
    if (buffer.length === 0) return;
    if (bufType === "text") {
      let text = buffer.join("<br>");
      text = applyBoldToPrefixes(text);
      result.push(`<p>${text}</p>`);
    } else if (bufType === "list-item") {
      result.push(
        `<ul>\n${buffer.map((t) => `  <li>${t}</li>`).join("\n")}\n</ul>`
      );
    }
    buffer.length = 0;
    bufType = null;
  }

  for (const item of classified) {
    if (item.type === "empty") { flush(); continue; }
    if (item.type === "heading") { flush(); result.push(`<h2>${item.text}</h2>`); continue; }
    if (item.type === "kv") {
      flush();
      result.push(`<p><strong>${item.key}</strong> \u2014 ${item.value}</p>`);
      continue;
    }
    if (bufType !== null && bufType !== item.type) flush();
    if (item.type === "list-item") { buffer.push(item.text); bufType = "list-item"; }
    else if (item.type === "text") { buffer.push(item.text); bufType = "text"; }
  }
  flush();
  return result.filter(Boolean);
}

function formatPlainText(text) {
  const lines = text.split(/\n/);
  return formatLines(lines).join("\n\n");
}

function formatFile(filePath) {
  const original = fs.readFileSync(filePath, "utf-8").trimEnd();
  if (!original) return;

  let working = original;
  let changeType = null;

  if (hasOriginalHtml(working)) {
    const normalized = normalizeExistingHtml(working);
    if (normalized !== working) { changeType = "html-normalized"; working = normalized; }
    else { stats.unchanged++; return; }
  } else if (hasV3Formatting(working)) {
    const plain = stripFormatting(working);
    const formatted = formatPlainText(plain);
    changeType = "re-formatted";
    working = formatted;
    stats.restored++;
  } else {
    const formatted = formatPlainText(working);
    if (formatted !== working) { changeType = "formatted"; working = formatted; }
    else { stats.unchanged++; return; }
  }

  if (changeType) {
    fs.writeFileSync(filePath, working + "\n", "utf-8");
    stats.changed++;
    if (changeType === "html-normalized") stats.htmlNormalized++;
    stats.tagsP += countTags(working, "p");
    stats.tagsH2 += countTags(working, "h2");
    stats.tagsUl += countTags(working, "ul");
    stats.tagsOl += countTags(working, "ol");
    stats.tagsLi += countTags(working, "li");
    stats.tagsStrong += countTags(working, "strong");
    console.log(`  [${changeType}] ${path.relative(DATASETW, filePath)}`);
  } else {
    stats.unchanged++;
  }
}

console.log("=== HTML FORMATTER v4 ===\n");

const files = findTxtFiles(DATASETW);
stats.total = files.length;

for (const f of files.sort()) {
  try { formatFile(f); }
  catch (err) { console.error(`  [ERROR] ${path.relative(DATASETW, f)}: ${err.message}`); }
}

console.log(`\n=== COMPLETE ===`);
console.log(`Total:        ${stats.total}`);
console.log(`Changed:      ${stats.changed}`);
console.log(`  HTML norm:  ${stats.htmlNormalized}`);
console.log(`  Re-fmt:     ${stats.restored}`);
console.log(`Unchanged:    ${stats.unchanged}`);
console.log(`\nTAGS:`);
console.log(`<p>: ${stats.tagsP}  <h2>: ${stats.tagsH2}  <ul>: ${stats.tagsUl}  <ol>: ${stats.tagsOl}`);
console.log(`<li>: ${stats.tagsLi}  <strong>: ${stats.tagsStrong}`);
