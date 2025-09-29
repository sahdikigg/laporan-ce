(() => {
  const haveSwal = typeof Swal !== 'undefined';
  if (!haveSwal) console.warn('SweetAlert2 belum dimuat — pastikan CDN <script> dimuat sebelum main.js');

  // 🔹 Notifikasi helper
  window.showSuccess = function (msg) {
    if (haveSwal) return Swal.fire({ icon: 'success', title: msg, timer: 1500, showConfirmButton: false });
    alert(msg);
  };
  window.showError = function (msg) {
    if (haveSwal) return Swal.fire({ icon: 'error', title: 'Error', text: msg });
    alert('Error: ' + msg);
  };

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("itemsContainer");
    const btnAdd = document.getElementById("btnAddItem");
    const form = document.getElementById("laporanForm");
    const loader = document.getElementById("loader");

    // 🔹 Tambah pekerjaan
    if (btnAdd && container) {
      btnAdd.addEventListener("click", () => {
        const idx = container.children.length;
        const div = document.createElement("div");
        div.className = "item-row";
        div.style.cssText = `
          border: 1px solid #ddd; 
          border-radius: 8px; 
          padding: 12px; 
          margin-bottom: 10px; 
          background: #f9f9f9;
        `;

        div.innerHTML = `
          <div style="margin-bottom: 8px; font-weight: bold;" class="item-label">No ${idx + 1}</div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px;">
            <input name="pekerjaan[]" placeholder="Pekerjaan" required style="flex:1; padding:6px;">
            <input name="kontraktor[]" placeholder="Kontraktor" style="flex:1; padding:6px;">
          </div>
          <textarea name="keterangan[]" placeholder="Keterangan" style="width:100%; padding:6px; margin-bottom:8px;"></textarea>
          <input type="file" name="gambar_${idx}[]" multiple style="margin-bottom:8px;">
          <br>
          <button type="button" class="btn danger small" onclick="removeItem(this)">🗑 Hapus</button>
        `;

        container.appendChild(div);
        reorderItems();
      });
    }

    // 🔹 Hapus item
    window.removeItem = function (btn) {
      const row = btn.closest(".item-row");
      if (row) {
        row.remove();
        reorderItems();
      }
    };

    // 🔹 Reorder item
    window.reorderItems = function () {
      const items = document.querySelectorAll('#itemsContainer .item-row');
      items.forEach((row, i) => {
        const label = row.querySelector(".item-label");
        if (label) label.innerText = `No ${i + 1}`;
        const fileInput = row.querySelector('input[type=file]');
        if (fileInput) fileInput.name = `gambar_${i}[]`;
      });
    };

    // 🔹 Form submit (hanya sekali!)
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log('Submitting form...');

        if (loader) loader.style.display = "flex";

        const fd = new FormData(form);

        try {
          const url = form.action || '/laporan/add';
          const res = await fetch(url, { method: 'POST', body: fd });
          const text = await res.text();

          let data;
          try {
            data = JSON.parse(text);
          } catch (err) {
            console.error('Response bukan JSON:', text);
            if (loader) loader.style.display = "none";
            showError('Response server bukan JSON. Periksa konsol / network.');
            return;
          }

          if (loader) loader.style.display = "none";

          console.log('Response add laporan:', data);
          if (res.ok && data && data.success) {
            showSuccess(data.message || 'Data berhasil disimpan');
            form.reset();
            container.innerHTML = '';
          } else {
            showError(data.message || 'Gagal menyimpan data');
          }
        } catch (err) {
          console.error('Fetch error:', err);
          if (loader) loader.style.display = "none";
          showError('Terjadi kesalahan saat mengirim data');
        }
      });
    }
  });

  // 🔹 Delete laporan
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
