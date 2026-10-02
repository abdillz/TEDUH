# Prototipe TEDUH

Aplikasi web progresif (PWA) untuk Lomba Esai WOUNDFEST 2026, subtema Luka Kanker.
TEDUH adalah pendamping keluarga dalam merawat luka kanker di rumah dan terhubung ke dasbor perawat puskesmas.
Tanpa framework dan tanpa proses build: cukup `index.html`, `css/style.css`, dan `js/app.js`.

## Struktur folder

```
teduh-prototype/
  index.html
  css/style.css
  js/config.js      (nomor telepon, nama perawat, nama pasien contoh)
  js/app.js         (semua layar, mesin aturan Lampu Waspada, dasbor perawat)
  icons/            (ikon PWA)
  manifest.webmanifest
  sw.js             (cache agar tetap terbuka saat sinyal lemah)
  vercel.json
```

## Deploy ke Vercel

**Cara 1 (paling cepat, tanpa GitHub)**
1. Buka https://vercel.com/new dan login.
2. Pilih opsi upload atau deploy folder, lalu seret folder `teduh-prototype`.
3. Framework Preset: **Other**. Build Command dan Output Directory dikosongkan.
4. Klik **Deploy**.

**Cara 2 (lewat GitHub)**
1. Unggah isi folder ini ke repositori GitHub baru.
2. Di Vercel klik **Add New > Project**, pilih repositori tersebut.
3. Framework Preset: **Other**, lalu **Deploy**.

**Cara 3 (Vercel CLI)**
```
npm i -g vercel
cd teduh-prototype
vercel
```

Setelah terbit, tautannya dimasukkan ke esai pada kalimat prototipe, dan kode QR-nya bisa dibuat dari tautan itu.

## Alur yang bisa dicoba

Sisi keluarga:
1. Masuk dan setujui penggunaan data.
2. Beranda, lalu **Mulai cek**.
3. Pindai luka (foto contoh atau kamera ponsel), pengukuran AI disimulasikan.
4. Cek gejala lima langkah: bau, cairan, nyeri, perdarahan, kulit sekitar luka (plus demam dan lemas).
5. Hasil dengan **Lampu Waspada** hijau, kuning, atau merah. Hasil merah langsung membuka layar Bantuan.
6. Panduan rawat per gejala (dengan tombol Tandai), Ruang tenang (latihan napas, bacaan singkat, catatan perasaan), dan Riwayat luka (grafik dan lampu harian).

Sisi perawat:
- Dasbor antrean diurutkan merah, kuning, hijau, dengan batas waktu respons (merah 1 jam, kuning 24 jam).
- Hasil cek keluarga langsung masuk ke antrean sebagai pasien P-017 dengan tanda **Baru**.
- Detail pasien: tren luas luka, foto diburamkan, rencana rawat, catatan perawat, tombol Hubungi dan Jadwalkan.

## Panel demo (kiri layar, atau tombol "Panel demo" di ponsel)

- **Lihat sebagai**: berpindah antara Keluarga dan Perawat.
- **Lompat ke layar**: langsung ke layar tertentu, praktis untuk tangkapan layar Gambar 2 esai dan lampiran.
- **Simulasikan hasil cek**: langsung menampilkan hasil Hijau, Kuning, atau Merah dan mengirimnya ke dasbor perawat.
- **Reset data demo**: mengembalikan semua data contoh ke awal.

## Aturan Lampu Waspada (rancangan awal)

- **Merah**: perdarahan tidak berhenti setelah ditekan sekitar 5 menit, nyeri 8 atau lebih, demam, atau pasien sangat lemas.
- **Kuning**: bau tercium dari dekat walau balutan terpasang atau lebih, cairan lebih dari 5 lembar kasa basah, nyeri 5 sampai 7, kulit sekitar luka kemerahan atau lecet, atau luas luka bertambah 10% atau lebih dibanding minggu lalu.
- **Hijau**: selain itu.
- Bila beberapa kriteria muncul bersamaan, dipakai tingkat yang paling tinggi.

Ambang ini selaras dengan Lampiran 2 dokumen pendukung esai dan perlu divalidasi perawat luka bersertifikat sebelum dipakai.

## Mengatur nomor telepon

Buka `js/config.js`. Isi `NURSE_PHONE` dan ubah `REAL_CALLS` menjadi `true` agar tombol telepon benar-benar menelepon.
Secara bawaan semua panggilan hanya disimulasikan supaya tidak ada yang tidak sengaja menelepon layanan darurat saat demo.

## Catatan jujur untuk juri dan tim

- Semua data adalah contoh dan hanya tersimpan di memori browser (hilang saat halaman dimuat ulang).
- **Pengukuran luka oleh AI disimulasikan.** Prototipe ini menunjukkan alur dan antarmuka, bukan model visi komputer yang sudah dilatih. Di esai, sebut sebagai "prototipe antarmuka".
- Foto yang dipilih hanya ditampilkan di perangkat dan tidak diunggah ke server.
- Konten panduan dan ruang tenang bersumber dari Hidayat et al. (2024) dan Nigrelli et al. (2025), disusun ulang untuk keperluan prototipe, dan perlu divalidasi perawat sebelum dipakai.
- Hasil Lampu Waspada bukan diagnosis dan tidak menggantikan pemeriksaan perawat atau dokter.
- Font (Atkinson Hyperlegible dan Literata) dimuat dari Google Fonts. Tanpa internet, tampilan memakai font sistem.
