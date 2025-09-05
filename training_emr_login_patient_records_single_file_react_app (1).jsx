import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ------------------------------
// Helper utils (storage, ids, dates)
// ------------------------------
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "—");

const LS_KEYS = {
  users: "emr_users",
  session: "emr_session",
  patientsPrefix: (id) => `emr_patients_${id}`,
};

const getUsers = () => JSON.parse(localStorage.getItem(LS_KEYS.users) || "[]");
const setUsers = (arr) => localStorage.setItem(LS_KEYS.users, JSON.stringify(arr));
const getSession = () => JSON.parse(localStorage.getItem(LS_KEYS.session) || "null");
const setSession = (obj) => localStorage.setItem(LS_KEYS.session, JSON.stringify(obj));
const clearSession = () => localStorage.removeItem(LS_KEYS.session);

const getPatients = (userId) => {
  return JSON.parse(localStorage.getItem(LS_KEYS.patientsPrefix(userId)) || "[]");
};
const setPatients = (userId, arr) => {
  localStorage.setItem(LS_KEYS.patientsPrefix(userId), JSON.stringify(arr));
};

// Simple (non-crypto) hash for demo only
const hash = (str) => btoa(unescape(encodeURIComponent(str)));

// ------------------------------
// App Shell
// ------------------------------
export default function App() {
  const [session, setSessionState] = useState(getSession());

  useEffect(() => {
    // Seed a demo account once
    const users = getUsers();
    const hasDemo = users.some((u) => u.email === "demo@classroom.edu");
    if (!hasDemo) {
      const demoUser = { id: uid(), name: "Demo Instructor", email: "demo@classroom.edu", password: hash("demo1234") };
      users.push(demoUser);
      setUsers(users);
      const samplePatients = sampleData();
      setPatients(demoUser.id, samplePatients);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-sky-900 text-slate-100">
      <GridBg />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <Logo />
            <h1 className="text-2xl font-semibold tracking-tight">Training EMR</h1>
          </div>
          <div className="text-xs opacity-70">For classroom use only — no real PHI</div>
        </header>

        <main className="mt-8">
          <AnimatePresence mode="wait">
            {!session ? (
              <motion.div key="auth" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <Auth onLogin={(s) => { setSessionState(s); setSession(s); }} />
              </motion.div>
            ) : (
              <motion.div key="app" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <EMR session={session} onLogout={() => { clearSession(); setSessionState(null); }} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="relative">
      <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 shadow-lg shadow-sky-500/25" />
      <div className="absolute inset-0 grid place-items-center text-white font-bold">EMR</div>
    </div>
  );
}

function GridBg() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.06)_1px,_transparent_0)] [background-size:16px_16px]"
      aria-hidden
    />
  );
}

// ------------------------------
// Auth (Sign Up / Sign In)
// ------------------------------
function Auth({ onLogin }) {
  const [mode, setMode] = useState("signin");
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
        <h2 className="mb-2 text-xl font-semibold">{mode === "signin" ? "Welcome back" : "Create your classroom account"}</h2>
        <p className="mb-6 text-sm opacity-80">
          {mode === "signin"
            ? "Sign in to access the training EMR. Use the demo credentials to explore quickly."
            : "Sign up as a student to practice entering, updating, and reviewing patient charts."}
        </p>
        {mode === "signin" ? <SignIn onLogin={onLogin} /> : <SignUp onSignedUp={(s) => onLogin(s)} />}
        <div className="mt-6 text-sm opacity-90">
          {mode === "signin" ? (
            <>Don’t have an account?{" "}
              <button className="font-medium text-sky-300 hover:text-sky-200" onClick={() => setMode("signup")}>Sign up</button>.
            </>
          ) : (
            <>Already registered?{" "}
              <button className="font-medium text-sky-300 hover:text-sky-200" onClick={() => setMode("signin")}>Sign in</button>.
            </>
          )}
        </div>
        <div className="mt-4 text-xs opacity-70">
          Demo: <span className="font-mono">demo@classroom.edu</span> / <span className="font-mono">demo1234</span>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8 backdrop-blur-xl shadow-2xl">
        <h3 className="mb-4 text-lg font-semibold">What’s inside</h3>
        <ul className="space-y-3 text-sm opacity-90">
          <li>• Secure-feeling UI for classroom practice (not HIPAA for real use)</li>
          <li>• Add, edit, and delete patient records; view chart summaries</li>
          <li>• Track demographics, allergies, meds, conditions, vitals, notes</li>
          <li>• Search, sort, and filter patients; quick actions and keyboard focus</li>
          <li>• Local-only storage so each student has their own sandbox</li>
        </ul>
      </div>
    </div>
  );
}

