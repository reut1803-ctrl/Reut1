// "אסור לפספס" — מדריך אצור למקומות סביב סן פרנסיסקו (עד כ-4 שעות נסיעה).
// מקומות אמיתיים; הקואורדינטות לנקודת הכניסה/החניה. זמני הנסיעה מחושבים באפליקציה מהמיקום שלכם.
// טיפים: רק מידע מעשי ויציב. מחירים ושעות פתיחה משתנים — תמיד לבדוק באתר הרשמי.

export type Interest = "nature" | "beach" | "city" | "views" | "museums" | "animals" | "walks" | "food" | "rides";
export type KidsMood = "play" | "animals" | "water" | "calm" | "science";
export type GuideCat = "city" | "nature" | "beach" | "kids" | "daytrip";
export type BestTime = "morning" | "afternoon" | "sunset" | "any";

export type Spot = {
  id: string;
  name: string;
  /** שם באנגלית — לחיפוש בגוגל מפות */
  en: string;
  lat: number;
  lng: number;
  cat: GuideCat;
  interests: Interest[];
  kids: KidsMood[];
  indoor: boolean;
  best: BestTime;
  /** כמה שעות כדאי להקדיש, כולל הנסיעה בתוך האזור */
  hours: number;
  why: string;
  tip?: string;
  mustSee?: boolean;
  /** שם תצוגה באנגלית */
  titleEn?: string;
  /** שם הערך בוויקיפדיה האנגלית — לתמונה אמיתית */
  wiki?: string;
  /** כניסה: חינם / בתשלום / חינם עם חניה בתשלום / חינם, חלק מהדברים בתשלום */
  entry?: "free" | "paid" | "parking" | "mixed";
  entryNote?: string;
  /** הערה כללית על שעות (השעות המדויקות נטענות חי כשהן זמינות) */
  hoursNote?: string;
  /** למה הבנות ייהנו */
  kidsWhy?: string;
};

export const INTERESTS: { id: Interest; label: string }[] = [
  { id: "nature", label: "טבע ויערות" },
  { id: "beach", label: "חופים" },
  { id: "views", label: "תצפיות ונופים" },
  { id: "city", label: "העיר" },
  { id: "museums", label: "מוזיאונים" },
  { id: "animals", label: "בעלי חיים" },
  { id: "walks", label: "הליכות" },
  { id: "rides", label: "מתקנים ונסיעות" },
  { id: "food", label: "שווקים ואוכל" },
];

export const KIDS: { id: KidsMood; label: string }[] = [
  { id: "play", label: "משחק ותנועה" },
  { id: "animals", label: "בעלי חיים" },
  { id: "water", label: "מים וחול" },
  { id: "science", label: "לגלות ולנסות" },
  { id: "calm", label: "משהו רגוע" },
];

export const CATS: { id: GuideCat; label: string }[] = [
  { id: "city", label: "העיר" },
  { id: "nature", label: "טבע" },
  { id: "beach", label: "חופים" },
  { id: "kids", label: "לבנות" },
  { id: "daytrip", label: "טיולי יום" },
];

export const SF_CENTER = { lat: 37.7749, lng: -122.4194 };

