// Paste your Apps Script Web app URL here (setup steps are in apps-script/Code.gs)
const API_URL = "https://script.google.com/macros/s/AKfycbwhqHTuDVzG74gMw8MmGVvTiHECxI0NW9MQ0Gw_jnQnDIdCgFRUtWVcMwZS4eTOEt-s/exec";

// Values hard-coded in index.html, used until the sheet has its own profile rows
const PROFILE_DEFAULTS = {
    name: "Darlington Ndlela",
    photo: "profile.png",
    title: "Nuclear Science and Technology",
    subtitle: "(Radioecology and Radiation Protection)",
    email: "darlingtonndlela@gmail.com",
    phone: "+263782881303",
    address: "Zvishavane, Zimbabwe",
    orcid: "https://orcid.org/0009-0009-8910-1468",
    linkedin: "http://www.linkedin.com/in/darlington-ndlela",
    summary: "Nuclear Technologist & Computational Safety Specialist specializing in Radioecology and Radiation Safety with a strong foundation in scientific computing. Core expertise spans radiation protection, environmental safety, and applying Genetic Algorithms to Weibull parameter estimation for component reliability analysis. Recipient of multiple international awards with extensive conference presentation experience across innovative nuclear systems and safety research.",
    research_title: "Computational Intelligence in Nuclear Safety",
    research_text: "Focusing on optimizing Nuclear Power Plant (NPP) reliability and safety outcomes through Genetic Algorithms (GA) and Weibull parameter estimation. Dedicated to engineering data-driven analysis workflows for complex engineering contexts, infrastructure reliability assessment, and reinforcing nuclear security culture.",
    certificates_folder: "https://drive.google.com/drive/folders/1tjltKjXomAYr7xfo2IFSl8LM1oyosEe-",
    portfolio: "https://darlingtonndlela.github.io/academic-dossier-admin/",
    cv_cert_heading: "IAEA E-Learning Modules (Completed):"
};

// Certificate groups on the CV, used until the sheet has its own cv_group rows
const DEFAULT_CV_GROUPS = [
    { heading: "Radiation Protection & Safety", useAnd: false, items: [
        "Occupational Radiation Protection (GSG-7)", "Radiation Protection for Occupationally Exposed Workers", "GSR Part 3",
        "Training Courses for Radiation Metrologists", "Radiation Protection in Radiography & C-Arm Fluoroscopy"] },
    { heading: "Nuclear Security & Detection", useAnd: true, items: [
        "Physical Protection", "Nuclear Security Detection Architecture Awareness", "Information and Computer Security",
        "Security of Nuclear Information", "Radiological Crime Scene Management", "Nuclear Security Culture"] },
    { heading: "Safeguards, Law & Standards", useAnd: false, items: [
        "IAEA Safety Standards Overview", "Legal Framework for IAEA Safeguards (Advanced Course)",
        "International Legal Framework for Nuclear Security", "IAEA Nuclear Security Series"] },
    { heading: "Materials & Applications", useAnd: false, items: [
        "Disposal of Radioactive Waste (SSR-5)", "Categorization of Radioactive and Nuclear Material",
        "Practical Uses and Benefits of Radiation Polymer Processing"] }
];

