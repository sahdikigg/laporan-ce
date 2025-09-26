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
