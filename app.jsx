const { useMemo, useState } = React;
const { motion, AnimatePresence } = window.MOTION_SAFE;

const SECTION_TITLES = [
  "A propos de moi",
  "Ce qui me distingue",
  "Mes competences cles",
  "Mes realisations",
  "Ce que je recherche",
];

const DEFAULT_BANNER = "linear-gradient(135deg,#111827 0%,#f97316 55%,#fed7aa 100%)";
const BANNER_OPTIONS = [
  DEFAULT_BANNER,
  "linear-gradient(135deg,#0f172a 0%,#14b8a6 58%,#ccfbf1 100%)",
  "linear-gradient(135deg,#1f2937 0%,#dc2626 55%,#fecaca 100%)",
  "linear-gradient(135deg,#172554 0%,#2563eb 55%,#bfdbfe 100%)",
];

function slugify(value) {
  return String(value || "mon-profil")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "mon-profil";
}

function initials(name) {
  return String(name || "U")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function cleanText(value) {
  return String(value || "")
    .replace(/[\uFFFD\u25A1]/g, "")
    .replace(/\b(CV|curriculum vitae|document joint|fichier transmis|parcours fourni)\b/gi, "parcours")
    .replace(/\b(Action|Impact)\s*:\s*/gi, "")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function looksGarbled(value) {
  const text = String(value || "");
  if (!text.trim()) return false;
  const broken = (text.match(/[\uFFFD\u25A1]/g) || []).length;
  const weirdRuns = (text.match(/[?%/\\[\]{}<>~^|]{3,}/g) || []).length;
  return broken > 0 || weirdRuns > 0;
}

function containsInstructionLeak(value) {
  const text = JSON.stringify(value || "").toLowerCase();
  return [
    "reponds uniquement",
    "json valide",
    "ne repete",
    "instructions",
    "document joint",
    "parcours fourni",
    "placeholder",
  ].some((marker) => text.includes(marker));
}

function section(profile, title) {
  return profile.sections.find((item) => item.title === title)?.body || "";
}

function normalizeLines(value) {
  return cleanText(value)
    .split(/\n|,|;/)
    .map((item) => cleanText(item).replace(/^[-•]\s*/, ""))
    .filter(Boolean);
}

function defaultProfile(name = "Responsable Comptable") {
  return {
    name,
    city: "Dakar, Senegal",
    title: "Responsable Comptable - 9 ans d'experience - Secteur bancaire",
    tagline: "Je transforme les donnees financieres en informations fiables, utiles et faciles a partager.",
    photo: null,
    banner: null,
    generatedBanner: DEFAULT_BANNER,
    slug: slugify(name),
    strengths: ["Rigueur operationnelle", "Precision sous pression", "Pedagogie metier"],
    skills: ["Reporting", "Tresorerie", "Audit", "SAP", "Excel avance", "Management"],
    sections: [
      {
        title: "A propos de moi",
        body: "Je presente un parcours structure autour de la gestion comptable, du reporting financier et du suivi operationnel. J'aime rendre les informations claires, fiables et utiles pour les equipes comme pour les decideurs.",
      },
      {
        title: "Ce qui me distingue",
        body: "Rigueur operationnelle sans lourdeur inutile\nCalme et precision en periode de cloture\nCapacite a expliquer les sujets financiers simplement",
      },
      {
        title: "Mes competences cles",
        body: "Reporting financier\nTresorerie multi-devises\nAudit interne\nSAP Finance\nExcel avance\nManagement d'equipe",
      },
      {
        title: "Mes realisations",
        body: "J'ai coordonne une migration comptable en preservant la continuite d'activite et la fiabilite des donnees.\n\nJ'ai reorganise un suivi de rapprochement bancaire afin de reduire les ecarts recurrents et de rendre les controles plus lisibles.",
      },
      {
        title: "Ce que je recherche",
        body: "Je recherche une opportunite coherente avec mon parcours, mes competences et mon envie de contribuer dans un environnement structure.",
      },
    ],
  };
}

function normalizeProfile(profile) {
  const base = defaultProfile(profile?.name || "Responsable Comptable");
  const merged = { ...base, ...profile };
  merged.slug = slugify(merged.name);
  merged.title = cleanText(merged.title || base.title);
  merged.tagline = cleanText(merged.tagline || base.tagline);
  merged.city = cleanText(merged.city || base.city);
  merged.skills = Array.isArray(merged.skills) ? merged.skills.map(cleanText).filter(Boolean) : base.skills;
  merged.strengths = Array.isArray(merged.strengths) ? merged.strengths.map(cleanText).filter(Boolean) : base.strengths;
  merged.sections = SECTION_TITLES.map((title) => {
    const body = (merged.sections || []).find((item) => item.title === title)?.body;
    return { title, body: cleanText(body || section(base, title)) };
  });
  return merged;
}

function detectProfession(text) {
  const value = text.toLowerCase();
  if (/comptable|finance|audit|tresorer/i.test(value)) return "Professionnel finance et comptabilite";
  if (/commercial|vente|client|prospection/i.test(value)) return "Commercial terrain";
  if (/rh|ressources humaines|recrutement/i.test(value)) return "Assistant ressources humaines";
  if (/developpeur|informatique|web|data/i.test(value)) return "Profil digital et technique";
  if (/administratif|accueil|secretariat/i.test(value)) return "Assistant administratif";
  return "Professionnel polyvalent";
}

function extractKeywords(text) {
  const known = [
    "Excel",
    "Word",
    "PowerPoint",
    "SAP",
    "Reporting",
    "Audit",
    "Tresorerie",
    "Comptabilite",
    "Relation client",
    "Vente",
    "Administration",
    "Classement",
    "Management",
    "Communication",
    "Analyse",
  ];
  const lower = text.toLowerCase();
  const found = known.filter((word) => lower.includes(word.toLowerCase()));
  return found.length ? found.slice(0, 8) : ["Organisation", "Communication", "Fiabilite", "Suivi operationnel"];
}

function localGenerateProfile(currentProfile, sourceText, answers = {}) {
  const source = cleanText(`${sourceText}\n${Object.values(answers).join("\n")}`);
  const profession = detectProfession(source);
  const skills = extractKeywords(source);
  const name = currentProfile.name || "Mon profil";
  const achievementSeed = cleanText(
    Object.values(answers).find((value) => String(value || "").length > 40) ||
      source.split(/\n+/).find((line) => line.length > 60) ||
      "J'ai contribue a structurer le travail, clarifier les priorites et ameliorer le suivi des activites."
  );

  return normalizeProfile({
    ...currentProfile,
    title: profession,
    tagline: `Je valorise un parcours construit avec serieux, des competences directement utiles et une envie claire de progresser.`,
    skills,
    strengths: ["Serieux", "Clarte", "Sens du resultat"],
    sections: [
      {
        title: "A propos de moi",
        body: `Je construis mon parcours autour de competences concretes, d'experiences utiles et d'une volonte de contribuer avec fiabilite. Mon objectif est de rendre mon profil lisible pour les personnes qui peuvent me recommander, me recruter ou collaborer avec moi.`,
      },
      {
        title: "Ce qui me distingue",
        body: "Je travaille avec methode et constance\nJe sais transformer une experience simple en contribution claire\nJe reste attentif aux resultats attendus et a la qualite du suivi",
      },
      {
        title: "Mes competences cles",
        body: skills.join("\n"),
      },
      {
        title: "Mes realisations",
        body: `${achievementSeed}\n\nCette experience montre ma capacite a comprendre un besoin, agir avec methode et produire un resultat utile pour mon environnement professionnel.`,
      },
      {
        title: "Ce que je recherche",
        body: "Je recherche une opportunite coherente avec mes competences, mon niveau d'experience et mon envie de progresser dans un cadre professionnel serieux.",
      },
    ],
  });
}

async function callGroq(messages, maxTokens = 1400) {
  const response = await fetch("/api/profile/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      maxTokens,
      temperature: 0.2,
      top_p: 0.85,
      response_format: { type: "json_object" },
    }),
  });
  if (!response.ok) throw new Error("Groq indisponible");
  const data = await response.json();
  return JSON.parse(data.choices?.[0]?.message?.content || "{}");
}