const PROFILE_FIELDS = [
    { key: "photo", label: "Profile picture", type: "photo" },
    { key: "name", label: "Full name" },
    { key: "title", label: "Program" },
    { key: "subtitle", label: "Specialisation (under program)" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address / location" },
    { key: "orcid", label: "ORCID link", hint: "Leave empty to hide." },
    { key: "linkedin", label: "LinkedIn link", hint: "Leave empty to hide." },
    { key: "summary", label: "Professional summary (website About tab)", type: "textarea", hint: "The CV has its own summary in CV maker." },
    { key: "research_title", label: "Research focus title" },
    { key: "research_text", label: "Research focus text", type: "textarea" },
    { key: "certificates_folder", label: "Certificates Google Drive folder link", hint: "The folder shown in the Certificates PDF tab. It must be shared as \"Anyone with the link\"." },
    // Shown on the CV maker page instead of Profile
    { key: "cv_summary", label: "CV professional summary", cv: true, custom: true },
    { key: "portfolio", label: "Academic Portfolio link", cv: true, hint: "Your website's address. Leave empty to use the address this panel is opened from." },
    { key: "cv_cert_heading", label: "Certificates intro line", cv: true }
];

// col = sheet column: 1 Title, 2 Subtitle, 3 Date, 4 Details, 5 Extra
const LINES_HINT = "One bullet point per line.";
const SECTIONS = [
    { key: "education", label: "Education", singular: "education", fields: [
        { col: 1, label: "Institution" }, { col: 2, label: "Degree" }, { col: 3, label: "Year" },
        { col: 4, label: "Details", type: "lines", hint: LINES_HINT }] },
    { key: "experience", label: "Experience", singular: "job", fields: [
        { col: 1, label: "Job title" }, { col: 2, label: "Organisation & place" }, { col: 3, label: "Period" },
        { col: 4, label: "Responsibilities", type: "lines", hint: LINES_HINT }] },
    { key: "awards", label: "Honors & awards", singular: "award", fields: [
        { col: 1, label: "Award" }, { col: 2, label: "Event" }, { col: 3, label: "Date" }] },
    { key: "training", label: "Training & practicals", singular: "training", fields: [
        { col: 1, label: "Programme" }, { col: 2, label: "Organiser" }, { col: 3, label: "Date" }] },
    { key: "iaea_cert", label: "IAEA certificates", singular: "certificate", fields: [
        { col: 1, label: "Certificate" }, { col: 2, label: "Issued by" }, { col: 3, label: "Year" }] },
    { key: "other_cert", label: "Other certificates", singular: "certificate", fields: [
        { col: 1, label: "Certificate" }, { col: 2, label: "Issued by" }, { col: 3, label: "Year" }] },
    { key: "skills", label: "Technical skills", singular: "skill group", fields: [
        { col: 1, label: "Category" }, { col: 2, label: "Skills", type: "textarea", hint: "Separate skills with commas." }] },
    { key: "publications", label: "Publications", singular: "publication", fields: [
        { col: 1, label: "Title" }, { col: 2, label: "Conference / journal" }, { col: 3, label: "Date" }] },
    { key: "referees", label: "Referees", singular: "referee", fields: [
        { col: 1, label: "Name" }, { col: 2, label: "Position" }, { col: 4, label: "Institution" },
        { col: 5, part: 0, label: "Email" }, { col: 5, part: 1, label: "Phone" }] }
];

const COLS = 6;
let state = null;
let current = "profile";
let dirty = false;
let password = "";

const $ = id => document.getElementById(id);

// Small DOM helper: h("div", { class: "x", onclick: fn }, ...children)
function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") el.className = v;
        else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
        else if (v !== false && v != null) el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c != null && c !== false) el.append(c);
    return el;
}

async function api(action, payload = {}, options = {}) {
    // A plain-text body keeps this a "simple" request, so Apps Script needs no CORS preflight
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action, password, ...payload }), ...options });
    if (!res.ok) throw new Error("Server error " + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Request failed.");
    return data;
}

// Sheet rows <-> editable state
function toState(rows) {
    const s = { profile: { ...PROFILE_DEFAULTS }, sections: {}, cvGroups: [], other: [] };
    SECTIONS.forEach(sec => s.sections[sec.key] = []);
    let cvSaved = false;
    rows.forEach(r => {
        const row = Array.from({ length: COLS }, (_, i) => String(r[i] ?? ""));
        const key = row[0].trim().toLowerCase();
        if (key === "profile") {
            s.profile[row[1].trim()] = row[2];
            if (row[1].trim() === "cv_cert_heading") cvSaved = true;
        } else if (key === "cv_group") {
            s.cvGroups.push({ heading: row[1], useAnd: row[2].trim() === "and", items: row[4].split("|").map(t => t.trim()).filter(Boolean) });
        } else if (s.sections[key]) s.sections[key].push(row);
        else if (row.some(c => c.trim())) s.other.push(row); // unknown rows are kept untouched
    });
    if (!cvSaved && !s.cvGroups.length) s.cvGroups = structuredClone(DEFAULT_CV_GROUPS);
    // The CV summary is tailored per application; it starts as a copy of the website summary
    if (s.profile.cv_summary == null) s.profile.cv_summary = s.profile.summary;
    return s;
}

