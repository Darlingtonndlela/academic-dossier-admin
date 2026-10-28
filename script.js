// Direct Google Sheets CSV endpoint using your Sheet ID
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1eQz1-_C-hvks4QUOibcpWmM8aYXYyFcXXv-FPpqJYy8/export?format=csv";

// Interactive Starfield Animation
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];
const STAR_COUNT = 160;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.3,
            speedX: (Math.random() - 0.5) * 0.15,
            speedY: (Math.random() - 0.5) * 0.15,
            alpha: Math.random() * 0.7 + 0.2,
            fadeSpeed: Math.random() * 0.01 + 0.003
        });
    }
}

function renderStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let star of stars) {
        star.x += star.speedX;
        star.y += star.speedY;

        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        star.alpha += star.fadeSpeed;
        if (star.alpha > 0.9 || star.alpha < 0.2) star.fadeSpeed = -star.fadeSpeed;

        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, star.alpha))})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    requestAnimationFrame(renderStars);
}

window.addEventListener('resize', () => {
    resizeCanvas();
    initStars();
});
resizeCanvas();
initStars();
renderStars();

// Tab Switcher
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const contentBody = document.querySelector('.content-body');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-tab');
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.add('hidden'));

        button.classList.add('active');
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.classList.remove('hidden');
            if (contentBody) contentBody.scrollTop = 0;
        }
    });
});

// CSV Parser (handles quoted cells, including line breaks inside a cell)
function parseCSV(text) {
    const rows = [];
    let row = [];
    let value = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuotes) {
            if (char === '"' && text[i + 1] === '"') {
                value += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                value += char;
            }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ',') {
            row.push(value.trim());
            value = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n') i++;
            row.push(value.trim());
            rows.push(row);
            row = [];
            value = '';
        } else {
            value += char;
        }
    }
    if (value || row.length) {
        row.push(value.trim());
        rows.push(row);
    }
    return rows.slice(1);
}

