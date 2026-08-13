const path = require("path");

const imageStats = {
  processed: 0,
  created: 0,
  skipped: 0,
  errors: 0,
};

let _Image = null;

async function getImage() {
  if (!_Image) {
    const mod = await import("@11ty/eleventy-img");
    _Image = mod.default || mod;
  }
  return _Image;
}

async function imageShortcode(src, alt, loading = "lazy") {
  if (!src) {
    imageStats.errors++;
    return `<div class="image-placeholder">Изображение отсутствует</div>`;
  }

  try {
    const Image = await getImage();
    const ext = path.extname(src).toLowerCase();
    const baseName = path.basename(src, ext);
    const sourceDir = path.dirname(src);
    const sectionName = path.basename(sourceDir);
    const urlPath = `/assets/images/${sectionName}/`;

    const metadata = await Image(src, {
      widths: [320, 574, 800, 1200],
      formats: ["webp"],
      outputDir: `./public/assets/images/${sectionName}/`,
      urlPath: urlPath,
      filenameFormat: (id, _src, width, format) => {
        return `${baseName}-${width}w.${format}`;
      },
      sharpOptions: {
        animated: true,
      },
      cacheOptions: {
        directory: ".eleventy-cache/images",
        duration: "*",
      },
    });

    imageStats.processed++;

    const webpData = metadata.webp;
    if (webpData && webpData.length > 0) {
      imageStats.created += webpData.length;
    } else {
      imageStats.skipped++;
    }

    const imgSrc = webpData[webpData.length - 1];
    const srcset = webpData
      .map((entry) => `${entry.url} ${entry.width}w`)
      .join(", ");

    const sizes = "(max-width: 320px) 320px, 574px";

    return (
      `<picture>` +
      `<source srcset="${srcset}" sizes="${sizes}" type="image/webp">` +
      `<img src="${imgSrc.url}" ` +
      `width="${imgSrc.width}" ` +
      `height="${imgSrc.height}" ` +
      `alt="${alt || baseName}" ` +
      `loading="${loading}" ` +
      `decoding="async">` +
      `</picture>`
    );
  } catch (err) {
    imageStats.errors++;
    console.warn(`  [image] Ошибка "${path.basename(src)}": ${err.message}`);
    return `<div class="image-placeholder">${path.basename(src)}</div>`;
  }
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addAsyncShortcode("image", imageShortcode);

  eleventyConfig.addShortcode("imageStats", function () {
    console.log("\n=== IMAGE PROCESSING ===");
    console.log(`Обработано:   ${imageStats.processed}`);
    console.log(`Создано WebP: ${imageStats.created}`);
    console.log(`Пропущено:    ${imageStats.skipped}`);
    console.log(`Ошибок:       ${imageStats.errors}`);
    console.log("========================\n");

    return "";
  });

  eleventyConfig.addFilter("absUrl", function (base, path) {
    return String(base).replace(/\/+$/, "") + path;
  });

  eleventyConfig.addFilter("formatText", function (text) {
    if (!text) return "";
    if (/<\/?(p|ul|ol|li|blockquote|h[2-4]|div|table)\b/i.test(text)) {
      return text;
    }
    return text.replace(/\r\n/g, "<br>").replace(/\n/g, "<br>");
  });

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/site.webmanifest": "site.webmanifest" });

  eleventyConfig.setServerOptions({
    host: "0.0.0.0",
    port: 8080
  });

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data",
    },
    templateFormats: ["njk", "html"],
    htmlTemplateEngine: "njk",
  };
};
