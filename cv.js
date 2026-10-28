// Builds the printable two-page CV (layout follows the PDF resume) from the admin panel's state

function esc(text) {
    return String(text ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// "Dec 2022 - Jan 2024" -> "Dec 2022 – Jan 2024"
const cvDash = text => String(text || "").trim().replace(/ - /g, " – ");

// Adds a full stop unless the text already ends with punctuation
const cvDot = text => /[.!?:]$/.test(String(text).trim()) ? "" : ".";

const cvSplit = text => String(text || "").split("|").map(t => t.trim()).filter(Boolean);

// "Related Coursework: Nuclear…" -> bold label before the colon
function cvLabelled(text) {
    const m = /^([^:]{1,40}):\s*(.*)$/.exec(text);
    return m ? `<strong>${esc(m[1])}:</strong> ${esc(m[2])}` : esc(text);
}

function cvBullets(details, cls = "") {
    const items = cvSplit(details);
    return items.length ? `<ul class="${cls}">${items.map(t => `<li>${cvLabelled(t)}</li>`).join("")}</ul>` : "";
}

function cvLink(url, label) {
    return `<a href="${esc(url)}">${esc(label)}</a>`;
}

function cvBlock(title, body) {
    return body ? `<h2 class="cv-h">${esc(title)}</h2>${body}` : "";
}

function cvJoin(items, useAnd) {
    if (useAnd && items.length > 1) return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
    return items.join(", ");
}

function buildCV(s) {
    const p = s.profile;
    const rows = key => (s.sections[key] || []).filter(r => r[1] && r[1].trim());
    const list = (items, cls = "") => items.length ? `<ul class="${cls}">${items.join("")}</ul>` : "";

    const contact = [p.address, p.phone, p.email].filter(Boolean).map(esc).join(" | ");
    const portfolio = p.portfolio || new URL("index.html", location.href).href;
    const links = [["LinkedIn", p.linkedin], ["ORCID", p.orcid], ["Academic Portfolio", portfolio]]
        .filter(([, url]) => url)
        .map(([label, url]) => cvLink(url, label))
        .join(" | ");

    const education = rows("education").map(([, inst, degree, year, details]) => `
        <div class="cv-inst">${esc(inst)}</div>
        <div class="cv-row cv-degree"><span>${esc(degree)}</span><span>${esc(year)}</span></div>
        ${cvBullets(details, "cv-tall")}`).join("");

    const publications = list(rows("publications").map(([, title, venue, date]) => {
        const rest = [venue, date].filter(Boolean).join(", ");
        return `<li><strong>${esc(title)}</strong>${rest ? ` – ${esc(rest)}${cvDot(rest)}` : ""}</li>`;
    }));

    const awards = list(rows("awards").map(([, title, event, date]) => {
        const rest = cvDash(event) + (date ? ` (${date})` : "");
        return `<li><strong>${esc(title)}:</strong> ${esc(rest)}${cvDot(rest)}</li>`;
    }));

    const experience = rows("experience").map(([, job, org, period, details]) => {
        const [, name, place] = /^([^,]*)(,.*)?$/.exec(org || "");
        return `
        <div class="cv-row cv-job">
            <span><strong>${esc(name)}</strong>${esc(place || "")}${period ? ` | ${esc(cvDash(period))}` : ""}</span>
            <strong>${esc(job)}</strong>
        </div>
        ${cvBullets(details)}`;
    }).join("");

    const training = list(rows("training").map(([, title, organiser, date]) => {
        const rest = [organiser, date].filter(Boolean).join(", ");
        return `<li><strong>${esc(title)}:</strong> ${esc(rest)}${cvDot(rest)}</li>`;
    }));

    const groups = (s.cvGroups || []).filter(g => g.heading.trim() && g.items.some(i => i.trim()));
    const certificates = groups.length ? `
        ${p.cv_cert_heading ? `<p class="cv-sub">${esc(p.cv_cert_heading)}</p>` : ""}
        ${list(groups.map(g => {
            const text = cvJoin(g.items.map(i => i.trim()).filter(Boolean), g.useAnd);
            return `<li><strong>${esc(g.heading)}:</strong> ${esc(text)}${cvDot(text)}</li>`;
        }), "cv-tall")}` : "";

    const skills = list(rows("skills").map(([, category, items]) =>
        `<li><strong>${esc(category)}:</strong> ${esc(items)}${cvDot(items)}</li>`));

    const referees = rows("referees").length ? `<div class="cv-referees">${rows("referees").map(([, name, position, , institution, extra]) => {
        const [email, phone] = String(extra || "").split("|").map(t => t.trim());
        return `<div>
            <p class="cv-ref-name">${esc(name)}</p>
            ${cvSplit(position).map(line => `<p>${esc(line)}</p>`).join("")}
            ${institution ? `<p>${esc(institution)}</p>` : ""}
            ${email ? `<p>${cvLink("mailto:" + email, email)}</p>` : ""}
            ${phone ? `<p>${esc(phone)}</p>` : ""}
        </div>`;
    }).join("")}</div>` : "";

    return `
    <div class="cv">
        <section class="cv-page">
            <h1 class="cv-name">${esc((p.name || "").toUpperCase())}</h1>
            <p class="cv-contact">${contact}</p>
            <p class="cv-contact">${links}</p>
            ${cvBlock("Professional Summary", p.cv_summary ? `<p class="cv-summary">${esc(p.cv_summary)}</p>` : "")}
            ${cvBlock("Education", education)}
            ${cvBlock("Publications & Scientific Conferences", publications)}
            ${cvBlock("Honors & Awards", awards)}
        </section>
        <section class="cv-page">
            ${cvBlock("Relevant Experience", experience)}
            ${cvBlock("Advanced Training & Practicals", training)}
            ${cvBlock("Professional Development & Certifications", certificates)}
            ${cvBlock("Technical Skills", skills)}
            ${cvBlock("Referees", referees)}
        </section>
    </div>`;
}