function toRows(s) {
    const rows = PROFILE_FIELDS.map(f => ["profile", f.key, s.profile[f.key] || "", "", "", ""]);
    s.cvGroups.forEach(g => rows.push(["cv_group", g.heading, g.useAnd ? "and" : "", "",
        g.items.map(i => i.replace(/\|/g, "/").trim()).filter(Boolean).join(" | "), ""]));
    SECTIONS.forEach(sec => s.sections[sec.key].forEach(r => {
        if (r.slice(1).some(c => c.trim())) rows.push([sec.key, ...r.slice(1)]);
    }));
    return rows.concat(s.other);
}

function getField(row, f) {
    const v = row[f.col] || "";
    if (f.part != null) return (v.split("|")[f.part] || "").trim();
    if (f.type === "lines") return v.split("|").map(s => s.trim()).filter(Boolean).join("\n");
    return v;
}

function setField(row, f, value) {
    if (f.part != null) {
        const parts = (row[f.col] || "").split("|").map(s => s.trim());
        while (parts.length <= f.part) parts.push("");
        parts[f.part] = value.replace(/\|/g, "/").trim();
        row[f.col] = parts.some(Boolean) ? parts.join(" | ") : "";
    } else if (f.type === "lines") {
        row[f.col] = value.split("\n").map(s => s.trim()).filter(Boolean).join(" | ");
    } else {
        row[f.col] = value;
    }
}

// Status & dirty tracking
function setStatus(text, kind = "") {
    const el = $("status");
    el.textContent = text;
    el.className = "status" + (kind ? " " + kind : "");
}

// Every edit is saved to the sheet automatically, shortly after you stop typing
const AUTOSAVE_DELAY = 1500;
let changeCount = 0;
let saving = false;
let saveTimer;

function markDirty() {
    dirty = true;
    changeCount++;
    setStatus("Saving soon…", "warn");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, AUTOSAVE_DELAY);
    checkLayout();
}

// CV page-length checks: re-measured shortly after every edit, in any section
const SUMMARY_MAX_LINES = 7;
const SUMMARY_ORIGINAL_WORDS = PROFILE_DEFAULTS.summary.split(/\s+/).length;
const PAGE_TOPICS = ["Summary, Education, Publications or Awards", "Experience, Training, Certificates, Skills or Referees"];
let layout = { overflow: [], summaryLines: 0 };
let layoutTimer;

function checkLayout() {
    clearTimeout(layoutTimer);
    layoutTimer = setTimeout(measureCV, 250);
}

function measureCV() {
    if (!state) return;
    const host = $("cvMeasure");
    host.innerHTML = buildCV(state);
    const pages = [...host.querySelectorAll(".cv-page")];
    const pxPerMm = pages[0].offsetWidth / 210;
    const summary = host.querySelector(".cv-summary");
    const lineHeight = summary ? parseFloat(getComputedStyle(summary).lineHeight) : 18;
    layout = {
        // how many text lines each page runs past the bottom of the A4 sheet
        overflow: pages.map(p => Math.max(0, Math.ceil((p.offsetHeight - 297 * pxPerMm - 1) / lineHeight))),
        summaryLines: summary ? Math.round(summary.offsetHeight / lineHeight) : 0
    };
    showLayoutWarnings();
}

function layoutProblems() {
    const problems = layout.overflow.map((lines, i) => lines && (i === 0
        ? `<strong>Page 1 is too long</strong> by about ${lines} line${lines > 1 ? "s" : ""}. The extra text will spill onto page 2. Shorten the ${PAGE_TOPICS[0]}.`
        : `<strong>Page 2 is too long</strong> by about ${lines} line${lines > 1 ? "s" : ""}. The CV will run onto a 3rd page. Shorten the ${PAGE_TOPICS[1]}.`)).filter(Boolean);
    if (layout.summaryLines > SUMMARY_MAX_LINES) {
        problems.unshift(`<strong>The professional summary is ${layout.summaryLines} lines</strong> on the CV. Keep it to ${SUMMARY_MAX_LINES} lines or fewer.`);
    }
    return problems;
}

