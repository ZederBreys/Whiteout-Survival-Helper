const fs = require("fs");
const path = require("path");

function readDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  const dirs = [];
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      dirs.push({ name: entry.name, path: fullPath });
    } else if (entry.isFile()) {
      files.push({ name: entry.name, path: fullPath });
    }
  }

  return { dirs, files };
}

function isImage(name) {
  return /\.(jpg|jpeg|png)$/i.test(name);
}

function isText(name) {
  return /\.txt$/i.test(name);
}

function extractNumber(name) {
  const match = name.match(/^(\d+)\.(jpg|jpeg|png)$/i);
  return match ? parseInt(match[1], 10) : null;
}

module.exports = { readDir, isImage, isText, extractNumber };
