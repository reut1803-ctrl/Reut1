"use client";

import { useState } from "react";
import { Tag, Plus, X, Trash2 } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { tagChipStyle } from "@/lib/crm/mockData";
import Button from "@/components/crm/ui/Button";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";

// ניהול קטגוריות התוויות - זמין למנהלת בלבד. כל שינוי נשמר ב-Firestore ומתעדכן
// מיד בטופסי הכרטיס ובסרגל הסינון, בלי שינוי בקוד.
export default function TagGroupsManager() {
  const tagGroups = useCrmStore((s) => s.tagGroups);
  const addTagOption = useCrmStore((s) => s.addTagOption);
  const removeTagOption = useCrmStore((s) => s.removeTagOption);
  const addTagGroup = useCrmStore((s) => s.addTagGroup);
  const removeTagGroup = useCrmStore((s) => s.removeTagGroup);
  const showToast = useCrmStore((s) => s.showToast);

  const [drafts, setDrafts] = useState({});
  const [newGroup, setNewGroup] = useState("");
  const [confirm, setConfirm] = useState(null);

  const handleAddOption = async (groupId) => {
    const value = (drafts[groupId] || "").trim();
    if (!value) return;
    await addTagOption(groupId, value);
    setDrafts((d) => ({ ...d, [groupId]: "" }));
    showToast("התווית נוספה");
  };

  const handleAddGroup = async () => {
    const value = newGroup.trim();
    if (!value) return;
    await addTagGroup(value);
    setNewGroup("");
    showToast("הקטגוריה נוספה");
  };

  return (
    <>
      <h2 className="mt-6 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3A3335]">
        <Tag size={17} /> קטגוריות תוויות
      </h2>
      <div className="mb-6 rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <p className="mb-4 text-[11px] leading-relaxed text-[#8A8285]">
          כאן אפשר להוסיף או להסיר תוויות וקטגוריות. כל תווית שתוסיפי תופיע מיד בטופס הכרטיס ובסרגל הסינון.
        </p>

        <div className="space-y-4">
          {tagGroups.map((group) => (
            <div key={group.id} className="rounded-2xl border border-[#F0EBE9] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-bold text-[#3A3335]">{group.label}</p>
                <button
                  onClick={() => setConfirm({ type: "group", group })}
                  aria-label={`מחיקת קטגוריה ${group.label}`}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#C24545] transition hover:bg-[#FBEDED]"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {group.options.length === 0 ? (
                <p className="mb-2 text-[11px] text-[#B5AEB0]">אין תוויות בקטגוריה זו</p>
              ) : (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {group.options.map((option, i) => (
                    <span
                      key={option}
                      style={tagChipStyle(group, i)}
                      className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                    >
                      {option}
                      <button
                        onClick={() => setConfirm({ type: "option", group, option })}
                        aria-label={`הסרת התווית ${option}`}
                        className="opacity-80 transition hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={drafts[group.id] || ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [group.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleAddOption(group.id)}
                  placeholder="תווית חדשה"
                  className="flex-1 rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
                />
                <Button variant="secondary" onClick={() => handleAddOption(group.id)}>
                  <Plus size={15} /> הוספה
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-[#F0EBE9] pt-4">
          <p className="mb-2 text-[12px] font-semibold text-[#3A3335]">הוספת קטגוריה חדשה</p>
          <div className="flex gap-2">
            <input
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
              placeholder='לדוגמה: "מקום מגורים מועדף"'
              className="flex-1 rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
            />
            <Button variant="primary" onClick={handleAddGroup}>
              <Plus size={15} /> קטגוריה
            </Button>
          </div>
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          message={
            confirm.type === "group"
              ? `האם למחוק את הקטגוריה "${confirm.group.label}" וכל התוויות שבה? הסינון לפיה יפסיק להופיע.`
              : `האם להסיר את התווית "${confirm.option}" מהקטגוריה "${confirm.group.label}"?`
          }
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            if (confirm.type === "group") await removeTagGroup(confirm.group.id);
            else await removeTagOption(confirm.group.id, confirm.option);
            setConfirm(null);
            showToast(confirm.type === "group" ? "הקטגוריה נמחקה" : "התווית הוסרה");
          }}
        />
      )}
    </>
  );
}