function SignIn({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== hash(password)) {
      setError("Invalid email or password.");
      return;
    }
    const session = { userId: user.id, name: user.name, email: user.email };
    onLogin(session);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@classroom.edu" required />
      <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button className="w-full rounded-xl bg-sky-500 px-4 py-2 font-medium text-white shadow hover:bg-sky-400 focus:outline-none focus:ring focus:ring-sky-300">
        Sign in
      </button>
    </form>
  );
}

function SignUp({ onSignedUp }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== password2) return setError("Passwords do not match.");

    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return setError("An account with this email already exists.");
    }

    const newUser = { id: uid(), name: name.trim() || "Student", email: email.trim(), password: hash(password) };
    users.push(newUser);
    setUsers(users);

    // Seed with a couple of blank patients for practice
    setPatients(newUser.id, sampleData().slice(0, 2));

    onSignedUp({ userId: newUser.id, name: newUser.name, email: newUser.email });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Full name" value={name} onChange={setName} placeholder="Alex Student" required />
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@classroom.edu" required />
      <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" required />
      <Field label="Confirm password" type="password" value={password2} onChange={setPassword2} placeholder="Re-enter password" required />
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button className="w-full rounded-xl bg-emerald-500 px-4 py-2 font-medium text-white shadow hover:bg-emerald-400 focus:outline-none focus:ring focus:ring-emerald-300">
        Create account
      </button>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }) {
  const id = useMemo(() => uid(), []);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm opacity-90">{label}{required && <span className="text-rose-300">*</span>}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-slate-100 placeholder:text-slate-300/60 focus:border-sky-400 focus:outline-none focus:ring focus:ring-sky-300/30"
      />
    </div>
  );
}

