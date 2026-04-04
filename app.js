(function () {
  const input = document.getElementById("q");
  const results = document.getElementById("results");
  const hint = document.getElementById("hint");

  let teams = [];
  let loadError = null;

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function matchTeam(query, team) {
    const q = norm(query);
    if (!q) return false;
    const name = norm(team.name);
    if (name && name.includes(q)) return true;
    const num = norm(team.number);
    if (!num || num === "---") return false;
    if (num === q || num.includes(q) || q.includes(num)) return true;
    return false;
  }

  function render() {
    if (loadError) {
      results.innerHTML =
        '<div class="empty-state"><strong>Не удалось загрузить данные.</strong><br />' +
        escapeHtml(loadError) +
        "</div>";
      hint.textContent = "";
      return;
    }

    const q = input.value;
    const filtered = teams.filter((t) => matchTeam(q, t));

    if (!q.trim()) {
      results.innerHTML = "";
      hint.textContent =
        teams.length > 0
          ? `В базе ${teams.length} ${pluralTeams(teams.length)}. Начните вводить номер или название команды.`
          : "Список команд пуст. Добавьте записи в data/teams.json.";
      return;
    }

    if (filtered.length === 0) {
      results.innerHTML =
        '<div class="empty-state">Ничего не найдено. Проверьте номер или название команды.</div>';
      hint.textContent = "";
      return;
    }

    hint.textContent =
      filtered.length === 1
        ? "Найдена 1 команда."
        : `Найдено команд: ${filtered.length}.`;

    results.innerHTML = filtered.map(renderCard).join("");
  }

  /** Пит-зона: число или плейсхолдер «--». */
  function formatPitZone(v) {
    if (v == null || v === "") return "--";
    const trimmed = String(v).trim();
    if (trimmed === "--") return "--";
    if (typeof v === "number" && Number.isFinite(v)) {
      return String(Math.trunc(v));
    }
    const n = Number(trimmed);
    if (Number.isFinite(n) && trimmed !== "") return String(Math.trunc(n));
    const m = trimmed.match(/-?\d+/);
    return m ? m[0] : "--";
  }

  function displayTeamNumber(team) {
    const n = team.number;
    if (n == null || String(n).trim() === "") return "---";
    return String(n).trim();
  }

  function renderCard(team) {
    const num = escapeHtml(displayTeamNumber(team));
    const name = escapeHtml(team.name || "--");
    return (
      '<article class="card">' +
      '<div class="card-identity">' +
      '<div class="identity-field">' +
      '<span class="identity-label">Номер команды</span>' +
      '<p class="identity-num">' +
      num +
      "</p>" +
      "</div>" +
      '<div class="identity-field">' +
      '<span class="identity-label">Название</span>' +
      '<p class="identity-name">' +
      name +
      "</p>" +
      "</div>" +
      "</div>" +
      '<div class="rows">' +
      row("First Run", team.launch1) +
      row("Second Run", team.launch2) +
      row("Third Run", team.launch3) +
      row("Judging Session", team.judging) +
      row("Пит-зона", formatPitZone(team.pitZone), true) +
      "</div>" +
      "</article>"
    );
  }

  function row(label, value, pit) {
    const v = value != null && String(value).trim() !== "" ? String(value) : "--";
    const cls = pit ? "row pit-highlight" : "row";
    return (
      '<div class="' +
      cls +
      '">' +
      '<span class="row-label">' +
      escapeHtml(label) +
      "</span>" +
      '<p class="row-value">' +
      escapeHtml(v) +
      "</p>" +
      "</div>"
    );
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function pluralTeams(n) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m100 >= 11 && m100 <= 14) return "команд";
    if (m10 === 1) return "команда";
    if (m10 >= 2 && m10 <= 4) return "команды";
    return "команд";
  }

  fetch("data/teams.json")
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then((data) => {
      teams = Array.isArray(data) ? data : [];
      render();
    })
    .catch((e) => {
      loadError = e.message || String(e);
      render();
    });

  let t = null;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(render, 120);
  });
  input.addEventListener("search", render);
})();