function showLayoutWarnings() {
    const problems = layoutProblems();
    const banner = $("layoutWarning");
    banner.innerHTML = problems.map(p => `<p>⚠ ${p}</p>`).join("");
    banner.hidden = !problems.length;

    const meter = $("summaryMeter");
    if (meter) {
        const words = (state.profile.cv_summary || "").trim().split(/\s+/).filter(Boolean).length;
        meter.textContent = `${layout.summaryLines} of ${SUMMARY_MAX_LINES} lines on the CV · ${words} words (your original had ${SUMMARY_ORIGINAL_WORDS})`;
        meter.className = layout.summaryLines > SUMMARY_MAX_LINES ? "over" : "ok";
    }

    // Mark where each overflowing page is cut off in the preview
    document.querySelectorAll(".cv-preview .cv-page").forEach((page, i) => {
        page.querySelector(".cv-cutline")?.remove();
        if (layout.overflow[i]) page.append(h("div", { class: "cv-cutline" }));
    });
}

// Asks before exporting a CV that won't fit on two pages
function confirmLayout() {
    measureCV();
    const problems = layoutProblems();
    if (!problems.length) return true;
    const text = problems.map(p => "• " + p.replace(/<[^>]+>/g, "")).join("\n");
    return confirm(text + "\n\nExport the CV anyway?");
}

window.addEventListener("beforeunload", e => {
    if (dirty) { e.preventDefault(); e.returnValue = ""; }
});

// Save straight away when the page is hidden (switching apps on a phone, closing the tab)
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && dirty && state) save({ keepalive: true });
});

// Rendering
function render() {
    renderNav();
    const section = SECTIONS.find(s => s.key === current);
    const view = section ? renderSection(section) : current === "cv" ? renderCvMaker() : renderProfile();
    $("editor").replaceChildren(...view);
}

function renderNav() {
    const item = (key, label, count) => h("button", {
        type: "button",
        class: "nav-btn" + (current === key ? " active" : ""),
        onclick: () => { current = key; render(); window.scrollTo(0, 0); }
    }, h("span", {}, label), count != null ? h("span", { class: "nav-count" }, String(count)) : null);

    $("sectionNav").replaceChildren(
        item("profile", "Profile & About"),
        item("cv", "CV maker"),
        ...SECTIONS.map(sec => item(sec.key, sec.label, state.sections[sec.key].length))
    );
}

function inputField(label, type, value, onChange, hint) {
    const multiline = type === "textarea" || type === "lines";
    const control = multiline ? h("textarea", { rows: type === "lines" ? 4 : 5 }) : h("input", { type: "text" });
    control.value = value;
    control.addEventListener("input", () => onChange(control.value));
    return h("label", { class: "field" + (multiline ? " wide" : "") },
        h("span", { class: "field-label" }, label),
        control,
        hint ? h("small", { class: "muted" }, hint) : null);
}

function renderProfile() {
    return [
        h("header", { class: "panel-head" },
            h("div", {},
                h("h2", {}, "Profile & About"),
                h("p", { class: "muted" }, "Picture, name and contact details in the sidebar, and the About tab."))),
        h("div", { class: "card fields" }, PROFILE_FIELDS.filter(f => !f.cv).map(f => f.type === "photo"
            ? photoField(f)
            : inputField(f.label, f.type, state.profile[f.key] || "", v => { state.profile[f.key] = v; markDirty(); }, f.hint)))
    ];
}

