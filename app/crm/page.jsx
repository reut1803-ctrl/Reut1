"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, UserPlus } from "lucide-react";
import { useCrmStore, AGE_LIMITS, HEIGHT_LIMITS } from "@/lib/crm/store";
import { normalizeTagName } from "@/lib/crm/mockData";
import GenderToggle from "@/components/crm/layout/GenderToggle";
import ProfileCard from "@/components/crm/profiles/ProfileCard";
import FilterSheet from "@/components/crm/profiles/FilterSheet";
import TipsCarousel from "@/components/crm/profiles/TipsCarousel";
import TagsSidebar from "@/components/crm/profiles/TagsSidebar";
import StaffTour from "@/components/crm/tour/StaffTour";
import SpotlightStrip from "@/components/crm/profiles/SpotlightStrip";
import { pickSpotlight } from "@/lib/crm/attention";

function ProfilesFeed() {
  const searchParams = useSearchParams();
  const board = useCrmStore((s) => s.board);
  const setBoard = useCrmStore((s) => s.setBoard);
  const role = useCrmStore((s) => s.role);
  const filters = useCrmStore((s) => s.filters);
  const setFilters = useCrmStore((s) => s.setFilters);
  const searchAutoFilled = useCrmStore((s) => s.searchAutoFilled);
  const setAutoSearch = useCrmStore((s) => s.setAutoSearch);
  const clearAutoSearch = useCrmStore((s) => s.clearAutoSearch);
  const clearAllFilters = useCrmStore((s) => s.clearAllFilters);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const findCandidateById = useCrmStore((s) => s.findCandidateById);
  const candidates_ = useCrmStore((s) => s.candidates);
  const candidatesLoaded = useCrmStore((s) => s.candidatesLoaded);
  const candidatesError = useCrmStore((s) => s.candidatesError);
  // נרשמים להיסט שעון השרת עצמו (ולא רק לפונקציה), כדי שהמסך יתעדכן
  // ברגע שההיסט נמדד ולא יישאר עם חישוב זמן על שעון מכשיר שגוי.
  const serverOffsetMs = useCrmStore((s) => s.serverOffsetMs);
  const attentionData = useCrmStore((s) => s.attentionData);
  const intake_ = useCrmStore((s) => s.intakeSubmissions);
  const tab = useCrmStore((s) => s.feedTab);
  const setTab = useCrmStore((s) => s.setFeedTab);
  const [showFilters, setShowFilters] = useState(false);
  const [focusedId, setFocusedId] = useState(null);
  const focusedOnceRef = useRef(null);

  // אחרי הוספת מועמד/ת חדש/ה: מנקים כל סינון פעיל ועוברים למאגר וללשונית הנכונים,
  // כדי שהכרטיס החדש ייראה מיד בראש הרשימה ולא "ייבלע" בסינון קודם שנשאר ברקע.
  useEffect(() => {
    const addedId = searchParams.get("added");
    if (!addedId) return;
    const c = findCandidateById(addedId);
    if (!c) return;
    clearAllFilters();
    setBoard(c.gender);
    setTab("new");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, candidates_]);

  useEffect(() => {
    const openId = searchParams.get("openCandidate");
    // בכניסה רגילה למאגר (בלי קישור לכרטיס) מנקים חיפוש שמולא אוטומטית בפעם קודמת,
    // אחרת הוא נשאר תקוע ומסתיר את כל שאר המאגר.
    if (!openId) {
      clearAutoSearch();
      return;
    }
    const c = findCandidateById(openId);
    if (!c) return;
    setBoard(c.gender);
    setTab(c.isNew ? "new" : "previous");
    setAutoSearch(c.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // אחרי שמירת עריכה חוזרים למאגר עם מזהה הכרטיס שנערך, וגוללים ישירות אליו
  // במקום לקפוץ לראש הרשימה. הכרטיס גם מקבל הדגשה קצרה כדי שיהיה קל למצוא אותו.
  useEffect(() => {
    const editedId = searchParams.get("edited");
    if (!editedId || !candidatesLoaded) return;
    // מתמקדים בכרטיס פעם אחת בלבד. בלי זה, כל החלפת לשונית או עדכון מהשרת
    // הייתה מושכת את המסך בחזרה לאותו כרטיס.
    if (focusedOnceRef.current === editedId) return;
    focusedOnceRef.current = editedId;
    let cancelled = false;
    // הרשימה נבנית אחרי שהנתונים מגיעים, ולכן מחפשים את הכרטיס עד שהוא קיים במסך
    const deadline = Date.now() + 2000;
    const focus = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-candidate-card="${editedId}"]`);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "auto" });
        setFocusedId(editedId);
        setTimeout(() => !cancelled && setFocusedId(null), 2200);
        return;
      }
      if (Date.now() < deadline) requestAnimationFrame(focus);
    };
    requestAnimationFrame(focus);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, candidatesLoaded, candidates_]);

  // השלמה חד-פעמית של שדה "חסוי" לכרטיסים ותיקים. רצה רק אצל המנהלת ובשקט,
  // ומכינה את המאגר לאכיפה בשרת בלי שהצוות יאבד כרטיסים ותיקים.
  useEffect(() => {
    if (role !== "admin" || !candidatesLoaded) return;
    const store = useCrmStore.getState();
    store.backfillConfidentialFlag();
    // מפתח החיפוש לטופס ההרשמה החיצוני, ופניות שהגיעו ממנו וממתינות להמרה
    store.backfillNameIndex();
    // כרטיסים ותיקים מהטופס שעדיין לא נוצר איתם קשר חוזרים למצב חסוי.
    // פניות חדשות אינן הופכות לכרטיס מעצמן - ראו לוח הבקרה.
    store.hideUncontactedIntake();
  }, [role, candidatesLoaded, candidates_, intake_]);

  // "קודמות" מוגדרת כ"כל מי שאינו חדש" - משלימה מתמטית, כדי שכרטיס לא ייפול בין הלשוניות
  const inTab = (c, which) => (which === "new" ? !!c.isNew : !c.isNew);

  // ערך חסר (גיל/גובה שלא הוזנו) אינו מסנן כלל. רק ערך מספרי אמיתי נבדק מול הטווח.
  // ומחוון שנמצא על הטווח המלא אינו מסנן בכלל - כדי ש"ניקוי סינון" באמת יציג את כולם,
  // גם כרטיס שהוזן בו ערך חריג או שגוי.
  const inRange = (value, [min, max], [limitMin, limitMax]) => {
    if (min <= limitMin && max >= limitMax) return true;
    const n = Number(value);
    if (value === null || value === undefined || value === "" || Number.isNaN(n)) return true;
    return n >= min && n <= max;
  };

  const visibleInBoard = useMemo(() => allCandidates(board), [board, allCandidates, candidates_]);

  const passesFilters = (c) => {
    if (!inRange(c.age, filters.ageRange, AGE_LIMITS)) return false;
    if (!inRange(c.height, filters.heightRange, HEIGHT_LIMITS)) return false;
    if (filters.religiousLevel !== "הכל" && c.religiousLevel !== filters.religiousLevel) return false;
    if (filters.region !== "הכל" && c.region !== filters.region) return false;
    if (filters.search && !(c.name || "").includes(filters.search.trim())) return false;
    if (filters.tag && normalizeTagName(c.tag) !== filters.tag) return false;
    return true;
  };

  const candidates = useMemo(
    () => visibleInBoard.filter((c) => inTab(c, tab) && passesFilters(c)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleInBoard, tab, filters]
  );

  // כרטיסי "הזרקור היומי". נבחרים מתוך אותה רשימה שמוצגת מטה בדיוק, ולכן כל
  // כרטיס בזרקור נמצא תמיד גם ברשימה הרגילה - הזרקור אינו מוציא אף אחד ממנה.
  const spotlightNow = Date.now() + serverOffsetMs;
  const spotlight = useMemo(
    () => (role === "staff" || role === "admin" ? pickSpotlight(candidates, spotlightNow, attentionData) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candidates, role, serverOffsetMs, attentionData]
  );

  // גלילה אל הכרטיס המלא ברשימה שמתחת, בלי ניווט ובלי רענון
  const jumpToCard = (id) => {
    const el = document.querySelector(`[data-candidate-card="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    setFocusedId(id);
    setTimeout(() => setFocusedId((cur) => (cur === id ? null : cur)), 2200);
  };

  // כמה כרטיסים יש בלשונית הנוכחית לפני הסינון, וכמה מוסתרים בגללו
  const totalInTab = useMemo(() => visibleInBoard.filter((c) => inTab(c, tab)).length, [visibleInBoard, tab]);
  const hiddenByFilters = totalInTab - candidates.length;
  const otherTab = tab === "new" ? "previous" : "new";
  const matchesInOtherTab = useMemo(
    () => visibleInBoard.filter((c) => inTab(c, otherTab) && passesFilters(c)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleInBoard, otherTab, filters]
  );

  return (
    <div className="px-4 py-4">
      {(role === "staff" || role === "admin") && <TipsCarousel />}

      <GenderToggle />

      <div data-tour="tour-search" className="relative mt-4">
        <Search size={17} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#B5AEB0]" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="חיפוש מועמד (שם, משפחה)..."
          className="w-full rounded-2xl bg-white py-3 pr-10 pl-4 text-[14px] text-[#3A3335] shadow-sm outline-none placeholder:text-[#B5AEB0] focus:ring-2 focus:ring-[#8C4A55]/30"
        />
        {searchAutoFilled && filters.search && (
          <p className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-[#8A8285]">
            החיפוש הזה מולא אוטומטית לפי הכרטיס שנפתח
            <button onClick={clearAutoSearch} className="font-bold text-[#8C4A55] underline">
              ניקוי
            </button>
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div data-tour="tour-tabs" className="flex flex-1 rounded-2xl bg-white p-1 shadow-sm">
          <button
            onClick={() => setTab("new")}
            className={`flex-1 rounded-xl py-2 text-[13px] font-bold transition ${
              tab === "new" ? "bg-[#F6E4E6] text-[#6E3540]" : "text-[#8A8285]"
            }`}
          >
            הצעות חדשות
          </button>
          <button
            onClick={() => setTab("previous")}
            className={`flex-1 rounded-xl py-2 text-[13px] font-bold transition ${
              tab === "previous" ? "bg-[#F6E4E6] text-[#6E3540]" : "text-[#8A8285]"
            }`}
          >
            הצעות קודמות
          </button>
        </div>
        <button
          data-tour="tour-filter"
          onClick={() => setShowFilters(true)}
          aria-label="סינון"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#8C4A55] shadow-sm transition active:scale-95"
        >
          <SlidersHorizontal size={18} />
        </button>
        {(role === "staff" || role === "admin") && (
          <Link
            href="/crm/add-candidate"
            aria-label="הוספת מועמד/ת"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8C4A55] text-white shadow-sm transition active:scale-95"
          >
            <UserPlus size={18} />
          </Link>
        )}
      </div>

      {spotlight.length > 0 && (
        <SpotlightStrip
          candidates={spotlight}
          now={spotlightNow}
          attentionData={attentionData}
          onSelect={jumpToCard}
        />
      )}

      {candidatesError ? (
        <p className="mt-16 text-center text-sm leading-relaxed text-[#C24545]">
          לא הצלחנו לטעון את המאגר.
          <br />
          נסו לרענן את הדף, ואם זה חוזר - פנו למנהלת לבדיקת ההרשאות.
        </p>
      ) : !candidatesLoaded ? (
        <p className="mt-16 text-center text-sm text-[#8A8285]">טוען את המאגר...</p>
      ) : candidates.length === 0 ? (
        <div className="mt-16 text-center text-sm leading-relaxed text-[#8A8285]">
          {hiddenByFilters > 0 || matchesInOtherTab > 0 ? (
            <>
              <p>
                {hiddenByFilters > 0 && `${hiddenByFilters} מועמדים בלשונית הזו מוסתרים כרגע בגלל הסינון.`}
                {hiddenByFilters > 0 && matchesInOtherTab > 0 && <br />}
                {matchesInOtherTab > 0 &&
                  `יש ${matchesInOtherTab} מועמדים שמתאימים לסינון בלשונית "${
                    otherTab === "new" ? "הצעות חדשות" : "הצעות קודמות"
                  }".`}
              </p>
              <div className="mt-3 flex justify-center gap-2">
                {matchesInOtherTab > 0 && (
                  <button
                    onClick={() => setTab(otherTab)}
                    className="rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-[12px] font-semibold text-[#3A3335]"
                  >
                    מעבר ללשונית השנייה
                  </button>
                )}
                {hiddenByFilters > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="rounded-xl bg-[#8C4A55] px-3 py-2 text-[12px] font-semibold text-white"
                  >
                    ניקוי סינון
                  </button>
                )}
              </div>
            </>
          ) : (
            <p>אין עדיין מועמדים בלשונית הזו</p>
          )}
        </div>
      ) : (
        <>
          {hiddenByFilters > 0 && (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-[#F0DFA0] bg-[#FFF8E7] px-3 py-2">
              <p className="text-[12px] font-semibold text-[#946200]">
                {hiddenByFilters} מועמדים נוספים מוסתרים כרגע בגלל הסינון
              </p>
              <button
                onClick={clearAllFilters}
                className="shrink-0 rounded-xl bg-[#946200] px-2.5 py-1.5 text-[11px] font-bold text-white transition active:scale-95"
              >
                ניקוי סינון
              </button>
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {candidates.map((c) => (
              // העוגן מאפשר לחזור בדיוק לכרטיס הזה אחרי עריכה, בלי לקפוץ לראש הרשימה
              <div
                key={c.id}
                data-candidate-card={c.id}
                className={`rounded-3xl transition-shadow duration-500 ${
                  c.id === focusedId ? "ring-2 ring-[#8C4A55] ring-offset-2 ring-offset-[#F6F5F4]" : ""
                }`}
              >
                <ProfileCard candidate={c} />
              </div>
            ))}
          </div>
        </>
      )}

      {showFilters && <FilterSheet onClose={() => setShowFilters(false)} />}
      <TagsSidebar />
      <StaffTour />
    </div>
  );
}

export default function ProfilesFeedPage() {
  return (
    <Suspense fallback={null}>
      <ProfilesFeed />
    </Suspense>
  );
}