async function generateProfile(currentProfile, sourceText, answers = {}) {
  const compactSource = cleanText(`${sourceText}\n${Object.entries(answers).map(([key, value]) => `${key}: ${value}`).join("\n")}`).slice(0, 12000);
  if (!compactSource) return normalizeProfile(currentProfile);

  try {
    const facts = await callGroq([
      {
        role: "system",
        content: "Tu extrais uniquement des faits professionnels. Retourne un JSON strict. Ne redige pas le profil final.",
      },
      {
        role: "user",
        content: `Identite connue: ${currentProfile.name}. Donnees utilisateur: ${compactSource}. Champs attendus: metier, ville, secteurs, competences, outils, experiences, realisations, objectif.`,
      },
    ], 1000);

    const draft = await callGroq([
      {
        role: "system",
        content: "Tu rediges un profil professionnel personnel a la premiere personne. Ne mentionne jamais CV, document, fichier, consignes, Action ou Impact. Retourne uniquement un JSON.",
      },
      {
        role: "user",
        content: `Faits: ${JSON.stringify(facts)}. Format: {"title":"","city":"","tagline":"","strengths":[],"skills":[],"sections":[{"title":"A propos de moi","body":""},{"title":"Ce qui me distingue","body":""},{"title":"Mes competences cles","body":""},{"title":"Mes realisations","body":""},{"title":"Ce que je recherche","body":""}]}`,
      },
    ]);

    if (containsInstructionLeak(draft) || looksGarbled(JSON.stringify(draft))) throw new Error("Sortie IA rejetee");
    return normalizeProfile({ ...currentProfile, ...draft, name: currentProfile.name });
  } catch {
    return localGenerateProfile(currentProfile, compactSource, answers);
  }
}

