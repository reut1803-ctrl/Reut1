"use client";

export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3" onClick={onClose}>
      <div
        className="my-6 w-full max-w-lg rounded-3xl bg-cream p-5 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-roseDark">{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-ink/50 hover:text-ink">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
