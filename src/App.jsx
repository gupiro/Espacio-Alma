import { useState, useEffect, useRef, useCallback } from "react";

const INITIAL_CONTEXT = {
  nombre: "Gustavo",
  edad: 35,
  pais: "Argentina",
  ubicacion: "Orán, Salta",
  trabajo: "Negocio propio con responsabilidades con España. Diferencia horaria que genera presión para responder temprano.",
  estiloPersoanl: "Sensible, intenso emocionalmente, piensa mucho las cosas, se apega fuerte cuando alguien le importa, necesita claridad emocional.",
  intereses: ["pádel", "tecnología", "trabajo", "series / One Piece", "entenderse mejor"],
  dificultades: [
    "ansiedad y sobrepensamiento",
    "miedo al rechazo",
    "dolor amoroso",
    "dificultad para dormir cuando está mal",
    "saturación emocional",
    "culpa cuando no rinde en el trabajo",
    "desbordamiento cuando coinciden cansancio físico y dolor emocional"
  ],
  situacionReciente: "Vivió un fin de semana intenso en Tarija por un torneo de pádel. Llegó a semifinales. Durmió y comió mal. Está afectado por una situación con Karen que le rompió la estabilidad emocional. Señales contradictorias de afecto y rechazo. Lo dejó triste, ansioso, dolido y sin energía.",
  necesidadesActuales: [
    "bajar ansiedad",
    "no sobrepensar",
    "no actuar impulsivamente",
    "recuperar foco laboral",
    "procesar vínculos sin destruirse"
  ]
};

const CRISIS_KEYWORDS = [
  "no quiero vivir", "no tiene sentido", "hacerme daño", "desaparecer",
  "suicidarme", "suicidio", "matarme", "ya no puedo más con esto",
  "preferiría no existir", "no vale la pena seguir"
];

const isCrisis = (text) =>
  CRISIS_KEYWORDS.some(k => text.toLowerCase().includes(k));

const buildSystemPrompt = (ctx, state) => `
Eres el asistente de Espacio Calma, una herramienta personal de acompañamiento emocional para ${ctx.nombre}.
NO eres psicólogo ni reemplazas la terapia. Eres una herramienta de apoyo emocional, cálida, humana y concreta.

CONTEXTO PERSONAL DE ${ctx.nombre.toUpperCase()}:
- Edad: ${ctx.edad} años. País: ${ctx.pais}. Ubicación: ${ctx.ubicacion}.
- Trabajo: ${ctx.trabajo}
- Estilo personal: ${ctx.estiloPersoanl}
- Intereses: ${ctx.intereses.join(", ")}.
- Dificultades frecuentes: ${ctx.dificultades.join("; ")}.
- Situación emocional reciente: ${ctx.situacionReciente}
- Necesidades actuales: ${ctx.necesidadesActuales.join(", ")}.

ESTADO DE HOY (si disponible):
${state ? `Ánimo: ${state.animo}/10 | Ansiedad: ${state.ansiedad}/10 | Energía: ${state.energia}/10 | Sueño: ${state.sueno} | Dolor emocional: ${state.dolorEmocional}/10` : "Sin registro de hoy aún."}

REGLAS DE CONVERSACIÓN:
- Habla en español natural, argentino casual, sin ser informal hasta lo ridículo.
- Sé cálido pero no cursi. Humano pero no condescendiente.
- NO juzgues. NO sermones. NO uses frases vacías.
- Ayudá a bajar intensidad. Proponé acciones concretas y simples.
- Si detectás ansiedad alta, proponé primero calmar el sistema nervioso.
- Recordá su historia: el torneo, Karen, el cansancio acumulado, la presión laboral.
- Respuestas cortas y directas primero.
`;

