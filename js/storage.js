(() => {
  const SETTINGS_KEY = "printcost3d.settings.v1";
  const HISTORY_KEY = "printcost3d.history.v1";
  const DEFAULTS = {
    electricityRate: 0.90,
    printerWatts: 200,
    wearPerHour: 0.30,
    failurePercent: 10,
    manualHourlyRate: 10,
    designHourlyRate: 10,
    defaultFilamentPrice: 50,
    markupPercent: 100,
    fixedCostPerPrint: 0
  };
  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn("No se pudo leer almacenamiento local.", error);
      return fallback;
    }
  }
  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("No se pudo guardar en almacenamiento local.", error);
      return false;
    }
  }
  window.PrintCostStorage = {
    defaults: {...DEFAULTS},
    getSettings() {
      const saved = readJSON(SETTINGS_KEY, {});
      return {...DEFAULTS, ...(saved && typeof saved === "object" ? saved : {})};
    },
    saveSettings(settings) { return saveJSON(SETTINGS_KEY, {...DEFAULTS, ...settings}); },
    resetSettings() { return saveJSON(SETTINGS_KEY, {...DEFAULTS}); },
    getHistory() {
      const value = readJSON(HISTORY_KEY, []);
      return Array.isArray(value) ? value : [];
    },
    saveHistory(items) { return saveJSON(HISTORY_KEY, items); }
  };
})();
