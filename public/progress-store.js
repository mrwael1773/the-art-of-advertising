(() => {
  "use strict";
  const KEY = "art-of-advertising:student-progress:v1";
  function readAll() {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    try {
      const value = JSON.parse(raw);
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }
  function get(lessonKey) {
    if (typeof lessonKey !== "string" || !lessonKey) return null;
    const record = readAll()[lessonKey];
    if (!record || typeof record !== "object" ||
        !Number.isInteger(record.score) || !Number.isInteger(record.total) ||
        record.total < 1 || record.score < 0 || record.score > record.total ||
        record.completed !== true) return null;
    return record;
  }
  function save(lessonKey, record) {
    if (typeof lessonKey !== "string" || !lessonKey ||
        !record || typeof record !== "object" ||
        !Number.isInteger(record.score) || !Number.isInteger(record.total) ||
        record.total < 1 || record.score < 0 || record.score > record.total ||
        record.completed !== true) throw new TypeError("بيانات التقدم غير صالحة.");
    const all = readAll();
    all[lessonKey] = { ...record, updatedAt: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(all));
    return all[lessonKey];
  }
  function clear(lessonKey) {
    if (typeof lessonKey !== "string" || !lessonKey) return;
    const all = readAll();
    delete all[lessonKey];
    if (Object.keys(all).length) window.localStorage.setItem(KEY, JSON.stringify(all));
    else window.localStorage.removeItem(KEY);
  }
  window.StudentProgressStore = Object.freeze({ get, save, clear });
})();
