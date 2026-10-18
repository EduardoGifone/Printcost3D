(() => {
  function money(value) {
    return new Intl.NumberFormat("es-PE", {style:"currency", currency:"PEN", minimumFractionDigits:2, maximumFractionDigits:2}).format(Number.isFinite(value) ? value : 0).replace("PEN", "S/");
  }
  function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function validate(input, settings) {
    const errors = [];
    if (!(input.grams > 0)) errors.push("Los gramos por pieza deben ser mayores que cero.");
    if (input.filamentPrice < 0) errors.push("El precio del filamento no puede ser negativo.");
    if (!(input.printHours >= 0) || !(input.printMinutes >= 0 && input.printMinutes <= 59)) errors.push("Ingresa un tiempo válido: horas no negativas y minutos entre 0 y 59.");
    if (input.printHours * 60 + input.printMinutes <= 0) errors.push("El tiempo de impresión debe ser mayor que cero.");
    if (!(Number.isInteger(input.quantity) && input.quantity >= 1 && input.quantity <= 100000)) errors.push("La cantidad debe ser un entero entre 1 y 100 000.");
    if (input.manualMinutes < 0) errors.push("El trabajo manual no puede ser negativo.");
    if (input.designType === "own" && input.designHours < 0) errors.push("Las horas de diseño no pueden ser negativas.");
    if (input.designType === "own" && !(Number.isInteger(input.designUnits) && input.designUnits >= 1)) errors.push("Las unidades previstas para amortizar el diseño deben ser al menos 1.");
    if (input.extrasUnit < 0 || input.extrasBatch < 0) errors.push("Los costos adicionales no pueden ser negativos.");
    for (const [key, value] of Object.entries(settings)) {
      if (!Number.isFinite(Number(value)) || Number(value) < 0) errors.push("Revisa la configuración: todos los costos y porcentajes deben ser números no negativos.");
      if (key === "failurePercent" && Number(value) > 100) errors.push("La reserva para fallas debe estar entre 0% y 100%.");
    }
    return [...new Set(errors)];
  }
  function calculate(input, settings) {
    const hoursPerPiece = (input.printHours * 60 + input.printMinutes) / 60;
    const quantity = input.quantity;
    const filamentPerPiece = input.grams * input.filamentPrice / 1000;
    const electricityPerPiece = hoursPerPiece * (settings.printerWatts / 1000) * settings.electricityRate;
    const wearPerPiece = hoursPerPiece * settings.wearPerHour;
    const failurePerPiece = (filamentPerPiece + electricityPerPiece + wearPerPiece) * settings.failurePercent / 100;
    const manualPerPiece = input.manualMinutes / 60 * settings.manualHourlyRate;
    const fixedPerPiece = settings.fixedCostPerPrint;
    const extrasPerPiece = input.extrasEnabled ? input.extrasUnit : 0;
    const extrasBatchPerPiece = input.extrasEnabled ? input.extrasBatch / quantity : 0;
    const designTotal = input.designType === "own" ? input.designHours * settings.designHourlyRate : 0;
    const designPerPiece = input.designType === "own" ? designTotal / input.designUnits : 0;
    const costPerPiece = filamentPerPiece + electricityPerPiece + wearPerPiece + failurePerPiece + manualPerPiece + fixedPerPiece + extrasPerPiece + extrasBatchPerPiece + designPerPiece;
    const batchCost = costPerPiece * quantity;
    const unitPrice = costPerPiece * (1 + settings.markupPercent / 100);
    const batchPrice = unitPrice * quantity;
    const unitProfit = unitPrice - costPerPiece;
    return {
      hoursPerPiece, quantity, costPerPiece, batchCost, unitPrice, batchPrice, unitProfit,
      designTotal, designPerPiece,
      breakdown: [
        {label:"Filamento", unit:filamentPerPiece, total:filamentPerPiece * quantity},
        {label:"Electricidad", unit:electricityPerPiece, total:electricityPerPiece * quantity},
        {label:"Desgaste y mantenimiento", unit:wearPerPiece, total:wearPerPiece * quantity},
        {label:`Reserva para fallas (${settings.failurePercent}%)`, unit:failurePerPiece, total:failurePerPiece * quantity},
        {label:"Trabajo manual", unit:manualPerPiece, total:manualPerPiece * quantity},
        {label:"Costo fijo por impresión", unit:fixedPerPiece, total:fixedPerPiece * quantity},
        ...(input.extrasEnabled ? [
          {label:"Empaque/accesorios por pieza", unit:extrasPerPiece, total:extrasPerPiece * quantity},
          {label:"Extras por lote", unit:extrasBatchPerPiece, total:input.extrasBatch}
        ] : []),
        ...(input.designType === "own" ? [{label:"Diseño propio amortizado", unit:designPerPiece, total:designPerPiece * quantity, note:`Inversión de ${money(designTotal)} repartida entre ${input.designUnits} unidades previstas`}] : [])
      ],
      markupPercent: settings.markupPercent
    };
  }
  window.PrintCostCalculator = {money, round, validate, calculate};
})();
