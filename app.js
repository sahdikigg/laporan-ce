const express = require('express');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
require('dotenv').config();

const laporanRoutes = require('./routes/laporan');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// Routes
app.get('/', (req, res) => res.redirect('/laporan'));
app.use('/laporan', laporanRoutes);
app.use(express.static('public'))

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
// konfigurasi penyimpanan
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.post('/laporan/edit/:id', upload.any(), async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;

    // items bisa array
    const items = (body.pekerjaan || []).map((_, idx) => {
      const uploadedFile = req.files.find(f => f.fieldname === `gambar_${idx}`);
      return {
        no: idx + 1,
        pekerjaan: body.pekerjaan[idx],
        kontraktor: body.kontraktor[idx],
        keterangan: body.keterangan[idx],
        gambar: uploadedFile ? `uploads/${uploadedFile.filename}` : body.gambar_lama[idx] // pakai lama kalau tidak ada upload baru
      };
    });

    // update laporan + items ke DB
    await laporanModel.update(id, { ...body, items });

    res.json({ success: true, message: 'Laporan berhasil diupdate' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Gagal update laporan' });
  }
});