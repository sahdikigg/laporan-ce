// routes/laporan.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const laporanController = require('../controllers/laporanController');

// === Konfigurasi multer (deklarasi SEKALI) ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// === Debug cepat: tampilkan fungsi yang ada di controller ===
console.log('Loaded laporanController handlers:', Object.keys(laporanController));
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

router.post("/add", upload.any(), async (req, res, next) => {
  try {
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const outputPath = path.join("public/uploads", "compressed-" + file.filename);

        // resize + compress
        await sharp(file.path)
          .resize(800, 600, { fit: "inside" }) // max width 800px, height 600px
          .jpeg({ quality: 70 })              // ubah ke JPEG kualitas 70%
          .toFile(outputPath);

        // hapus file asli biar hemat storage
        fs.unlinkSync(file.path);

        // ganti path file ke versi compressed
        file.path = outputPath;
        file.filename = "compressed-" + file.filename;
      }
    }

    next(); // lanjut ke controller
  } catch (err) {
    console.error("Error compress gambar:", err);
    res.status(500).json({ success: false, message: "Gagal compress gambar" });
  }
});


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

// Cek setiap handler; jika ada yang bukan function, tampilkan error jelas
expectedHandlers.forEach(fn => {
  if (typeof laporanController[fn] !== 'function') {
    console.error(`\x1b[31mERROR:\x1b[0m laporanController.${fn} is not a function (undefined). Check controllers/laporanController.js`);
  }
});

// === Routes ===
router.get('/', laporanController.list);
router.get('/add', laporanController.showAddForm);

// Gunakan upload.any() jika nama field file dinamis (gambar_0, gambar_1, ...)
router.post('/add', upload.any(), laporanController.createLaporan);

router.get('/:id', laporanController.getLaporan);
router.get('/edit/:id', laporanController.showEditForm);
router.post('/edit/:id', upload.any(), laporanController.updateLaporan);
// Hapus bisa pake POST atau DELETE tergantung route yang kamu pakai di client
router.delete('/delete/:id', laporanController.deleteLaporan);

// Export
// router.get('/:id/export', laporanController.exportPDF);
router.get('/export/:id', laporanController.exportPDF);

module.exports = router;
