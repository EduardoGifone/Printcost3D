(() => {
  const $ = id => document.getElementById(id);
  const storage = window.PrintCostStorage;
  const calculator = window.PrintCostCalculator;
  let latest = null;
  let toastTimer;
  const tips = {
    electricity: {title:"Tarifa eléctrica",body:"Es lo que pagas por cada kilovatio-hora (kWh) de electricidad. La tarifa inicial es una referencia editable; revisa tu recibo para usar el importe que corresponda.",example:"Ejemplo: si la impresora consume 0.2 kW durante 4 horas, usa 0.8 kWh. A S/ 0.90/kWh, la electricidad cuesta aproximadamente S/ 0.72."},
    watts: {title:"Consumo promedio de la impresora",body:"Es la potencia media aproximada que consume la impresora mientras trabaja, expresada en vatios (W). No es necesariamente la potencia máxima indicada por el fabricante.",example:"Ejemplo: 200 W equivalen a 0.2 kW. Si imprimes durante 4 horas, el cálculo estima 0.8 kWh. Puedes ajustar este valor si mides el consumo con un medidor."},
    wear: {title:"Desgaste y mantenimiento",body:"Es una reserva por hora de uso para cubrir mantenimiento, limpieza y desgaste de componentes. No es un cobro oficial del fabricante: es un supuesto para tu negocio.",example:"Ejemplo: con S/ 0.30 por hora y una impresión de 4 horas, se reservan S/ 1.20 para mantenimiento y desgaste."},
    failure: {title:"Reserva para fallas",body:"Es un porcentaje adicional para compensar parcialmente impresiones fallidas, pruebas y material desperdiciado. Se aplica al costo de filamento, electricidad y desgaste, no al trabajo manual ni al diseño.",example:"Ejemplo: si esos tres conceptos suman S/ 5 y configuras 10%, la reserva estimada será S/ 0.50. El porcentaje real puede variar según tus impresiones."},
    manual: {title:"Valor de tu hora de trabajo manual",body:"Es cuánto valoras una hora de tareas activas: preparar la impresión, retirar la pieza, limpiar, revisar y empacar. No incluye el tiempo en que la impresora trabaja sola.",example:"Ejemplo: si asignas S/ 10 por hora y trabajas 6 minutos en una pieza, el costo de tu trabajo es S/ 1."},
    designRate: {title:"Valor de tu hora de diseño",body:"Es cuánto vale cada hora que inviertes creando o modificando un modelo 3D. Ayuda a recuperar el tiempo de aprendizaje y modelado en las ventas del producto.",example:"Ejemplo: 3 horas de diseño a S/ 10/h cuestan S/ 30. Si planeas vender 30 unidades, asignas S/ 1 de diseño a cada unidad."},
    filament: {title:"Precio del filamento por kilogramo",body:"Es el precio que pagaste por la bobina de un kilo del material que usarás. Puedes cambiarlo en cada cotización cuando uses otra marca, tipo o color.",example:"Ejemplo: una bobina de S/ 50 y una pieza de 100 g producen un costo de material de S/ 5, sin contar desperdicio."},
    markup: {title:"Recargo sobre el costo",body:"Es el porcentaje que agregas al costo total calculado para obtener el precio sugerido. No es lo mismo que el margen expresado como porcentaje del precio de venta.",example:"Ejemplo: costo S/ 10 con recargo de 100% = precio S/ 20. La diferencia es S/ 10, equivalente a un margen bruto del 50% del precio, antes de gastos no incluidos."},
    fixed: {title:"Costo fijo por impresión",body:"Es un importe adicional por trabajo que no depende directamente de los gramos ni de las horas, por ejemplo una preparación fija o un gasto operativo que quieras incluir. Se aplica a cada pieza/unidad cotizada.",example:"Ejemplo: si configuras S/ 1, se añade S/ 1 al costo de cada unidad producida."}
  };
  function showToast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function showView(name) {
    document.querySelectorAll(".view").forEach(v => v.hidden = v.id !== `view-${name}`);
    document.querySelectorAll("[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === name && b.classList.contains("nav-btn")));
    if (name === "history") window.PrintCostHistory.render();
    if (name === "settings") loadSettingsForm();
    window.scrollTo({top:0, behavior:"smooth"});
  }
  function getSettingsForm() {
    return {
      electricityRate:Number($("cfg-electricity").value),
      printerWatts:Number($("cfg-watts").value),
      wearPerHour:Number($("cfg-wear").value),
      failurePercent:Number($("cfg-failure").value),
      manualHourlyRate:Number($("cfg-manual-rate").value),
      designHourlyRate:Number($("cfg-design-rate").value),
      defaultFilamentPrice:Number($("cfg-filament").value),
      markupPercent:Number($("cfg-markup").value),
      fixedCostPerPrint:Number($("cfg-fixed").value)
    };
  }
  function loadSettingsForm() {
    const s = storage.getSettings();
    const mapping = {"cfg-electricity":"electricityRate","cfg-watts":"printerWatts","cfg-wear":"wearPerHour","cfg-failure":"failurePercent","cfg-manual-rate":"manualHourlyRate","cfg-design-rate":"designHourlyRate","cfg-filament":"defaultFilamentPrice","cfg-markup":"markupPercent","cfg-fixed":"fixedCostPerPrint"};
    Object.entries(mapping).forEach(([id,key]) => $(id).value = s[key]);
  }
  function readInput() {
    const designType = document.querySelector('input[name="design-type"]:checked').value;
    return {
      name:$("quote-name").value.trim(),
      material:$("quote-material").value.trim(),
      grams:Number($("grams").value),
      filamentPrice:Number($("filament-price").value),
      printHours:Number($("print-hours").value),
      printMinutes:Number($("print-minutes").value),
      manualMinutes:Number($("manual-minutes").value || 0),
      quantity:Number($("quantity").value),
      designType,
      designHours:Number($("design-hours").value || 0),
      designUnits:Number($("design-units").value || 1),
      extrasEnabled:$("extras-enabled").checked,
      extrasUnit:Number($("extras-unit").value || 0),
      extrasBatch:Number($("extras-batch").value || 0)
    };
  }
  function renderResult(input, result) {
    latest = {input, result, settings:storage.getSettings()};
    $("unit-price").textContent = calculator.round(result.unitPrice).toFixed(2);
    $("unit-cost").textContent = calculator.money(calculator.round(result.costPerPiece));
    $("batch-price").textContent = calculator.money(calculator.round(result.batchPrice));
    $("unit-profit").textContent = calculator.money(calculator.round(result.unitProfit));
    $("price-caption").textContent = `Recargo configurado: ${result.markupPercent}%`;
    const breakdown = $("breakdown");
    breakdown.innerHTML = "";
    result.breakdown.forEach(row => {
      const div = document.createElement("div"); div.className = "breakdown-row";
      div.innerHTML = `<span>${window.PrintCostHistory.safe(row.label)}<br><small>Por pieza</small></span><strong>${calculator.money(calculator.round(row.unit))}</strong>`;
      breakdown.appendChild(div);
    });
    const cost = document.createElement("div"); cost.className = "breakdown-row total";
    cost.innerHTML = `<span>Costo estimado<br><small>Lote completo</small></span><strong>${calculator.money(calculator.round(result.batchCost))}</strong>`;
    breakdown.appendChild(cost);
    const price = document.createElement("div"); price.className = "breakdown-row total";
    price.innerHTML = `<span>Precio de venta<br><small>Lote completo</small></span><strong>${calculator.money(calculator.round(result.batchPrice))}</strong>`;
    breakdown.appendChild(price);
    $("result-note").textContent = input.designType === "own"
      ? `El diseño se amortiza entre ${input.designUnits} unidades previstas. Ajusta esa cantidad según tus expectativas reales de venta.`
      : "Estimación orientativa. Revisa el precio de mercado y verifica qué gastos están incluidos.";
  }
  function calculateFromForm(event) {
    if (event) event.preventDefault();
    const input = readInput();
    const settings = storage.getSettings();
    const errors = calculator.validate(input, settings);
    const error = $("form-error");
    if (errors.length) {
      error.textContent = errors.join(" ");
      error.hidden = false;
      return false;
    }
    error.hidden = true;
    const result = calculator.calculate(input, settings);
    renderResult(input, result);
    return true;
  }
  function quoteSummary(item) {
    const i = item.input, r = item.result;
    return [
      `PrintCost 3D — ${i.name || "Cotización de impresión 3D"}`,
      `Material: ${i.material || "No especificado"}`,
      `Filamento: ${i.grams} g por pieza · S/ ${i.filamentPrice}/kg`,
      `Tiempo: ${i.printHours} h ${i.printMinutes} min por pieza`,
      `Cantidad: ${i.quantity}`,
      `Costo estimado por pieza: ${calculator.money(calculator.round(r.costPerPiece))}`,
      `Precio sugerido por pieza: ${calculator.money(calculator.round(r.unitPrice))}`,
      `Precio total del lote: ${calculator.money(calculator.round(r.batchPrice))}`,
      `Recargo aplicado: ${r.markupPercent}%`,
      "Estimación orientativa; no incluye gastos que no se hayan ingresado."
    ].join("\n");
  }
  function saveCurrentQuote() {
    if (!latest) { showToast("Primero calcula una cotización."); return; }
    const history = storage.getHistory();
    const date = new Date();
    const item = {
      id: `${date.getTime()}-${Math.random().toString(36).slice(2,8)}`,
      date:date.toISOString(),
      dateLabel:date.toLocaleString("es-PE",{dateStyle:"medium",timeStyle:"short"}),
      timeLabel:`${latest.input.printHours} h ${latest.input.printMinutes} min`,
      name:latest.input.name || "Cotización sin nombre",
      material:latest.input.material,
      grams:latest.input.grams,
      quantity:latest.input.quantity,
      input:latest.input,
      result:latest.result,
      settings:latest.settings
    };
    history.push(item);
    if (!storage.saveHistory(history)) { showToast("No se pudo guardar. Revisa el almacenamiento del navegador."); return; }
    window.PrintCostHistory.render();
    showToast("Cotización guardada en este navegador.");
  }
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const textarea = document.createElement("textarea"); textarea.value = text; textarea.style.position = "fixed"; textarea.style.opacity = "0";
        document.body.appendChild(textarea); textarea.select();
        const ok = document.execCommand("copy"); textarea.remove();
        if (!ok) throw new Error("copy failed");
      }
      showToast("Resumen copiado.");
    } catch { showToast("No se pudo copiar automáticamente. Prueba desde un sitio HTTPS."); }
  }
  function loadHistoryItem(id) {
    const item = storage.getHistory().find(entry => entry.id === id);
    if (!item) return;
    const i = item.input;
    $("quote-name").value = i.name || ""; $("quote-material").value = i.material || "";
    $("grams").value = i.grams; $("filament-price").value = i.filamentPrice;
    $("print-hours").value = i.printHours; $("print-minutes").value = i.printMinutes;
    $("manual-minutes").value = i.manualMinutes; $("quantity").value = i.quantity;
    document.querySelector(`input[name="design-type"][value="${i.designType}"]`).checked = true;
    $("design-hours").value = i.designHours; $("design-units").value = i.designUnits;
    $("extras-enabled").checked = i.extrasEnabled; $("extras-unit").value = i.extrasUnit; $("extras-batch").value = i.extrasBatch;
    syncConditionalFields(); showView("calculator"); calculateFromForm(); showToast("Cotización cargada.");
  }
  function syncConditionalFields() {
    const own = document.querySelector('input[name="design-type"]:checked').value === "own";
    $("design-fields").hidden = !own;
    $("extras-fields").hidden = !$("extras-enabled").checked;
  }
  function openTip(key, button) {
    const tip = tips[key]; if (!tip) return;
    $("tooltip-title").textContent = tip.title;
    $("tooltip-content").innerHTML = `<p>${tip.body}</p><p class="tooltip-example"><strong>Ejemplo:</strong> ${tip.example}</p>`;
    const pop = $("tooltip-popover"); pop.hidden = false;
    const rect = button.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 28);
    let left = Math.max(14, Math.min(rect.left, window.innerWidth - width - 14));
    let top = rect.bottom + 8;
    if (window.innerWidth <= 560) { left = 14; top = Math.max(12, window.innerHeight - Math.min(pop.offsetHeight || 260, window.innerHeight * .6) - 14); }
    else if (top + 260 > window.innerHeight) top = Math.max(14, rect.top - 260);
    pop.style.left = `${left}px`; pop.style.top = `${top}px`;
    $("close-tooltip").focus();
  }
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
  $("quote-form").addEventListener("submit", calculateFromForm);
  ["grams","filament-price","print-hours","print-minutes","manual-minutes","quantity","design-hours","design-units","extras-unit","extras-batch"].forEach(id => $(id).addEventListener("input", () => calculateFromForm()));
  document.querySelectorAll('input[name="design-type"]').forEach(el => el.addEventListener("change", () => { syncConditionalFields(); calculateFromForm(); }));
  $("extras-enabled").addEventListener("change", () => { syncConditionalFields(); calculateFromForm(); });
  $("toggle-breakdown").addEventListener("click", () => {
    const panel = $("breakdown"); panel.hidden = !panel.hidden; $("toggle-breakdown").textContent = panel.hidden ? "Ver detalle" : "Ocultar detalle";
  });
  $("save-quote").addEventListener("click", saveCurrentQuote);
  $("copy-quote").addEventListener("click", () => latest ? copyText(quoteSummary(latest)) : showToast("Primero calcula una cotización."));
  $("settings-form").addEventListener("submit", event => {
    event.preventDefault();
    const s = getSettingsForm();
    const errors = [];
    Object.entries(s).forEach(([key,value]) => { if (!Number.isFinite(value) || value < 0) errors.push("Todos los valores deben ser números no negativos."); if (key === "failurePercent" && value > 100) errors.push("La reserva para fallas debe estar entre 0% y 100%."); });
    if (s.markupPercent > 100000) errors.push("El recargo es demasiado alto.");
    if (errors.length) { $("settings-status").textContent = errors[0]; $("settings-status").style.color = "var(--red)"; return; }
    if (!storage.saveSettings(s)) { $("settings-status").textContent = "No se pudo guardar en este navegador."; $("settings-status").style.color = "var(--red)"; return; }
    $("settings-status").textContent = "Configuración guardada correctamente."; $("settings-status").style.color = "var(--green)";
    $("filament-price").value = s.defaultFilamentPrice;
    calculateFromForm(); showToast("Configuración guardada.");
  });
  $("reset-settings").addEventListener("click", () => {
    if (!confirm("¿Restaurar todos los valores iniciales? Tu historial de cotizaciones no se borrará.")) return;
    storage.resetSettings(); loadSettingsForm(); $("settings-status").textContent = "Valores iniciales restaurados."; $("settings-status").style.color = "var(--green)";
    $("filament-price").value = storage.getSettings().defaultFilamentPrice; calculateFromForm(); showToast("Configuración restaurada.");
  });
  document.querySelectorAll("[data-tip]").forEach(button => button.addEventListener("click", () => openTip(button.dataset.tip, button)));
  $("close-tooltip").addEventListener("click", () => $("tooltip-popover").hidden = true);
  document.addEventListener("keydown", event => { if (event.key === "Escape") $("tooltip-popover").hidden = true; });
  document.addEventListener("click", event => {
    const pop = $("tooltip-popover");
    if (!pop.hidden && !pop.contains(event.target) && !event.target.closest("[data-tip]")) pop.hidden = true;
  });
  $("history-list").addEventListener("click", event => {
    const button = event.target.closest("button[data-action]"); if (!button) return;
    const {action,id} = button.dataset;
    const list = storage.getHistory(); const item = list.find(entry => entry.id === id);
    if (action === "load") loadHistoryItem(id);
    if (action === "copy" && item) copyText(quoteSummary(item));
    if (action === "delete") {
      if (!confirm("¿Eliminar esta cotización del historial?")) return;
      storage.saveHistory(list.filter(entry => entry.id !== id)); window.PrintCostHistory.render(); showToast("Cotización eliminada.");
    }
  });
  $("clear-history").addEventListener("click", () => {
    if (!storage.getHistory().length) { showToast("El historial ya está vacío."); return; }
    if (!confirm("¿Seguro que quieres borrar todas las cotizaciones guardadas?")) return;
    storage.saveHistory([]); window.PrintCostHistory.render(); showToast("Historial borrado.");
  });
  $("history-empty").querySelector("button").addEventListener("click", () => showView("calculator"));
  window.addEventListener("resize", () => { $("tooltip-popover").hidden = true; });
  loadSettingsForm();
  $("filament-price").value = storage.getSettings().defaultFilamentPrice;
  syncConditionalFields();
  calculateFromForm();
  window.PrintCostHistory.render();
})();
