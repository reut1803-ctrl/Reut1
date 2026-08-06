"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, UserPlus } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import GenderToggle from "@/components/crm/layout/GenderToggle";
import ProfileCard from "@/components/crm/profiles/ProfileCard";
import FilterSheet from "@/components/crm/profiles/FilterSheet";
import TipsCarousel from "@/components/crm/profiles/TipsCarousel";

function ProfilesFeed() {
  const searchParams = useSearchParams();
  const board = useCrmStore((s) => s.board);
  const setBoard = useCrmStore((s) => s.setBoard);
  const role = useCrmStore((s) => s.role);
  const filters = useCrmStore((s) => s.filters);
  const setFilters = useCrmStore((s) => s.setFilters);
  const resetFilters = useCrmStore((s) => s.resetFilters);
  const searchFromLink = useCrmStore((s) => s.searchFromLink);
  const setSearchFromLink = useCrmStore((s) => s.setSearchFromLink);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const findCandidateById = useCrmStore((s) => s.findCandidateById);
  const candidates_ = useCrmStore((s) => s.candidates);
  const candidatesLoaded = useCrmStore((s) => s.candidatesLoaded);
  const candidatesError = useCrmStore((s) => s.candidatesError);
  const tab = useCrmStore((s) => s.feedTab);
  const setTab = useCrmStore((s) => s.setFeedTab);
  const [showFilters, setShowFilters] = useState(false);
  const handledSavedId = useRef(null);

  // אחרי הוספה או עריכה של כרטיס - עוברים ללוח הנכון (בנים/בנות) וללשונית שבה הוא יושב,
  // כדי שהכרטיס שהרגע נשמר ייראה מיד בראש הרשימה ולא "ייעלם" בלוח השני.
  // מתבצע פעם אחת בלבד לכל כרטיס, כדי שעדכון מהשרת לא יחזיר את המשתמשת ללוח הזה שוב.
  useEffect(() => {
    const savedId = searchParams.get("added") || searchParams.get("edited");
    if (!savedId || handledSavedId.current === savedId) return;
    const c = findCandidateById(savedId);
    if (!c) return;
    handledSavedId.current = savedId;
    setBoard(c.gender);
    setTab(c.isNew ? "new" : "previous");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, candidates_]);

  useEffect(() => {
    const openId = searchParams.get("openCandidate");
    if (!openId) {
      // חזרה למאגר בלי קישור לכרטיס מסוים - מנקים חיפוש שמולא אוטומטית בפעם הקודמת,
      // אחרת הוא ממשיך להסתיר את כל שאר המועמדים.
      if (searchFromLink) {
        setFilters({ search: "" });
        setSearchFromLink(false);
      }
      return;
    }
    const c = findCandidateById(openId);
    if (!c) return;
    setBoard(c.gender);
    setTab(c.isNew ? "new" : "previous");
    setFilters({ search: c.name });
    setSearchFromLink(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const boardCandidates = useMemo(() => allCandidates(board), [board, candidates_]);

  // כרטיס שאין לו גיל או גובה עדיין חייב להופיע. בעבר טווח הסינון הסתיר אותו
  // לגמרי (ערך ריק נחשב כאפס), והוא נעלם מהמסך אף שנשמר במאגר.
  const inRange = (value, [min, max]) => {
    if (value === null || value === undefined || value === "") return true;
    const n = Number(value);
    return !Number.isFinite(n) || (n >= min && n <= max);
  };

  // "קודמות" היא המשלימה המלאה של "חדשות", כדי שאף כרטיס לא ייפול בין הלשוניות
  const tabCandidates = useMemo(
    () => boardCandidates.filter((c) => (tab === "new" ? !!c.isNew : !c.isNew)),
    [boardCandidates, tab]
  );

  const candidates = useMemo(() => {
    return tabCandidates.filter((c) => {
      if (!inRange(c.age, filters.ageRange)) return false;
      if (!inRange(c.height, filters.heightRange)) return false;
      if (filters.religiousLevel !== "הכל" && c.religiousLevel !== filters.religiousLevel) return false;
      if (filters.region !== "הכל" && c.region !== filters.region) return false;
      if (filters.search && !String(c.name || "").includes(filters.search.trim())) return false;
      return true;
    });
  }, [tabCandidates, filters]);

  // כמה כרטיסים בלשונית הנוכחית מוסתרים בגלל הסינון, וכמה יושבים בלשונית השנייה
  const hiddenByFilters = tabCandidates.length - candidates.length;
  const otherTabCount = boardCandidates.length - tabCandidates.length;

  const handleClearAll = () => {
    resetFilters();
    setFilters({ search: "" });
    setSearchFromLink(false);
  };

  return (
    <div className="px-4 py-4">
      {(role === "staff" || role === "admin") && <TipsCarousel />}

      <GenderToggle />

      <div data-tour="tour-search" className="relative mt-4">
        <Search size={17} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A2937F]" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="חיפוש מועמד (שם, משפחה)..."
          className="w-full rounded-2xl bg-white py-3 pr-10 pl-4 text-[14px] text-[#3A2E26] shadow-sm outline-none placeholder:text-[#A2937F] focus:ring-2 focus:ring-[#844442]/30"
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div data-tour="tour-tabs" className="flex flex-1 rounded-2xl bg-white p-1 shadow-sm">
          <button
            onClick={() => setTab("new")}
            className={`flex-1 rounded-xl py-2 text-[13px] font-bold transition ${
              tab === "new" ? "bg-[#F0E2DE] text-[#5E2F2D]" : "text-[#7C6E60]"
            }`}
          >
            הצעות חדשות
          </button>
          <button
            onClick={() => setTab("previous")}
            className={`flex-1 rounded-xl py-2 text-[13px] font-bold transition ${
              tab === "previous" ? "bg-[#F0E2DE] text-[#5E2F2D]" : "text-[#7C6E60]"
            }`}
          >
            הצעות קודמות
          </button>
        </div>
        <button
          data-tour="tour-filter"
          onClick={() => setShowFilters(true)}
          aria-label="סינון"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#844442] shadow-sm transition active:scale-95"
        >
          <SlidersHorizontal size={18} />
        </button>
        {(role === "staff" || role === "admin") && (
          <Link
            href="/crm/add-candidate"
            aria-label="הוספת מועמד/ת"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#844442] text-white shadow-sm transition active:scale-95"
          >
            <UserPlus size={18} />
          </Link>
        )}
      </div>

      {candidatesError ? (
        <p className="mt-16 text-center text-sm leading-relaxed text-[#C24545]">
          לא הצלחנו לטעון את המאגר.
          <br />
          נסו לרענן את הדף, ואם זה חוזר - פנו למנהלת לבדיקת ההרשאות.
        </p>
      ) : !candidatesLoaded ? (
        <p className="mt-16 text-center text-sm text-[#7C6E60]">טוען את המאגר...</p>
      ) : candidates.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-sm leading-relaxed text-[#7C6E60]">
            {boardCandidates.length === 0
              ? "אין עדיין מועמדים במאגר הזה"
              : `לא נמצאו התאמות לסינון שבחרת. ${hiddenByFilters} מועמדים בלשונית הזו מוסתרים בגלל הסינון${
                  otherTabCount > 0 ? `, ועוד ${otherTabCount} נמצאים בלשונית השנייה` : ""
                }.`}
          </p>
          {hiddenByFilters > 0 && (
            <button
              onClick={handleClearAll}
              className="mt-3 rounded-2xl border-2 border-[#844442] bg-white px-4 py-2 text-[13px] font-semibold text-[#844442] transition active:scale-95"
            >
              ניקוי הסינון והצגת הכל
            </button>
          )}
        </div>
      ) : (
        <>
          {/* חיווי ברור כשיש כרטיסים שהסינון או הלשונית מסתירים,
              כדי שכרטיס שנשמר לא ייראה כאילו נעלם מהמערכת */}
          {hiddenByFilters > 0 && (
            <button
              onClick={handleClearAll}
              className="mt-3 flex w-full items-center justify-between gap-2 rounded-2xl bg-[#E8DCCB] px-3 py-2 text-right"
            >
              <span className="shrink-0 text-[12px] font-bold text-[#844442]">ניקוי סינון</span>
              <span className="text-[12px] text-[#7C6E60]">
                {hiddenByFilters} מועמדים נוספים מוסתרים כרגע בגלל הסינון
              </span>
            </button>
          )}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {candidates.map((c) => (
              <ProfileCard key={c.id} candidate={c} />
            ))}
          </div>
        </>
      )}

      {showFilters && <FilterSheet onClose={() => setShowFilters(false)} />}
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
