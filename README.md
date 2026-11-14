# Kas Al-Husna

Aplikasi pencatatan kas untuk Remaja Masjid Al-Husna. Catat pemasukan dan pengeluaran,
lampirkan foto nota, lihat saldo, dan susun laporan bulanan. Tampilan dibuat untuk layar
ponsel.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # hasil ada di dist/
npm run preview  # cek hasil build
```

Butuh Node 20 atau lebih baru.

## Dua mode pemakaian

- **Mode lihat** (bawaan). Siapa pun yang membuka aplikasi bisa melihat saldo, daftar
  transaksi, foto nota, dan laporan. Tidak ada tombol catat, ubah, ekspor, impor, atau
  hapus. Tab **Pengaturan** juga disembunyikan sehingga navigasi hanya berisi Ringkasan,
  Transaksi, dan Laporan.
- **Mode bendahara.** Dibuka lewat tombol **Masuk** di halaman Ringkasan dengan PIN 4–6
  angka. PIN dibuat saat pertama kali masuk. Sesi berlaku selama tab masih terbuka dan
  berakhir saat tab ditutup. Keluar lewat **Pengaturan → Sesi bendahara**.

### Sejauh mana PIN melindungi

PIN disimpan sebagai hash SHA-256 di `localStorage` perangkat, bukan dikirim ke server.
Kunci ini mencegah perubahan tak sengaja dan menyembunyikan tombol pengelolaan, tetapi
**bukan keamanan sungguhan**:

- Siapa pun yang memegang perangkat dan bisa membuka data browser dapat membaca seluruh
  isi kas.
- Siapa pun bisa menekan "Lupa PIN?" untuk membuat PIN baru; data kas tidak terhapus.
- Data hanya ada di perangkat yang dipakai mencatat, jadi pengunjung dari perangkat lain
  melihat kas kosong.

Untuk akses multi-perangkat dengan akun sungguhan, diperlukan backend dan database.

## Foto nota

Form catat/ubah punya kolom **Foto nota** (opsional). Foto dari kamera atau galeri
dikompres di perangkat (sisi terpanjang 1200 px, JPEG) sebelum disimpan, karena
`localStorage` hanya menyediakan sekitar 5 MB. Di Ringkasan dan daftar Transaksi,
transaksi yang punya nota menampilkan ikon mata untuk membuka fotonya.

Semakin banyak foto, semakin cepat ruang penyimpanan penuh. Bila data gagal disimpan,
aplikasi menampilkan peringatan; ekspor data lalu hapus beberapa foto lama.

## Data disimpan di mana

Data disimpan di `localStorage` browser dengan kunci `kas-alhusna:v1`. Artinya:

- Data hanya ada di perangkat dan browser yang dipakai mencatat.
- Membuka dari ponsel lain atau mode incognito akan menampilkan data kosong.
- Menghapus data situs di browser akan menghapus catatan kas.

Karena itu, gunakan **Pengaturan → Ekspor data** secara berkala. Berkas JSON hasil ekspor
memuat transaksi, foto nota, dan nama lembaga; berkas itu bisa dipulihkan lewat
**Impor data** (data saat ini akan diganti) atau dipindahkan ke perangkat lain.

Aplikasi mulai dengan data kosong. Tombol **Tambah data contoh** mengisi 8 transaksi
contoh untuk latihan, dan transaksi itu bisa dihapus satu per satu.

## Tampilan

Saat halaman dimuat ulang (termasuk refresh), layar sambutan menampilkan maskot
`ropik-1.webp` dengan tulisan **"Halo! Selamat Datang di Kas Remasna!"** selama sekitar
dua detik, lalu memudar.
Maskot `ropik-2.webp` tampil besar di atas dialog PIN dan di pojok kanan bawah halaman
Ringkasan, serta sebagai hiasan di keadaan kosong dan halaman khusus bendahara.

Gambar ada di `public/` dan bisa diganti tanpa mengubah kode, asalkan namanya tetap.

## Deploy ke Vercel

1. Unggah folder ini ke repositori Git (GitHub, GitLab, atau Bitbucket).
2. Di Vercel, pilih **Add New → Project**, lalu impor repositori tersebut.
3. Vercel mendeteksi Vite secara otomatis: build `npm run build`, output `dist`.
4. Deploy. Tidak perlu environment variable, database, atau pengaturan rewrite.

Navigasi memakai hash (`#/transaksi`), jadi halaman bisa di-refresh tanpa 404.
`hero.jpeg` disajikan dari folder `public/`.

## Grafik laporan

Tab **Laporan** berisi dua grafik yang ikut berubah saat bulan diganti:

- **Arus kas 6 bulan** — batang pemasukan (hijau) dan pengeluaran (merah) per bulan.
  Ketuk atau fokuskan satu kolom untuk melihat rincian bulan itu.
- **Komposisi** — donat kategori untuk pengeluaran atau pemasukan, lengkap dengan
  nominal dan persentasenya.

Grafik digambar langsung dengan SVG, tanpa pustaka tambahan, supaya ukuran berkas tetap
kecil dan warnanya konsisten dengan sisa aplikasi.

## Struktur singkat

- `src/App.tsx` — kerangka aplikasi, rute, penjaga mode bendahara, navigasi bawah.
- `src/pages/` — Ringkasan, Transaksi, Laporan, Pengaturan, form catat/ubah.
- `src/lib/auth.tsx` — status mode bendahara, hash PIN, sesi tab.
- `src/lib/storage.ts` — baca/tulis localStorage, validasi impor, ekspor JSON.
- `src/lib/image.ts` — kompres foto nota sebelum disimpan.
- `src/lib/summary.ts` — saldo, total bulanan, pengelompokan per tanggal, per kategori.
- `src/lib/categories.ts` — daftar kategori dan ikonnya.
- `src/components/` — baris transaksi (ikon mata nota), dialog PIN, penampil nota,
  layar sambutan, navigasi, dialog konfirmasi, toast.
- `src/components/charts/` — grafik arus kas dan donat komposisi.
- `src/index.css` — token warna dan tipografi Tailwind v4.

## Catatan

- Ikon aplikasi masih berupa SVG sederhana di `index.html`; ganti dengan logo resmi
  jika sudah ada.
- Warna biru dipakai untuk identitas, hijau untuk pemasukan, merah untuk pengeluaran.
- `hero.jpeg`, `ropik-1.webp`, dan `ropik-2.webp` di root hanyalah salinan asli; berkas
  yang dipakai aplikasi ada di `public/`.
