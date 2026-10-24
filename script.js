/* =====================================================
   НАСТРОЙКИ — меняйте только этот блок
   ===================================================== */
const CONFIG = {
  name: "Ателье",                              // название ателье
  phone: "+7 965 511-76-02",                   // телефон для отображения
  whatsapp: "79655117602",                     // номер для WhatsApp: только цифры, с кодом страны, без +
  telegram: "",                                // ник в Telegram без @ (необязательно)
  address: "Екатеринбург, ул. Щорса, 94/1",   // адрес
  formspree: "",                               // необязательно: https://formspree.io/f/xxxxxxx — заявки будут приходить на почту
  open: 10,                                    // открытие (час)
  close: 19,                                   // закрытие (час)
  slotMinutes: 60,                             // длина одной записи в минутах
  closedDays: [0],                             // выходные: 0 = воскресенье, 1 = понедельник ... 6 = суббота
  daysAhead: 30,                               // на сколько дней вперёд можно записаться
  // Занятое время вручную, например: "2026-11-05": ["10:00", "14:00"]
  blocked: {}
};

// Услуги: category — repair | alter | sew
const CATEGORIES = {
  all: "Все",
  repair: "Ремонт",
  alter: "Подгонка",
  sew: "Пошив"
};

const SERVICES = [
  { id: 1, cat: "alter",  name: "Укоротить джинсы",     desc: "Подгиб по вашему росту",                price: "500 ₽",  time: "" },
  { id: 2, cat: "alter",  name: "Ушить с боков",        desc: "Подгонка по боковым швам",              price: "500 ₽",  time: "" },
  { id: 3, cat: "alter",  name: "Укоротить пояс",       desc: "Подгонка пояса по фигуре",              price: "700 ₽",  time: "" },
  { id: 4, cat: "repair", name: "Замена молний",        desc: "Брюки, джинсы, юбки, куртки",           price: "1 000 ₽", time: "" },
  { id: 5, cat: "sew",    name: "Индивидуальный заказ", desc: "Пошив по вашим меркам и пожеланиям",    price: "по договорённости", time: "" }
];

