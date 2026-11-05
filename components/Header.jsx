import Link from "next/link";
import Logo from "./Logo";

// לוגו קטן וסולידי בראש העמוד - בכל עמודי האתר פרט למסך הפתיחה.
export default function Header({ children }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sand/70 bg-cream/[0.97] px-4 py-3">
      <Link href="/" className="flex items-center gap-2">
        <Logo className="h-11 w-auto" />
      </Link>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
