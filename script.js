/* ==========================================================
   TechHer AI — script.js
   Berisi 3 fitur JavaScript utama:
   1. Toggle menu navigasi mobile (hamburger menu)
   2. Tombol CTA yang scroll otomatis ke section demo roadmap
   3. Fitur utama: AI Learning Roadmap Generator
      - Mengambil input form (latar belakang, minat, waktu belajar)
      - Memanggil Gemini API (Google AI) untuk membuat roadmap belajar personal
      - Jika tidak ada API key, sistem memakai generator roadmap lokal
        (rule-based) sebagai fallback, supaya halaman tetap berfungsi
        tanpa error meskipun tanpa koneksi API
   ========================================================== */


/* ----------------------------------------------------------
   FITUR 1: Toggle menu navigasi mobile
   Saat lebar layar kecil, menu nav disembunyikan dan diganti
   tombol hamburger. Klik tombol ini akan membuka/menutup menu
   dengan menambah/menghapus class "nav-open" pada navbar.
   ---------------------------------------------------------- */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navbar = document.querySelector('.navbar');

hamburgerBtn.addEventListener('click', () => {
  const isOpen = navbar.classList.toggle('nav-open');
  hamburgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

// Tutup menu mobile otomatis kalau salah satu link nav diklik
document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navbar.classList.remove('nav-open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  });
});


/* ----------------------------------------------------------
   FITUR 2: Tombol CTA scroll ke section demo
   Semua tombol ajakan (hero, navbar, CTA penutup) mengarahkan
   pengguna ke form roadmap generator di section #demo.
   ---------------------------------------------------------- */
function scrollToDemo() {
  document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('heroCtaBtn').addEventListener('click', scrollToDemo);
document.getElementById('navCtaBtn').addEventListener('click', scrollToDemo);
document.getElementById('finalCtaBtn').addEventListener('click', scrollToDemo);


/* ----------------------------------------------------------
   FITUR 3: AI Learning Roadmap Generator
   ---------------------------------------------------------- */
const roadmapForm = document.getElementById('roadmapForm');
const roadmapResult = document.getElementById('roadmapResult');
const generateBtn = document.getElementById('generateBtn');

// Nama model Gemini yang dipakai untuk generate roadmap
const GEMINI_MODEL = 'gemini-2.5-flash';

roadmapForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const background = document.getElementById('background').value;
  const interest = document.getElementById('interest').value;
  const hours = document.getElementById('hours').value;
  const apiKey = document.getElementById('apiKeyInput').value.trim();

  // Tampilkan status loading dulu sambil menunggu proses AI
  renderLoading();
  generateBtn.disabled = true;

  try {
    let steps;

    if (apiKey) {
      // Jika user mengisi API key sendiri, coba panggil Gemini API
      steps = await generateRoadmapWithGemini({ background, interest, hours, apiKey });
    } else {
      // Tanpa API key, pakai generator roadmap lokal (rule-based)
      steps = generateRoadmapLocally({ background, interest, hours });
    }

    renderRoadmap(steps, apiKey ? 'Dibuat oleh Gemini AI' : 'Contoh roadmap dari sistem bawaan');
  } catch (error) {
    // Kalau API gagal (key salah, kuota habis, dsb), jangan biarkan halaman error.
    // Tampilkan pesan yang jelas, lalu tetap kasih roadmap dari sistem lokal.
    console.error('Gagal memanggil Gemini API:', error);
    const fallbackSteps = generateRoadmapLocally({ background, interest, hours });
    renderRoadmap(
      fallbackSteps,
      'Contoh roadmap dari sistem bawaan (API tidak dapat dihubungi)'
    );
  } finally {
    generateBtn.disabled = false;
  }
});

/**
 * Memanggil Gemini API (Google Generative Language API) untuk membuat
 * roadmap belajar personal berdasarkan input pengguna.
 * Mengembalikan array of { title, desc } yang siap dirender ke timeline.
 */
