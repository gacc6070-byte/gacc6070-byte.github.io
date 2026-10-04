// Phantom Habits — todo se guarda en el navegador (localStorage).
const STATS = {
  kno: { nombre: "Conocimiento" },
  fis: { nombre: "Físico" },
  car: { nombre: "Carisma" },
};
const XP_POR_HABITO = 10;
const $ = (id) => document.getElementById(id);

let estado = cargar();

function cargar() {
  try { return JSON.parse(localStorage.getItem("ph")) || nuevo(); } catch { return nuevo(); }
}
function nuevo() { return { habitos: [], xp: { kno: 0, fis: 0, car: 0 } }; }
function guardar() { try { localStorage.setItem("ph", JSON.stringify(estado)); } catch {} }

const hoy = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const ayer = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

// Nivel n necesita 30*n XP para pasar al siguiente.
function nivel(xp) {
  let n = 1, resto = xp;
  while (resto >= 30 * n) { resto -= 30 * n; n++; }
  return { n, resto, falta: 30 * n };
}
function racha(h) {
  let r = 0, i = h.hechos[hoy()] ? 0 : 1;
  while (h.hechos[ayer(i)]) { r++; i++; }
  return r + (h.hechos[hoy()] ? 1 : 0) - (h.hechos[hoy()] ? 0 : 0);
}

function alternar(id) {
  const h = estado.habitos.find((x) => x.id === id);
  const antes = nivel(estado.xp[h.stat]).n;
  if (h.hechos[hoy()]) {
    delete h.hechos[hoy()];
    estado.xp[h.stat] = Math.max(0, estado.xp[h.stat] - XP_POR_HABITO);
  } else {
    h.hechos[hoy()] = true;
    estado.xp[h.stat] += XP_POR_HABITO;
  }
  guardar(); pintar();
  const despues = nivel(estado.xp[h.stat]).n;
  if (despues > antes) subida(STATS[h.stat].nombre, despues);
}
function subida(nombre, n) {
  const b = $("banner");
  b.innerHTML = "<div><b>¡SUBISTE DE NIVEL!</b><small>" + nombre + " → Nv. " + n + "</small></div>";
  b.hidden = false;
  setTimeout(() => (b.hidden = true), 2200);
  b.onclick = () => (b.hidden = true);
}

function pintar() {
  const f = new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  $("fecha").textContent = f;
  $("stats").innerHTML = Object.entries(STATS).map(([k, s]) => {
    const l = nivel(estado.xp[k]);
    return '<div class="stat"><div class="fila"><span>' + s.nombre + '</span><span class="nv">Nv. ' + l.n +
      '</span></div><div class="barra"><i style="width:' + (l.resto / l.falta * 100) + '%"></i></div></div>';
  }).join("");
  $("vacio").hidden = estado.habitos.length > 0;
  const ul = $("lista"); ul.innerHTML = "";
  estado.habitos.forEach((h) => {
    const li = document.createElement("li");
    li.className = "hab" + (h.hechos[hoy()] ? " hecho" : "");
    const r = racha(h);
    li.innerHTML = '<span class="chk"></span><span class="info"></span><button class="x" aria-label="Borrar">✕</button>';
    li.querySelector(".info").innerHTML = "";
    const t = document.createTextNode(h.nombre);
    const sm = document.createElement("small");
    sm.textContent = STATS[h.stat].nombre + " · racha " + r;
    li.querySelector(".info").append(t, sm);
    li.onclick = () => alternar(h.id);
    li.querySelector(".x").onclick = (e) => {
      e.stopPropagation();
      if (confirm("¿Borrar este hábito?")) { estado.habitos = estado.habitos.filter((x) => x.id !== h.id); guardar(); pintar(); }
    };
    ul.append(li);
  });
}

$("stat").innerHTML = Object.entries(STATS).map(([k, s]) => '<option value="' + k + '">' + s.nombre + "</option>").join("");
$("agregar").onclick = () => {
  const nombre = $("nombre").value.trim();
  if (!nombre) { $("nombre").focus(); return; }
  estado.habitos.push({ id: Date.now(), nombre, stat: $("stat").value, hechos: {} });
  $("nombre").value = ""; guardar(); pintar();
};
pintar();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
