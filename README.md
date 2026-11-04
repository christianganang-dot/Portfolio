# Christian Ganang — Local Portfolio

Web lokal berbahasa Inggris, menggunakan Node.js tanpa dependency tambahan.

## Menjalankan

Klik dua kali `start.bat`, lalu buka **http://127.0.0.1:3000**. Biarkan terminalnya terbuka. Launcher bisa menggunakan Node bawaan Codex di komputer ini. Alternatif: jalankan `node server.mjs` dari folder ini. Memerlukan Node.js 22 atau lebih baru.

## Admin

Buka **http://127.0.0.1:3000/admin** dan buat password minimal 12 karakter pada penggunaan pertama. Tidak ada password bawaan. Gunakan halaman ini untuk mengedit profil, menambahkan atau mengedit proyek, mengunggah cover PNG/JPEG/WebP maksimal 5 MB, serta memilih proyek unggulan untuk beranda. Gunakan teks berbahasa Inggris.

Empat proyek awal dan profil diambil dari screenshot desain yang diberikan. Keempat cover memakai render asli dari folder Google Drive yang diberikan, dan sudah disalin ke `public/assets` agar tetap tampil tanpa internet. Foto profil belum disertakan. Kamu bisa mengganti cover dari admin. Tidak ada hasil render atau foto pribadi buatan.

Profil, proyek, gambar, dan hash password tersimpan di `data/portfolio.json`, di luar folder publik. Cadangkan folder `data` untuk menyimpan semuanya. Menghapus data browser tidak menghapus proyek. Jika lupa password, hentikan server, cadangkan file data, lalu ubah nilai `owner` menjadi `null` di file JSON itu; jangan hapus proyek. Jalankan kembali dan buat password baru.

Server hanya dapat diakses dari komputer ini dan menggunakan cookie sesi HttpOnly selama 8 jam. Menutup atau memulai ulang server mengakhiri sesi. Ini belum dikonfigurasi untuk hosting publik; sebelum online diperlukan konfigurasi HTTPS dan autentikasi deployment yang sesuai.

## Fitur

- Tampilan studio berwarna ivory, terracotta, lilac, dan sage; galeri dengan komposisi asimetris, transisi saat scroll, dan dukungan reduced motion.
- Ganang Bloom: bentuk 3D empat kelopak yang menjadi motif identitas bersama logo. Tiga bentuk (Bloom, Loop, Pebble) berpindah dengan morph, tiga material, mode mesh/surface, pencahayaan responsif terhadap pointer, drag atau panah keyboard untuk memutar, Reset view, dan Space untuk jeda. Ini studi bentuk interaktif untuk website, terpisah dari karya portofolio.
- Animasi judul bertahap, kartu proyek dengan tilt/parallax ringan, tombol yang bereaksi terhadap pointer, sorotan halus pada kontak, dan indikator progres scroll. Efek gerak mengikuti prefers-reduced-motion; animasi objek berhenti ketika di luar viewport.
- Kursor Bloom dengan pengikut lembut, petunjuk View/Drag/Zoom, dan gema klik. Kursor bawaan dipakai pada kolom teks, dialog, admin, perangkat sentuh, dan reduced motion. Ikon toolkit, mesh, reset, dan indikator proses memiliki respons hover ringan.
- Proses kreatif interaktif: bentuk, material, lalu pencahayaan.
- Halaman portfolio dengan pencarian, filter kategori, pilihan gallery/index, tombol Surprise me, dan tautan Google Drive yang diberikan.
- Halaman tersendiri untuk setiap proyek, viewer render ukuran penuh, tag, cerita proyek, dan link eksternal opsional.
- Tombol kontak membuka compose Gmail ke `christianganang@gmail.com`. Pengunjung tetap menulis dan mengirim pesannya sendiri. Ada tautan email biasa sebagai alternatif.
- Workspace pemilik dengan login, profil, tambah/edit/hapus proyek, cover, dan pilihan featured.

## Pemeriksaan

Jalankan `node --test`. Pengujian menggunakan direktori data sementara dan tidak mengubah portofolio aslimu.