/* =====================================================
   КОД — ниже можно ничего не менять
   ===================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// --- Подстановка контактов ---
function fillContacts() {
  document.title = CONFIG.name + " — ремонт, подгонка и пошив одежды";
  $$("[data-brand]").forEach(el => (el.textContent = CONFIG.name));
  $$("[data-phone-link]").forEach(el => {
    el.textContent = CONFIG.phone;
    el.href = "tel:" + CONFIG.phone.replace(/[^\d+]/g, "");
  });
  const addr = $("[data-address-link]");
  addr.textContent = CONFIG.address;
  addr.href = "https://yandex.ru/maps/?text=" + encodeURIComponent(CONFIG.address);

  const days = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  const work = [1, 2, 3, 4, 5, 6, 0].filter(d => !CONFIG.closedDays.includes(d)).map(d => days[d]);
  const closed = CONFIG.closedDays.map(d => days[d]).join(", ");
  const text = `${work.join(", ")}: ${pad(CONFIG.open)}:00–${pad(CONFIG.close)}:00` + (closed ? `. Выходной: ${closed}.` : "");
  $$("[data-hours-text]").forEach(el => (el.textContent = text));
  $("#year").textContent = new Date().getFullYear();
}
const pad = n => String(n).padStart(2, "0");

// --- Рулетка (лента с цифрами) ---
function drawTape() {
  const tape = $("#tape");
  tape.innerHTML = "";
  const count = Math.ceil(window.innerWidth / 40) + 1;
  for (let i = 0; i < count; i++) {
    const s = document.createElement("span");
    s.style.left = i * 40 + "px";
    s.textContent = i;
    tape.appendChild(s);
  }
}

// --- Каталог ---
let activeCat = "all";

function renderChips() {
  const box = $("#chips");
  box.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key, label]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", key === activeCat);
    b.textContent = label;
    b.addEventListener("click", () => { activeCat = key; renderChips(); renderServices(); });
    box.appendChild(b);
  });
}

function renderServices() {
  const list = $("#pricelist");
  list.innerHTML = "";
  SERVICES.filter(s => activeCat === "all" || s.cat === activeCat).forEach(s => {
    const li = document.createElement("li");

    const name = document.createElement("div");
    name.className = "svc-name";
    name.textContent = s.name;

    const price = document.createElement("div");
    price.className = "svc-price";
    price.textContent = s.price;

    const meta = document.createElement("div");
    meta.className = "svc-meta";
    meta.textContent = s.time ? `${s.desc} · ${s.time}` : s.desc;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "svc-book";
    btn.textContent = "Записаться на эту услугу";
    btn.addEventListener("click", () => {
      $("#service").value = s.id;
      $("#booking").scrollIntoView();
      $("#date").focus({ preventScroll: true });
    });

    li.append(name, price, meta, btn);
    list.appendChild(li);
  });
}

// --- Форма записи ---
function fillServiceSelect() {
  const sel = $("#service");
  sel.innerHTML = "";
  SERVICES.forEach(s => {
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = `${s.name} — ${s.price}`;
    sel.appendChild(o);
  });
}

function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function setupDate() {
  const input = $("#date");
  const today = new Date();
  const max = new Date();
  max.setDate(today.getDate() + CONFIG.daysAhead);
  input.min = toISO(today);
  input.max = toISO(max);
  input.addEventListener("change", renderSlots);
}

function parseLocal(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function renderSlots() {
  const box = $("#slots");
  const hint = $("#dateHint");
  const iso = $("#date").value;
  box.innerHTML = "";
  hint.textContent = "";
  if (!iso) { box.innerHTML = '<p class="hint">Сначала выберите дату.</p>'; return; }

  const date = parseLocal(iso);
  if (CONFIG.closedDays.includes(date.getDay())) {
    hint.textContent = "В этот день мы не работаем. Выберите другую дату.";
    return;
  }

  const now = new Date();
  const isToday = iso === toISO(now);
  const taken = CONFIG.blocked[iso] || [];
  let shown = 0;

  for (let m = CONFIG.open * 60; m + CONFIG.slotMinutes <= CONFIG.close * 60; m += CONFIG.slotMinutes) {
    const t = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    if (isToday && m <= now.getHours() * 60 + now.getMinutes() + 30) continue;

    const label = document.createElement("label");
    label.className = "slot";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "time";
    input.value = t;
    input.disabled = taken.includes(t);
    const span = document.createElement("span");
    span.textContent = t;
    label.append(input, span);
    box.appendChild(label);
    shown++;
  }
  if (!shown) hint.textContent = "На сегодня свободного времени нет. Выберите другую дату.";
}

function showError(msg) { $("#formError").textContent = msg; }

function onSubmit(e) {
  e.preventDefault();
  showError("");

  const serviceId = Number($("#service").value);
  const service = SERVICES.find(s => s.id === serviceId);
  const iso = $("#date").value;
  const time = ($("#slots input:checked") || {}).value;
  const name = $("#name").value.trim();
  const phone = $("#phone").value.trim();
  const comment = $("#comment").value.trim();

  if (!iso) return showError("Выберите дату.");
  if (CONFIG.closedDays.includes(parseLocal(iso).getDay())) return showError("В этот день мы не работаем. Выберите другую дату.");
  if (!time) return showError("Выберите время.");
  if (!name) return showError("Введите имя.");
  if (phone.replace(/\D/g, "").length < 10) return showError("Введите телефон полностью, с кодом города или оператора.");

  const dateText = parseLocal(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" });
  const message =
    `Здравствуйте! Хочу записаться.\n` +
    `Услуга: ${service.name}\n` +
    `Дата и время: ${dateText}, ${time}\n` +
    `Имя: ${name}\n` +
    `Телефон: ${phone}` +
    (comment ? `\nКомментарий: ${comment}` : "");

  // Копия заявки на почту (если подключён Formspree)
  if (CONFIG.formspree) {
    fetch(CONFIG.formspree, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ service: service.name, date: iso, time, name, phone, comment })
    }).catch(() => {});
  }

  $("#doneSummary").textContent = `${service.name}, ${dateText}, ${time}.`;
  $("#waBtn").href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
  const tg = $("#tgBtn");
  if (CONFIG.telegram) {
    tg.href = `https://t.me/${CONFIG.telegram}?text=${encodeURIComponent(message)}`;
    tg.hidden = false;
  }
  $("#bookingForm").hidden = true;
  $("#done").hidden = false;
  $("#done").scrollIntoView({ block: "center" });
}

function reset() {
  $("#bookingForm").reset();
  $("#bookingForm").hidden = false;
  $("#done").hidden = true;
  renderSlots();
}

// --- Запуск ---
fillContacts();
drawTape();
window.addEventListener("resize", drawTape);
renderChips();
renderServices();
fillServiceSelect();
setupDate();
$("#bookingForm").addEventListener("submit", onSubmit);
$("#againBtn").addEventListener("click", reset);
