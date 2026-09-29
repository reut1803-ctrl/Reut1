"use client";

import { useMemo, useState } from "react";
import { X, Phone, MessageCircle, Search, Plus, Trash2, PenLine, BookUser } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { whatsappNumber } from "@/lib/crm/brainstorm";
import Overlay from "@/components/crm/ui/Overlay";

// הקטגוריות היחידות באלפון, לפי הגדרת רעות. אין להוסיף או לגרוע כאן.
export const DIRECTORY_CATEGORIES = ["תורני", "חוזר בתשובה", "ברסלב", 'חב"ד', "דתל\"ש"];

const emptyDraft = { name: "", category: DIRECTORY_CATEGORIES[0], phone: "", note: "" };


// טופס איש קשר. משמש גם להוספה חדשה בראש הרשימה וגם לעריכה בתוך השורה
// עצמה, כדי שהעריכה תיפתח בדיוק במקום שבו לחצו.
function ContactForm({ draft, setDraft, onSave, onCancel, saving }) {
  return (
    <div>
      <input
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        placeholder="שם"
        className="mb-2 w-full rounded-xl bg-[#F6F5F4] px-3 py-2 text-[13px] outline-none"
      />
      <input
        value={draft.phone}
        onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
        placeholder="טלפון"
        inputMode="tel"
        className="mb-2 w-full rounded-xl bg-[#F6F5F4] px-3 py-2 text-[13px] outline-none"
      />
      <div className="mb-2 flex flex-wrap gap-1.5">
        {DIRECTORY_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setDraft({ ...draft, category: c })}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
              draft.category === c ? "bg-[#F6E4E6] text-[#6E3540]" : "bg-[#F6F5F4] text-[#8A8285]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <textarea
        value={draft.note}
        onChange={(e) => setDraft({ ...draft, note: e.target.value })}
        rows={2}
        placeholder="הערה (אזור, התמחות, איך מכירים...)"
        className="mb-2 w-full resize-none rounded-xl bg-[#F6F5F4] px-3 py-2 text-[13px] outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-[#8C4A55] py-2 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          {saving ? "שומר..." : "שמירה"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-[#EAE5E3] bg-white px-4 py-2 text-[13px] font-semibold text-[#8A8285]"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

export default function MatchmakersDirectory({ onClose }) {
  const role = useCrmStore((s) => s.role);
  const matchmakers = useCrmStore((s) => s.matchmakers);
  const matchmakersLoaded = useCrmStore((s) => s.matchmakersLoaded);
  const saveMatchmakers = useCrmStore((s) => s.saveMatchmakers);
  const showToast = useCrmStore((s) => s.showToast);

  const [category, setCategory] = useState("הכל");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState("");

  const isAdmin = role === "admin";

  const list = useMemo(() => {
    const term = search.trim();
    return (matchmakers || [])
      .filter((m) => category === "הכל" || m.category === category)
      .filter((m) => !term || String(m.name || "").includes(term) || String(m.note || "").includes(term))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "he"));
  }, [matchmakers, category, search]);

  // כמה אנשי קשר יש בכל קטגוריה - כדי שברור מיד איפה יש תוכן
  const counts = useMemo(() => {
    const map = {};
    (matchmakers || []).forEach((m) => {
      map[m.category] = (map[m.category] || 0) + 1;
    });
    return map;
  }, [matchmakers]);

  const persist = async (next) => {
    setSaving(true);
    setError("");
    try {
      await saveMatchmakers(next);
      return true;
    } catch (err) {
      setError(`השמירה נכשלה: ${err?.code || ""} ${err?.message || String(err)}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!draft?.name?.trim()) {
      setError("צריך למלא שם");
      return;
    }
    const clean = {
      id: draft.id || `m-${Date.now()}`,
      name: draft.name.trim(),
      category: draft.category,
      phone: String(draft.phone || "").trim(),
      note: String(draft.note || "").trim(),
    };
    const current = matchmakers || [];
    const next = draft.id ? current.map((m) => (m.id === draft.id ? clean : m)) : [...current, clean];
    if (await persist(next)) {
      setDraft(null);
      showToast("האלפון עודכן");
    }
  };

  const handleDelete = async (id) => {
    const next = (matchmakers || []).filter((m) => m.id !== id);
    if (await persist(next)) {
      setConfirmDeleteId(null);
      showToast("איש הקשר הוסר מהאלפון");
    }
  };

  return (
    <Overlay>
      <div className="fixed inset-0 z-[60] flex" dir="rtl">
        <button
          aria-label="סגירת האלפון"
          onClick={onClose}
          className="absolute inset-0 bg-[#3A3335]/40"
        />
        {/* מגירה צדדית. נפתחת מעל המסך ואינה מנווטת לשום עמוד,
            ולכן מיקום הגלילה ברשימה שמאחוריה נשמר במלואו. */}
        <div className="relative flex h-full w-[86%] max-w-sm flex-col bg-[#F6F5F4] shadow-2xl safe-top safe-bottom">
          <div className="flex items-center justify-between border-b border-[#EAE5E3] bg-white px-4 py-3">
            <h2 className="flex items-center gap-2 text-[16px] font-bold text-[#3A3335]">
              <BookUser size={19} className="text-[#8C4A55]" /> אלפון שדכנים
            </h2>
            <button
              onClick={onClose}
              aria-label="סגירה"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F5F4] text-[#8A8285] transition active:scale-90"
            >
              <X size={18} />
            </button>
          </div>

          <div className="border-b border-[#EAE5E3] bg-white px-4 pb-3">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#B5AEB0]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש שם..."
                className="w-full rounded-2xl bg-[#F6F5F4] py-2.5 pr-9 pl-3 text-[13px] outline-none placeholder:text-[#B5AEB0] focus:ring-2 focus:ring-[#8C4A55]/25"
              />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {["הכל", ...DIRECTORY_CATEGORIES].map((c) => {
                const active = category === c;
                const count = c === "הכל" ? (matchmakers || []).length : counts[c] || 0;
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                      active ? "bg-[#F6E4E6] text-[#6E3540]" : "bg-[#F6F5F4] text-[#8A8285]"
                    }`}
                  >
                    {c}
                    {count > 0 && <span className="mr-1 text-[10px] opacity-70">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {error && <p className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-[#C24545]">{error}</p>}

            {isAdmin && !draft && (
              <button
                onClick={() => setDraft({ ...emptyDraft })}
                className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#D8CFCB] bg-white py-2.5 text-[13px] font-semibold text-[#8C4A55] transition active:scale-[0.99]"
              >
                <Plus size={15} /> הוספת איש קשר לאלפון
              </button>
            )}

            {draft && !draft.id && (
              <div className="mb-3 rounded-2xl border border-[#EAE5E3] bg-white p-3">
                <ContactForm
                  draft={draft}
                  setDraft={setDraft}
                  onSave={handleSaveDraft}
                  onCancel={() => {
                    setDraft(null);
                    setError("");
                  }}
                  saving={saving}
                />
              </div>
            )}

            {!matchmakersLoaded ? (
              <p className="mt-10 text-center text-[13px] text-[#8A8285]">טוען את האלפון...</p>
            ) : list.length === 0 ? (
              <p className="mt-10 text-center text-[13px] leading-relaxed text-[#8A8285]">
                {(matchmakers || []).length === 0
                  ? isAdmin
                    ? "האלפון עדיין ריק. אפשר להוסיף איש קשר ראשון למעלה."
                    : "האלפון עדיין ריק. המנהלת תוסיף אנשי קשר בקרוב."
                  : "אין אנשי קשר בקטגוריה הזו."}
              </p>
            ) : (
              <ul className="space-y-2">
                {list.map((m) => {
                  const wa = whatsappNumber(m.phone);
                  return (
                    <li key={m.id} className="rounded-2xl border border-[#EAE5E3] bg-white p-3">
                      {/* עריכה מתרחשת בתוך השורה עצמה. קודם הטופס נפתח בראש
                          הרשימה - ומי שגלל למטה לחץ על העיפרון ולא ראה כלום,
                          כי הטופס נפתח הרחק מחוץ למסך. */}
                      {draft?.id === m.id ? (
                        <ContactForm
                          draft={draft}
                          setDraft={setDraft}
                          onSave={handleSaveDraft}
                          onCancel={() => {
                            setDraft(null);
                            setError("");
                          }}
                          saving={saving}
                        />
                      ) : (
                      <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-[#3A3335]">{m.name}</p>
                          <p className="mt-0.5 text-[11px] font-semibold text-[#8C4A55]">{m.category}</p>
                          {m.note && <p className="mt-1 text-[12px] leading-relaxed text-[#8A8285]">{m.note}</p>}
                          {m.phone && (
                            <p dir="ltr" className="mt-1 text-right text-[12px] text-[#B5AEB0]">
                              {m.phone}
                            </p>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex shrink-0 gap-1">
                            <button
                              onClick={() => {
                                setError("");
                                setConfirmDeleteId(null);
                                setDraft({ ...m });
                              }}
                              aria-label="עריכה"
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F6F5F4] text-[#8A8285]"
                            >
                              <PenLine size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setError("");
                                setConfirmDeleteId(m.id);
                              }}
                              aria-label="מחיקה"
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-[#C24545]"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {m.phone && (
                        <div className="mt-2.5 flex gap-2">
                          {/* נפתח באפליקציה חיצונית / בלשונית נפרדת. אין ניווט
                              בתוך האתר, ולכן אין רענון ומיקום הגלילה נשמר. */}
                          {wa && (
                            <a
                              href={`https://wa.me/${wa}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#20A66B] py-2 text-[12px] font-semibold text-white transition active:scale-95"
                            >
                              <MessageCircle size={14} /> וואטסאפ
                            </a>
                          )}
                          <a
                            href={`tel:${String(m.phone).replace(/[^\d+]/g, "")}`}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#EAE5E3] bg-white py-2 text-[12px] font-semibold text-[#3A3335] transition active:scale-95"
                          >
                            <Phone size={14} /> חיוג
                          </a>
                        </div>
                      )}
                      {/* אישור מחיקה בתוך השורה, כדי שהמשוב יופיע איפה שנוגעים */}
                      {confirmDeleteId === m.id && (
                        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2">
                          <span className="text-[12px] font-semibold text-[#C24545]">למחוק את {m.name}?</span>
                          <button
                            onClick={() => handleDelete(m.id)}
                            disabled={saving}
                            className="mr-auto rounded-lg bg-[#C24545] px-3 py-1 text-[11px] font-bold text-white disabled:opacity-50"
                          >
                            {saving ? "מוחק..." : "מחיקה"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg border border-[#EAE5E3] bg-white px-3 py-1 text-[11px] font-bold text-[#8A8285]"
                          >
                            ביטול
                          </button>
                        </div>
                      )}
                      </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Overlay>
  );
}
