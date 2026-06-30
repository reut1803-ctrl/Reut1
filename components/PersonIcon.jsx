// אייקון דמות בצבע הלוגו (במקום אימוג'י כחול).
export default function PersonIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-9 1.79-9 5.333V22h18v-2.667C21 15.79 15.866 14 12 14z" />
    </svg>
  );
}
