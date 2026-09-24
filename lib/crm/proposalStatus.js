// אוצר המילים של סטטוס ההצעה, במקום אחד.
//
// שלושה מצבים שונים באופיים:
//
// 1. שלב מתוך המסלול (PROPOSAL_STAGES) - ההצעה חיה ומתקדמת.
// 2. "ירד מהפרק" - ההצעה נגמרה. היא נשמרת לתמיד במסד לצורך התראת
//    הכפילות, אבל יוצאת מהלוח הפעיל ועוברת לפאנל ההיסטוריה.
// 3. "מוקפא / בהשהיה" - מצב ביניים. ההצעה לא נגמרה, היא רק ממתינה
//    (למשל צד אחד בהפסקה), ובכוונה אינה תופסת מקום בלוח הפעיל.
//
// ההקפאה אינה מצב של המועמד/ת אלא של ההצעה בלבד: מי שהצעה שלו/ה
// מוקפאת נשאר/ת פנוי/ה לחלוטין לכל שאר הצוות, ויכול/ה לקבל הצעות
// חדשות במקביל. לכן הצעה מוקפאת אינה מוצגת בכרטיס המועמד/ת ואינה
// נחשבת "התאמה פעילה" בשום מקום במערכת.

export const PROPOSAL_STAGES = ["הוצע", "בבדיקה", "הוחלפו פרטים", "נפגשו", "בהמשך / מתקדמים", "אירוסין"];
export const PROPOSAL_DROPPED = "ירד מהפרק";
export const PROPOSAL_FROZEN = "מוקפא / בהשהיה";

export const isFrozenProposal = (proposal) => proposal?.status === PROPOSAL_FROZEN;

export const isDroppedProposal = (proposal) => proposal?.status === PROPOSAL_DROPPED;

// הצעה שמקומה בלוח הפעיל: לא ירדה מהפרק, לא מוקפאת, ואינה רשומת
// היסטוריה שהוזנה ידנית.
export const isActiveProposal = (proposal) =>
  !!proposal && !isDroppedProposal(proposal) && !isFrozenProposal(proposal) && !proposal.isHistory;

// לאן חוזרת הצעה כשמשחררים אותה מהקפאה.
//
// חוזרים בדיוק לשלב שבו היא היתה רגע לפני ההקפאה (frozenFrom). הצעה
// שהוקפאה לפני שהשדה הזה היה קיים, או שנשמר בה ערך שכבר אינו שלב תקף,
// חוזרת לשלב הראשון - כדי שלעולם לא תיתקע במצב שאינו קיים.
export function restoredStatus(proposal) {
  const from = proposal?.frozenFrom;
  return PROPOSAL_STAGES.includes(from) ? from : PROPOSAL_STAGES[0];
}

// כל הכפתורים שמוצגים בבורר הסטטוס, לפי הסדר שבו קוראים אותם על המסך
export const ALL_PROPOSAL_STATUSES = [...PROPOSAL_STAGES, PROPOSAL_FROZEN, PROPOSAL_DROPPED];
