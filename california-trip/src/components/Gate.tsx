"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import Cloud from "./home/Cloud";
import OrigamiPlane from "./home/OrigamiPlane";
import { FlagSymbols } from "./home/flags";

export type GatePhase = "idle" | "flying" | "arrived";

// מסך הכניסה: שמיים רכים, ענני כותנה, ומטוסי נייר שמרחפים.
// בהתחברות המטוס הצהוב ממריא בלולאה ומשאיר שובל נייר מקווקו.
export default function Gate({
  phase,
  onFlown,
  children,
}: {
  phase: GatePhase;
  onFlown: () => void;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const trail = useRef<SVGPolylineElement>(null);
  const flownRef = useRef(onFlown);
  flownRef.current = onFlown;

  // ריחוף ועומק — רץ כל הזמן
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(scope);
      gsap.from(q(".gp-enter"), {
        x: (i: number) => (i === 1 ? "-45vw" : "45vw"),
        y: (i: number) => (i === 1 ? "20vh" : "-12vh"),
        rotate: (i: number) => (i === 1 ? -20 : 16),
        opacity: 0, duration: 2.2, ease: "expo.out", stagger: 0.18,
      });
      q(".gp-float").forEach((el: Element, i: number) => {
        gsap.to(el, {
          y: [-14, 12, -9][i] ?? -10, rotate: [3, -2.5, 2][i] ?? 2,
          duration: [3.4, 4.1, 3.7][i] ?? 3.5, ease: "sine.inOut", yoyo: true, repeat: -1,
        });
      });
      q(".cloud").forEach((el: Element, i: number) => {
        gsap.to(el, { x: i % 2 ? 22 : -22, duration: 14 + i * 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
      });

      // עומק לפי תנועת העכבר (במחשב) — כל שכבה זזה במהירות אחרת
      const layers = q("[data-depth]").map((el: Element) => ({
        depth: Number((el as HTMLElement).dataset.depth),
        x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" }),
      }));
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        layers.forEach((l) => { l.x(-nx * 40 * l.depth); l.y(-ny * 28 * l.depth); });
      };
      window.addEventListener("pointermove", onMove);
      return () => window.removeEventListener("pointermove", onMove);
    }, scope);
    return () => mm.revert();
  }, []);

  // ההמראה
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fly = scope.querySelector(".gp-fly--yellow") as HTMLElement;
    const line = trail.current!;

    if (phase !== "flying") {
      gsap.killTweensOf(fly);
      gsap.set(fly, { clearProps: "transform,opacity" });
      gsap.to(line, { opacity: 0, duration: 0.6, onComplete: () => line.setAttribute("points", "") });
      if (phase === "arrived" && !reduce) {
        gsap.from(fly, { y: -160, x: -40, opacity: 0, duration: 1.6, ease: "expo.out" });
      }
      return;
    }
    if (reduce) {
      flownRef.current();
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const pts: string[] = [];
    line.setAttribute("points", "");
    gsap.set(line, { opacity: 1 });
    const svg = line.ownerSVGElement!;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

    const plane = fly.querySelector("svg") as SVGSVGElement;
    // המטוס מצויר הפוך (פונה שמאלה), ולכן ציר x של התנועה מתהפך: חיובי = שמאלה במסך.
    const tl = gsap.timeline({ onComplete: () => flownRef.current() });
    tl.to(fly, {
      duration: 2.5,
      ease: "power1.inOut",
      motionPath: {
        path: [
          { x: w * 0.12, y: h * 0.1 },
          { x: w * 0.42, y: h * 0.3 },
          { x: w * 0.62, y: h * 0.12 },
          { x: w * 0.5, y: -h * 0.04 },
          { x: w * 0.7, y: h * 0.02 },
          { x: w * 1.25, y: -h * 0.32 },
        ],
        curviness: 1.25,
        autoRotate: true,
      },
      onUpdate: () => {
        const r = plane.getBoundingClientRect();
        pts.push(`${(r.left + r.width / 2).toFixed(1)},${(r.top + r.height / 2).toFixed(1)}`);
        line.setAttribute("points", pts.join(" "));
      },
    });
    tl.to(scope.querySelectorAll(".cloud"), { scale: 1.12, duration: 2.5, ease: "sine.inOut", stagger: 0.05 }, 0)
      .to(scope.querySelectorAll(".cloud"), { scale: 1, duration: 1.2, ease: "sine.out" }, 2.5);
    return () => { tl.kill(); };
  }, [phase]);

  return (
    <main className="gate" ref={root}>
      <FlagSymbols />
      <div className="gate-layer" data-depth="0.35">
        <Cloud style={{ width: "36vw", top: "10%", insetInlineStart: "-8vw" }} />
        <Cloud style={{ width: "24vw", top: "6%", insetInlineEnd: "8vw" }} />
      </div>
      <div className="gate-layer" data-depth="0.7">
        <Cloud style={{ width: "44vw", bottom: "-4%", insetInlineEnd: "-12vw" }} />
        <Cloud style={{ width: "20vw", bottom: "16%", insetInlineStart: "10vw" }} />
        <Cloud style={{ width: "16vw", top: "42%", insetInlineEnd: "2vw" }} />
      </div>

      <div className="gate-plane gate-plane--yellow" data-depth="1.2">
        <div className="gp-enter"><div className="gp-mirror"><div className="gp-fly gp-fly--yellow"><div className="gp-float">
          <OrigamiPlane tone="yellow" />
        </div></div></div></div>
      </div>
      <div className="gate-plane gate-plane--mint" data-depth="0.9">
        <div className="gp-enter"><div className="gp-float"><OrigamiPlane tone="mint" /></div></div>
      </div>
      <div className="gate-plane gate-plane--white" data-depth="0.5">
        <div className="gp-enter"><div className="gp-mirror"><div className="gp-float"><OrigamiPlane tone="white" /></div></div></div>
      </div>

      <svg className="gate-trail" aria-hidden="true">
        <polyline ref={trail} points="" />
      </svg>

      <div className="gate-content">{children}</div>
    </main>
  );
}