function photoField(f) {
    const preview = h("img", { class: "photo-preview", alt: "Profile picture preview" });
    const url = h("input", { type: "text", placeholder: "profile.png or https://…" });
    const status = h("small", { class: "muted" }, "Upload a new picture, or paste an image link.");
    const file = h("input", { type: "file", accept: "image/png,image/jpeg,image/webp", hidden: true });
    const button = h("button", { type: "button", class: "btn", onclick: () => file.click() }, "Upload new picture");

    const showPreview = () => { preview.src = url.value.trim() || "profile.png"; };
    url.value = state.profile[f.key] || "";
    showPreview();
    url.addEventListener("input", () => { state.profile[f.key] = url.value.trim(); markDirty(); showPreview(); });

    file.addEventListener("change", async () => {
        const chosen = file.files[0];
        if (!chosen) return;
        button.disabled = true;
        status.textContent = "Uploading…";
        try {
            const dataUrl = await resizeImage(chosen, 800);
            const { url: uploaded } = await api("upload", { dataUrl, name: chosen.name.replace(/\.\w+$/, "") + ".jpg" });
            url.value = uploaded;
            state.profile[f.key] = uploaded;
            markDirty();
            showPreview();
            status.textContent = "Uploaded and saved.";
        } catch (err) {
            status.textContent = "Upload failed: " + err.message;
        } finally {
            button.disabled = false;
            file.value = "";
        }
    });

    return h("div", { class: "field wide" },
        h("span", { class: "field-label" }, f.label),
        h("div", { class: "photo-row" }, preview, h("div", { class: "photo-controls" }, button, url, status)),
        file);
}

// Shrinks large photos before upload so they load fast on the page
function resizeImage(file, maxSize) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(img.src);
            resolve(canvas.toDataURL("image/jpeg", 0.9));
        };
        img.onerror = () => reject(new Error("Could not read that image."));
        img.src = URL.createObjectURL(file);
    });
}

// CV maker: choose which certificates go on the CV, in which groups and order, with a live preview
function renderCvMaker() {
    const preview = h("div", { class: "cv-preview" });
    const refresh = () => {
        preview.innerHTML = buildCV(state);
        showLayoutWarnings(); // redraw the cut-off lines; checkLayout() re-measures shortly after
    };
    const changed = () => { markDirty(); refresh(); };
    const certTitles = key => state.sections[key].map(r => r[1].trim()).filter(Boolean);
    const used = new Set(state.cvGroups.flatMap(g => g.items));

    const moveIn = (list, i, delta) => {
        [list[i], list[i + delta]] = [list[i + delta], list[i]];
        markDirty();
        render();
    };

    const certOptions = (key, label) => h("optgroup", { label },
        certTitles(key).map(t => h("option", { value: t }, (used.has(t) ? "✓ " : "") + t)));

    const groupCard = (g, i) => {
        const select = h("select", { "aria-label": "Add a certificate to this group" },
            h("option", { value: "" }, "+ Add a certificate…"),
            certOptions("iaea_cert", "IAEA certificates"),
            certOptions("other_cert", "Other certificates"));
        select.addEventListener("change", () => {
            if (!select.value) return;
            g.items.push(select.value);
            markDirty();
            render();
        });

        return h("article", { class: "card entry" },
            h("div", { class: "entry-head" },
                h("span", { class: "entry-num" }, "Group " + (i + 1)),
                h("div", { class: "entry-actions" },
                    h("button", { type: "button", class: "icon-btn", title: "Move group up", "aria-label": "Move group up", disabled: i === 0, onclick: () => moveIn(state.cvGroups, i, -1) }, "↑"),
                    h("button", { type: "button", class: "icon-btn", title: "Move group down", "aria-label": "Move group down", disabled: i === state.cvGroups.length - 1, onclick: () => moveIn(state.cvGroups, i, 1) }, "↓"),
                    h("button", { type: "button", class: "icon-btn danger", onclick: () => {
                        if (!confirm(`Delete the group "${g.heading || "untitled"}"?`)) return;
                        state.cvGroups.splice(i, 1);
                        markDirty();
                        render();
                    } }, "Delete"))),
            h("div", { class: "fields" },
                inputField("Group heading", "text", g.heading, v => { g.heading = v; changed(); })),
            h("div", { class: "item-list" }, g.items.map((text, j) => {
                const input = h("input", { type: "text", "aria-label": "Name on CV" });
                input.value = text;
                input.addEventListener("input", () => { g.items[j] = input.value; changed(); });
                return h("div", { class: "item-row" }, input,
                    h("button", { type: "button", class: "icon-btn", "aria-label": "Move up", disabled: j === 0, onclick: () => moveIn(g.items, j, -1) }, "↑"),
                    h("button", { type: "button", class: "icon-btn", "aria-label": "Move down", disabled: j === g.items.length - 1, onclick: () => moveIn(g.items, j, 1) }, "↓"),
                    h("button", { type: "button", class: "icon-btn danger", "aria-label": "Remove from CV", onclick: () => { g.items.splice(j, 1); markDirty(); render(); } }, "✕"));
            })),
            h("div", { class: "add-row" }, select,
                h("button", { type: "button", class: "btn", onclick: () => { g.items.push(""); markDirty(); render(); } }, "+ Custom text")),
            h("label", { class: "check", style: "margin-top: 12px" },
                h("input", { type: "checkbox", checked: g.useAnd, onchange: e => { g.useAnd = e.target.checked; changed(); } }),
                "Join the last two with \"and\" instead of a comma"));
    };

    const view = [
        h("header", { class: "panel-head" },
            h("div", {},
                h("h2", {}, "CV maker"),
                h("p", { class: "muted" }, "The CV uses everything in the other sections. Here you choose which certificates go on it, and in what order.")),
            h("button", { type: "button", class: "btn primary", onclick: printCV }, "Print CV")),
        h("div", { class: "card fields" },
            summaryField(changed),
            PROFILE_FIELDS.filter(f => f.cv && !f.custom).map(f =>
                inputField(f.label, f.type, state.profile[f.key] || "", v => { state.profile[f.key] = v; changed(); }, f.hint))),
        h("header", { class: "panel-head" },
            h("div", {},
                h("h2", {}, "Certificate groups"),
                h("p", { class: "muted" }, "Each group becomes one bullet on the CV. You can shorten the names. They change only on the CV.")),
            h("button", { type: "button", class: "btn", onclick: () => {
                state.cvGroups.push({ heading: "", useAnd: false, items: [] });
                markDirty();
                render();
            } }, "+ Add group")),
        ...state.cvGroups.map(groupCard),
        h("header", { class: "panel-head" }, h("h2", {}, "Preview")),
        preview
    ];
    preview.innerHTML = buildCV(state);
    checkLayout();
    return view;
}

