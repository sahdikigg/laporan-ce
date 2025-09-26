// main.js
(() => {
  const haveSwal = typeof Swal !== 'undefined';
  if (!haveSwal) console.warn('SweetAlert2 belum dimuat — pastikan CDN <script> dimuat sebelum main.js');

  // Notifikasi helper
  window.showSuccess = function (msg) {
    if (haveSwal) return Swal.fire({ icon: 'success', title: msg, timer: 1500, showConfirmButton: false });
    alert(msg);
  };
  window.showError = function (msg) {
    if (haveSwal) return Swal.fire({ icon: 'error', title: 'Error', text: msg });
    alert('Error: ' + msg);
  };

  // Buat 1 item pekerjaan
  function createItemElement(prefill = {}) {
    const container = document.getElementById('itemsContainer');
    const idx = container.children.length;
    const div = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML = `
      <label>No ${idx + 1}</label>
      <input name="pekerjaan[]" placeholder="Pekerjaan" value="${prefill.pekerjaan || ''}">
      <input name="kontraktor[]" placeholder="Kontraktor" value="${prefill.kontraktor || ''}">
      <textarea name="keterangan[]" placeholder="Keterangan">${prefill.keterangan || ''}</textarea>
      <input type="file" name="gambar_${idx}[]" multiple>
      <button type="button" class="btn danger small btn-remove">Hapus</button>
    `;
    // Hapus row
    div.querySelector('.btn-remove').addEventListener('click', () => {
      div.remove();
      reorderItems();
    });
    container.appendChild(div);
    reorderItems();
    return div;
  }

  // Public addItem
  window.addItem = function (prefill = {}) {
    return createItemElement(prefill);
  };

  // Reorder nomor urut
  window.reorderItems = function () {
    const items = document.querySelectorAll('#itemsContainer .item-row');
    items.forEach((it, i) => {
      const lbl = it.querySelector('label');
      const fileInput = it.querySelector('input[type="file"]');
      if (lbl) lbl.innerText = 'No ' + (i + 1);
      if (fileInput) fileInput.name = `gambar_${i}[]`; // update name supaya urut
    });
  };

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('itemsContainer');
    if (container && container.children.length === 0) addItem();
  });

  // Form submit
  (function attachFormHandler() {
    const form = document.getElementById('laporanForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Submitting form...');

      const fd = new FormData(form);
      for (const pair of fd.entries()) {
        console.log('FormData:', pair[0], pair[1]);
      }

      try {
        const url = form.action || '/laporan/add';
        const res = await fetch(url, { method: 'POST', body: fd });
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('Response bukan JSON:', text);
          showError('Response server bukan JSON. Periksa konsol / network.');
          return;
        }
        console.log('Response add laporan:', data);
        if (res.ok && data && data.success) {
          showSuccess(data.message || 'Data berhasil disimpan');
          form.reset();
          document.getElementById('itemsContainer').innerHTML = '';
          addItem();
        } else {
          showError(data.message || 'Gagal menyimpan data');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        showError('Terjadi kesalahan saat mengirim data');
      }
    });
  })();

  // Delete laporan
  window.deleteLaporan = async function (id) {
    if (!id) {
      showError('ID laporan tidak ditemukan');
      return;
    }
    const result = haveSwal ? await Swal.fire({
      title: 'Hapus laporan?',
      text: "Tindakan ini tidak dapat dibatalkan",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    }) : { isConfirmed: confirm('Hapus laporan?') };

    if (!result.isConfirmed) return;

    try {
      const res = await fetch('/laporan/delete/' + id, { method: 'DELETE' });
      const data = await res.json().catch(async () => {
        const t = await res.text();
        console.error('Non-JSON delete response:', t);
        return null;
      });
      console.log("Delete response:", data);
      if (res.ok && data && data.success) {
        showSuccess(data.message || 'Laporan dihapus');
        setTimeout(() => location.reload(), 700);
      } else {
        showError((data && data.message) || 'Gagal hapus');
      }
    } catch (err) {
      console.error(err);
      showError('Error server saat menghapus');
    }
  };
})();