const save = (key, val) => {
  try { localStorage.setItem("ec_" + key, JSON.stringify(val)); } catch {}
};
const load = (key, fallback) => {
  try {
    const v = localStorage.getItem("ec_" + key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};

const QUICK_ACTIONS = [
  { id: "calm", label: "Necesito calmarme", prompt: "Estoy muy ansioso ahora mismo y necesito calmarme." },
  { id: "think", label: "Estoy sobrepensando", prompt: "No puedo parar de darle vueltas a algo y está paralizando." },
  { id: "heart", label: "Me duele lo que pasó", prompt: "Me duele mucho algo que pasó con alguien y no sé cómo procesarlo." },
  { id: "focus", label: "No puedo enfocarme", prompt: "No logro concentrarme en el trabajo ni en nada. Necesito ayuda." },
  { id: "sleep", label: "Dormí mal", prompt: "Dormí muy mal y me siento sin energía ni recursos para el día." },
  { id: "rejected", label: "Me siento rechazado", prompt: "Me siento rechazado y eso me duele más de lo que debería." },
  { id: "plan", label: "Necesito ordenar hoy", prompt: "Necesito organizar el día pero me siento desbordado." },
  { id: "stop", label: "No quiero escribirle", prompt: "Tengo ganas de escribirle a alguien pero sé que no debería. Necesito ayuda para no hacerlo." },
  { id: "center", label: "Necesito volver al eje", prompt: "Me siento completamente descentrado. Necesito volver a mí." },
];

function BreathingTool({ onClose }) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const phases = [
    { name: "Inhalá", duration: 4, color: "#7eb8a4" },
    { name: "Sostené", duration: 4, color: "#a8c5b8" },
    { name: "Exhalá", duration: 6, color: "#4a9b8a" },
  ];

  useEffect(() => {
    if (!running) return;
    const current = phases[phaseIdx];
    if (tick >= current.duration) {
      const next = (phaseIdx + 1) % 3;
      if (next === 0) setCycle(c => c + 1);
      setPhaseIdx(next);
      setTick(0);
      return;
    }
    const t = setTimeout(() => setTick(t => t + 1), 1000);
    return () => clearTimeout(t);
  }, [running, tick, phaseIdx]);

  const current = phases[phaseIdx];

  return (
    <div style={styles.toolOverlay}>
      <div style={styles.toolCard}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
        <h2 style={styles.toolTitle}>🫁 Respiración 4-4-6</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
          Activa el nervio vago y baja la ansiedad en minutos.
        </p>
        <div style={{
          width: 160, height: 160, borderRadius: 80,
          margin: "20px auto",
          background: running ? current.color : "var(--surface-2)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 4,
          transform: `scale(${running ? 0.85 + (tick / current.duration) * 0.3 : 1})`,
          transition: "all 1s ease"
        }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: "white" }}>
            {running ? current.name : "Listo"}
          </span>
          {running && <span style={{ fontSize: 20, color: "rgba(255,255,255,0.8)" }}>{current.duration - tick}s</span>}
        </div>
        {cycle > 0 && <p style={{ color: "var(--accent)", textAlign: "center" }}>Ciclos: {cycle} ✓</p>}
        <button onClick={() => { setRunning(r => !r); setTick(0); setPhaseIdx(0); }}
          style={{ ...styles.primaryBtn, marginTop: 24 }}>
          {running ? "Pausar" : cycle > 0 ? "Continuar" : "Comenzar"}
        </button>
      </div>
    </div>
  );
}

