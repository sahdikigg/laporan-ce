const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");
const baseUrl = "http://localhost:3000"; // sesuaikan port kamu

async function generatePDFBuffer(data) {
  try {
    // Normalisasi path gambar jadi absolute file:///
    if (data.items && Array.isArray(data.items)) {
      data.items = data.items.map(it => {
        if (it.gambar && Array.isArray(it.gambar)) {
          it.gambar = it.gambar.map(g => baseUrl + g); // ubah jadi URL absolut

        }
        return it;
      });
    }

    // Render HTML
    const templatePath = path.join(__dirname, "../views/pdfTemplate.ejs");
    const html = await ejs.renderFile(templatePath, { data });

    // Launch browser
    const browser = await puppeteer.launch({
      headless: "new", // gunakan mode baru agar stabil
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // ✅ penting: set base path agar gambar file:/// bisa dibaca
    await page.setContent(html, {
      waitUntil: ["domcontentloaded", "networkidle0"]
    });

    // Tunggu semua gambar load
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images).map(img => {
          if (img.complete) return;
          return new Promise(resolve => {
            img.addEventListener("load", resolve);
            img.addEventListener("error", resolve);
          });
        })
      );
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();
    return pdfBuffer;
  } catch (err) {
    console.error("Export PDF error:", err);
    throw err;
  }
}

module.exports = { generatePDFBuffer };
