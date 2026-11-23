// Scroll wheel picker: a snapping, scrollable list where the centred item is the
// selected value. Works with mouse wheel, touch/trackpad, keyboard and clicks.
class ScrollWheel {
  constructor(container, options, initialIndex = 0) {
    this.container = container;
    this.options = options;
    this.index = initialIndex;
    this.listeners = [];

    this.track = document.createElement("ul");
    this.track.className = "wheel-track";
    this.track.tabIndex = 0;
    this.track.setAttribute("role", "listbox");
    const labelledBy = container.getAttribute("aria-labelledby");
    if (labelledBy) this.track.setAttribute("aria-labelledby", labelledBy);

    this.items = options.map((opt, i) => {
      const li = document.createElement("li");
      li.className = "wheel-item";
      li.textContent = opt.label;
      li.setAttribute("role", "option");
      li.id = `${container.dataset.name}-opt-${i}`;
      li.addEventListener("click", () => this.select(i));
      this.track.appendChild(li);
      return li;
    });

    container.appendChild(this.track);

    let scrollTimer;
    this.track.addEventListener("scroll", () => {
      this.highlight(this.indexFromScroll());
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => this.settle(), 90);
    });
    this.track.addEventListener("keydown", (e) => this.onKey(e));

    this.select(initialIndex, false);
  }

  get itemHeight() {
    return this.items[0]?.offsetHeight || 40;
  }

  get value() {
    return this.options[this.index].value;
  }

  indexFromScroll() {
    const i = Math.round(this.track.scrollTop / this.itemHeight);
    return Math.max(0, Math.min(this.options.length - 1, i));
  }

  highlight(i) {
    this.items.forEach((li, j) => {
      const on = j === i;
      li.classList.toggle("is-selected", on);
      li.setAttribute("aria-selected", on ? "true" : "false");
    });
    this.track.setAttribute("aria-activedescendant", this.items[i].id);
  }

  settle() {
    const i = this.indexFromScroll();
    if (i !== this.index) {
      this.index = i;
      this.listeners.forEach((fn) => fn(this.value));
    }
    this.highlight(i);
  }

  select(i, smooth = true) {
    i = Math.max(0, Math.min(this.options.length - 1, i));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.track.scrollTo({ top: i * this.itemHeight, behavior: smooth && !reduce ? "smooth" : "auto" });
    if (!smooth) {
      this.index = i;
      this.highlight(i);
    }
  }

  onKey(e) {
    const moves = { ArrowUp: -1, ArrowDown: 1, PageUp: -3, PageDown: 3 };
    if (e.key in moves) {
      e.preventDefault();
      this.select(this.index + moves[e.key]);
      this.index = Math.max(0, Math.min(this.options.length - 1, this.index + moves[e.key]));
      this.highlight(this.index);
    } else if (e.key === "Home") {
      e.preventDefault();
      this.select(0);
    } else if (e.key === "End") {
      e.preventDefault();
      this.select(this.options.length - 1);
    }
  }

  onChange(fn) {
    this.listeners.push(fn);
  }
}
