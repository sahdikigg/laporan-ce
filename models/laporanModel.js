const pool = require('../db');

// tambah laporan
async function create(laporan) {
  const query = `
    INSERT INTO laporan
    (month, week, year, location, report_date, created_by, created_title, items, other_info, penutup, rentang_tanggal, judul)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *;
  `;
  const values = [
    laporan.month,
    laporan.week,
    laporan.year,
    laporan.location,
    laporan.report_date,
    laporan.created_by,
    laporan.created_title,
    JSON.stringify(laporan.items || []),
    laporan.other_info,
    laporan.penutup,
    laporan.rentang_tanggal,
    laporan.judul
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function findAll() {
  const result = await pool.query('SELECT * FROM laporan ORDER BY id DESC');
  return result.rows;
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM laporan WHERE id = $1', [id]);
  return result.rows[0];
}

async function update(id, laporan) {
  const query = `
    UPDATE laporan SET
      month=$1,
      week=$2,
      year=$3,
      location=$4,
      report_date=$5,
      created_by=$6,
      created_title=$7,
      items=$8,
      other_info=$9,
      penutup=$10,
      rentang_tanggal=$11,
      judul=$12,
      updated_at=now()
    WHERE id=$13
    RETURNING *;
  `;
  const values = [
    laporan.month,
    laporan.week,
    laporan.year,
    laporan.location,
    laporan.report_date,
    laporan.created_by,
    laporan.created_title,
    JSON.stringify(laporan.items || []),
    laporan.other_info,
    laporan.penutup,
    laporan.rentang_tanggal,
    laporan.judul,
    id
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function remove(id) {
  const result = await pool.query('DELETE FROM laporan WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove
};