// The CV's own summary (separate from the website's About tab), with a live line counter
function summaryField(changed) {
    const field = inputField("CV professional summary", "textarea", state.profile.cv_summary || "",
        v => { state.profile.cv_summary = v; changed(); }, " ");
    field.querySelector("small").id = "summaryMeter";
    field.querySelector("textarea").rows = 7;
    return field;
}

const cvFileName = () => (state.profile.name || "CV").toUpperCase() + " RESUME";

async function printCV() {
    if (!confirmLayout()) return;
    $("cvPrint").innerHTML = buildCV(state);
    await document.fonts.ready; // Android has no Calibri; wait for the Carlito web font
    const title = document.title;
    document.title = cvFileName(); // default PDF file name
    // Android opens the print screen without pausing, so restore the title afterwards
    window.addEventListener("afterprint", () => { document.title = title; }, { once: true });
    window.print();
}

function renderSection(sec) {
    const list = state.sections[sec.key];
    return [
        h("header", { class: "panel-head" },
            h("div", {},
                h("h2", {}, sec.label),
                h("p", { class: "muted" }, `${list.length} ${list.length === 1 ? "entry" : "entries"} · shown on the page in this order`)),
            h("button", { type: "button", class: "btn primary", onclick: () => addEntry(sec) }, "+ Add " + sec.singular)),
        ...(list.length ? list.map((row, i) => entryCard(sec, row, i, list.length)) : [h("p", { class: "empty" }, "Nothing here yet.")])
    ];
}

function entryCard(sec, row, i, total) {
    return h("article", { class: "card entry" },
        h("div", { class: "entry-head" },
            h("span", { class: "entry-num" }, "#" + (i + 1)),
            h("div", { class: "entry-actions" },
                h("button", { type: "button", class: "icon-btn", title: "Move up", "aria-label": "Move up", disabled: i === 0, onclick: () => moveEntry(sec, i, -1) }, "↑"),
                h("button", { type: "button", class: "icon-btn", title: "Move down", "aria-label": "Move down", disabled: i === total - 1, onclick: () => moveEntry(sec, i, 1) }, "↓"),
                h("button", { type: "button", class: "icon-btn danger", onclick: () => deleteEntry(sec, i) }, "Delete"))),
        h("div", { class: "fields" }, sec.fields.map(f =>
            inputField(f.label, f.type, getField(row, f), v => { setField(row, f, v); markDirty(); }, f.hint))));
}