export const SPOTS: Spot[] = [
  { id: "golden-gate", name: "גשר הזהב", en: "Golden Gate Bridge Welcome Center", lat: 37.8077, lng: -122.475, cat: "city", interests: ["views", "walks", "city"], kids: [], indoor: false, best: "any", hours: 1.5, why: "הסמל של העיר. אפשר לחצות אותו ברגל.", tip: "על הגשר יש רוח חזקה — לקחת שכבה חמה.", mustSee: true, titleEn: "Golden Gate Bridge", wiki: "Golden_Gate_Bridge", entry: "free", entryNote: "הליכה על הגשר בחינם; חניה במרכז המבקרים בתשלום.", hoursNote: "מדרכת הולכי הרגל פתוחה בשעות היום — השעות משתנות לפי עונה.", kidsWhy: "ללכת על גשר תלוי ענק מעל הים, ולראות ספינות עוברות מתחת." },
  { id: "alcatraz", name: "אלקטרז", en: "Alcatraz Landing Pier 33", lat: 37.8067, lng: -122.404, cat: "city", interests: ["museums", "city"], kids: ["science"], indoor: false, best: "morning", hours: 3, why: "הכלא המפורסם באי, עם מדריך שמע מרתק.", tip: "כרטיסים נגמרים מהר — להזמין מראש, רק באתר הרשמי.", mustSee: true, titleEn: "Alcatraz Island", wiki: "Alcatraz_Island", entry: "paid", entryNote: "כרטיס מעבורת (כולל הכניסה לאי) — רק דרך האתר הרשמי.", hoursNote: "מעבורות יוצאות לאורך היום מרציף 33; מקומות נגמרים מוקדם.", kidsWhy: "שיט במפרץ, ואי עם מגדלור, גינות וציפורים." },
  { id: "pier39", name: "מזח 39 ואריות הים", en: "Pier 39", lat: 37.8087, lng: -122.4098, cat: "city", interests: ["city", "animals", "food"], kids: ["animals", "play"], indoor: false, best: "any", hours: 1.5, why: "עשרות אריות ים משתזפים על הרציפים.", mustSee: true, titleEn: "Pier 39", wiki: "Pier_39", entry: "free", entryNote: "הכניסה חופשית; אטרקציות בתוך המזח בתשלום.", hoursNote: "המזח פתוח כל היום; החנויות בדרך כלל מהבוקר עד הערב.", kidsWhy: "אריות ים אמיתיים מקרוב, קרוסלה ושעשועים." },
  { id: "cal-academy", name: "האקדמיה למדעים", en: "California Academy of Sciences", lat: 37.7699, lng: -122.4661, cat: "kids", interests: ["museums", "animals"], kids: ["science", "animals"], indoor: true, best: "any", hours: 3, why: "אקווריום, פלנטריום ויער גשם — תחת גג אחד.", tip: "מושלם ליום גשום או ערפילי.", mustSee: true, titleEn: "California Academy of Sciences", wiki: "California_Academy_of_Sciences", entry: "paid", entryNote: "כרטיס כניסה; מומלץ לקנות מראש באתר.", hoursNote: "פתוח בדרך כלל מהבוקר עד אחר הצהריים, כל יום.", kidsWhy: "פינגווינים, יער גשם עם פרפרים, אקווריום ופלנטריום." },
  { id: "exploratorium", name: "האקספלורטוריום", en: "Exploratorium Pier 15", lat: 37.8017, lng: -122.3973, cat: "kids", interests: ["museums"], kids: ["science", "play"], indoor: true, best: "any", hours: 3, why: "מוזיאון מדע שכולו לגעת, לנסות ולשחק.", titleEn: "Exploratorium", wiki: "Exploratorium", entry: "paid", entryNote: "כרטיס כניסה; מומלץ לקנות מראש.", hoursNote: "פתוח בדרך כלל מהבוקר עד אחר הצהריים; יש ימים סגורים.", kidsWhy: "מאות ניסויים שאפשר לגעת בהם — אור, קול, מים ובועות." },
  { id: "gg-park", name: "פארק גולדן גייט", en: "Golden Gate Park", lat: 37.7694, lng: -122.4862, cat: "nature", interests: ["nature", "walks"], kids: ["play", "calm"], indoor: false, best: "any", hours: 2, why: "פארק ענק עם אגמים, גנים ומדשאות.", titleEn: "Golden Gate Park", wiki: "Golden_Gate_Park", entry: "free", entryNote: "הפארק חינם; חלק מהאטרקציות בתוכו בתשלום.", hoursNote: "פארק פתוח; מומלץ באור יום.", kidsWhy: "מדשאות ענק, אגם עם סירות פדלים וברווזים." },
  { id: "koret", name: "מגרש המשחקים קורט", en: "Koret Children's Quarter", lat: 37.7678, lng: -122.4572, cat: "kids", interests: [], kids: ["play"], indoor: false, best: "any", hours: 1, why: "מגרש משחקים גדול בפארק, ולידו קרוסלה היסטורית.", titleEn: "Koret Children’s Quarter", wiki: "Golden_Gate_Park", entry: "free", entryNote: "מגרש המשחקים חינם; הקרוסלה בתשלום סמלי.", hoursNote: "פתוח בשעות היום.", kidsWhy: "מתקני טיפוס גדולים ומגלשות, וקרוסלה היסטורית ליד." },
  { id: "zoo", name: "גן החיות של סן פרנסיסקו", en: "San Francisco Zoo", lat: 37.733, lng: -122.503, cat: "kids", interests: ["animals"], kids: ["animals", "play"], indoor: false, best: "morning", hours: 3, why: "גן חיות גדול ליד האוקיינוס.", titleEn: "San Francisco Zoo", wiki: "San_Francisco_Zoo", entry: "paid", entryNote: "כרטיס כניסה; חניה בתשלום.", hoursNote: "פתוח בדרך כלל מהבוקר עד אחר הצהריים.", kidsWhy: "ג׳ירפות, פינגווינים, פינת ליטוף ומגרש משחקים." },
  { id: "lombard", name: "רחוב לומברד", en: "Lombard Street", lat: 37.8021, lng: -122.4187, cat: "city", interests: ["city", "views"], kids: [], indoor: false, best: "any", hours: 0.5, why: "הרחוב המתפתל המפורסם, מוקף פרחים.", titleEn: "Lombard Street", wiki: "Lombard_Street_(San_Francisco)", entry: "free", entryNote: "חינם.", hoursNote: "רחוב פתוח; הכי יפה בשעות היום.", kidsWhy: "רחוב שמתפתל כמו נחש בין פרחים — מצחיק לנסוע בו." },
  { id: "cable-car", name: "הקרונית ההיסטורית", en: "Powell and Market cable car turnaround", lat: 37.7849, lng: -122.4076, cat: "city", interests: ["city", "rides"], kids: ["play"], indoor: false, best: "any", hours: 1, why: "נסיעה בקרונית הכבלים על הגבעות.", tip: "התור בתחנה הראשונה ארוך — אפשר לעלות גם בתחנות בהמשך הקו.", mustSee: true, titleEn: "Cable Car (Powell & Market)", wiki: "San_Francisco_cable_car_system", entry: "paid", entryNote: "תשלום לנסיעה (אפשר באפליקציית MuniMobile או בכרטיס Clipper).", hoursNote: "הקרוניות נוסעות מהבוקר עד הלילה.", kidsWhy: "נסיעה על קרונית עתיקה, נאחזים בעמוד והפעמון מצלצל." },
  { id: "painted-ladies", name: "הבתים הצבעוניים", en: "Alamo Square", lat: 37.7763, lng: -122.4346, cat: "city", interests: ["city", "views"], kids: ["play"], indoor: false, best: "afternoon", hours: 0.75, why: "שורת הבתים הוויקטוריאניים מול קו הרקיע, ובפארק יש מגרש משחקים.", titleEn: "Painted Ladies (Alamo Square)", wiki: "Painted_ladies", entry: "free", entryNote: "חינם.", hoursNote: "פארק פתוח; אור אחר הצהריים הכי יפה לתמונות.", kidsWhy: "בתים צבעוניים כמו של בובות, ומגרש משחקים בפארק." },
  { id: "twin-peaks", name: "טווין פיקס", en: "Twin Peaks Summit", lat: 37.7544, lng: -122.4477, cat: "city", interests: ["views"], kids: [], indoor: false, best: "sunset", hours: 0.75, why: "התצפית הגבוהה על כל העיר והמפרץ.", tip: "בערפל לא רואים כמעט כלום, ותמיד קר ורוחי שם.", titleEn: "Twin Peaks", wiki: "Twin_Peaks_(San_Francisco)", entry: "free", entryNote: "חינם.", hoursNote: "פתוח; הכי יפה בשקיעה ביום בהיר.", kidsWhy: "רואים את כל העיר מלמעלה כמו מפה ענקית." },
  { id: "ferry-building", name: "בניין המעבורות", en: "Ferry Building San Francisco", lat: 37.7955, lng: -122.3937, cat: "city", interests: ["food", "city"], kids: [], indoor: true, best: "morning", hours: 1, why: "שוק מקורה על המים, וממנו יוצאות מעבורות לסוסליטו.", tip: "בשווקים — לבדוק כשרות על כל מוצר בנפרד.", titleEn: "Ferry Building", wiki: "San_Francisco_Ferry_Building", entry: "free", entryNote: "הכניסה חופשית.", hoursNote: "פתוח מהבוקר עד הערב; בימי שוק יש עוד דוכנים בחוץ.", kidsWhy: "מעבורות, שחפים ונוף למפרץ." },
  { id: "palace-fine-arts", name: "ארמון האמנויות היפות", en: "Palace of Fine Arts", lat: 37.8029, lng: -122.4484, cat: "city", interests: ["views", "walks"], kids: ["calm"], indoor: false, best: "afternoon", hours: 0.75, why: "כיפה ועמודים בסגנון רומי, ליד אגם שקט.", titleEn: "Palace of Fine Arts", wiki: "Palace_of_Fine_Arts", entry: "free", entryNote: "חינם.", hoursNote: "השטח פתוח; מומלץ באור יום.", kidsWhy: "כיפה ענקית ליד אגם עם ברווזים — נראה כמו ארמון מאגדה." },
  { id: "coit", name: "מגדל קויט", en: "Coit Tower", lat: 37.8024, lng: -122.4058, cat: "city", interests: ["views", "city"], kids: [], indoor: false, best: "any", hours: 1, why: "מגדל תצפית על ראש גבעת טלגרף.", titleEn: "Coit Tower", wiki: "Coit_Tower", entry: "mixed", entryNote: "השטח חינם; העלייה במעלית לתצפית בתשלום.", hoursNote: "פתוח בשעות היום.", kidsWhy: "מגדל גבוה על ראש גבעה, ותצפית על הגשרים." },
  { id: "japanese-garden", name: "הגן היפני", en: "Japanese Tea Garden", lat: 37.7701, lng: -122.4703, cat: "nature", interests: ["nature", "walks"], kids: ["calm"], indoor: false, best: "morning", hours: 1, why: "גשרים קשתיים, פגודות וברכות דגים.", titleEn: "Japanese Tea Garden", wiki: "Japanese_Tea_Garden_(San_Francisco)", entry: "paid", entryNote: "כרטיס כניסה (לתושבי העיר הנחה).", hoursNote: "פתוח בדרך כלל מהבוקר עד אחר הצהריים.", kidsWhy: "גשר קשת תלול לטפס עליו, ודגי קוי בבריכות." },
  { id: "lands-end", name: "לנדס אנד", en: "Lands End Trailhead", lat: 37.7804, lng: -122.5108, cat: "nature", interests: ["nature", "walks", "views"], kids: ["calm"], indoor: false, best: "afternoon", hours: 1.5, why: "שביל צוקים לאורך האוקיינוס, עם נוף לגשר.", mustSee: true, titleEn: "Lands End", wiki: "Lands_End_(San_Francisco)", entry: "free", entryNote: "חינם; חניה חינם במגרש מוגבל.", hoursNote: "שביל פתוח; מומלץ באור יום ובנעליים נוחות.", kidsWhy: "שביל הרפתקאות על צוקים, עם מבוך אבנים ליד הים." },
  { id: "baker-beach", name: "חוף בייקר", en: "Baker Beach", lat: 37.7936, lng: -122.4836, cat: "beach", interests: ["beach", "views"], kids: ["water"], indoor: false, best: "afternoon", hours: 1, why: "חוף עם הנוף הכי יפה לגשר הזהב.", tip: "החלק הצפוני של החוף אינו מתאים למשפחות — להישאר בחלק הדרומי.", titleEn: "Baker Beach", wiki: "Baker_Beach", entry: "free", entryNote: "חינם.", hoursNote: "החוף פתוח בשעות היום.", kidsWhy: "חול רך ונוף לגשר — מקום מעולה לארמונות חול." },
  { id: "ocean-beach", name: "אושן ביץ׳", en: "Ocean Beach San Francisco", lat: 37.7594, lng: -122.5107, cat: "beach", interests: ["beach", "walks"], kids: ["water", "play"], indoor: false, best: "sunset", hours: 1, why: "חוף ארוך ופתוח, מקום מושלם לשקיעה.", tip: "המים קרים והזרמים מסוכנים — לא להיכנס לשחות.", titleEn: "Ocean Beach", wiki: "Ocean_Beach,_San_Francisco", entry: "free", entryNote: "חינם.", hoursNote: "פתוח; הכי יפה בשקיעה.", kidsWhy: "חוף רחב וארוך לרוץ ולחפש צדפים (בלי להיכנס למים)." },
  { id: "sausalito", name: "סוסליטו", en: "Sausalito", lat: 37.8591, lng: -122.4853, cat: "daytrip", interests: ["city", "views", "walks"], kids: ["calm"], indoor: false, best: "afternoon", hours: 2.5, why: "עיירת חוף ציורית עם בתים צפים. אפשר להגיע במעבורת.", titleEn: "Sausalito", wiki: "Sausalito,_California", entry: "free", entryNote: "העיירה חינם; המעבורת אליה בתשלום.", hoursNote: "עיירה פתוחה; מעבורות לאורך היום.", kidsWhy: "שיט במעבורת, ובתים צפים צבעוניים על המים." },
  { id: "muir-woods", name: "מיור וודס", en: "Muir Woods National Monument", lat: 37.897, lng: -122.5811, cat: "nature", interests: ["nature", "walks"], kids: ["calm"], indoor: false, best: "morning", hours: 2.5, why: "יער של עצי סקויה ענקיים בני מאות שנים.", tip: "חובה להזמין מראש חניה או שאטל.", mustSee: true, titleEn: "Muir Woods", wiki: "Muir_Woods_National_Monument", entry: "paid", entryNote: "כרטיס כניסה + הזמנת חניה או שאטל מראש.", hoursNote: "פתוח מהבוקר עד שעות אחר הצהריים; השעות משתנות לפי עונה.", kidsWhy: "עצים כל כך גבוהים שצריך לשכב כדי לראות את הצמרת." },
  { id: "tamalpais", name: "הר טמלפאיס", en: "Mount Tamalpais East Peak", lat: 37.9293, lng: -122.5786, cat: "nature", interests: ["views", "nature"], kids: [], indoor: false, best: "sunset", hours: 2, why: "נוף על כל המפרץ, ולפעמים מעל העננים.", titleEn: "Mount Tamalpais", wiki: "Mount_Tamalpais", entry: "parking", entryNote: "חינם; חניה בפסגה בתשלום.", hoursNote: "פתוח בשעות היום.", kidsWhy: "נוף מעל העננים, ושביל קצר לפסגה." },
  { id: "point-reyes", name: "מגדלור פוינט ריס", en: "Point Reyes Lighthouse", lat: 38.0408, lng: -123.023, cat: "daytrip", interests: ["nature", "views", "animals"], kids: ["animals"], indoor: false, best: "morning", hours: 5, why: "מגדלור על צוק, חופים פראיים ולפעמים לווייתנים.", tip: "הרבה מדרגות בירידה למגדלור, ורוח חזקה.", titleEn: "Point Reyes Lighthouse", wiki: "Point_Reyes_Lighthouse", entry: "free", entryNote: "הכניסה לפארק חינם.", hoursNote: "מרכז המבקרים והמדרגות למגדלור פתוחים רק בחלק מהימים — לבדוק לפני.", kidsWhy: "מגדלור אמיתי על צוק, ולפעמים רואים לווייתנים." },
  { id: "half-moon-bay", name: "האף מון ביי", en: "Half Moon Bay", lat: 37.4636, lng: -122.4286, cat: "beach", interests: ["beach", "walks", "food"], kids: ["water"], indoor: false, best: "any", hours: 3, why: "עיירת חוף קטנה וחופים רחבים, דרומית לעיר.", titleEn: "Half Moon Bay", wiki: "Half_Moon_Bay,_California", entry: "parking", entryNote: "החופים חינם; חניה בחופי המדינה בתשלום.", hoursNote: "פתוח בשעות היום.", kidsWhy: "חופים רחבים לשחק בחול, ועיירה קטנה ונעימה." },
  { id: "ano-nuevo", name: "פילי הים באניו נואבו", en: "Año Nuevo State Park", lat: 37.1088, lng: -122.3328, cat: "daytrip", interests: ["nature", "animals"], kids: ["animals"], indoor: false, best: "morning", hours: 4, why: "מושבה ענקית של פילי ים על החוף.", tip: "בחורף הביקור בסיור מודרך בלבד — להזמין מראש.", titleEn: "Año Nuevo State Park", wiki: "Año_Nuevo_State_Park", entry: "paid", entryNote: "חניה בתשלום; בחורף סיור מודרך בתשלום בהזמנה מראש.", hoursNote: "בחורף רק בסיורים מודרכים בשעות קבועות.", kidsWhy: "פילי ים ענקיים מקרוב — הם נוחרים ושוכבים על החול." },
  { id: "santa-cruz", name: "טיילת סנטה קרוז", en: "Santa Cruz Beach Boardwalk", lat: 36.9643, lng: -122.0177, cat: "daytrip", interests: ["beach", "rides"], kids: ["play", "water"], indoor: false, best: "any", hours: 5, why: "לונה פארק קלאסי על החוף.", tip: "המתקנים פועלים בעיקר בעונה ובסופי שבוע — לבדוק באתר לפני הנסיעה.", titleEn: "Santa Cruz Beach Boardwalk", wiki: "Santa_Cruz_Beach_Boardwalk", entry: "mixed", entryNote: "הכניסה חינם; המתקנים בתשלום.", hoursNote: "המתקנים פועלים בעיקר בעונה ובסופי שבוע — לבדוק באתר.", kidsWhy: "רכבת הרים, קרוסלה, משחקים וחוף ממש ליד." },
  { id: "natural-bridges", name: "הגשרים הטבעיים, סנטה קרוז", en: "Natural Bridges State Beach", lat: 36.953, lng: -122.0573, cat: "beach", interests: ["nature", "beach"], kids: ["animals", "calm"], indoor: false, best: "afternoon", hours: 1.5, why: "קשת סלע בתוך הים, ובחורף אלפי פרפרי מונרך בחורשה.", titleEn: "Natural Bridges State Beach", wiki: "Natural_Bridges_State_Beach", entry: "parking", entryNote: "כניסה ברגל חינם; חניה בתשלום.", hoursNote: "פתוח בשעות היום.", kidsWhy: "קשת סלע בים, בריכות גאות עם סרטנים, ובחורף פרפרים." },
  { id: "monterey-aquarium", name: "האקווריום של מונטריי", en: "Monterey Bay Aquarium", lat: 36.6182, lng: -121.9019, cat: "daytrip", interests: ["museums", "animals"], kids: ["animals", "science", "water"], indoor: true, best: "morning", hours: 6, why: "מהאקווריומים הגדולים בעולם: יער אצות ולוטרות ים.", mustSee: true, titleEn: "Monterey Bay Aquarium", wiki: "Monterey_Bay_Aquarium", entry: "paid", entryNote: "כרטיס כניסה; מומלץ לקנות מראש.", hoursNote: "פתוח בדרך כלל מהבוקר עד אחר הצהריים.", kidsWhy: "לוטרות ים, מדוזות זוהרות ובריכת מגע." },
  { id: "bixby", name: "גשר ביקסבי, ביג סור", en: "Bixby Creek Bridge", lat: 36.3715, lng: -121.9017, cat: "daytrip", interests: ["views", "nature"], kids: [], indoor: false, best: "afternoon", hours: 8, why: "מהכבישים היפים בעולם: צוקים מעל האוקיינוס.", tip: "כביש 1 נסגר לפעמים — לבדוק סגירות לפני היציאה.", titleEn: "Bixby Creek Bridge", wiki: "Bixby_Creek_Bridge", entry: "free", entryNote: "חינם (תצפית מהמפרץ בצד הכביש).", hoursNote: "לנסוע באור יום; כביש 1 נסגר לפעמים.", kidsWhy: "גשר ענק מעל ים טורקיז — תמונה מהסרטים." },
  { id: "yosemite", name: "עמק יוסמיטי", en: "Yosemite Valley", lat: 37.7456, lng: -119.5936, cat: "daytrip", interests: ["nature", "views", "walks"], kids: ["calm"], indoor: false, best: "morning", hours: 10, why: "מפלים וצוקי גרניט ענקיים.", tip: "יום ארוך מאוד. בחורף חלק מהכבישים סגורים ולפעמים נדרשות שרשראות.", mustSee: true, titleEn: "Yosemite Valley", wiki: "Yosemite_Valley", entry: "paid", entryNote: "דמי כניסה לרכב; בעונות עמוסות לפעמים נדרשת הזמנה מראש.", hoursNote: "הפארק פתוח; חלק מהכבישים סגורים בחורף.", kidsWhy: "מפלים ענקיים, צוקים ושבילים קלים בעמק." },
  { id: "tahoe", name: "אגם טאהו", en: "South Lake Tahoe", lat: 38.9399, lng: -119.9772, cat: "daytrip", interests: ["nature", "views"], kids: ["water", "play"], indoor: false, best: "morning", hours: 10, why: "אגם הרים כחול, ובחורף שלג.", tip: "בחורף לבדוק תנאי דרך ודרישת שרשראות.", titleEn: "Lake Tahoe", wiki: "Lake_Tahoe", entry: "free", entryNote: "האגם חינם; חלק מהחופים והחניות בתשלום.", hoursNote: "פתוח; בחורף לבדוק תנאי דרך.", kidsWhy: "אגם כחול לזרוק אבנים, ובחורף שלג לשחק בו." },
  { id: "napa", name: "עמק נאפה", en: "Napa Valley Welcome Center", lat: 38.2975, lng: -122.2869, cat: "daytrip", interests: ["views", "food"], kids: ["calm"], indoor: false, best: "afternoon", hours: 5, why: "כרמים, נופים כפריים ורכבת היין ההיסטורית.", titleEn: "Napa Valley", wiki: "Napa_Valley", entry: "free", entryNote: "הביקור חינם; רכבת היין ופעילויות בתשלום.", hoursNote: "פתוח בשעות היום.", kidsWhy: "שדות כרמים ירוקים ונסיעה ברכבת עתיקה." },
  { id: "stanford", name: "קמפוס סטנפורד", en: "Stanford Oval", lat: 37.4275, lng: -122.1697, cat: "daytrip", interests: ["walks", "city"], kids: ["calm"], indoor: false, best: "any", hours: 2, why: "קמפוס יפהפה עם כניסה חופשית.", titleEn: "Stanford University", wiki: "Stanford_University", entry: "free", entryNote: "חינם; חניה בתשלום ברוב המגרשים.", hoursNote: "הקמפוס פתוח.", kidsWhy: "מדשאות ענק ומזרקות — מקום טוב לרוץ ולשחק." },
];