async function generateRoadmapWithGemini({ background, interest, hours, apiKey }) {
  const prompt = `Buatkan roadmap belajar singkat untuk seorang perempuan yang ingin career switching ke bidang ${interest}.
Latar belakangnya: ${background}. Waktu belajar tersedia: ${hours} per minggu.
Berikan tepat 4 tahap roadmap. Balas HANYA dalam format JSON array tanpa teks lain, dengan struktur:
[{"title": "nama tahap singkat", "desc": "penjelasan singkat 1 kalimat"}, ...]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API merespons dengan status ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Bersihkan kemungkinan markdown code fence (```json ... ```) dari respons AI
  const cleanText = rawText.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleanText);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Format respons Gemini tidak sesuai yang diharapkan');
  }

  return parsed;
}

/**
 * Generator roadmap sederhana berbasis aturan (tanpa API).
 * Dipakai sebagai fallback supaya fitur roadmap tetap berfungsi
 * walau pengguna tidak mengisi API key.
 */
function generateRoadmapLocally({ background, interest, hours }) {
  const interestLabel = {
    'web-development': 'web development',
    'data-analyst': 'data analyst',
    'ui-ux': 'UI/UX design'
  }[interest] || 'teknologi';

  const paceNote = {
    '<5 jam': 'dengan ritme santai, sedikit tiap hari',
    '5-10 jam': 'dengan ritme konsisten beberapa jam tiap minggu',
    '10+ jam': 'dengan ritme intensif karena waktumu cukup luang'
  }[hours] || 'sesuai waktu luangmu';

  const baseSteps = {
    'web-development': [
      { title: 'Fondasi HTML & CSS', desc: 'Pelajari struktur halaman web dan dasar styling.' },
      { title: 'JavaScript dasar', desc: 'Pahami logika pemrograman dan interaktivitas halaman.' },
      { title: 'Bangun 1 project portofolio', desc: 'Praktikkan langsung lewat project nyata sederhana.' },
      { title: 'Lamar posisi junior', desc: 'Siapkan CV dan portofolio, mulai melamar magang/junior.' }
    ],
    'data-analyst': [
      { title: 'Dasar statistik & Excel', desc: 'Kuasai konsep data dan pengolahan angka dasar.' },
      { title: 'SQL & visualisasi data', desc: 'Belajar mengambil dan menyajikan data secara efektif.' },
      { title: 'Project analisis nyata', desc: 'Olah dataset publik jadi insight yang bisa dipresentasikan.' },
      { title: 'Bangun portofolio analisis', desc: 'Kumpulkan hasil project untuk dilamar ke posisi analyst.' }
    ],
    'ui-ux': [
      { title: 'Dasar prinsip desain', desc: 'Pahami layout, warna, dan tipografi untuk produk digital.' },
      { title: 'Tools desain (Figma)', desc: 'Latihan membuat wireframe dan prototipe interaktif.' },
      { title: 'Studi kasus desain', desc: 'Rancang ulang 1 aplikasi/website sebagai studi kasus.' },
      { title: 'Susun portofolio UI/UX', desc: 'Kumpulkan studi kasus untuk dilamar ke posisi designer.' }
    ]
  };

  const steps = baseSteps[interest] || baseSteps['web-development'];

  // Tambahkan catatan latar belakang & ritme belajar ke tahap pertama
  return steps.map((step, index) => {
    if (index === 0) {
      return {
        title: step.title,
        desc: `${step.desc} Cocok untuk kamu yang berlatar belakang ${background}, dipelajari ${paceNote}.`
      };
    }
    return step;
  });
}

/** Menampilkan status loading di area hasil roadmap, lengkap dengan spinner */
function renderLoading() {
  roadmapResult.innerHTML = `
    <p class="roadmap-status">
      <span class="roadmap-spinner" aria-hidden="true"></span>
      Sedang menyusun roadmap terbaikmu...
    </p>`;
}

/** Merender roadmap dalam bentuk timeline vertikal */
function renderRoadmap(steps, sourceLabel) {
  const listItems = steps
    .map(
      (step) => `
        <li>
          <p class="step-title">${escapeHtml(step.title)}</p>
          <p class="step-desc">${escapeHtml(step.desc)}</p>
        </li>`
    )
    .join('');

  roadmapResult.innerHTML = `
    <ul class="roadmap-timeline">${listItems}</ul>
    <span class="roadmap-source-tag">${escapeHtml(sourceLabel)}</span>
  `;
}

/** Mencegah karakter HTML berbahaya ikut ter-render (proteksi dasar XSS) */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
