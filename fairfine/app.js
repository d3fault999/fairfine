// app.js — core data logic for FairFine
// Using localStorage as the data layer for now (no backend for the demo)

const DB_KEY = "fairfine_fines_v1";

// ---- low level storage helpers ----
function getFines() {
  const raw = localStorage.getItem(DB_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveFines(fines) {
  localStorage.setItem(DB_KEY, JSON.stringify(fines));
}

// ---- fine operations ----
function addFine({ studentId, reason, location, photo }) {
  const fines = getFines();
  const fine = {
    id: "FN" + Date.now().toString().slice(-6),
    studentId: studentId.trim().toUpperCase(),
    reason,
    location,
    time: new Date().toISOString(),
    photo: photo || null,
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

// ---- seed demo data if empty ----
function seedIfEmpty() {
  if (getFines().length > 0) return;
  const demo = [
    { studentId: "22BCE1042", reason: "No ID card", location: "Academic Block", photo: null },
    { studentId: "22BCE1042", reason: "Misconduct", location: "Hostel Gate", photo: null },
    { studentId: "22BCE1078", reason: "No ID card", location: "Library", photo: null },
    { studentId: "22BCE1099", reason: "Other", location: "Main Gate", photo: null }
  ];
  demo.forEach(addFine);
  // mark one as appealed for demo purposes
  const fines = getFines();
  if (fines[1]) submitAppeal(fines[1].id, "I had left my ID at the hostel by mistake, showed my library card instead.");
}