// ------------------------------
// EMR Area
// ------------------------------
function EMR({ session, onLogout }) {
  const [patients, setPatientsState] = useState(() => getPatients(session.userId));
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "lastName", dir: "asc" });
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    setPatients(session.userId, patients);
  }, [patients, session.userId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...patients];
    if (q) {
      list = list.filter((p) =>
        [p.firstName, p.lastName, p.mrn, p.allergies, p.conditions, p.medications].join(" ").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const A = (a[sort.key] || "").toString().toLowerCase();
      const B = (b[sort.key] || "").toString().toLowerCase();
      return sort.dir === "asc" ? (A > B ? 1 : A < B ? -1 : 0) : (A < B ? 1 : A > B ? -1 : 0);
    });
    return list;
  }, [patients, query, sort]);

  const openNew = () => { setEditing(null); setShowEditor(true); };
  const openEdit = (p) => { setEditing(p); setShowEditor(true); };
  const remove = (id) => {
    if (confirm("Delete this patient? This cannot be undone.")) {
      setPatientsState((prev) => prev.filter((p) => p.id !== id));
      if (activeId === id) setActiveId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-xl">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="grow">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, MRN, meds, conditions…"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 placeholder:text-slate-300/60 focus:border-sky-400 focus:outline-none focus:ring focus:ring-sky-300/30"
            />
          </div>
          <button onClick={openNew} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium shadow hover:bg-emerald-400">+ New patient</button>
          <button onClick={onLogout} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium shadow hover:bg-slate-700">Log out</button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5 text-left text-sm">
              <tr>
                {[
                  ["lastName", "Patient"],
                  ["mrn", "MRN"],
                  ["dob", "DOB"],
                  ["sex", "Sex"],
                  ["lastVisit", "Last Visit"],
                ].map(([key, label]) => (
                  <th key={key} className="px-4 py-3">
                    <button
                      className="inline-flex items-center gap-1 hover:text-sky-300"
                      onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))}
                    >
                      {label}
                      {sort.key === key && <span className="text-xs opacity-70">{sort.dir === "asc" ? "▲" : "▼"}</span>}
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm">
              {filtered.map((p) => (
                <tr key={p.id} className={"hover:bg-white/5 " + (activeId === p.id ? "bg-white/10" : "") }>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => setActiveId(p.id)}>
                    <div className="font-medium">{p.lastName}, {p.firstName}</div>
                    <div className="text-xs opacity-70">Allergies: {p.allergies || "None"}</div>
                  </td>
                  <td className="px-4 py-3 font-mono">{p.mrn}</td>
                  <td className="px-4 py-3">{fmtDate(p.dob)}</td>
                  <td className="px-4 py-3">{p.sex || "—"}</td>
                  <td className="px-4 py-3">{p.lastVisit ? fmtDate(p.lastVisit) : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => openEdit(p)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs hover:bg-sky-500">Edit</button>
                      <button onClick={() => remove(p.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs hover:bg-rose-500">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm opacity-70">No patients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-xl">
          <h3 className="mb-3 text-lg font-semibold">{activeId ? "Chart summary" : "Getting started"}</h3>
          {!activeId ? (
            <ul className="list-disc pl-6 text-sm opacity-90">
              <li>Select a patient from the table to view their chart.</li>
              <li>Use <span className="rounded bg-white/10 px-1">+ New patient</span> to add a new chart.</li>
              <li>Everything is saved locally for your login only.</li>
            </ul>
          ) : (
            <PatientSummary patient={patients.find((p) => p.id === activeId)} />
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 backdrop-blur-xl shadow-xl">
          <h3 className="mb-3 text-lg font-semibold">Account</h3>
          <div className="text-sm opacity-90">
            <div className="mb-1 font-medium">{session.name}</div>
            <div className="mb-3 text-xs opacity-80">{session.email}</div>
            <button onClick={onLogout} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium shadow hover:bg-slate-700">Log out</button>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {showEditor && (
          <Modal onClose={() => setShowEditor(false)}>
            <PatientEditor
              initial={editing}
              onSave={(record) => {
                setPatientsState((prev) => {
                  if (editing) return prev.map((p) => (p.id === record.id ? record : p));
                  return [record, ...prev];
                });
                setShowEditor(false);
                if (!editing) setActiveId(record.id);
              }}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function PatientSummary({ patient }) {
  if (!patient) return null;
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <Info label="Name" value={`${patient.firstName} ${patient.lastName}`} />
        <Info label="MRN" value={patient.mrn} mono />
        <Info label="DOB" value={fmtDate(patient.dob)} />
        <Info label="Sex" value={patient.sex || "—"} />
        <Info label="Last Visit" value={patient.lastVisit ? fmtDate(patient.lastVisit) : "—"} />
        <Info label="Phone" value={patient.phone || "—"} />
      </div>
      <Info label="Allergies" value={patient.allergies || "None"} />
      <Info label="Medications" value={patient.medications || "None"} />
      <Info label="Conditions" value={patient.conditions || "None"} />
      <Info label="Vitals" value={`HR ${patient.vitals?.hr || "—"} • BP ${patient.vitals?.bp || "—"} • Temp ${patient.vitals?.temp || "—"}`} />
      <Info label="Notes" value={patient.notes || "(no notes)"} />
    </div>
  );
}

function Info({ label, value, mono = false }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide opacity-60">{label}</div>
      <div className={("mt-0.5 " + (mono ? "font-mono" : ""))}>{value}</div>
    </div>
  );
}

function Modal({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-slate-950/70" onClick={onClose} />
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        {children}
      </motion.div>
    </motion.div>
  );
}

function PatientEditor({ initial, onSave }) {
  const [form, setForm] = useState(() => initial || blankPatient());
  const [errors, setErrors] = useState({});

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.firstName?.trim()) e.firstName = "Required";
    if (!form.lastName?.trim()) e.lastName = "Required";
    if (!form.mrn?.trim()) e.mrn = "Required";
    if (!form.dob) e.dob = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...form, updatedAt: new Date().toISOString() });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <h3 className="text-lg font-semibold">{initial ? "Edit patient" : "New patient"}</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Labeled id="firstName" label="First name" error={errors.firstName}>
          <input className="input" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
        </Labeled>
        <Labeled id="lastName" label="Last name" error={errors.lastName}>
          <input className="input" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
        </Labeled>
        <Labeled id="mrn" label="MRN" error={errors.mrn}>
          <input className="input font-mono" value={form.mrn} onChange={(e) => update("mrn", e.target.value)} />
        </Labeled>
        <Labeled id="dob" label="Date of birth" error={errors.dob}>
          <input type="date" className="input" value={form.dob || ""} onChange={(e) => update("dob", e.target.value)} />
        </Labeled>
        <Labeled id="sex" label="Sex">
          <select className="input" value={form.sex} onChange={(e) => update("sex", e.target.value)}>
            <option value="">—</option>
            <option>Female</option>
            <option>Male</option>
            <option>Intersex</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>
        </Labeled>
        <Labeled id="phone" label="Phone">
          <input className="input" placeholder="(555) 123‑4567" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </Labeled>
        <Labeled id="lastVisit" label="Last visit">
          <input type="date" className="input" value={form.lastVisit || ""} onChange={(e) => update("lastVisit", e.target.value)} />
        </Labeled>
        <Labeled id="hr" label="Heart rate (bpm)">
          <input className="input" value={form.vitals.hr} onChange={(e) => update("vitals", { ...form.vitals, hr: e.target.value })} />
        </Labeled>
        <Labeled id="bp" label="Blood pressure">
          <input className="input" placeholder="120/80" value={form.vitals.bp} onChange={(e) => update("vitals", { ...form.vitals, bp: e.target.value })} />
        </Labeled>
        <Labeled id="temp" label="Temperature (°F)">
          <input className="input" value={form.vitals.temp} onChange={(e) => update("vitals", { ...form.vitals, temp: e.target.value })} />
        </Labeled>
      </div>

      <Labeled id="allergies" label="Allergies">
        <input className="input" placeholder="Penicillin; Peanuts" value={form.allergies} onChange={(e) => update("allergies", e.target.value)} />
      </Labeled>

      <Labeled id="medications" label="Medications">
        <input className="input" placeholder="Metformin; Lisinopril" value={form.medications} onChange={(e) => update("medications", e.target.value)} />
      </Labeled>

      <Labeled id="conditions" label="Conditions">
        <input className="input" placeholder="Hypertension; Type 2 diabetes" value={form.conditions} onChange={(e) => update("conditions", e.target.value)} />
      </Labeled>

      <Labeled id="notes" label="Clinical notes">
        <textarea className="input min-h-[120px]" placeholder="Chief complaint, HPI, assessment, plan…" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
      </Labeled>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => onSave && window.dispatchEvent(new Event('keydown'))} className="hidden" />
        <button type="submit" className="rounded-xl bg-sky-600 px-4 py-2 font-medium hover:bg-sky-500">Save</button>
      </div>

      <style>{`
        .input { @apply w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 placeholder:text-slate-300/60 focus:border-sky-400 focus:outline-none focus:ring focus:ring-sky-300/30; }
      `}</style>
    </form>
  );
}

function Labeled({ id, label, children, error }) {
  return (
    <label htmlFor={id} className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm opacity-90">{label}</span>
        {error && <span className="text-xs text-rose-300">{error}</span>}
      </div>
      {children}
    </label>
  );
}

// ------------------------------
// Data models
// ------------------------------
function blankPatient() {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    firstName: "",
    lastName: "",
    mrn: generateMRN(),
    dob: "",
    sex: "",
    phone: "",
    lastVisit: todayISO(),
    allergies: "",
    medications: "",
    conditions: "",
    vitals: { hr: "", bp: "", temp: "" },
    notes: "",
  };
}

function generateMRN() {
  const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");
  return `MRN-${digits}`;
}

function sampleData() {
  return [
    {
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      firstName: "Ariana",
      lastName: "Lopez",
      mrn: generateMRN(),
      dob: "1992-07-16",
      sex: "Female",
      phone: "(555) 201-7789",
      lastVisit: todayISO(),
      allergies: "Penicillin",
      medications: "Sertraline 50mg qd",
      conditions: "GAD",
      vitals: { hr: "74", bp: "118/78", temp: "98.6" },
      notes: "Follow-up in 6 weeks; CBT referral.",
    },
    {
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      firstName: "Marcus",
      lastName: "Nguyen",
      mrn: generateMRN(),
      dob: "1984-11-02",
      sex: "Male",
      phone: "(555) 554-1130",
      lastVisit: "2025-07-22",
      allergies: "Peanuts",
      medications: "Metformin 500mg bid",
      conditions: "T2DM",
      vitals: { hr: "86", bp: "132/84", temp: "98.8" },
      notes: "A1C 7.2 → reinforce diet/exercise; consider uptitration.",
    },
    {
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      firstName: "Sara",
      lastName: "Bennett",
      mrn: generateMRN(),
      dob: "2001-03-29",
      sex: "Female",
      phone: "(555) 330-4040",
      lastVisit: "2025-05-10",
      allergies: "None",
      medications: "Albuterol PRN",
      conditions: "Mild intermittent asthma",
      vitals: { hr: "70", bp: "110/70", temp: "98.4" },
      notes: "Seasonal triggers; spacer technique reviewed.",
    },
  ];
}
