// Inisialisasi peta dengan zoom tanpa batas
const map = L.map('map', { minZoom: 1, maxZoom: 20 }).setView([0, 0], 2);

// Tambahkan tile OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Variabel untuk menyimpan titik dan poligon
let latlngs = [];
let polygon = null;

// Fungsi untuk menghitung luas menggunakan algoritma Shoelace
// Fungsi untuk menghitung luas menggunakan proyeksi planar (UTM)
function calculateArea(coords) {
    const R = 6378137; // Radius bumi dalam meter
  
    // Konversi ke proyeksi UTM zona 49S (Indonesia)
    const proj4WGS84 = '+proj=longlat +datum=WGS84 +no_defs';
    const proj4UTM = '+proj=utm +zone=49 +south +datum=WGS84 +units=m +no_defs';
    
    const projectedCoords = coords.map(({ lat, lng }) => {
      const [x, y] = proj4(proj4WGS84, proj4UTM, [lng, lat]);
      return { x, y };
    });
  
    // Gunakan algoritma Shoelace pada koordinat proyeksi planar
    let area = 0;
    projectedCoords.forEach((point, i) => {
      const next = projectedCoords[(i + 1) % projectedCoords.length];
      area += point.x * next.y - next.x * point.y;
    });
  
    return Math.abs(area / 2); // Luas dalam meter persegi
  }
  
// Event klik untuk menambahkan titik
map.on('click', (e) => {
  const { lat, lng } = e.latlng;
  latlngs.push([lat, lng]);

  // Gambar ulang poligon
  if (polygon) map.removeLayer(polygon);
  polygon = L.polygon(latlngs, { color: 'blue' }).addTo(map);

  // Hitung luas dan tampilkan
  if (latlngs.length > 2) {
    const area = calculateArea(latlngs.map(([lat, lng]) => ({ lat, lng })));
    document.getElementById('area').textContent = area.toFixed(2);
  }
});

// Fungsi untuk reset
document.getElementById('reset').addEventListener('click', (e) => {
  e.stopPropagation();
  latlngs = [];
  if (polygon) map.removeLayer(polygon);
  document.getElementById('area').textContent = '0';
});

// Event untuk mencari kota
document.getElementById('goToCity').addEventListener('click', async () => {
  const cityName = document.getElementById('cityName').value.trim();
  if (!cityName) {
    alert('Masukkan nama kota!');
    return;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`
    );
    const data = await response.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      map.setView([lat, lon], 14); // Zoom ke kota
      document.getElementById('cityInput').style.display = 'none'; // Sembunyikan input kota
    } else {
      alert('Kota tidak ditemukan.');
    }
  } catch (error) {
    alert('Gagal mengambil lokasi kota.');
  }
});
