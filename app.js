const STORAGE_KEY = "game-journal-entries";

const toOptions = (list) => list.map((v) => ({ label: String(v), value: v }));

const wheelConfig = {
  platform: { options: toOptions(["PC", "PlayStation", "Xbox", "Switch", "Mobile", "Retro", "Other"]), initial: 0 },
  status: { options: toOptions(["Backlog", "Playing", "Paused", "Completed", "Dropped"]), initial: 1 },
  rating: {
    options: [{ label: "—", value: 0 }, ...[1, 2, 3, 4, 5].map((n) => ({ label: "★".repeat(n), value: n }))],
    initial: 0,
  },
  hours: {
    options: [0, 1, 2, 5, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200].map((h) => ({ label: `${h}h`, value: h })),
    initial: 0,
  },
};

const wheels = {};
document.querySelectorAll(".wheel").forEach((el) => {
  const cfg = wheelConfig[el.dataset.name];
  wheels[el.dataset.name] = new ScrollWheel(el, cfg.options, cfg.initial);
});

function loadEntries() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* storage unavailable: keep entries in memory for this visit */
  }
}

let entries = loadEntries();

const list = document.getElementById("entries");
const empty = document.getElementById("empty");
const count = document.getElementById("count");

function chip(text, gold = false) {
  const span = document.createElement("span");
  span.className = gold ? "chip gold" : "chip";
  span.textContent = text;
  return span;
}

function render() {
  list.replaceChildren(
    ...entries.map((entry) => {
      const li = document.createElement("li");
      li.className = "entry";

      const top = document.createElement("div");
      top.className = "entry-top";
      const h3 = document.createElement("h3");
      h3.textContent = entry.title;
      const del = document.createElement("button");
      del.type = "button";
      del.className = "delete";
      del.textContent = "Remove";
      del.setAttribute("aria-label", `Remove ${entry.title}`);
      del.addEventListener("click", () => {
        entries = entries.filter((e) => e.id !== entry.id);
        saveEntries(entries);
        render();
      });
      top.append(h3, del);

      const meta = document.createElement("div");
      meta.className = "entry-meta";
      meta.append(chip(entry.platform), chip(entry.status));
      if (entry.rating) meta.append(chip("★".repeat(entry.rating), true));
      if (entry.hours) meta.append(chip(`${entry.hours}h`));

      li.append(top, meta);
      if (entry.notes) {
        const p = document.createElement("p");
        p.className = "notes";
        p.textContent = entry.notes;
        li.append(p);
      }
      return li;
    })
  );
  empty.hidden = entries.length > 0;
  count.textContent = entries.length ? `${entries.length} game${entries.length === 1 ? "" : "s"}` : "";
}

document.getElementById("entry-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  if (!title) return;
  Object.values(wheels).forEach((w) => w.settle());
  entries.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    title,
    platform: wheels.platform.value,
    status: wheels.status.value,
    rating: wheels.rating.value,
    hours: wheels.hours.value,
    notes: document.getElementById("notes").value.trim(),
    createdAt: new Date().toISOString(),
  });
  saveEntries(entries);
  e.target.reset();
  render();
});

render();