function GroundingTool({ onClose }) {
  const steps = [
    { n: 5, sense: "ves", icon: "👀", hint: "Nombrá 5 cosas que podés ver ahora mismo." },
    { n: 4, sense: "tocás", icon: "✋", hint: "Nombrá 4 texturas o superficies que podés tocar." },
    { n: 3, sense: "escuchás", icon: "👂", hint: "Nombrá 3 sonidos que podés escuchar." },
    { n: 2, sense: "olés", icon: "👃", hint: "Nombrá 2 olores que podés percibir." },
    { n: 1, sense: "probás", icon: "👅", hint: "Nombrá 1 sabor que podés notar en tu boca." },
  ];
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  return (
    <div style={styles.toolOverlay}>
      <div style={styles.toolCard}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
        <h2 style={styles.toolTitle}>✋ 5-4-3-2-1 Sentidos</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
          Anclate al presente. Hacelo despacio.
        </p>
        {!done ? (
          <>
            <div style={{ fontSize: 48, textAlign: "center", marginBottom: 16 }}>{steps[step].icon}</div>
            <h3 style={{ color: "var(--text)", textAlign: "center", fontSize: 22 }}>{steps[step].n} cosas que {steps[step].sense}</h3>
            <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>{steps[step].hint}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
              {step > 0 && <button onClick={() => setStep(s => s - 1)} style={styles.secondaryBtn}>←</button>}
              <button onClick={() => step < 4 ? setStep(s => s + 1) : setDone(true)}
                style={styles.primaryBtn}>
                {step < 4 ? "Ya lo hice →" : "Terminé ✓"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
            <h3 style={{ color: "var(--text)" }}>Bien hecho.</h3>
            <p style={{ color: "var(--text-muted)", marginTop: 8 }}>Estás en el presente. Ese fue el ejercicio.</p>
            <button onClick={onClose} style={{ ...styles.primaryBtn, marginTop: 24 }}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReframeTool({ onClose }) {
  const [step, setStep] = useState(0);
  const [thought, setThought] = useState("");
  const [evidence, setEvidence] = useState("");
  const [alternative, setAlternative] = useState("");
  const steps = [
    { q: "¿Qué pensamiento te está afectando?", val: thought, set: setThought },
    { q: "¿Qué evidencia real tenés de que eso es verdad?", val: evidence, set: setEvidence },
    { q: "¿Cómo lo verías en un mes? ¿O qué le dirías a un amigo en tu lugar?", val: alternative, set: setAlternative },
  ];
  const current = steps[step];

  return (
    <div style={styles.toolOverlay}>
      <div style={styles.toolCard}>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
        <h2 style={styles.toolTitle}>🔄 Reencuadre cognitivo</h2>
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? "var(--accent)" : "var(--surface-2)" }} />
          ))}
        </div>
        <p style={{ color: "var(--text)", fontWeight: 600, marginBottom: 12 }}>{current.q}</p>
        <textarea value={current.val} onChange={e => current.set(e.target.value)}
          placeholder="Escribí acá..." style={styles.textarea} rows={4} />
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {step > 0 && <button onClick={() => setStep(s => s - 1)} style={styles.secondaryBtn}>←</button>}
          <button onClick={() => step < 2 ? setStep(s => s + 1) : null}
            style={{ ...styles.primaryBtn, opacity: current.val.length < 5 ? 0.5 : 1 }}
            disabled={current.val.length < 5}>
            {step < 2 ? "Siguiente →" : "Listo"}
          </button>
        </div>
        {step === 2 && thought && evidence && alternative && (
          <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: 16, marginTop: 20 }}>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Pensaste: <em>"{thought}"</em><br />
              Desde afuera dirías: <em>"{alternative}"</em>
            </p>
            <p style={{ color: "var(--accent)", fontWeight: 600, marginTop: 8 }}>
              Ese último pensamiento es más justo con vos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DailyCheckin({ onSave, existing }) {
  const def = {
    animo: 5, ansiedad: 5, energia: 5,
    sueno: "regular", alimentacion: "regular",
    enfoque: 5, dolorEmocional: 0,
    actividadFisica: false, contactoEmocional: false, nota: ""
  };
  const [form, setForm] = useState(existing || def);

  const Slider = ({ label, field }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 14 }}>{label}</span>
        <span style={{ color: "var(--accent)", fontWeight: 700 }}>{form[field]}</span>
      </div>
      <input type="range" min={0} max={10} value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: +e.target.value }))}
        style={{ width: "100%", accentColor: "var(--accent)" }} />
    </div>
  );

  const Select = ({ label, field, opts }) => (
    <div style={{ marginBottom: 16 }}>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 8 }}>{label}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {opts.map(o => (
          <button key={o.v} onClick={() => setForm(f => ({ ...f, [field]: o.v }))}
            style={{ padding: "6px 14px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 13,
              background: form[field] === o.v ? "var(--accent)" : "var(--surface-2)",
              color: form[field] === o.v ? "white" : "var(--text-muted)" }}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );

  const Toggle = ({ label, field }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <span style={{ color: "var(--text-muted)", fontSize: 14 }}>{label}</span>
      <button onClick={() => setForm(f => ({ ...f, [field]: !f[field] }))}
        style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
          background: form[field] ? "var(--accent)" : "var(--surface-2)", position: "relative" }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: "white",
          position: "absolute", top: 3, left: form[field] ? 22 : 3, transition: "left 0.2s" }} />
      </button>
    </div>
  );

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>📊 Registro de hoy</h2>
      <Slider label="Estado de ánimo" field="animo" />
      <Slider label="Nivel de ansiedad" field="ansiedad" />
      <Slider label="Energía disponible" field="energia" />
      <Slider label="Dolor emocional" field="dolorEmocional" />
      <Slider label="Nivel de enfoque" field="enfoque" />
      <Select label="¿Cómo dormiste?" field="sueno"
        opts={[{v:"mal",l:"Mal"},{v:"regular",l:"Regular"},{v:"bien",l:"Bien"},{v:"muy_bien",l:"Muy bien"}]} />
      <Select label="¿Cómo comiste?" field="alimentacion"
        opts={[{v:"mal",l:"Mal"},{v:"regular",l:"Regular"},{v:"bien",l:"Bien"}]} />
      <Toggle label="¿Hiciste actividad física?" field="actividadFisica" />
      <Toggle label="¿Tuviste contacto con alguien que te moviliza?" field="contactoEmocional" />
      <div style={{ marginBottom: 16 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 8 }}>Nota libre</p>
        <textarea value={form.nota} onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
          placeholder="¿Algo que quieras registrar del día?"
          style={styles.textarea} rows={3} />
      </div>
      <button onClick={() => onSave(form)} style={styles.primaryBtn}>Guardar registro ✓</button>
    </div>
  );
}

