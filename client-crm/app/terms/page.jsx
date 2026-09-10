"use client";

import LegalPage, { Section, CustomLegalText } from "@/components/crm/register/LegalPage";
import { usePublicContent } from "@/lib/crm/usePublicContent";
import { APP_NAME } from "@/lib/appConfig";

export default function TermsPage() {
  // נוסח שהמנהלת הזינה גובר על הנוסח שבקוד
  const { content } = usePublicContent();
  const custom = String(content?.legal?.terms || "").trim();
  // הסכומים בנוסח שבקוד מתעדכנים לפי מה שהוגדר בלוח הבקרה
  const successFee = Number(content?.payment?.successFee || 0);
  const trackPrice = Number(content?.payment?.personalTrackPrice || 0);

  if (custom) {
    return (
      <LegalPage title="נספח 1 — הסכם ההתקשרות" subtitle={`${APP_NAME} · מאגר שידוכים`}>
        <CustomLegalText text={custom} />
      </LegalPage>
    );
  }

  return (
    <LegalPage title="נספח 1 — הסכם ההתקשרות" subtitle={`${APP_NAME} · מאגר שידוכים`}>
      <Section heading="1. מהות השירות">
        <p>
          {APP_NAME} הוא מיזם שידוכים שמטרתו סיוע בהקמת בתים בישראל. השירות כולל רישום למאגר
          המועמדים, ליווי אישי של צוות השדכניות, והצעת התאמות מתוך המאגר לפי שיקול דעת מקצועי.
        </p>
        <p>
          המיזם פועל במיטב יכולתו, אך <strong>אינו מתחייב</strong> למספר הצעות, לקצב, או לתוצאה
          כלשהי. שידוך אינו שירות שניתן להבטיח את תוצאתו.
        </p>
      </Section>

      <Section heading="2. ההצטרפות למאגר — ללא עלות">
        <p>
          ההרשמה למאגר וההימצאות בו אינן כרוכות בתשלום כלשהו, ואינן יוצרות התחייבות מצדכם.
          אפשר לבקש הסרה מהמאגר בכל עת.
        </p>
      </Section>

      <Section heading="3. המסלול האישי — שירות אופציונלי">
        <p>
          המסלול האישי הוא שירות נוסף ונפרד: שיחת היכרות מעמיקה שנועדה לדייק את החיפוש. עלותו{" "}
          {trackPrice} ₪ (מחיר השקה), והוא אינו תנאי להימצאות במאגר או לקבלת הצעות.
        </p>
      </Section>

      <Section heading="4. דמי הצלחה">
        <p>
          בקרות נישואין שמקורם בהצעה שהתקבלה דרך המיזם, ישולמו דמי הצלחה בסך{" "}
          <strong>{successFee.toLocaleString("he-IL")} ₪</strong>.
        </p>
        <p>
          דמי ההצלחה משולמים <strong>אך ורק</strong> במקרה של נישואין בפועל. אין תשלום בגין הצעות,
          מפגשים או תהליכים שלא הבשילו.
        </p>
      </Section>

      <Section heading="5. המידע שאתם מוסרים">
        <p>
          אתם מצהירים שהפרטים שמסרתם נכונים ומעודכנים, ושהם נמסרו מרצונכם החופשי. מסירת פרטים
          שאינם נכונים עלולה לפגוע בתהליך ובאמון של הצד השני.
        </p>
        <p>
          המידע נשמר ומעובד לפי <a href="/privacy/" className="font-semibold text-[#2E8BA8] underline">נספח 2 — מדיניות הפרטיות</a>.
        </p>
      </Section>

      <Section heading="6. אחריות">
        <p>
          המיזם משמש כגורם מקשר בלבד. האחריות על ההיכרות, על הבירורים ועל ההחלטות שמתקבלות בעקבותיה
          היא של הצדדים עצמם. מומלץ לערוך בירורים עצמאיים בכל תהליך.
        </p>
      </Section>

      <Section heading="7. סיום ההתקשרות">
        <p>
          כל צד רשאי לסיים את ההתקשרות בכל עת ובהודעה פשוטה. סיום ההתקשרות אינו גורע מחובת תשלום
          דמי הצלחה בגין שידוך שהבשיל לנישואין ושמקורו במיזם.
        </p>
      </Section>
    </LegalPage>
  );
}