async function extractDocumentText(file) {
  if (!file) return "";
  const formData = new FormData();
  formData.append("cv", file);
  const response = await fetch("/api/profile/extract-cv", { method: "POST", body: formData });
  if (!response.ok) throw new Error("Extraction impossible");
  const data = await response.json();
  return cleanText(data.text || "");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function IconHome({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function TopBar({ loggedIn, setPage, onLogout }) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <button onClick={() => setPage("home")} className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 font-bold text-white">M</span>
          <span className="text-2xl font-bold text-slate-900">mylink<span className="text-orange-500">.org</span></span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => setPage("home")} className="rounded-2xl px-4 py-2 text-slate-700 hover:bg-slate-100">Accueil</button>
          <button onClick={() => setPage("tips")} className="rounded-2xl px-4 py-2 text-slate-700 hover:bg-slate-100">Conseils utiles</button>
          {loggedIn && (
            <>
              <button onClick={() => setPage("dashboard")} className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">Mon profil</button>
              <button onClick={onLogout} className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">Se deconnecter</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</div>;
}

function HomePage({ setPage, loggedIn }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="py-10">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-orange-500">Profil professionnel partageable</p>
          <h1 className="text-5xl font-bold leading-tight text-slate-950">Ton profil merite une page claire, personnelle et credible.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            MyLink t'aide a structurer ton parcours, tes competences, tes realisations et ton objectif pour les partager facilement a ton reseau.
          </p>
          <div className="mt-8 flex gap-3">
            <button onClick={() => setPage(loggedIn ? "dashboard" : "signup")} className="rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-white">Commencer</button>
            <button onClick={() => setPage("tips")} className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">Voir les conseils</button>
          </div>
        </div>
        <ProfileCard profile={defaultProfile("Awa Diallo")} />
      </div>
    </div>
  );
}

function AuthPage({ mode, setPage, onAuth }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <button onClick={() => setPage("home")} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600"><IconHome /> Accueil</button>
      <Card>
        <h1 className="text-2xl font-bold text-slate-950">{mode === "signup" ? "Creer mon compte" : "Connexion"}</h1>
        <div className="mt-6 space-y-4">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom complet" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500" />
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500" />
          <input type="password" placeholder="Mot de passe" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500" />
          <button onClick={() => onAuth({ name: name || email.split("@")[0] || "Utilisateur", email })} className="w-full rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-white">
            {mode === "signup" ? "Recevoir le lien de validation" : "Me connecter"}
          </button>
        </div>
      </Card>
    </div>
  );
}

function DashboardPage({ profile, setProfile, setPage, loggedIn }) {
  const [draft, setDraft] = useState(profile);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const previewProfile = useMemo(() => normalizeProfile(draft), [draft]);

  function updateSection(title, body) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((item) => item.title === title ? { ...item, body } : item),
    }));
  }

  async function applyDocument() {
    if (!file) return;
    setBusy(true);
    try {
      const text = await extractDocumentText(file);
      const generated = await generateProfile(previewProfile, text);
      setDraft(generated);
    } finally {
      setBusy(false);
    }
  }

  function cycleBanner() {
    setDraft((current) => {
      const active = current.generatedBanner || DEFAULT_BANNER;
      const index = BANNER_OPTIONS.indexOf(active);
      return { ...current, generatedBanner: BANNER_OPTIONS[(index + 1) % BANNER_OPTIONS.length] };
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8 flex items-center justify-between">
        <button onClick={() => setPage("home")} className="inline-flex items-center gap-2 text-slate-600"><IconHome /> Accueil</button>
        <button onClick={() => setPage(loggedIn ? "profile-public" : "signup")} className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white">Voir ma page publique</button>
      </div>
      <Card>
        <h1 className="text-3xl font-bold text-slate-950">Mon espace</h1>
        <p className="mt-3 text-slate-600">Modifie chaque partie de ton profil, ajoute une photo, complete avec un document ou reponds a quelques questions guidees.</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="space-y-5">
            <Card className="bg-slate-50 shadow-none">
              <h2 className="font-semibold text-slate-950">Photo et banniere</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-[220px_1fr]">
                <div>
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-slate-200 text-4xl font-semibold text-slate-700">
                    {draft.photo ? <img src={draft.photo} alt={draft.name} className="h-full w-full object-cover" /> : initials(draft.name)}
                  </div>
                  <label className="mt-4 flex w-full cursor-pointer items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 font-semibold">
                    Ajouter une photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (event) => {
                        const nextFile = event.target.files?.[0];
                        if (!nextFile) return;
                        const photo = await fileToDataUrl(nextFile);
                        setDraft((current) => ({ ...current, photo }));
                      }}
                    />
                  </label>
                </div>
                <div>
                  <div className="h-44 rounded-3xl" style={{ background: draft.generatedBanner || DEFAULT_BANNER }} />
                  <button onClick={cycleBanner} className="mt-4 w-full rounded-2xl border border-slate-300 px-4 py-3 font-semibold">Modifier la banniere</button>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-50 shadow-none">
              <h2 className="font-semibold text-slate-950">Completer mon profil</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Tu peux joindre ton document puis appliquer l'analyse, ou repondre a 5 questions ciblees pour enrichir automatiquement les paragraphes.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_130px]">
                <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold">
                  {file ? file.name : "Joins ton CV"}
                  <input type="file" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                </label>
                <button onClick={applyDocument} disabled={!file || busy} className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:bg-slate-400">{busy ? "Analyse..." : "Appliquer"}</button>
              </div>
              <button onClick={() => setPage("questions")} className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold">Repondre a 5 questions</button>
            </Card>

            <Field label="Nom" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
            <Field label="Titre professionnel" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
            <Field label="Accroche" value={draft.tagline} onChange={(value) => setDraft({ ...draft, tagline: value })} />
            {SECTION_TITLES.map((title) => (
              <Field key={title} label={title} value={section(draft, title)} multiline onChange={(value) => updateSection(title, value)} />
            ))}

            <div className="grid gap-3 sm:grid-cols-3">
              <button onClick={() => { setDraft(profile); setFile(null); }} className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">Annuler</button>
              <button onClick={() => setProfile(normalizeProfile(draft))} className="rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-white">Sauvegarder</button>
              <button onClick={() => setPage("share")} className="rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white">Partager mon profil</button>
            </div>
          </div>
          <ProfileCard profile={previewProfile} />
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, multiline = false }) {
  return (
    <label className="block">
      <span className="mb-2 block font-semibold text-slate-700">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={5} className="w-full rounded-2xl border border-slate-300 px-4 py-3 leading-7 outline-none focus:border-orange-500" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500" />
      )}
    </label>
  );
}

