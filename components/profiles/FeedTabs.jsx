"use client";

import clsx from "clsx";
import { useAppStore } from "@/lib/store";

export default function FeedTabs() {
  const feedTab = useAppStore((s) => s.feedTab);
  const setFeedTab = useAppStore((s) => s.setFeedTab);

  return (
    <div className="flex gap-2">
      <TabButton active={feedTab === "new"} onClick={() => setFeedTab("new")}>
        הצעות חדשות
      </TabButton>
      <TabButton active={feedTab === "previous"} onClick={() => setFeedTab("previous")}>
        הצעות קודמות
      </TabButton>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex-1 rounded-2xl py-2.5 text-sm font-semibold transition",
        active ? "bg-bordeaux-500 text-white shadow-soft" : "bg-white text-muted"
      )}
    >
      {children}
    </button>
  );
}