function addEntry(sec) {
    state.sections[sec.key].push([sec.key, "", "", "", "", ""]);
    markDirty();
    render();
    const cards = $("editor").querySelectorAll(".entry");
    const last = cards[cards.length - 1];
    last.scrollIntoView({ behavior: "smooth", block: "center" });
    last.querySelector("input, textarea").focus({ preventScroll: true });
}

function moveEntry(sec, i, delta) {
    const list = state.sections[sec.key];
    [list[i], list[i + delta]] = [list[i + delta], list[i]];
    markDirty();
    render();
}

function deleteEntry(sec, i) {
    const title = state.sections[sec.key][i][1] || "this entry";
    if (!confirm(`Delete "${title}"?`)) return;
    state.sections[sec.key].splice(i, 1);
    markDirty();
    render();
}

async function save(options = {}) {
    clearTimeout(saveTimer);
    if (!state) return;
    if (saving) { saveTimer = setTimeout(save, AUTOSAVE_DELAY); return; } // edits made during a save go out next
    saving = true;
    const savedChange = changeCount;
    setStatus("Saving…");
    try {
        await api("save", { rows: toRows(state) }, options);
        if (changeCount === savedChange) {
            dirty = false;
            setStatus("All changes saved", "ok");
        }
    } catch (err) {
        setStatus("Not saved: " + err.message + ". Retrying…", "error");
        saveTimer = setTimeout(save, 10000);
    } finally {
        saving = false;
    }
}

// Sign in / out
async function signIn(pw) {
    password = pw;
    const { rows } = await api("load");
    state = toState(rows);
    try { sessionStorage.setItem("dossierAdminPw", pw); } catch (e) {}
    $("loginView").hidden = true;
    $("appView").hidden = false;
    setStatus("All changes saved");
    render();
    checkLayout();
}

function signOut() {
    if (dirty && !confirm("Your latest changes are still saving. Log out anyway?")) return;
    clearTimeout(saveTimer);
    dirty = false;
    password = "";
    state = null;
    try { sessionStorage.removeItem("dossierAdminPw"); } catch (e) {}
    $("appView").hidden = true;
    $("loginView").hidden = false;
    $("passwordInput").value = "";
}

function showSetupNote() {
    $("loginView").replaceChildren(h("div", { class: "card setup-note" },
        h("h1", {}, "Almost ready"),
        h("p", { class: "muted" }, "The admin panel is not connected to your Google Sheet yet."),
        h("ol", {},
            h("li", {}, "Follow the setup steps at the top of ", h("code", {}, "apps-script/Code.gs"), "."),
            h("li", {}, "Paste the Web app URL into ", h("code", {}, "API_URL"), " at the top of ", h("code", {}, "admin.js"), "."),
            h("li", {}, "Reload this page."))));
}

function init() {
    // Lets the panel install as an app (and be packaged as an Android APK)
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

    if (API_URL.includes("PASTE_YOUR")) return showSetupNote();

    $("loginForm").addEventListener("submit", async e => {
        e.preventDefault();
        $("loginBtn").disabled = true;
        $("loginError").textContent = "";
        try {
            await signIn($("passwordInput").value);
        } catch (err) {
            $("loginError").textContent = err.message;
        } finally {
            $("loginBtn").disabled = false;
        }
    });
    $("saveBtn").addEventListener("click", () => save());
    $("printBtn").addEventListener("click", printCV);
    // Re-measure once web fonts arrive, since line lengths depend on them
    document.fonts.addEventListener("loadingdone", checkLayout);
    $("logoutBtn").addEventListener("click", signOut);
    document.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && state) {
            e.preventDefault();
            save();
        }
    });

    let saved = null;
    try { saved = sessionStorage.getItem("dossierAdminPw"); } catch (e) {}
    if (saved) signIn(saved).catch(() => { try { sessionStorage.removeItem("dossierAdminPw"); } catch (e) {} });
}

init();