function ProfileCard({ profile }) {
  const safe = normalizeProfile(profile);
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="h-48" style={{ background: safe.generatedBanner || DEFAULT_BANNER }} />
      <div className="p-6">
        {safe.photo ? (
          <img src={safe.photo} alt={safe.name} className="-mt-20 h-32 w-32 rounded-3xl border-4 border-white object-cover shadow-md" />
        ) : (
          <div className="-mt-20 flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-white bg-slate-200 text-4xl font-semibold text-slate-700 shadow-md">{initials(safe.name)}</div>
        )}
        <h2 className="mt-4 text-3xl font-bold text-slate-950">{safe.name}</h2>
        <p className="mt-1 font-semibold text-orange-500">{safe.title}</p>
        <p className="mt-4 rounded-3xl bg-slate-50 p-4 italic leading-7 text-slate-700">"{safe.tagline}"</p>
        <div className="mt-6 space-y-6">
          {safe.sections.map((item) => (
            <div key={item.title}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">{item.title}</h3>
              <p className="mt-2 whitespace-pre-line leading-7 text-slate-700">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuestionsPage({ profile, setProfile, setPage }) {
  const questions = [
    ["A propos de moi", "Presente-toi en quelques lignes : qui es-tu et quel type d'opportunite recherches-tu ?"],
    ["Ce qui me distingue", "Qu'est-ce qui te rend fiable, utile ou different dans un cadre professionnel ?"],
    ["Mes competences cles", "Quelles competences, outils ou qualites utilises-tu le plus souvent ?"],
    ["Mes realisations", "Raconte une reussite concrete, meme simple, dont tu es fier."],
    ["Ce que je recherche", "Quel environnement, mission ou formation souhaites-tu trouver maintenant ?"],
  ];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const current = questions[step];

  async function finish() {
    const generated = await generateProfile(profile, "", answers);
    setProfile(generated);
    setPage("dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <button onClick={() => setPage("dashboard")} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600"><IconHome /> Retour</button>
      <Card>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
        </div>
        <p className="text-sm font-semibold text-orange-500">{current[0]}</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">{current[1]}</h1>
        <textarea value={answers[current[0]] || ""} onChange={(event) => setAnswers({ ...answers, [current[0]]: event.target.value })} rows={7} className="mt-6 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500" />
        <div className="mt-5 flex gap-3">
          <button onClick={() => step > 0 ? setStep(step - 1) : setPage("dashboard")} className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold">Retour</button>
          {step < questions.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="flex-1 rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-white">Continuer</button>
          ) : (
            <button onClick={finish} className="flex-1 rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-white">Mettre a jour mon profil</button>
          )}
        </div>
      </Card>
    </div>
  );
}

function SharePage({ profile, setPage }) {
  const safe = normalizeProfile(profile);
  const link = `https://mylink.org/${safe.slug}`;
  const message = `Bonjour,\nJe te partage mon profil professionnel :\n${link}\n\nN'hesite pas a le faire circuler dans ton reseau si une opportunite correspond.`;
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <button onClick={() => setPage("dashboard")} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600"><IconHome /> Retour</button>
      <Card>
        <h1 className="text-3xl font-bold text-slate-950">Partager mon profil</h1>
        <p className="mt-3 text-slate-600">Ton lien est pret a circuler dans ton reseau.</p>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 font-semibold text-slate-800">{link}</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button onClick={() => navigator.clipboard?.writeText(link)} className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">Copier le lien</button>
          <a className="rounded-2xl border border-slate-300 px-4 py-3 text-center font-semibold" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="rounded-2xl border border-slate-300 px-4 py-3 text-center font-semibold" href={`mailto:?subject=${encodeURIComponent("Mon profil professionnel")}&body=${encodeURIComponent(message)}`}>Email</a>
        </div>
        <pre className="mt-5 whitespace-pre-wrap rounded-2xl bg-emerald-50 p-4 text-sm leading-7 text-slate-700">{message}</pre>
      </Card>
    </div>
  );
}

function TipsPage({ setPage }) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <button onClick={() => setPage("home")} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600"><IconHome /> Accueil</button>
      <div className="grid gap-4">
        {[
          ["Soigne ton accroche", "Explique en une phrase ton domaine, ta valeur et ton objectif."],
          ["Valorise tes resultats", "Raconte ce que tu as fait, pourquoi c'etait utile et ce que cela a change."],
          ["Active ton reseau", "Partage ton lien a quelques personnes de confiance avec un message court."],
          ["Mets a jour regulierement", "Ajoute tes nouvelles competences, formations et realisations."],
        ].map(([title, body]) => (
          <Card key={title}>
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 leading-7 text-slate-600">{body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TestPanel() {
  const tests = {
    sections: defaultProfile().sections.length === SECTION_TITLES.length,
    noCvGenerated: !/CV/i.test(localGenerateProfile(defaultProfile(), "Comptable avec Excel et reporting").sections.map((item) => item.body).join(" ")),
    noActionImpact: !/Action\s*:|Impact\s*:/i.test(localGenerateProfile(defaultProfile(), "Organisation du reporting").sections.map((item) => item.body).join(" ")),
    noGarbled: !looksGarbled(defaultProfile().tagline),
  };
  return (
    <div className="fixed bottom-3 right-3 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-500 shadow-sm">
      <div>Tests:</div>
      {Object.entries(tests).map(([key, value]) => <div key={key}>{key}: {value ? "OK" : "KO"}</div>)}
    </div>
  );
}

function Preview() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(defaultProfile());
  const loggedIn = Boolean(user);

  function onAuth(userData) {
    const nextUser = { name: userData.name || "Utilisateur", email: userData.email || "" };
    setUser(nextUser);
    setProfile((current) => normalizeProfile({ ...current, name: nextUser.name }));
    setPage("dashboard");
  }

  function onLogout() {
    setUser(null);
    setPage("home");
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-slate-900">
      <TopBar loggedIn={loggedIn} setPage={setPage} onLogout={onLogout} />
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
          {page === "home" && <HomePage setPage={setPage} loggedIn={loggedIn} />}
          {(page === "signup" || page === "login") && <AuthPage mode={page} setPage={setPage} onAuth={onAuth} />}
          {page === "dashboard" && <DashboardPage profile={profile} setProfile={setProfile} setPage={setPage} loggedIn={loggedIn} />}
          {page === "questions" && <QuestionsPage profile={profile} setProfile={setProfile} setPage={setPage} />}
          {page === "share" && <SharePage profile={profile} setPage={setPage} />}
          {page === "tips" && <TipsPage setPage={setPage} />}
          {page === "profile-public" && <div className="mx-auto max-w-4xl px-5 py-10"><ProfileCard profile={profile} /></div>}
        </motion.div>
      </AnimatePresence>
      <TestPanel />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Preview />);
