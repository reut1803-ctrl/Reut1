import Image from "next/image";
import Link from "next/link";

// לוגו קטן וסולידי בראש העמוד - בכל עמודי האתר פרט למסך הפתיחה.
export default function Header({ children }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sand/70 bg-cream/90 px-4 py-3 backdrop-blur">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="לוגו"
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
      </Link>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
