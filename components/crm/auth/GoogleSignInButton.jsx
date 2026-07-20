"use client";

import { useEffect, useRef } from "react";
import { useCrmStore } from "@/lib/crm/store";
import { GOOGLE_CLIENT_ID } from "@/lib/crm/authConfig";

export default function GoogleSignInButton() {
  const buttonRef = useRef(null);
  const signInWithGoogle = useCrmStore((s) => s.signInWithGoogle);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function render() {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => signInWithGoogle(response.credential),
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        locale: "iw",
      });
    }

    if (window.google?.accounts?.id) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [signInWithGoogle]);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={buttonRef} className="flex justify-center" />;
}
