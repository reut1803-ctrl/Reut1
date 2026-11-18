import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { navigate } from "./router";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode };

export default function Link({ href, onClick, children, ...rest }: Props) {
  const name = href.replace(/^\//, "") || "home";
  return (
    <a
      {...rest}
      href={`#${name}`}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
