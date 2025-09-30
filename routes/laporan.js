// routes/laporan.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const laporanController = require('../controllers/laporanController');
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// === Konfigurasi multer (deklarasi SEKALI) ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// === Debug cepat: tampilkan fungsi yang ada di controller ===
console.log('Loaded laporanController handlers:', Object.keys(laporanController));

// Daftar handler yang kita harapkan ada (sesuaikan jika kamu pakai nama berbeda)
const expectedHandlers = [
  'list',
  'showAddForm',
  'createLaporan',
  'getLaporan',
  'showEditForm',
  'updateLaporan',
  'deleteLaporan',
  'exportPDF'
];

expectedHandlers.forEach(fn => {
  if (typeof laporanController[fn] !== 'function') {
    console.error(`\x1b[31mERROR:\x1b[0m laporanController.${fn} is not a function (undefined). Check controllers/laporanController.js`);
  }
});

// === Routes ===
router.get('/', laporanController.list);
router.get('/add', laporanController.showAddForm);

// ✅ SATUKAN upload + compress + controller di sini
router.post('/add', upload.any(), async (req, res, next) => {
  try {
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const outputPath = path.join("public/uploads", "compressed-" + file.filename);

        await sharp(file.path)
          .resize(800, 600, { fit: "inside" })  // resize max 800x600
          .jpeg({ quality: 70 })                // compress jpeg
          .toFile(outputPath);

        fs.unlinkSync(file.path); // hapus file asli

        // update path biar controller pakai versi compressed
        file.path = outputPath;
        file.filename = "compressed-" + file.filename;
      }
    }
    // teruskan ke controller
    laporanController.createLaporan(req, res);
  } catch (err) {
    console.error("Error compress gambar:", err);
    res.status(500).json({ success: false, message: "Gagal compress gambar" });
  }
});

router.get('/:id', laporanController.getLaporan);
router.get('/edit/:id', laporanController.showEditForm);
router.post('/edit/:id', upload.any(), laporanController.updateLaporan);
router.delete('/delete/:id', laporanController.deleteLaporan);

// Export
router.get('/export/:id', laporanController.exportPDF);

module.exports = router;
