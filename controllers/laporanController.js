const laporanModel = require('../models/laporanModel');
const pdfGen = require('../utilities/pdfGenerator');
const dayjs = require('dayjs');
const fs = require('fs');
const path = require('path');

// helper kecil
function toArray(val) {
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

// dapatkan field yang diindex (bisa berasal dari bentuk object atau array atau single value)
function getIndexedField(obj, idx) {
  if (!obj) return [];
  // jika bentuk array (mis. body.gambar_lama = [[],[],...])
  if (Array.isArray(obj)) {
    const v = obj[idx];
    return v ? (Array.isArray(v) ? v : [v]) : [];
  }
  // jika bentuk object (mis. body.gambar_lama = { '0': [...], '1': [...] })
  if (typeof obj === 'object') {
    const v = obj[idx] || obj[String(idx)];
    return v ? (Array.isArray(v) ? v : [v]) : [];
  }
  // fallback single value
  return toArray(obj);
}
function parseItemsFromReq(req) {
  const pekerjaan = req.body.pekerjaan || [];
  const kontraktor = req.body.kontraktor || [];
  const keterangan = req.body.keterangan || [];

  const files = req.files || [];
  const items = [];

  for (let i = 0; i < pekerjaan.length; i++) {
    const itemFiles = files
      .filter(f => f.fieldname === `gambar_${i}[]`)
      .map(f => '/uploads/' + f.filename);

    items.push({
      no: i + 1,
      pekerjaan: pekerjaan[i],
      kontraktor: kontraktor[i],
      keterangan: keterangan[i],
      gambar: itemFiles
    });
  }
  return items;
}

exports.list = async (req, res) => {
  try {
    const laporan = await laporanModel.findAll();
    console.log("ISI LAPORAN:", laporan); // sekarang harus array, bukan undefined
    res.render('list', { laporan });
  } catch (err) {
    console.error("Error ambil data laporan:", err);
    res.status(500).send('Error ambil data laporan');
  }
};

exports.showAddForm = (req, res) => {
  res.render('add', { laporan: {} });
};


exports.createLaporan = async (req, res) => {
  try {
    const items = parseItemsFromReq(req);
    const laporan = {
      month: req.body.month,
      week: req.body.week,
      year: req.body.year,
      location: req.body.location,
      report_date: req.body.report_date,
      created_by: req.body.created_by,
      created_title: req.body.created_title,
      items,
      other_info: req.body.other_info,
      penutup: req.body.penutup,
      rentang_tanggal: req.body.rentang_tanggal,
      judul: req.body.judul,
      know: req.body.know,
      jabatan:req.body.jabatan
    };

    const result = await laporanModel.create(laporan);  // ✅ hanya sekali
    res.json({ success: true, message: 'Laporan berhasil disimpan', laporan: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal simpan laporan' });
  }
};

exports.getLaporan = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await laporanModel.findById(id);
    if (!data) return res.status(404).send('Not found');
    res.render('detail', { laporan: data });
  } catch (err) {
    console.error("Error getLaporan:", err);
    res.status(500).send('Server error');
  }
};

exports.showEditForm = async (req, res) => {
  const id = req.params.id;
  const data = await laporanModel.findById(id);
  if (!data) return res.status(404).send('Not found');
  res.render('edit', { laporan: data });
};

exports.updateLaporan = async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};

    // debug: cek apa yang diterima
    console.log('--- updateLaporan DEBUG ---');
    console.log('body keys:', Object.keys(body));
    console.log('req.files length:', (req.files || []).length);

    // normalisasi text fields supaya selalu array
    const pekerjaanArr = Array.isArray(body.pekerjaan) ? body.pekerjaan : (body.pekerjaan ? [body.pekerjaan] : []);
    const kontraktorArr = Array.isArray(body.kontraktor) ? body.kontraktor : (body.kontraktor ? [body.kontraktor] : []);
    const keteranganArr = Array.isArray(body.keterangan) ? body.keterangan : (body.keterangan ? [body.keterangan] : []);

    // beri index cepat untuk files berdasarkan fieldname
    const filesIndex = {};
    (req.files || []).forEach(f => {
      filesIndex[f.fieldname] = filesIndex[f.fieldname] || [];
      filesIndex[f.fieldname].push(f);
    });

    const items = pekerjaanArr.map((_, idx) => {
      // gambar lama yang dikirim melalui hidden input
      const gambarLama = getIndexedField(body.gambar_lama, idx); // array

      // gambar yang user pilih untuk dihapus (checkbox)
      const hapusGambar = getIndexedField(body.hapus_gambar, idx); // array

      // filter gambar lama (hapus yang dicentang)
      let gambarFinal = gambarLama.filter(g => !hapusGambar.includes(g));

      // file baru yang diupload: fieldname di form adalah "gambar_${idx}[]"
      const fieldName = `gambar_${idx}[]`;
      const uploaded = filesIndex[fieldName] || [];
      const gambarBaru = uploaded.map(f => {
        // simpan path yang sama seperti saat create, misalnya '/uploads/filename'
        return `/uploads/${f.filename}`;
      });

      // gabungkan lama (yang tidak dihapus) + baru
      gambarFinal = gambarFinal.concat(gambarBaru);

      return {
        no: idx + 1,
        pekerjaan: pekerjaanArr[idx] || '',
        kontraktor: kontraktorArr[idx] || '',
        keterangan: keteranganArr[idx] || '',
        gambar: gambarFinal
      };
    });

    // update laporan di DB (sesuaikan nama fungsi model-mu)
    await laporanModel.update(id, {
      month: body.month,
      week: body.week,
      year: body.year,
      location: body.location,
      report_date: body.report_date,
      other_info: body.other_info,
      rentang_tanggal: req.body.rentang_tanggal,
      created_by: body.created_by,
      created_title: body.created_title,
      penutup: body.penutup,
      judul: body.judul,
      know:body.know,
      jabatan:body.jabatan,
      items
    });
    return res.json({ success: true, message: 'Laporan berhasil diupdate' });
  } catch (err) {
    console.error('updateLaporan error:', err);
    return res.status(500).json({ success: false, message: 'Gagal update laporan' });
  }
};

exports.deleteLaporan = async (req, res) => {
  try {
    const deleted = await laporanModel.remove(req.params.id);
    if (deleted) {
      res.json({ success: true, message: 'Laporan berhasil dihapus' });
    } else {
      res.json({ success: false, message: 'Laporan tidak ditemukan' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Gagal hapus laporan' });
  }
};

// const { generatePDFBuffer } = require("../utilities/pdfGenerator");

exports.exportPDF = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await laporanModel.findById(id);
    if (!data) return res.status(404).send("Not found");

    const buffer = await pdfGen.generatePDFBuffer(data);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=laporan_${id}.pdf`
    );
    res.end(buffer); // ✅ pakai res.end biar binary aman
  } catch (err) {
    console.error("Export PDF error:", err);
    res.status(500).send("Gagal membuat PDF");
  }
};


