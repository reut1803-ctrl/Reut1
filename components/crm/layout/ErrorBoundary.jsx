"use client";

import { Component } from "react";

// תופס קריסות של רכיבים.
//
// בלי המעטפת הזו, רכיב שקורס מוציא את כל העץ מהמסך והמשתמש/ת נשאר/ת מול
// מסך ריק לגמרי - בלי שום רמז מה קרה ובלי שום דרך לדווח. כאן מוצגת השגיאה
// המדויקת יחד עם עקבות הקריסה, וכפתור העתקה כדי שאפשר יהיה לשלוח אותה.
//
// חשוב: המעטפת אינה משנה שום לוגיקה. היא רק תופסת מה שכבר נשבר.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, stack: "", copied: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // מדפיסים גם לקונסולה, כדי שיהיה תיעוד גם אם המסך נסגר
    console.error("קריסת רכיב:", error, info);
    this.setState({ stack: `${error?.stack || ""}\n\n${info?.componentStack || ""}`.trim() });
  }

  handleCopy = async () => {
    const text = [
      `הודעה: ${this.state.error?.message || String(this.state.error)}`,
      `כתובת: ${typeof window !== "undefined" ? window.location.href : ""}`,
      "",
      this.state.stack,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch {
      this.setState({ copied: false });
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-dvh overflow-y-auto bg-[#F6F5F4] px-5 py-8 safe-top safe-bottom" dir="rtl">
        <div className="mx-auto max-w-md">
          <h1 className="text-[19px] font-bold text-[#3A3335]">משהו נשבר במסך הזה</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#8A8285]">
            שאר המערכת תקינה. שלחו את הפרטים שלמטה, ואפשר בינתיים לנסות לרענן.
          </p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 rounded-2xl bg-[#8C4A55] py-3 text-[14px] font-bold text-white transition active:scale-[0.98]"
            >
              רענון הדף
            </button>
            <button
              onClick={this.handleCopy}
              className="flex-1 rounded-2xl border border-[#EAE5E3] bg-white py-3 text-[14px] font-bold text-[#3A3335] transition active:scale-[0.98]"
            >
              {this.state.copied ? "הועתק" : "העתקת הפרטים"}
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-[#EAE5E3] bg-white p-3">
            <p className="mb-1 text-[11px] font-semibold text-[#8A8285]">הודעת השגיאה</p>
            <p dir="ltr" className="break-words text-left text-[12px] font-bold text-[#C24545]">
              {this.state.error?.message || String(this.state.error)}
            </p>
          </div>

          {this.state.stack && (
            <div className="mt-3 rounded-2xl bg-[#EFEDEB] p-3">
              <p className="mb-1 text-[11px] font-semibold text-[#8A8285]">פרטים טכניים</p>
              <pre
                dir="ltr"
                className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-left text-[10px] leading-relaxed text-[#8A8285]"
              >
                {this.state.stack}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }
}