// Profile rows (section "profile", Title = field name, Subtitle = value) fill the sidebar and About tab
function applyProfile(profile) {
    const setText = (id, key) => {
        const el = document.getElementById(id);
        if (!el || !(key in profile)) return;
        el.textContent = profile[key];
        el.style.display = profile[key] ? '' : 'none';
    };
    const setLink = (id, key) => {
        const el = document.getElementById(id);
        if (!el || !(key in profile)) return;
        if (profile[key]) el.href = profile[key];
        el.style.display = profile[key] ? '' : 'none';
    };

    setText('profileName', 'name');
    setText('profileTitle', 'title');
    setText('profileSubtitle', 'subtitle');
    setText('profileEmail', 'email');
    setText('profilePhone', 'phone');
    setText('profileAddress', 'address');
    setText('summary-container', 'summary');
    setText('researchTitle', 'research_title');
    setText('researchText', 'research_text');
    setLink('profileOrcid', 'orcid');
    setLink('profileLinkedin', 'linkedin');

    if (profile.email) document.getElementById('profileEmail').href = 'mailto:' + profile.email;
    if (profile.name) {
        document.getElementById('profileImage').alt = profile.name;
        document.title = `${profile.name} | Academic & Professional Dossier`;
    }
    if (profile.photo) document.getElementById('profileImage').src = profile.photo;

    const folderId = (profile.certificates_folder || '').match(/folders\/([\w-]+)/)?.[1] || profile.certificates_folder;
    if (folderId && /^[\w-]+$/.test(folderId)) {
        document.getElementById('certsFolderLink').href = `https://drive.google.com/drive/folders/${folderId}`;
        document.getElementById('certsFolderFrame').src = `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;
    }
}

// Built-in offline fallback data
const fallbackRecords = [
    ["education", "Obninsk Institute for Nuclear Power Engineering of the National Research Nuclear University (IATE MEPHI), Russia", "MSc in Nuclear Physics and Technology (Radioecology and Radiation Safety)", "2026", "Related Coursework: Nuclear Infrastructure, Safety of Nuclear Power Engineering, NPP Reliability Analysis, Genetic Algorithms in Safety of NPPs, Dosimetry. | GPA: 4.88/5 (Distinction)", ""],
    ["education", "Midlands State University, Zimbabwe", "BSc (Hons) Computer Science", "2022", "Related Coursework: Information Security, Database Systems, Machine Learning, Data Mining. | Grade: 1st Class Honours", ""],
    ["experience", "Server Technician", "Midlands State University, Gweru", "Dec 2022 - Jan 2024", "Infrastructure Reliability: Managed secure server environments, ensuring data integrity. | Systems Analysis: Maintained critical infrastructure with 99.9% uptime.", ""],
    ["experience", "IT Intern", "Runde Rural District Council, Zvishavane", "Jan 2020 - Feb 2021", "Supported the maintenance of IT systems with a focus on access control. | Documented standardized security procedures.", ""],
    ["awards", "Winner (1st Place)", "5th Joint ICTP-IAEA Workshop on Physics and Technology of Innovative Nuclear Energy Systems (SMR 4226) - International Level", "July 2026", "", ""],
    ["awards", "Winner (3rd Place)", "XXI International Youth Scientific and Practical Conference \"THE FUTURE OF NUCLEAR ENERGY - Atom Future 2025\" - International Level", "Dec 2025", "", ""],
    ["awards", "Prize Winner (2nd Place)", "Obninsk Tech Nuclear Triathlon - International Level", "Winter School 2025", "", ""],
    ["awards", "Grand Prize Participant", "2025 Global Atomic Quiz - International Level", "2025", "", ""],
    ["training", "BFS Complex of Critical Facilities", "Practical training course at SSC RF-IPPE (Rosatom)", "July 2025", "", ""],
    ["training", "International Winter School on Radiochemistry", "Organized by Rosatom & LMSU", "November 2025", "", ""],
    ["training", "Management of Knowledge & Tech in Nuclear Energy", "MEPHI (Obninsk Tech)", "February 2025", "", ""],
    ["training", "Popularization of Peaceful Nuclear Technologies", "NRNU MEPHI (Obninsk Tech)", "June 2025", "", ""],
    ["iaea_cert", "Radiation Protection Training Course for Occupationally Exposed Workers", "IAEA", "2025", "", ""],
    ["iaea_cert", "IAEA Safety Standards Overview", "IAEA", "2025", "", ""],
    ["iaea_cert", "Introduction to Nuclear Security Culture", "IAEA Cyber Learning Platform", "2025", "", ""],
    ["iaea_cert", "Introduction to the International Legal Framework for Nuclear Security", "IAEA Cyber Learning Platform", "2025", "", ""],
    ["iaea_cert", "Radiological Crime Scene Management", "IAEA Cyber Learning Platform", "2025", "", ""],
    ["iaea_cert", "Information and Computer Security", "IAEA Cyber Learning Platform", "2025", "", ""],
    ["iaea_cert", "Physical Protection", "IAEA Cyber Learning Platform", "2025", "", ""],
    ["iaea_cert", "Introduction to and Overview of IAEA Nuclear Security Series Publications", "IAEA Cyber Learning Platform", "2025", "", ""],
    ["iaea_cert", "Nuclear Security Detection Architecture Awareness", "IAEA Cyber Learning Platform", "2025", "", ""],
    ["iaea_cert", "Security of Nuclear Information", "IAEA Cyber Learning Platform", "2025", "", ""],
    ["iaea_cert", "Legal Framework for IAEA Safeguards (Advanced Course)", "IAEA", "2026", "", ""],
    ["iaea_cert", "Categorization of Nuclear Material", "IAEA Cyber Learning Platform", "2026", "", ""],
    ["iaea_cert", "Categorization of Radioactive Material", "IAEA Cyber Learning Platform", "2026", "", ""],
    ["iaea_cert", "Tips & Tricks: Radiation Protection in Radiography", "IAEA", "2026", "", ""],
    ["iaea_cert", "Topic 1: Radiation Protection During C-Arm Fluoroscopy", "IAEA", "2026", "", ""],
    ["iaea_cert", "IAEA Safety Standards Series No. GSR Part 3: Radiation Protection and Safety of Radiation Sources: International Basic Safety Standards", "IAEA", "2026", "", ""],
    ["iaea_cert", "Occupational Radiation Protection based on General Safety Guide No. GSG-7", "IAEA", "2026", "", ""],
    ["iaea_cert", "IAEA Safety Standards Series No. SSR-5: Disposal of Radioactive Waste", "IAEA", "2026", "", ""],
    ["iaea_cert", "E-Learning Course on Practical Uses and Benefits of Radiation Polymer Processing – Level A", "IAEA", "2026", "", ""],
    ["iaea_cert", "Training courses for radiation metrologists: Radiation protection calibrations at SSDLs", "IAEA", "2026", "", ""],
    ["other_cert", "Advanced Training Program: Management of Knowledge and Technologies in the Field of Nuclear Energy (Obninsk Tech Winter School 2025)", "National Research Nuclear University MEPhI", "2025", "", ""],
    ["other_cert", "Award Certificate: 2nd Place, Obninsk Tech Nuclear Triathlon (Team Nuclear Ninja Turtles)", "ROSATOM / OBNINSKTECH / MEPhI", "2025", "", ""],
    ["other_cert", "Certificate of Attendance: VIII International (XXI Regional) Scientific Conference \"Technogenic Systems and Environmental Risk\"", "IATE NRNU MEPhI", "2025", "", ""],
    ["other_cert", "Advanced Training Program: Creative Models of Popularization of Russian Peaceful Nuclear Technologies Abroad (Obninsk Tech Summer University 2025)", "National Research Nuclear University MEPhI", "2025", "", ""],
    ["other_cert", "Practical Training Course at the BFS Complex of Critical Facilities", "SSC RF-IPPE / ROSATOM", "2025", "", ""],
    ["other_cert", "Certificate of Attendance: XI International Scientific and Practical Conference of Young Scientists and Specialists of the Nuclear Industry \"KOMANDA\"", "ROSATOM / SPbGETU \"LETI\" / Atomenergoproekt", "2025", "", ""],
    ["other_cert", "International Winter School on Radiochemistry 2025", "ROSATOM / Lomonosov Moscow State University", "2025", "", ""],
    ["other_cert", "Diploma: Master of All Things Nuclear, Global Atomic Quiz", "International Educational Project Global Atomic Quiz", "2025", "", ""],
    ["other_cert", "Certificate of Attendance: IX International (XXII Regional) Scientific Conference \"Technogenic Systems and Environmental Risk\"", "IATE NRNU MEPhI", "2026", "", ""],
    ["other_cert", "Certificate of Participation: 5th Joint ICTP-IAEA Workshop on Physics and Technology of Innovative Nuclear Energy Systems (smr 4226)", "ICTP / IAEA / UNESCO", "2026", "", ""],
    ["other_cert", "Best Poster Award: 5th Joint ICTP-IAEA Workshop on Physics and Technology of Innovative Nuclear Energy Systems (smr 4226)", "ICTP / IAEA / UNESCO", "2026", "", ""],
    ["other_cert", "International Summer School on Radiochemistry 2026", "ROSATOM / Lomonosov Moscow State University", "2026", "", ""],
    ["other_cert", "Second E-Virtual NewComers4Nuclear (NC4N) Summer School: Nuclear Pathways 2026", "NewComers4Nuclear Global / Women in Nuclear (WiN) Global / Wem'Afrika", "2026", "", ""],
    ["other_cert", "International Youth Forum \"Russia-Africa: Nuclear Education\" (Section: Nuclear Reactors)", "ROSATOM / RUDN University", "2026", "", ""],
    ["other_cert", "Creating and Assessing an Energy Balance with EBS (Energy Balance Studio)", "Climate Compatible Growth / IAEA", "2026", "", ""],
    ["skills", "Nuclear Security", "Threat and Risk Assessment, Information and Computer Security, Nuclear Security Culture, Physical Protection Systems", "", "", ""],
    ["skills", "Programming", "Python (TensorFlow), Java, C++, SQL, PHP, JavaScript, React.js", "", "", ""],
    ["skills", "Tools", "Git, Linux/Windows Server Security, Agile Methodologies", "", "", ""],
    ["publications", "GA-Based Nuclear safety Optimization", "IX International (XXII Regional) Scientific Conference \"Technogenic Systems and Environmental Risk\"", "April 2026", "", ""],
    ["publications", "Genetic Algorithm-Based Optimization for Safety of NPPs", "XI International Scientific and Practical Conference of Young Scientists (KOMANDA)", "September 2025", "", ""],
    ["publications", "Application of Genetic Algorithm for Estimating Weibull Parameters for Incidents at a NPP", "VIII International Scientific Conference \"Technogenic Systems and Environmental Risk\"", "April 2025", "", ""],
    ["publications", "Application of Genetic Algorithms in Nuclear Reactor Safety Optimization", "International Youth Forum \"Russia-Africa: Nuclear Education\"", "February 2025", "", ""],
    ["referees", "Prof. Samokhin Sergeevich Dmitry", "Head of Department | Nuclear Physics and Technology", "", "OINPE, NRNU «MEPHI», Russia", "DSSamokhin@mephi.ru | +79036962068"],
    ["referees", "Prof. Alla Alexandrovna Udalova", "Head of Educational Programme | Radioecology and Radiation Safety", "", "OINPE, NRNU «MEPHI», Russia", "AAUdalova@mephi.ru | +79605193327"],
    ["referees", "Mrs. Noreen Sarai", "Head of Department | Computer Science", "", "MSU, Zimbabwe", "sarain@staff.msu.ac.zw | +263717885469"]
];

function renderRecords(records) {
    const eduEl = document.getElementById('education-container');
    const expEl = document.getElementById('experience-container');
    const awardsEl = document.getElementById('awards-container');
    const trainEl = document.getElementById('training-container');
    const iaeaEl = document.getElementById('iaea-certs-container');
    const otherEl = document.getElementById('other-certs-container');
    const skillsEl = document.getElementById('skills-container');
    const pubsEl = document.getElementById('publications-container');
    const refEl = document.getElementById('referees-container');

    let eduHTML = '', expHTML = '', awardsHTML = '', trainHTML = '';
    let iaeaHTML = '', otherHTML = '', skillsHTML = '', pubsHTML = '', refHTML = '';
    const profile = {};

    records.forEach(([section, title, subtitle, date, details, extra]) => {
        if (!section || !title) return;
        const sec = section.toLowerCase().trim();

        if (sec === 'profile') {
            profile[title.trim()] = subtitle || '';
        } else if (sec === 'education') {
            const bullets = details ? details.split('|').map(d => `<li>${d.trim()}</li>`).join('') : '';
            eduHTML += `
                <article class="info-box">
                    <div class="item-header-row">
                        <h4 class="item-title">${title}</h4>
                        <span class="item-date">${date || ''}</span>
                    </div>
                    <p class="item-meta" style="font-style: italic;">${subtitle || ''}</p>
                    ${bullets ? `<ul class="item-list">${bullets}</ul>` : ''}
                </article>
            `;
        } else if (sec === 'experience') {
            const bullets = details ? details.split('|').map(d => `<li>${d.trim()}</li>`).join('') : '';
            expHTML += `
                <article class="info-box">
                    <div class="item-header-row">
                        <h4 class="item-title">${title}</h4>
                        <span class="item-date">${date || ''}</span>
                    </div>
                    <p class="item-meta">${subtitle || ''}</p>
                    ${bullets ? `<ul class="item-list">${bullets}</ul>` : ''}
                </article>
            `;
        } else if (sec === 'awards') {
            awardsHTML += `<li><strong>${title}:</strong> ${subtitle || ''} ${date ? `(${date})` : ''}</li>`;
        } else if (sec === 'training') {
            trainHTML += `<li><strong>${title}:</strong> ${subtitle || ''} ${date ? `(${date})` : ''}</li>`;
        } else if (sec === 'iaea_cert') {
            iaeaHTML += `<li>${title}${subtitle ? ` – ${subtitle}` : ''}${date ? ` (${date})` : ''}</li>`;
        } else if (sec === 'other_cert') {
            otherHTML += `<li>${title}${subtitle ? ` – ${subtitle}` : ''}${date ? ` (${date})` : ''}</li>`;
        } else if (sec === 'skills') {
            const tags = subtitle ? subtitle.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('') : '';
            skillsHTML += `
                <h4 class="skill-category-title" style="margin-top: ${skillsHTML ? '18px' : '0'};">${title}</h4>
                <div class="tag-cloud">${tags}</div>
            `;
        } else if (sec === 'publications') {
            pubsHTML += `
                <article class="info-box">
                    <div class="item-header-row">
                        <h4 class="item-title">${title}</h4>
                        <span class="item-date">${date || ''}</span>
                    </div>
                    <p class="item-meta">${subtitle || ''}</p>
                </article>
            `;
        } else if (sec === 'referees') {
            const contactParts = extra ? extra.split('|').map(p => p.trim()) : [];
            const email = contactParts[0] || '';
            const phone = contactParts[1] || '';
            refHTML += `
                <article class="info-box">
                    <h4 class="item-title">${title}</h4>
                    <p class="item-meta">${subtitle || ''}</p>
                    ${details ? `<p class="item-meta">${details}</p>` : ''}
                    ${email ? `<p class="item-meta">Email: <a href="mailto:${email}" class="link-accent">${email}</a></p>` : ''}
                    ${phone ? `<p class="item-meta">Phone: ${phone}</p>` : ''}
                </article>
            `;
        }
    });

    if (eduHTML) eduEl.innerHTML = eduHTML;
    if (expHTML) expEl.innerHTML = expHTML;
    if (awardsHTML) awardsEl.innerHTML = awardsHTML;
    if (trainHTML) trainEl.innerHTML = trainHTML;
    if (iaeaHTML) iaeaEl.innerHTML = iaeaHTML;
    if (otherHTML) otherEl.innerHTML = otherHTML;
    if (skillsHTML) skillsEl.innerHTML = skillsHTML;
    if (pubsHTML) pubsEl.innerHTML = pubsHTML;
    if (refHTML) refEl.innerHTML = refHTML;
    applyProfile(profile);
}

// 1. Immediately render fallback so the page never freezes on "Loading..."
renderRecords(fallbackRecords);

// 2. Fetch live data from Google Sheets in the background and update seamlessly
async function fetchSheetData() {
    try {
        const response = await fetch(GOOGLE_SHEET_CSV_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error("HTTP " + response.status);
        const csvText = await response.text();
        const records = parseCSV(csvText);
        if (records.length > 0) {
            renderRecords(records);
        }
    } catch (err) {
        console.warn("Live fetch fallback active (e.g. running offline or file:///):", err);
    }
}

fetchSheetData();