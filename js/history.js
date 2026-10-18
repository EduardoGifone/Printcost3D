(() => {
  const store = window.PrintCostStorage;
  const calc = window.PrintCostCalculator;
  function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }
  function render() {
    const list = store.getHistory();
    const container = document.getElementById("history-list");
    const empty = document.getElementById("history-empty");
    const count = document.getElementById("history-count");
    count.textContent = list.length;
    container.innerHTML = "";
    empty.hidden = list.length > 0;
    list.slice().reverse().forEach(item => {
      const card = document.createElement("article");
      card.className = "history-card";
      card.innerHTML = `
        <div class="history-main">
          <h3>${safe(item.name || "Cotización sin nombre")}</h3>
          <div class="history-meta">
            <span>${safe(item.dateLabel)}</span>
            <span>${safe(item.grams)} g · ${safe(item.timeLabel)} · ${safe(item.quantity)} unid.</span>
            <span>${safe(item.material || "Material no especificado")}</span>
          </div>
        </div>
        <div class="history-price">
          <div><strong>${calc.money(item.result.unitPrice)}</strong><span> / pieza</span></div>
          <div class="history-buttons">
            <button class="mini-btn" data-action="load" data-id="${safe(item.id)}">Cargar</button>
            <button class="mini-btn" data-action="copy" data-id="${safe(item.id)}">Copiar</button>
            <button class="mini-btn" data-action="delete" data-id="${safe(item.id)}" aria-label="Eliminar cotización">Eliminar</button>
          </div>
        </div>`;
      container.appendChild(card);
    });
  }
  window.PrintCostHistory = {render, safe};
})();
