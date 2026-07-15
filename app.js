// app.js — core data logic for FairFine
// Using localStorage as the data layer for now (no backend for the demo)

const DB_KEY = "fairfine_fines_v1";

// ---- auth config (demo only — this is a client-side hackathon build,   ----
// ---- so these are NOT real secrets; a real deployment needs a backend) ----
const GUARD_USERS = {
  "warden1": "123",
  "warden2": "123"
};
const ADMIN_PASSWORD = "admin@123";

const GUARD_SESSION_KEY = "fairfine_guard_session";
const ADMIN_SESSION_KEY = "fairfine_admin_session";

// ---- security helper: escape any user-supplied text before it goes into
// ---- innerHTML, so stored data can never break out into markup/script ----
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---- registration number validation: exactly 6 digits ----
const REG_NUMBER_PATTERN = /^[0-9]{6}$/;
function isValidRegNumber(value) {
  return REG_NUMBER_PATTERN.test(String(value).trim());
}

// ---- low level storage helpers ----
function getFines() {
  const raw = localStorage.getItem(DB_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveFines(fines) {
  localStorage.setItem(DB_KEY, JSON.stringify(fines));
}

// ---- fine operations ----
function addFine({ studentId, reason, otherDetail, location, photo, issuedBy }) {
  const fines = getFines();
  const fine = {
    id: "FN" + Date.now().toString().slice(-6),
    studentId: studentId.trim().toUpperCase(),
    reason,
    otherDetail: reason === "Other" ? (otherDetail || "").trim() : null,
    location,
    time: new Date().toISOString(),
    photo: photo || null, // base64 data URL — mandatory at the UI layer
    issuedBy: issuedBy || null,
    status: "unpaid", // unpaid | appealed | approved | rejected
    appeal: null // { text, submittedAt }
  };
  fines.unshift(fine);
  saveFines(fines);
  return fine;
}

function getFinesForStudent(studentId) {
  return getFines().filter(
    f => f.studentId === studentId.trim().toUpperCase()
  );
}

function submitAppeal(fineId, text) {
  const fines = getFines();
  const fine = fines.find(f => f.id === fineId);
  if (!fine) return null;
  fine.status = "appealed";
  fine.appeal = { text, submittedAt: new Date().toISOString() };
  saveFines(fines);
  return fine;
}

function resolveAppeal(fineId, decision) {
  // decision: "approved" or "rejected"
  const fines = getFines();
  const fine = fines.find(f => f.id === fineId);
  if (!fine) return null;
  fine.status = decision;
  saveFines(fines);
  return fine;
}

// ---- formatting helpers ----
function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit"
  });
}

function badgeClass(status) {
  return { unpaid: "unpaid", appealed: "appealed", approved: "approved", rejected: "rejected" }[status] || "unpaid";
}

function displayReason(fine) {
  if (fine.reason === "Other" && fine.otherDetail) {
    return `Other — ${fine.otherDetail}`;
  }
  return fine.reason;
}

// ---- tiny placeholder image used only for seeded demo fines ----
const PLACEHOLDER_PHOTO = "data:image/svg+xml;base64," + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#3a3f52"/><text x="50%" y="50%" font-size="10" fill="#9aa0b0" text-anchor="middle" dy=".3em" font-family="sans-serif">demo</text></svg>'
);

// ---- seed demo data if empty ----
function seedIfEmpty() {
  if (getFines().length > 0) return;
  const demo = [
    { studentId: "100234", reason: "No ID card", location: "Academic Block", photo: PLACEHOLDER_PHOTO, issuedBy: "warden1" },
    { studentId: "100234", reason: "Misconduct", location: "Hostel Gate", photo: PLACEHOLDER_PHOTO, issuedBy: "warden1" },
    { studentId: "100578", reason: "No ID card", location: "Library", photo: PLACEHOLDER_PHOTO, issuedBy: "warden2" },
    { studentId: "100910", reason: "Other", otherDetail: "Riding a bike inside the academic block corridor", location: "Main Gate", photo: PLACEHOLDER_PHOTO, issuedBy: "warden2" }
  ];
  demo.forEach(addFine);
  // mark one as appealed for demo purposes
  const fines = getFines();
  if (fines[1]) submitAppeal(fines[1].id, "I had left my ID at the hostel by mistake, showed my library card instead.");
}
