const path = require("path");
const { parseDataSetW } = require("../../scripts/parser/index");

const DATA_ROOT = path.resolve(__dirname, "..", "..", "DataSetW");

module.exports = function () {
  console.log("\n=== Eleventy Data: content.js ===");
  console.log(`Читаю DataSetW: ${DATA_ROOT}`);

  const result = parseDataSetW(DATA_ROOT);

  return {
    sections: result.sections,
    eventsCategory: result.eventsCategory,
    stats: result.stats,
  };
};
