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
  { id: "golden-gate", name: "גשר הזהב", en: "Golden Gate Bridge Welcome Center", lat: 37.8077, lng: -122.475, cat: "city", interests: ["views", "walks", "city"], kids: [], indoor: false, best: "any", hours: 1.5, why: "הסמל של העיר. אפשר לחצות אותו ברגל.", tip: "על הגשר יש רוח חזקה — לקחת שכבה חמה.", mustSee: true },
  { id: "alcatraz", name: "אלקטרז", en: "Alcatraz Landing Pier 33", lat: 37.8067, lng: -122.404, cat: "city", interests: ["museums", "city"], kids: ["science"], indoor: false, best: "morning", hours: 3, why: "הכלא המפורסם באי, עם מדריך שמע מרתק.", tip: "כרטיסים נגמרים מהר — להזמין מראש, רק באתר הרשמי.", mustSee: true },
  { id: "pier39", name: "מזח 39 ואריות הים", en: "Pier 39", lat: 37.8087, lng: -122.4098, cat: "city", interests: ["city", "animals", "food"], kids: ["animals", "play"], indoor: false, best: "any", hours: 1.5, why: "עשרות אריות ים משתזפים על הרציפים.", mustSee: true },
  { id: "cal-academy", name: "האקדמיה למדעים", en: "California Academy of Sciences", lat: 37.7699, lng: -122.4661, cat: "kids", interests: ["museums", "animals"], kids: ["science", "animals"], indoor: true, best: "any", hours: 3, why: "אקווריום, פלנטריום ויער גשם — תחת גג אחד.", tip: "מושלם ליום גשום או ערפילי.", mustSee: true },
  { id: "exploratorium", name: "האקספלורטוריום", en: "Exploratorium Pier 15", lat: 37.8017, lng: -122.3973, cat: "kids", interests: ["museums"], kids: ["science", "play"], indoor: true, best: "any", hours: 3, why: "מוזיאון מדע שכולו לגעת, לנסות ולשחק." },
  { id: "gg-park", name: "פארק גולדן גייט", en: "Golden Gate Park", lat: 37.7694, lng: -122.4862, cat: "nature", interests: ["nature", "walks"], kids: ["play", "calm"], indoor: false, best: "any", hours: 2, why: "פארק ענק עם אגמים, גנים ומדשאות." },
  { id: "koret", name: "מגרש המשחקים קורט", en: "Koret Children's Quarter", lat: 37.7678, lng: -122.4572, cat: "kids", interests: [], kids: ["play"], indoor: false, best: "any", hours: 1, why: "מגרש משחקים גדול בפארק, ולידו קרוסלה היסטורית." },
  { id: "zoo", name: "גן החיות של סן פרנסיסקו", en: "San Francisco Zoo", lat: 37.733, lng: -122.503, cat: "kids", interests: ["animals"], kids: ["animals", "play"], indoor: false, best: "morning", hours: 3, why: "גן חיות גדול ליד האוקיינוס." },
  { id: "lombard", name: "רחוב לומברד", en: "Lombard Street", lat: 37.8021, lng: -122.4187, cat: "city", interests: ["city", "views"], kids: [], indoor: false, best: "any", hours: 0.5, why: "הרחוב המתפתל המפורסם, מוקף פרחים." },
  { id: "cable-car", name: "הקרונית ההיסטורית", en: "Powell and Market cable car turnaround", lat: 37.7849, lng: -122.4076, cat: "city", interests: ["city", "rides"], kids: ["play"], indoor: false, best: "any", hours: 1, why: "נסיעה בקרונית הכבלים על הגבעות.", tip: "התור בתחנה הראשונה ארוך — אפשר לעלות גם בתחנות בהמשך הקו.", mustSee: true },
  { id: "painted-ladies", name: "הבתים הצבעוניים", en: "Alamo Square", lat: 37.7763, lng: -122.4346, cat: "city", interests: ["city", "views"], kids: ["play"], indoor: false, best: "afternoon", hours: 0.75, why: "שורת הבתים הוויקטוריאניים מול קו הרקיע, ובפארק יש מגרש משחקים." },
  { id: "twin-peaks", name: "טווין פיקס", en: "Twin Peaks Summit", lat: 37.7544, lng: -122.4477, cat: "city", interests: ["views"], kids: [], indoor: false, best: "sunset", hours: 0.75, why: "התצפית הגבוהה על כל העיר והמפרץ.", tip: "בערפל לא רואים כמעט כלום, ותמיד קר ורוחי שם." },
  { id: "ferry-building", name: "בניין המעבורות", en: "Ferry Building San Francisco", lat: 37.7955, lng: -122.3937, cat: "city", interests: ["food", "city"], kids: [], indoor: true, best: "morning", hours: 1, why: "שוק מקורה על המים, וממנו יוצאות מעבורות לסוסליטו.", tip: "בשווקים — לבדוק כשרות על כל מוצר בנפרד." },
  { id: "palace-fine-arts", name: "ארמון האמנויות היפות", en: "Palace of Fine Arts", lat: 37.8029, lng: -122.4484, cat: "city", interests: ["views", "walks"], kids: ["calm"], indoor: false, best: "afternoon", hours: 0.75, why: "כיפה ועמודים בסגנון רומי, ליד אגם שקט." },
  { id: "coit", name: "מגדל קויט", en: "Coit Tower", lat: 37.8024, lng: -122.4058, cat: "city", interests: ["views", "city"], kids: [], indoor: false, best: "any", hours: 1, why: "מגדל תצפית על ראש גבעת טלגרף." },
  { id: "japanese-garden", name: "הגן היפני", en: "Japanese Tea Garden", lat: 37.7701, lng: -122.4703, cat: "nature", interests: ["nature", "walks"], kids: ["calm"], indoor: false, best: "morning", hours: 1, why: "גשרים קשתיים, פגודות וברכות דגים." },
  { id: "lands-end", name: "לנדס אנד", en: "Lands End Trailhead", lat: 37.7804, lng: -122.5108, cat: "nature", interests: ["nature", "walks", "views"], kids: ["calm"], indoor: false, best: "afternoon", hours: 1.5, why: "שביל צוקים לאורך האוקיינוס, עם נוף לגשר.", mustSee: true },
  { id: "baker-beach", name: "חוף בייקר", en: "Baker Beach", lat: 37.7936, lng: -122.4836, cat: "beach", interests: ["beach", "views"], kids: ["water"], indoor: false, best: "afternoon", hours: 1, why: "חוף עם הנוף הכי יפה לגשר הזהב.", tip: "החלק הצפוני של החוף אינו מתאים למשפחות — להישאר בחלק הדרומי." },
  { id: "ocean-beach", name: "אושן ביץ׳", en: "Ocean Beach San Francisco", lat: 37.7594, lng: -122.5107, cat: "beach", interests: ["beach", "walks"], kids: ["water", "play"], indoor: false, best: "sunset", hours: 1, why: "חוף ארוך ופתוח, מקום מושלם לשקיעה.", tip: "המים קרים והזרמים מסוכנים — לא להיכנס לשחות." },
  { id: "sausalito", name: "סוסליטו", en: "Sausalito", lat: 37.8591, lng: -122.4853, cat: "daytrip", interests: ["city", "views", "walks"], kids: ["calm"], indoor: false, best: "afternoon", hours: 2.5, why: "עיירת חוף ציורית עם בתים צפים. אפשר להגיע במעבורת." },
  { id: "muir-woods", name: "מיור וודס", en: "Muir Woods National Monument", lat: 37.897, lng: -122.5811, cat: "nature", interests: ["nature", "walks"], kids: ["calm"], indoor: false, best: "morning", hours: 2.5, why: "יער של עצי סקויה ענקיים בני מאות שנים.", tip: "חובה להזמין מראש חניה או שאטל.", mustSee: true },
  { id: "tamalpais", name: "הר טמלפאיס", en: "Mount Tamalpais East Peak", lat: 37.9293, lng: -122.5786, cat: "nature", interests: ["views", "nature"], kids: [], indoor: false, best: "sunset", hours: 2, why: "נוף על כל המפרץ, ולפעמים מעל העננים." },
  { id: "point-reyes", name: "מגדלור פוינט ריס", en: "Point Reyes Lighthouse", lat: 38.0408, lng: -123.023, cat: "daytrip", interests: ["nature", "views", "animals"], kids: ["animals"], indoor: false, best: "morning", hours: 5, why: "מגדלור על צוק, חופים פראיים ולפעמים לווייתנים.", tip: "הרבה מדרגות בירידה למגדלור, ורוח חזקה." },
  { id: "half-moon-bay", name: "האף מון ביי", en: "Half Moon Bay", lat: 37.4636, lng: -122.4286, cat: "beach", interests: ["beach", "walks", "food"], kids: ["water"], indoor: false, best: "any", hours: 3, why: "עיירת חוף קטנה וחופים רחבים, דרומית לעיר." },
  { id: "ano-nuevo", name: "פילי הים באניו נואבו", en: "Año Nuevo State Park", lat: 37.1088, lng: -122.3328, cat: "daytrip", interests: ["nature", "animals"], kids: ["animals"], indoor: false, best: "morning", hours: 4, why: "מושבה ענקית של פילי ים על החוף.", tip: "בחורף הביקור בסיור מודרך בלבד — להזמין מראש." },
  { id: "santa-cruz", name: "טיילת סנטה קרוז", en: "Santa Cruz Beach Boardwalk", lat: 36.9643, lng: -122.0177, cat: "daytrip", interests: ["beach", "rides"], kids: ["play", "water"], indoor: false, best: "any", hours: 5, why: "לונה פארק קלאסי על החוף.", tip: "המתקנים פועלים בעיקר בעונה ובסופי שבוע — לבדוק באתר לפני הנסיעה." },
  { id: "natural-bridges", name: "הגשרים הטבעיים, סנטה קרוז", en: "Natural Bridges State Beach", lat: 36.953, lng: -122.0573, cat: "beach", interests: ["nature", "beach"], kids: ["animals", "calm"], indoor: false, best: "afternoon", hours: 1.5, why: "קשת סלע בתוך הים, ובחורף אלפי פרפרי מונרך בחורשה." },
  { id: "monterey-aquarium", name: "האקווריום של מונטריי", en: "Monterey Bay Aquarium", lat: 36.6182, lng: -121.9019, cat: "daytrip", interests: ["museums", "animals"], kids: ["animals", "science", "water"], indoor: true, best: "morning", hours: 6, why: "מהאקווריומים הגדולים בעולם: יער אצות ולוטרות ים.", mustSee: true },
  { id: "bixby", name: "גשר ביקסבי, ביג סור", en: "Bixby Creek Bridge", lat: 36.3715, lng: -121.9017, cat: "daytrip", interests: ["views", "nature"], kids: [], indoor: false, best: "afternoon", hours: 8, why: "מהכבישים היפים בעולם: צוקים מעל האוקיינוס.", tip: "כביש 1 נסגר לפעמים — לבדוק סגירות לפני היציאה." },
  { id: "yosemite", name: "עמק יוסמיטי", en: "Yosemite Valley", lat: 37.7456, lng: -119.5936, cat: "daytrip", interests: ["nature", "views", "walks"], kids: ["calm"], indoor: false, best: "morning", hours: 10, why: "מפלים וצוקי גרניט ענקיים.", tip: "יום ארוך מאוד. בחורף חלק מהכבישים סגורים ולפעמים נדרשות שרשראות.", mustSee: true },
  { id: "tahoe", name: "אגם טאהו", en: "South Lake Tahoe", lat: 38.9399, lng: -119.9772, cat: "daytrip", interests: ["nature", "views"], kids: ["water", "play"], indoor: false, best: "morning", hours: 10, why: "אגם הרים כחול, ובחורף שלג.", tip: "בחורף לבדוק תנאי דרך ודרישת שרשראות." },
  { id: "napa", name: "עמק נאפה", en: "Napa Valley Welcome Center", lat: 38.2975, lng: -122.2869, cat: "daytrip", interests: ["views", "food"], kids: ["calm"], indoor: false, best: "afternoon", hours: 5, why: "כרמים, נופים כפריים ורכבת היין ההיסטורית." },
  { id: "stanford", name: "קמפוס סטנפורד", en: "Stanford Oval", lat: 37.4275, lng: -122.1697, cat: "daytrip", interests: ["walks", "city"], kids: ["calm"], indoor: false, best: "any", hours: 2, why: "קמפוס יפהפה עם כניסה חופשית." },
];