function EmotionalTimeline({ events, onAdd, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ fecha: "", tipo: "general", titulo: "", descripcion: "" });
  const tipos = [
    { v: "viaje", l: "Viaje/Evento", c: "#7eb8a4" },
    { v: "afectivo", l: "Afectivo", c: "#e07b7b" },
    { v: "laboral", l: "Laboral", c: "#7b8be0" },
    { v: "ansiedad", l: "Ansiedad alta", c: "#e0b87b" },
    { v: "bueno", l: "Día bueno", c: "#7be09a" },
    { v: "claridad", l: "Claridad", c: "#b87be0" },
    { v: "general", l: "General", c: "#aaaaaa" },
  ];
  const getColor = (t) => tipos.find(x => x.v === t)?.c || "#aaa";
  const getLabel = (t) => tipos.find(x => x.v === t)?.l || t;

  return (
    <div style={styles.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={styles.sectionTitle}>📅 Línea de tiempo</h2>
        <button onClick={() => setAdding(true)} style={styles.iconBtn}>＋ Agregar</button>
      </div>
      {adding && (
        <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <input type="date" value={form.fecha}
            onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
            style={styles.input} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
            {tipos.map(t => (
              <button key={t.v} onClick={() => setForm(f => ({ ...f, tipo: t.v }))}
                style={{ padding: "4px 12px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 12,
                  background: form.tipo === t.v ? t.c : "var(--surface)",
                  color: form.tipo === t.v ? "white" : "var(--text-muted)" }}>{t.l}</button>
            ))}
          </div>
          <input placeholder="Título del evento" value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} style={styles.input} />
          <textarea placeholder="Descripción (opcional)" value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            style={{ ...styles.textarea, marginTop: 8 }} rows={2} />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => {
              if (!form.titulo || !form.fecha) return;
              onAdd({ ...form, id: Date.now() });
              setAdding(false);
              setForm({ fecha: "", tipo: "general", titulo: "", descripcion: "" });
            }} style={styles.primaryBtn}>Guardar</button>
            <button onClick={() => setAdding(false)} style={styles.secondaryBtn}>Cancelar</button>
          </div>
        </div>
      )}
      {events.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>
          Tu línea de tiempo está vacía. Agregá momentos importantes.
        </p>
      ) : (
        [...events].sort((a,b) => b.fecha.localeCompare(a.fecha)).map(ev => (
          <div key={ev.id} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: getColor(ev.tipo),
              marginTop: 4, flexShrink: 0 }} />
            <div style={{ ...styles.card, flex: 1, margin: 0, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ color: "var(--text)", fontWeight: 600, fontSize: 14 }}>{ev.titulo}</p>
                  <p style={{ color: getColor(ev.tipo), fontSize: 12, marginTop: 2 }}>
                    {ev.fecha} · {getLabel(ev.tipo)}
                  </p>
                </div>
                <button onClick={() => onDelete(ev.id)} style={styles.trashBtn}>✕</button>
              </div>
              {ev.descripcion && <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8 }}>{ev.descripcion}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ContextProfile({ ctx, onChange }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const fields = [
    { key: "situacionReciente", label: "Situación emocional reciente", multiline: true },
    { key: "trabajo", label: "Trabajo", multiline: true },
    { key: "estiloPersoanl", label: "Estilo personal", multiline: true },
    { key: "ubicacion", label: "Ubicación habitual" },
  ];
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>👤 Mi contexto</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
        El asistente lee esto antes de responderte. Actualizalo cuando tu vida cambie.
      </p>
      <div style={{ ...styles.card, marginBottom: 16, background: "var(--accent-soft)" }}>
        <p style={{ color: "var(--accent)", fontWeight: 700, fontSize: 16 }}>Gustavo, 35 años</p>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Orán, Salta · Argentina</p>
      </div>
      {fields.map(f => (
        <div key={f.key} style={{ ...styles.card, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <p style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>{f.label}</p>
            <button onClick={() => { setEditing(f.key); setDraft(ctx[f.key]); }} style={styles.iconBtn}>✏️</button>
          </div>
          {editing === f.key ? (
            <>
              {f.multiline
                ? <textarea value={draft} onChange={e => setDraft(e.target.value)} style={styles.textarea} rows={3} />
                : <input value={draft} onChange={e => setDraft(e.target.value)} style={styles.input} />}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => { onChange(f.key, draft); setEditing(null); }} style={styles.primaryBtn}>Guardar</button>
                <button onClick={() => setEditing(null)} style={styles.secondaryBtn}>Cancelar</button>
              </div>
            </>
          ) : (
            <p style={{ color: "var(--text)", fontSize: 14 }}>{ctx[f.key]}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function CrisisOverlay({ onClose }) {
  return (
    <div style={styles.crisisOverlay}>
      <div style={styles.crisisCard}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🆘</div>
        <h2 style={{ color: "#e07b7b", marginBottom: 12 }}>Modo seguridad</h2>
        <p style={{ color: "#c8b8b8", marginBottom: 16, lineHeight: 1.7 }}>
          Escribiste algo que me indicó que podrías estar pasando un momento muy difícil.
          Esta app no puede reemplazar la ayuda real. Por favor, contactá a alguien de confianza.
        </p>
        <div style={{ background: "#2a1a1a", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <p style={{ color: "#e07b7b", fontWeight: 700, marginBottom: 8 }}>📞 Líneas de ayuda Argentina</p>
          <p style={{ color: "#c8b8b8" }}>Centro de Asistencia al Suicida: <strong style={{ color: "white" }}>135</strong></p>
          <p style={{ color: "#c8b8b8", marginTop: 4 }}>Salud Mental PAMI: <strong style={{ color: "white" }}>0800-222-0560</strong></p>
        </div>
        <button onClick={onClose} style={{ ...styles.secondaryBtn, borderColor: "#666", color: "#ccc" }}>
          Entendido, estoy bien
        </button>
      </div>
    </div>
  );
}

function getRecommendations(state) {
  if (!state) return [];
  const recs = [];
  if (state.sueno === "mal") recs.push({ icon: "💧", text: "Tomá agua. El mal descanso deshidrata más de lo que parece." });
  if (state.ansiedad >= 7) recs.push({ icon: "🌬️", text: "Hacé 3 respiraciones lentas antes de revisar el teléfono." });
  if (state.energia <= 3) recs.push({ icon: "🥗", text: "Comé algo, aunque sea pequeño. Tu cerebro lo necesita." });
  if (state.dolorEmocional >= 7) recs.push({ icon: "📵", text: "No revisés chats viejos hoy. Solo te va a reactivar." });
  if (state.enfoque <= 4) recs.push({ icon: "🎯", text: "Elegí UNA sola tarea y hacé solo esa por ahora." });
  if (!state.actividadFisica) recs.push({ icon: "🚶", text: "Caminá 10 minutos. Aunque no tengas ganas." });
  if (state.contactoEmocional) recs.push({ icon: "✋", text: "Si sentís el impulso de escribirle, esperá 20 minutos." });
  if (recs.length === 0) recs.push({ icon: "✓", text: "Hoy parece un día manejable. Seguí así." });
  return recs.slice(0, 4);
}

function getDayProfile(state) {
  if (!state) return null;
  const parts = [];
  if (state.ansiedad >= 7) parts.push("Ansiedad alta.");
  if (state.sueno === "mal") parts.push("El mal descanso te está pesando.");
  if (state.dolorEmocional >= 6) parts.push("Lo afectivo te ocupa mucho espacio mental.");
  if (state.energia <= 4) parts.push("Poca energía disponible hoy.");
  if (state.contactoEmocional) parts.push("Tuviste contacto con alguien que te moviliza.");
  const advices = [];
  if (state.ansiedad >= 7 && state.sueno === "mal") advices.push("Bajá la exigencia y evitá decisiones impulsivas.");
  if (state.dolorEmocional >= 6) advices.push("Lo afectivo te está pegando en el foco. Es esperable.");
  if (state.energia <= 3) advices.push("No es momento de resolver todo. Solo existir ya cuenta.");
  return { parts, advices };
}

function ChatPanel({ ctx, dailyState }) {
  const [messages, setMessages] = useState(load("chat", []));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { save("chat", messages.slice(-40)); }, [messages]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    if (isCrisis(text)) { setCrisis(true); return; }
    const userMsg = { role: "user", content: text };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: buildSystemPrompt(ctx, dailyState),
          messages: newMsgs.slice(-12).map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      const reply = data?.content?.[0]?.text || "No pude procesar la respuesta.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Intentá de nuevo." }]);
    }
    setLoading(false);
  }, [messages, loading, ctx, dailyState]);

  const toolComponents = {
    breath: <BreathingTool onClose={() => setActiveTool(null)} />,
    senses: <GroundingTool onClose={() => setActiveTool(null)} />,
    reframe: <ReframeTool onClose={() => setActiveTool(null)} />,
  };

  return (
    <>
      {crisis && <CrisisOverlay onClose={() => setCrisis(false)} />}
      {activeTool && toolComponents[activeTool]}
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "10px 0 0", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 10px", scrollbarWidth: "none" }}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.id} onClick={() => sendMessage(a.prompt)}
                style={{ display: "flex", alignItems: "center", gap: 6,
                  background: "var(--surface-2)", border: "1px solid var(--border)",
                  borderRadius: 20, padding: "6px 14px", cursor: "pointer",
                  color: "var(--text)", fontSize: 13, whiteSpace: "nowrap", flexShrink: 0,
                  fontFamily: "sans-serif" }}>
                {a.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, padding: "0 16px 8px", overflowX: "auto", scrollbarWidth: "none" }}>
            {[{id:"breath",l:"🫁 Respiración"},{id:"senses",l:"✋ Sentidos"},{id:"reframe",l:"🔄 Reencuadre"}].map(t => (
              <button key={t.id} onClick={() => setActiveTool(t.id)}
                style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)",
                  borderRadius: 16, padding: "4px 12px", cursor: "pointer",
                  color: "var(--accent)", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0,
                  fontFamily: "sans-serif" }}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 0" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
              <p style={{ color: "var(--text)", fontSize: 18, fontWeight: 600 }}>Hola, Gustavo.</p>
              <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
                Estoy acá. Podés escribirme o usar los botones de arriba.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <div style={{ maxWidth: "80%", padding: "12px 16px",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: m.role === "user" ? "var(--accent)" : "var(--surface)",
                color: m.role === "user" ? "white" : "var(--text)",
                fontSize: 14, lineHeight: 1.6, boxShadow: "0 2px 8px var(--shadow)" }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
              <div style={{ padding: "12px 20px", borderRadius: "18px 18px 18px 4px",
                background: "var(--surface)", color: "var(--text-muted)" }}>● ● ●</div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div style={{ display: "flex", gap: 8, padding: "12px 16px",
          background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Escribí acá..."
            style={{ flex: 1, background: "var(--surface-2)", border: "1px solid var(--border)",
              borderRadius: 22, padding: "10px 16px", color: "var(--text)", fontSize: 14, outline: "none" }} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            style={{ background: "var(--accent)", border: "none", borderRadius: 22,
              width: 44, height: 44, cursor: "pointer", color: "white", fontSize: 16,
              opacity: !input.trim() || loading ? 0.5 : 1 }}>➤</button>
        </div>
      </div>
    </>
  );
}

const styles = {
  section: { padding: "20px 20px 20px" },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 16 },
  card: { background: "var(--surface)", borderRadius: 14, padding: "14px 16px", border: "1px solid var(--border)", marginBottom: 12 },
  primaryBtn: { background: "var(--accent)", color: "white", border: "none", borderRadius: 12, padding: "12px 20px", cursor: "pointer", fontSize: 14, fontWeight: 600, width: "100%", fontFamily: "sans-serif" },
  secondaryBtn: { background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 20px", cursor: "pointer", fontSize: 14, fontFamily: "sans-serif" },
  iconBtn: { background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: "var(--accent)", fontSize: 13, fontFamily: "sans-serif" },
  trashBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, padding: 4 },
  textarea: { width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", color: "var(--text)", fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.6, fontFamily: "sans-serif" },
  input: { width: "100%", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 14px", color: "var(--text)", fontSize: 14, outline: "none", fontFamily: "sans-serif", marginBottom: 4 },
  toolOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 },
  toolCard: { background: "var(--surface)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", position: "relative" },
  toolTitle: { fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 8 },
  closeBtn: { position: "absolute", top: 16, right: 16, background: "var(--surface-2)", border: "none", borderRadius: 20, width: 32, height: 32, cursor: "pointer", color: "var(--text)", fontSize: 14 },
  crisisOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 },
  crisisCard: { background: "#1a0f0f", borderRadius: 20, padding: 32, maxWidth: 440, width: "100%", textAlign: "center", border: "1px solid #3a1a1a" },
};

export default function EspacioCalma() {
  const [tab, setTab] = useState("chat");
  const [dark, setDark] = useState(load("darkMode", true));
  const [ctx, setCtx] = useState(load("userCtx", INITIAL_CONTEXT));
  const [timeline, setTimeline] = useState(load("timeline", [
    { id: 1, fecha: "2025-05-01", tipo: "viaje", titulo: "Torneo de pádel en Tarija", descripcion: "Semifinales. Esfuerzo físico intenso. Mal sueño y alimentación." },
    { id: 2, fecha: "2025-05-03", tipo: "afectivo", titulo: "Situación con Karen", descripcion: "Señales contradictorias. Confusión emocional. Tristeza y ansiedad instaladas." },
  ]));
  const [dailyState, setDailyState] = useState(load("dailyState_" + new Date().toISOString().split("T")[0], null));

  useEffect(() => { save("userCtx", ctx); }, [ctx]);
  useEffect(() => { save("timeline", timeline); }, [timeline]);
  useEffect(() => { save("darkMode", dark); }, [dark]);

  const updateCtx = (key, val) => setCtx(c => ({ ...c, [key]: val }));
  const addEvent = (ev) => setTimeline(t => [...t, ev]);
  const deleteEvent = (id) => setTimeline(t => t.filter(e => e.id !== id));
  const saveDailyState = (state) => {
    setDailyState(state);
    save("dailyState_" + new Date().toISOString().split("T")[0], state);
  };

  const profile = getDayProfile(dailyState);
  const recs = getRecommendations(dailyState);

  const theme = dark ? {
    "--bg": "#0f1117", "--surface": "#1a1e2b", "--surface-2": "#242838",
    "--text": "#e8eaf0", "--text-muted": "#6b7280", "--accent": "#5b9e8a",
    "--accent-soft": "rgba(91,158,138,0.12)", "--border": "rgba(255,255,255,0.06)", "--shadow": "rgba(0,0,0,0.3)",
  } : {
    "--bg": "#f5f5f0", "--surface": "#ffffff", "--surface-2": "#f0f0eb",
    "--text": "#1a1a2e", "--text-muted": "#6b7280", "--accent": "#4a8a78",
    "--accent-soft": "rgba(74,138,120,0.1)", "--border": "rgba(0,0,0,0.07)", "--shadow": "rgba(0,0,0,0.08)",
  };

  const tabs = [
    { id: "chat", icon: "💬", label: "Chat" },
    { id: "daily", icon: "📊", label: "Hoy" },
    { id: "timeline", icon: "📅", label: "Historial" },
    { id: "profile", icon: "👤", label: "Contexto" },
  ];

  return (
    <div style={{ ...Object.fromEntries(Object.entries(theme)), fontFamily: "'Georgia', serif",
      background: "var(--bg)", color: "var(--text)", minHeight: "100vh",
      display: "flex", flexDirection: "column", maxWidth: 680, margin: "0 auto" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } input,textarea { font-family: sans-serif; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: var(--surface-2); border-radius: 2px; }`}</style>

      <div style={{ padding: "16px 20px 12px", background: "var(--surface)",
        borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Espacio Calma</h1>
          <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 1 }}>Herramienta de apoyo emocional personal</p>
        </div>
        <button onClick={() => setDark(d => !d)}
          style={{ background: "var(--surface-2)", border: "none", borderRadius: 20,
            padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {profile && profile.parts.length > 0 && tab === "chat" && (
        <div style={{ background: "var(--accent-soft)", borderLeft: "3px solid var(--accent)", padding: "12px 20px" }}>
          <p style={{ color: "var(--text)", fontSize: 13, lineHeight: 1.6 }}>
            <strong>Hoy: </strong>{profile.parts.join(" ")}
            {profile.advices.length > 0 && " → " + profile.advices[0]}
          </p>
        </div>
      )}

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tab === "chat" && <ChatPanel ctx={ctx} dailyState={dailyState} />}
        {tab === "daily" && (
          <div style={{ overflow: "auto", flex: 1, paddingBottom: 80 }}>
            {dailyState && (
              <div style={{ padding: "16px 20px 0" }}>
                {recs.map((r, i) => (
                  <div key={i} style={{ ...styles.card, display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>{r.icon}</span>
                    <p style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.5 }}>{r.text}</p>
                  </div>
                ))}
                <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />
              </div>
            )}
            <DailyCheckin onSave={saveDailyState} existing={dailyState} />
          </div>
        )}
        {tab === "timeline" && (
          <div style={{ overflow: "auto", flex: 1, paddingBottom: 80 }}>
            <EmotionalTimeline events={timeline} onAdd={addEvent} onDelete={deleteEvent} />
          </div>
        )}
        {tab === "profile" && (
          <div style={{ overflow: "auto", flex: 1, paddingBottom: 80 }}>
            <ContextProfile ctx={ctx} onChange={updateCtx} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", background: "var(--surface)", borderTop: "1px solid var(--border)", position: "sticky", bottom: 0, zIndex: 100 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: "10px 4px 12px", background: "none", border: "none", cursor: "pointer",
              color: tab === t.id ? "var(--accent)" : "var(--text-muted)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontFamily: "sans-serif" }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
