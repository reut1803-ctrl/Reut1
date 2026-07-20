"use client";

import { useMemo, useState } from "react";
import { Wallet, Plus, Trash2, Receipt, Image as ImageIcon, Check } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { STAFF_USERS, PAYMENT_STATUSES } from "@/lib/crm/mockData";
import Button from "@/components/crm/ui/Button";

function ProofUpload({ url, onUpload, label }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result);
    reader.readAsDataURL(file);
  };

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-semibold text-[#178A57]">
        <ImageIcon size={12} /> צפייה באסמכתא
      </a>
    );
  }
  return (
    <label className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#8C4A55]">
      <ImageIcon size={12} /> {label}
      <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </label>
  );
}

export default function FinancePage() {
  const role = useCrmStore((s) => s.role);
  const serviceTypes = useCrmStore((s) => s.serviceTypes);
  const addServiceType = useCrmStore((s) => s.addServiceType);
  const removeServiceType = useCrmStore((s) => s.removeServiceType);
  const charges = useCrmStore((s) => s.charges);
  const createCharge = useCrmStore((s) => s.createCharge);
  const updateChargeCandidatePayment = useCrmStore((s) => s.updateChargeCandidatePayment);
  const updateChargeStaffPayout = useCrmStore((s) => s.updateChargeStaffPayout);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const customCandidates = useCrmStore((s) => s.customCandidates);
  const candidateOverrides = useCrmStore((s) => s.candidateOverrides);

  const candidates = useMemo(
    () => [...allCandidates("male"), ...allCandidates("female")],
    [allCandidates, customCandidates, candidateOverrides]
  );

  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcCommission, setSvcCommission] = useState("");

  const [chargeCandidateId, setChargeCandidateId] = useState("");
  const [chargeServiceId, setChargeServiceId] = useState(serviceTypes[0]?.id || "");
  const [chargeStaffId, setChargeStaffId] = useState(STAFF_USERS[0].id);

  const [filter, setFilter] = useState("all");

  if (role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#8A8285]">אזור זה זמין למנהלת בלבד</p>;
  }

  const handleAddService = () => {
    if (!svcName.trim() || !svcPrice) return;
    addServiceType({ name: svcName.trim(), price: Number(svcPrice), commission: Number(svcCommission) || 0 });
    setSvcName("");
    setSvcPrice("");
    setSvcCommission("");
  };

  const handleCreateCharge = () => {
    if (!chargeCandidateId || !chargeServiceId) return;
    createCharge(chargeCandidateId, chargeServiceId, chargeStaffId);
    setChargeCandidateId("");
  };

  const candidateName = (id) => candidates.find((c) => c.id === id)?.name || id;
  const staffName = (id) => STAFF_USERS.find((s) => s.id === id)?.name || id;

  const filteredCharges = charges.filter((c) => {
    if (filter === "debt") return c.candidatePaymentStatus !== "שולם";
    if (filter === "commission") return c.staffPayoutStatus !== "שולם";
    return true;
  });

  return (
    <div className="px-4 py-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#3A3335]">
        <Wallet size={22} /> ניהול כספים ותשלומים
      </h1>
      <p className="mt-1 text-[13px] text-[#8A8285]">אזור זה נגיש למנהלת בלבד ומוסתר לחלוטין מהצוות</p>

      <h2 className="mt-6 mb-3 text-[15px] font-bold text-[#3A3335]">מחירון שירותים</h2>
      <div className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <div className="space-y-2">
          {serviceTypes.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl bg-[#F6F5F4] px-3 py-2">
              <div>
                <p className="text-[13px] font-semibold text-[#3A3335]">{s.name}</p>
                <p className="text-[11px] text-[#8A8285]">
                  מחיר: ₪{s.price} · עמלה: ₪{s.commission}
                </p>
              </div>
              <button onClick={() => removeServiceType(s.id)} aria-label="הסרה" className="rounded-full p-1.5 hover:bg-white">
                <Trash2 size={14} className="text-[#C24545]" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2 border-t border-[#EAE5E3] pt-3">
          <input
            type="text"
            value={svcName}
            onChange={(e) => setSvcName(e.target.value)}
            placeholder="שם השירות (לדוגמה: שיחת סינון)"
            className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={svcPrice}
              onChange={(e) => setSvcPrice(e.target.value)}
              placeholder="מחיר למועמד/ת (₪)"
              className="flex-1 rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
            />
            <input
              type="number"
              value={svcCommission}
              onChange={(e) => setSvcCommission(e.target.value)}
              placeholder="עמלה לנציגה (₪)"
              className="flex-1 rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
            />
          </div>
          <Button variant="ghost" className="w-full" onClick={handleAddService}>
            <Plus size={16} /> הוספת שירות
          </Button>
        </div>
      </div>

      <h2 className="mt-8 mb-3 flex items-center gap-1.5 text-[15px] font-bold text-[#3A3335]">
        <Receipt size={17} /> חיוב חדש
      </h2>
      <div className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
        <div className="space-y-2">
          <select
            value={chargeCandidateId}
            onChange={(e) => setChargeCandidateId(e.target.value)}
            className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
          >
            <option value="">בחירת מועמד/ת...</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={chargeServiceId}
            onChange={(e) => setChargeServiceId(e.target.value)}
            className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
          >
            {serviceTypes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - ₪{s.price}
              </option>
            ))}
          </select>
          <select
            value={chargeStaffId}
            onChange={(e) => setChargeStaffId(e.target.value)}
            className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-sm outline-none focus:border-[#8C4A55]"
          >
            {STAFF_USERS.map((s) => (
              <option key={s.id} value={s.id}>
                נציג/ה: {s.name}
              </option>
            ))}
          </select>
          <Button variant="primary" className="w-full" disabled={!chargeCandidateId} onClick={handleCreateCharge}>
            <Plus size={16} /> יצירת חיוב
          </Button>
        </div>
      </div>

      <div className="mt-8 mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#3A3335]">חיובים ועמלות ({filteredCharges.length})</h2>
      </div>
      <div className="mb-3 flex gap-2 rounded-2xl bg-white p-1 shadow-sm">
        {[
          { key: "all", label: "הכל" },
          { key: "debt", label: "חובות פתוחים" },
          { key: "commission", label: "עמלות ממתינות" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 rounded-xl py-2 text-[12px] font-bold transition ${
              filter === f.key ? "bg-[#F6E4E6] text-[#6E3540]" : "text-[#8A8285]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredCharges.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#8A8285]">אין חיובים להצגה</p>
      ) : (
        <div className="space-y-3">
          {filteredCharges.map((c) => (
            <div key={c.id} className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#3A3335]">{candidateName(c.candidateId)}</p>
                <span className="text-[11px] text-[#B5AEB0]">{new Date(c.createdAt).toLocaleDateString("he-IL")}</span>
              </div>
              <p className="text-[12px] text-[#8A8285]">{c.serviceName}</p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-[#F6F5F4] p-3">
                  <p className="text-[11px] font-semibold text-[#3A3335]">תשלום מועמד/ת</p>
                  <p className="mt-0.5 text-sm font-bold text-[#3A3335]">₪{c.price}</p>
                  <button
                    onClick={() =>
                      updateChargeCandidatePayment(c.id, c.candidatePaymentStatus === "שולם" ? PAYMENT_STATUSES[0] : PAYMENT_STATUSES[1])
                    }
                    className={`mt-1.5 flex w-full items-center justify-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold transition ${
                      c.candidatePaymentStatus === "שולם" ? "bg-[#E7F5EC] text-[#178A57]" : "bg-[#FBEAE6] text-[#C24545]"
                    }`}
                  >
                    {c.candidatePaymentStatus === "שולם" && <Check size={12} />}
                    {c.candidatePaymentStatus}
                  </button>
                  <div className="mt-1.5">
                    <ProofUpload
                      url={c.candidatePaymentProofUrl}
                      label="העלאת אסמכתא"
                      onUpload={(url) => updateChargeCandidatePayment(c.id, c.candidatePaymentStatus, url)}
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F6F5F4] p-3">
                  <p className="text-[11px] font-semibold text-[#3A3335]">עמלת {staffName(c.staffId)}</p>
                  <p className="mt-0.5 text-sm font-bold text-[#3A3335]">₪{c.commission}</p>
                  <button
                    onClick={() => updateChargeStaffPayout(c.id, c.staffPayoutStatus === "שולם" ? PAYMENT_STATUSES[0] : PAYMENT_STATUSES[1])}
                    className={`mt-1.5 flex w-full items-center justify-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold transition ${
                      c.staffPayoutStatus === "שולם" ? "bg-[#E7F5EC] text-[#178A57]" : "bg-[#FBEAE6] text-[#C24545]"
                    }`}
                  >
                    {c.staffPayoutStatus === "שולם" && <Check size={12} />}
                    {c.staffPayoutStatus}
                  </button>
                  <div className="mt-1.5">
                    <ProofUpload
                      url={c.staffPayoutProofUrl}
                      label="העלאת אסמכתא"
                      onUpload={(url) => updateChargeStaffPayout(c.id, c.staffPayoutStatus, url)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
