export interface SearchCriteria {
  carrosserie: string | null;
  motorisation: string | null;
  transmission: string | null;
  marque: string | null;
  modele: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetTolerance: number;
  ville: string | null;
  anneeMin: number | null;
  anneeMax: number | null;
  kmMax: number | null;
  intent: string[];
}

// ---------------------------------------------------------------------------
// Carrosseries (francais + darija)
// ---------------------------------------------------------------------------

const CARROSSERIES: Record<string, string> = {
  suv: "SUV",
  "4x4": "SUV",
  "4 x 4": "SUV",
  toutterrain: "SUV",
  "tout terrain": "SUV",
  offroad: "SUV",
  berline: "Berline",
  citadine: "Citadine",
  compacte: "Compacte",
  utilitaire: "Utilitaire",
  crossover: "Crossover",
  "cross over": "Crossover",
  break: "Break",
  coupé: "Coupé",
  coupe: "Coupé",
  cabriolet: "Cabriolet",
  monospace: "Monospace",
  pickup: "Utilitaire",
  "pick up": "Utilitaire",
  van: "Utilitaire",
  fourgon: "Utilitaire",
  // Darija (arabe)
  "ربع": "SUV",
  "كاروسة": "Berline",
  "مدينة": "Citadine",
  // Darija (Arabizi latin)
  rab3: "SUV",
  rba3: "SUV",
  rab3a: "SUV",
  karosa: "Berline",
  caroussa: "Berline",
  karoussa: "Berline",
  madina: "Citadine",
  mdina: "Citadine",
  ludospace: "Monospace",
  ludospas: "Monospace",
  "pick-up": "Utilitaire",
};

// ---------------------------------------------------------------------------
// Carburants (francais + darija)
// ---------------------------------------------------------------------------

const FUELS: Record<string, string> = {
  diesel: "Diesel",
  essence: "Essence",
  hybride: "Hybride",
  electrique: "Électrique",
  "électrique": "Électrique",
  gnv: "GNV",
  gpl: "GPL",
  gaz: "GPL",
  gasoil: "Diesel",
  // Darija (arabe)
  "مازوت": "Diesel",
  "مازوط": "Diesel",
  "كازوال": "Diesel",
  "ديزل": "Diesel",
  "كاز": "Essence",
  "بنزين": "Essence",
  "هجين": "Hybride",
  "هايبرد": "Hybride",
  "بطارية": "Électrique",
  "بطاريات": "Électrique",
  "كهرباء": "Électrique",
  "كهربائي": "Électrique",
  // Darija (Arabizi latin)
  mazot: "Diesel",
  mazout: "Diesel",
  mazwot: "Diesel",
  mazote: "Diesel",
  kazwal: "Diesel",
  kazwa: "Diesel",
  dizel: "Diesel",
  kaz: "Essence",
  banzin: "Essence",
  benzin: "Essence",
  bnzin: "Essence",
  hjin: "Hybride",
  haibred: "Hybride",
  kahraba: "Électrique",
  kahraoui: "Électrique",
  batariya: "Électrique",
};

// ---------------------------------------------------------------------------
// Transmissions (francais + darija)
// ---------------------------------------------------------------------------

const TRANSMISSIONS: Record<string, string> = {
  manuelle: "Manuelle",
  manuel: "Manuelle",
  mecanique: "Manuelle",
  automatique: "Automatique",
  auto: "Automatique",
  "boîte auto": "Automatique",
  "boite auto": "Automatique",
  "boite automatique": "Automatique",
  // Darija (arabe)
  "اوتوماتيك": "Automatique",
  "اوماتيك": "Automatique",
  "ماتيك": "Automatique",
  "مانيال": "Manuelle",
  "مانيويل": "Manuelle",
  "مانوال": "Manuelle",
  "اليدوي": "Manuelle",
  "يدوي": "Manuelle",
  // Darija (Arabizi latin)
  otomatic: "Automatique",
  awtomatic: "Automatique",
  automatik: "Automatique",
  matik: "Automatique",
  manyal: "Manuelle",
  manyouil: "Manuelle",
  manwal: "Manuelle",
  idawi: "Manuelle",
};

// ---------------------------------------------------------------------------
// Marques (francais + darija) : alias -> marque canonique
// ---------------------------------------------------------------------------

const BRAND_NAMES: Record<string, string> = {
  "toyota": "Toyota",
  "تويوتا": "Toyota",
  "تويوطة": "Toyota",
  "renault": "Renault",
  "reno": "Renault",
  "رونو": "Renault",
  "رينو": "Renault",
  "peugeot": "Peugeot",
  "peugeo": "Peugeot",
  "بيجو": "Peugeot",
  "dacia": "Dacia",
  "داسيا": "Dacia",
  "hyundai": "Hyundai",
  "hyundei": "Hyundai",
  "hyunday": "Hyundai",
  "huyndai": "Hyundai",
  "هيونداي": "Hyundai",
  "kia": "Kia",
  "كيا": "Kia",
  "volkswagen": "Volkswagen",
  "volks": "Volkswagen",
  "vw": "Volkswagen",
  "فولكس": "Volkswagen",
  "mercedes": "Mercedes",
  "mercedes-benz": "Mercedes",
  "merco": "Mercedes",
  "مرسيدس": "Mercedes",
  "bmw": "BMW",
  "بي ام": "BMW",
  "بي إم": "BMW",
  "audi": "Audi",
  "ford": "Ford",
  "fiat": "Fiat",
  "nissan": "Nissan",
  "opel": "Opel",
  "citroen": "Citroën",
  "citro": "Citroën",
  "سيتروين": "Citroën",
  "skoda": "Škoda",
  "seat": "Seat",
  "mazda": "Mazda",
  "سوزوكي": "Suzuki",
  "suzuki": "Suzuki",
  "honda": "Honda",
  "ميتسوبيشي": "Mitsubishi",
  "mitsubishi": "Mitsubishi",
  "mitsubichi": "Mitsubishi",
  "volvo": "Volvo",
  "jeep": "Jeep",
  "جيب": "Jeep",
  "chevrolet": "Chevrolet",
  "chevy": "Chevrolet",
  "lexus": "Lexus",
  "لكزس": "Lexus",
  "infiniti": "Infiniti",
  "alfa romeo": "Alfa Romeo",
  "alfa": "Alfa Romeo",
  "porsche": "Porsche",
  "بورش": "Porsche",
  "tesla": "Tesla",
  "land rover": "Land Rover",
  "landrover": "Land Rover",
  "range rover": "Range Rover",
  "jaguar": "Jaguar",
  "subaru": "Subaru",
  "smart": "Smart",
  "polestar": "Polestar",
  "dodge": "Dodge",
  "chrysler": "Chrysler",
  "bentley": "Bentley",
  "lamborghini": "Lamborghini",
  "ferrari": "Ferrari",
  "mclaren": "McLaren",
  "maserati": "Maserati",
  "aston martin": "Aston Martin",
  "rolls royce": "Rolls-Royce",
  "rolls": "Rolls-Royce",
  "gmc": "GMC",
  "cadillac": "Cadillac",
  "buick": "Buick",
  "acura": "Acura",
  "byd": "BYD",
  "changan": "Changan",
  "chery": "Chery",
  "haval": "Haval",
  "gac": "GAC",
  "baic": "BAIC",
  "geely": "Geely",
  "dfsk": "DFSK",
  "jac": "JAC",
  "omoda": "Omoda",
  "jaecoo": "Jaecoo",
  "exeed": "EXEED",
  "xpeng": "XPENG",
  "dongfeng": "Dongfeng",
  "isuzu": "Isuzu",
  "mahindra": "Mahindra",
  "tata": "Tata",
  "lada": "Lada",
  "great wall": "Great Wall",
};

// ---------------------------------------------------------------------------
// Villes (francais + darija) : alias -> ville canonique
// ---------------------------------------------------------------------------

const CITY_NAMES: Record<string, string[]> = {
  "Casablanca": ["casablanca", "casa", "الدار البيضاء", "البيضاء", "كازا", "كازابلانكا", "da7let beida", "l7ay beida"],
  "Rabat": ["rabat", "الرباط", "rbat"],
  "Marrakech": ["marrakech", "مراكش", "mchicha", "amrcouch"],
  "Fès": ["fes", "فاس", "fass"],
  "Tanger": ["tanger", "طنجة", "tnja"],
  "Agadir": ["agadir", "اكادير", "أكادير", "agadir"],
  "Meknès": ["meknes", "مكناس", "mknas"],
  "Oujda": ["oujda", "وجدة", "wjd"],
  "Tétouan": ["tetouan", "تطوان", "ttwan"],
  "Nador": ["nador", "الناظور", "nador"],
  "El Jadida": ["el jadida", "الجديدة", "jadida", "ljadida"],
  "Kénitra": ["kenitra", "القنيطرة", "qnitra"],
  "Béni Mellal": ["beni mellal", "بني ملال", "bni mlal"],
  "Salé": ["سلا", "sela"],
  "Temara": ["temara", "تمارة", "tmar"],
  "Mohammedia": ["mohammedia", "المحمدية", "mhamdia"],
  "Safi": ["safi", "اسفي", "آسفي", "safi"],
  "Essaouira": ["essaouira", "الصويرة", "swira"],
  "Khouribga": ["khouribga", "خريبكة", "khribga"],
  "Settat": ["settat", "سطات", "sttat"],
  "Benslimane": ["benslimane", "بن سليمان", "bn sliman"],
  "Ouarzazate": ["ouarzazate", "ورزازات", "wzazt"],
  "Laâyoune": ["laayoune", "العيون", "layoun"],
  "Dakhla": ["dakhla", "الداخلة", "dxla"],
  "Taza": ["taza", "تازة", "tza"],
  "Al Hoceima": ["al hoceima", "الحسيمة", "l7sima"],
  "Sidi Kacem": ["sidi kacem", "سيدي قاسم", "sidi qasm"],
  "Sidi Slimane": ["sidi slimane", "سيدي سليمان", "sidi sliman"],
  "Errachidia": ["errachidia", "الرشيدية", "rshidia"],
  "Sefrou": ["sefrou", "صفرو", "sfrou"],
  "Taroudant": ["taroudant", "تارودانت", "trudant"],
  "Khémisset": ["khemisset", "خميسات", "xmisset"],
  "Guercif": ["guercif", "جرسيف", "grsif"],
  "Youssoufia": ["youssoufia", "اليوسفية", "yusufia"],
  "Ben Guerir": ["ben guerir", "بنجرير", "bn jirir"],
  "Berkane": ["berkane", "بوركان", "barkan"],
  "Fkih Ben Salah": ["fkih ben salah", "الفقيه بن صالح", "fqih bn sla7"],
  "Sidi Bennour": ["sidi bennour", "سيدي بنور", "sidi bnur"],
  "Larache": ["larache", "العرائش", "larech"],
  "Azemmour": ["azemmour", "ازمور", "zmmur"],
};

// ---------------------------------------------------------------------------
// Modeles (canonique -> alias de saisie)
// ---------------------------------------------------------------------------

const MODELS: Record<string, string[]> = {
  // Dacia
  "Duster": ["duster", "داستر"],
  "Sandero": ["sandero", "stepway"],
  "Logan": ["logan"],
  "Jogger": ["jogger"],
  "Spring": ["spring"],
  "Dokker": ["dokker"],
  "Lodgy": ["lodgy"],
  // Renault
  "Clio": ["clio", "كلارو"],
  "Megane": ["megane", "meganne", "megan"],
  "Captur": ["captur"],
  "Kadjar": ["kadjar"],
  "Arkana": ["arkana"],
  "Koleos": ["koleos"],
  "Kangoo": ["kangoo"],
  "Trafic": ["trafic"],
  "Twingo": ["twingo"],
  "Symbol": ["symbol"],
  "Talisman": ["talisman"],
  "Scenic": ["scenic"],
  "Espace": ["espace"],
  "Zoe": ["zoe"],
  "Kardian": ["kardian"],
  "Express": ["express"],
  // Peugeot
  "208": ["208"],
  "308": ["308"],
  "2008": ["2008"],
  "3008": ["3008"],
  "5008": ["5008"],
  "508": ["508"],
  "301": ["301"],
  "206": ["206"],
  "207": ["207"],
  "407": ["407"],
  "406": ["406"],
  "107": ["107"],
  "108": ["108"],
  "Partner": ["partner"],
  "Rifter": ["rifter"],
  // Toyota
  "Yaris": ["yaris"],
  "Yaris Cross": ["yaris cross"],
  "Corolla": ["corolla"],
  "Corolla Cross": ["corolla cross"],
  "RAV4": ["rav4"],
  "C-HR": ["c-hr", "chr"],
  "Land Cruiser": ["land cruiser", "landcruiser", "prado"],
  "Prado": ["prado"],
  "Hilux": ["hilux"],
  "Fortuner": ["fortuner"],
  "Highlander": ["highlander"],
  "Aygo": ["aygo"],
  "Auris": ["auris"],
  "Camry": ["camry"],
  // Hyundai
  "Tucson": ["tucson"],
  "Santa Fe": ["santa fe", "sante fe"],
  "Kona": ["kona"],
  "i10": ["i10"],
  "i20": ["i20"],
  "Elantra": ["elantra"],
  "Accent": ["accent"],
  "Creta": ["creta"],
  "Getz": ["getz"],
  "Sonata": ["sonata"],
  "Palisade": ["palisade"],
  "Venue": ["venue"],
  "Bayon": ["bayon"],
  // Kia
  "Picanto": ["picanto"],
  "Rio": ["rio"],
  "Sportage": ["sportage"],
  "Sorento": ["sorento"],
  "Stonic": ["stonic"],
  "Soul": ["soul"],
  "Carnival": ["carnival"],
  "Ceed": ["ceed", "cee'd"],
  "Cerato": ["cerato"],
  "Niro": ["niro"],
  "Seltos": ["seltos"],
  "Telluride": ["telluride"],
  // Volkswagen
  "Golf": ["golf"],
  "Polo": ["polo"],
  "Passat": ["passat"],
  "Tiguan": ["tiguan"],
  "T-Roc": ["t-roc", "troc"],
  "Jetta": ["jetta"],
  "Touareg": ["touareg"],
  "Touran": ["touran"],
  "Sharan": ["sharan"],
  "Caddy": ["caddy"],
  "Transporter": ["transporter"],
  "Coccinelle": ["coccinelle", "beetle", "bug"],
  // BMW
  "Série 1": ["serie 1", "serie1"],
  "Série 3": ["serie 3", "serie3", "320i", "330i"],
  "Série 5": ["serie 5", "serie5", "520i", "530i"],
  "Série 7": ["serie 7", "serie7"],
  "X1": ["x1"],
  "X2": ["x2"],
  "X3": ["x3"],
  "X4": ["x4"],
  "X5": ["x5"],
  "X6": ["x6"],
  "X7": ["x7"],
  // Mercedes
  "Classe A": ["classe a", "classea"],
  "Classe B": ["classe b", "classeb"],
  "Classe C": ["classe c", "classec", "c 200", "c200"],
  "Classe E": ["classe e", "classee"],
  "Classe S": ["classe s", "classes"],
  "GLC": ["glc"],
  "GLE": ["gle"],
  "GLA": ["gla"],
  "GLB": ["glb"],
  "GLS": ["gls"],
  "Classe G": ["classe g", "classeg", "g class", "gclass"],
  "CLA": ["cla"],
  "Vito": ["vito"],
  "Sprinter": ["sprinter"],
  // Audi
  "A3": ["a3"],
  "A4": ["a4"],
  "A5": ["a5"],
  "A6": ["a6"],
  "A8": ["a8"],
  "Q2": ["q2"],
  "Q3": ["q3"],
  "Q5": ["q5"],
  "Q7": ["q7"],
  "Q8": ["q8"],
  "TT": ["tt"],
  "e-tron": ["e-tron", "etron", "e tron"],
  // Ford
  "Fiesta": ["fiesta"],
  "Focus": ["focus"],
  "Kuga": ["kuga"],
  "Puma": ["puma"],
  "Ranger": ["ranger"],
  "Mustang": ["mustang"],
  "Mondeo": ["mondeo"],
  "EcoSport": ["ecosport"],
  "Explorer": ["explorer"],
  "Escape": ["escape"],
  // Nissan
  "Qashqai": ["qashqai", "kashkai", "كشكاي"],
  "Juke": ["juke"],
  "X-Trail": ["x-trail", "xtrail", "x trail"],
  "Micra": ["micra"],
  "Patrol": ["patrol"],
  "Pathfinder": ["pathfinder"],
  "Navara": ["navara"],
  "Sunny": ["sunny"],
  "Sentra": ["sentra"],
  "Murano": ["murano"],
  "Kicks": ["kicks"],
  // Opel
  "Corsa": ["corsa"],
  "Astra": ["astra"],
  "Mokka": ["mokka"],
  "Grandland": ["grandland"],
  "Insignia": ["insignia"],
  "Crossland": ["crossland"],
  "Zafira": ["zafira"],
  // Citroën
  "C1": ["c1"],
  "C3": ["c3"],
  "C4": ["c4"],
  "C4 Cactus": ["cactus"],
  "C5": ["c5"],
  "C5 Aircross": ["c5 aircross"],
  "C3 Aircross": ["c3 aircross"],
  "Picasso": ["picasso"],
  "Berlingo": ["berlingo"],
  "Jumpy": ["jumpy"],
  "Elysée": ["elysee"],
  "DS3": ["ds3"],
  "DS4": ["ds4"],
  "DS7": ["ds7"],
  // Škoda
  "Octavia": ["octavia"],
  "Fabia": ["fabia"],
  "Superb": ["superb"],
  "Kamiq": ["kamiq"],
  "Karoq": ["karoq"],
  "Kodiaq": ["kodiaq"],
  "Rapid": ["rapid"],
  "Enyaq": ["enyaq"],
  // Seat
  "Ibiza": ["ibiza"],
  "Leon": ["leon"],
  "Arona": ["arona"],
  "Ateca": ["ateca"],
  "Alhambra": ["alhambra"],
  "Toledo": ["toledo"],
  // Mazda
  "Mazda 2": ["mazda 2", "mazda2"],
  "Mazda 3": ["mazda 3", "mazda3"],
  "Mazda 6": ["mazda 6", "mazda6"],
  "CX-3": ["cx-3", "cx3", "cx 3"],
  "CX-5": ["cx-5", "cx5", "cx 5"],
  "CX-30": ["cx-30", "cx30", "cx 30"],
  "MX-5": ["mx-5", "mx5"],
  // Suzuki
  "Swift": ["swift"],
  "Vitara": ["vitara"],
  "S-Cross": ["s-cross", "scross", "s cross"],
  "Jimny": ["jimny"],
  "Baleno": ["baleno"],
  "Alto": ["alto"],
  "Ignis": ["ignis"],
  "Ertiga": ["ertiga"],
  // Honda
  "Civic": ["civic", "سيفيك"],
  "Accord": ["accord"],
  "CR-V": ["cr-v", "crv", "cr v"],
  "HR-V": ["hr-v", "hrv", "hr v"],
  "Jazz": ["jazz"],
  "City": ["city"],
  // Mitsubishi
  "Lancer": ["lancer"],
  "Outlander": ["outlander"],
  "Pajero": ["pajero"],
  "ASX": ["asx"],
  "Eclipse Cross": ["eclipse"],
  "Triton": ["triton"],
  "L200": ["l200"],
  "Montero": ["montero"],
  // Volvo
  "XC40": ["xc40"],
  "XC60": ["xc60"],
  "XC90": ["xc90"],
  "S60": ["s60"],
  "S90": ["s90"],
  // Jeep
  "Cherokee": ["cherokee"],
  "Grand Cherokee": ["grand cherokee"],
  "Wrangler": ["wrangler"],
  "Compass": ["compass"],
  "Renegade": ["renegade"],
  "Gladiator": ["gladiator"],
  "Liberty": ["liberty"],
  // Fiat
  "500": ["500"],
  "Panda": ["panda"],
  "Punto": ["punto"],
  "Tipo": ["tipo"],
  "Doblo": ["doblo"],
  "Ducato": ["ducato"],
  // Land Rover / Range Rover
  "Defender": ["defender"],
  "Range Rover": ["range rover"],
  "Discovery": ["discovery"],
  "Evoque": ["evoque"],
  // Chevrolet
  "Cruze": ["cruze"],
  "Malibu": ["malibu"],
  "Spark": ["spark"],
  "Aveo": ["aveo"],
  "Tahoe": ["tahoe"],
  "Camaro": ["camaro"],
  // Lexus
  "RX": ["rx"],
  "NX": ["nx"],
  "LX": ["lx"],
  "UX": ["ux"],
  // BYD
  "Seal": ["seal"],
  "Dolphin": ["dolphin"],
  "Atto 3": ["atto 3", "atto3"],
  "Han": ["han"],
  "Tang": ["tang"],
  "Song": ["song"],
  // MG
  "ZS": ["zs ev", "zsev", "zs"],
  "MG5": ["mg5"],
  "MG3": ["mg3"],
  "HS": ["hs"],
  "Marvel": ["marvel"],
};

const INTENT_KEYWORDS: Record<string, string[]> = {
  achat: [
    "acheter", "achete", "achetons", "acheteur", "achat",
    "je veux acheter", "je souhaite acheter", "j'aimerais acheter", "je veux prendre",
    "bghit nchri", "bghit nchri", "nchri", "ghadi nchri", "bghit nechri", "bghit nechri",
    "buy", "want to buy", "looking for", "interested in",
    "nchri tomobil", "nchri tomobila", "tomobil", "tomobila", "toumobil",
    "عندني", "بغيت نشري",
  ],
  familial: ["famille", "familial", "familiale", "enfant", "enfants", "bébé", "bebe", "pratique", "7aml", "عائلة", "اولاد", "دراري", "صغار", "عائلي"],
  sportif: ["sport", "sportif", "sportive", "puissant", "puissance", "vitesse", "performance", "sari3", "سريع", "قوي"],
  economique: ["économique", "economique", "petit budget", "abordable", "pas cher", "moins cher", "pas trop cher", "budget serré", "رخيص", "رخص", "اقتصادي"],
  confort: ["confort", "confortable", "luxueux", "luxe", "premium", "haut de gamme", "مرتاح", "فخم", "راحة", "هادئ"],
  ville: ["ville", "urbain", "urbaine", "parking", "stationnement", "مدينة"],
  route: ["autoroute", "route", "longue distance", "voyage", "سفر", "طريق", "طويلة"],
  tout_terrain: ["tout-terrain", "tout terrain", "piste", "chemin", "offroad", "boue", "وعر"],
};

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

function normalizeText(text: string): string {
  const arabicDigits: Record<string, string> = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4", "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  };
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => arabicDigits[d])
    .replace(/[^\w\s\d\u0600-\u06FF\u0400-\u04FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Translitération Arabizi → Arabe : convertit les chiffres/digraphes
// Arabizi en leurs équivalents arabes pour enrichir le lookup.
// Ex: "mazot" → "mazot" (inchangé, déjà dans dict), "3andi" → "عandi"
// Sert de couche de secours si un terme n'est pas dans le dict Arabizi.
function transliterateArabizi(text: string): string {
  let result = text;
  // Chiffres arabizi → lettres arabes (dans l'ordre, digraphes avant single)
  const map: [RegExp, string][] = [
    [/7[ba]/g, "حبا"],
    [/7t/g, "حت"],
    [/7m/g, "حم"],
    [/7y/g, "حي"],
    [/7a/g, "حا"],
    [/7/g, "ح"],
    [/3in/g, "عين"],
    [/3an/g, "عان"],
    [/3a/g, "ع"],
    [/3i/g, "عي"],
    [/3/g, "ع"],
    [/9a/g, "قا"],
    [/9i/g, "قي"],
    [/9/g, "ق"],
    [/2/g, "ء"],
    [/8/g, "غ"],
    [/kh/g, "خ"],
    [/gh/g, "غ"],
    [/sh/g, "ش"],
    [/ch/g, "ش"],
    [/6/g, "ط"],
    [/5/g, "خ"],
  ];
  for (const [pattern, replacement] of map) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function hasKeyword(text: string, key: string): boolean {
  if (key.includes(" ")) return text.includes(key);
  return new RegExp(`(^|[^a-z0-9])${key}([^a-z0-9]|$)`).test(text);
}

function normalizeAlias(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, " ")
    .trim();
}

function startsWithPhrase(text: string, phrases: string[]): boolean {
  const t = text.trim();
  return phrases.some((p) => t === p || t.startsWith(`${p} `));
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

function expandMoneyUnits(text: string): string {
  const clean = (n: string) => n.replace(/\s/g, "");
  return text
    .replace(/(\d[\d\s]*\d?)\s*millions?\b/g, (_, n) => `${clean(n)}000000`)
    .replace(/(\d[\d\s]*\d?)\s*mille\b/g, (_, n) => `${clean(n)}000`)
    .replace(/(\d[\d\s]*\d?)\s*مليون/g, (_, n) => `${clean(n)}000000`)
    .replace(/(\d[\d\s]*\d?)\s*(?:الف|الاف)/g, (_, n) => `${clean(n)}000`)
    .replace(/(\d[\d\s]*\d?)\s*k\b/gi, (_, n) => `${clean(n)}000`);
}

function extractBudget(text: string): { min: number | null; max: number | null; tolerance: number } {
  let min: number | null = null;
  let max: number | null = null;
  let tolerance = 0.15;
  const t = expandMoneyUnits(text);

  const aroundMatch = t.match(/(?:autour\s+d[e']|environ|a peu pres|vers|تقريبا|حوالي|على ما يقارب)\s*(\d[\d\s]*\d)\s*(?:dh|درهم)?/i);
  if (aroundMatch) {
    const val = parseInt(aroundMatch[1].replace(/\s/g, ""));
    if (val >= 10000 && val <= 5000000) {
      max = Math.round(val * 1.2);
      min = Math.round(val * 0.8);
      tolerance = 0.2;
    }
  }

  if (min === null) {
    const rangeMatch = t.match(/(?:entre|بين)\s+(\d[\d\s]*\d)\s*(?:et|a|à|و)\s+(\d[\d\s]*\d)\s*(?:dh|درهم)?/i);
    if (rangeMatch) {
      const v1 = parseInt(rangeMatch[1].replace(/\s/g, ""));
      const v2 = parseInt(rangeMatch[2].replace(/\s/g, ""));
      if (v1 >= 10000 && v2 >= 10000) { min = Math.min(v1, v2); max = Math.max(v1, v2); }
    }
  }

  if (min === null) {
    const underMatch = t.match(/(?:sous|moins de|max|maximum|plafond|اقل من|اقل|تحت|اقصى)\s+(\d[\d\s]*\d)\s*(?:dh|درهم)?/i);
    if (underMatch) {
      const val = parseInt(underMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) max = val;
    }
  }

  if (min === null) {
    const aboveMatch = t.match(/(?:plus de|au-dessus de|min|minimum|a partir de|a partir|اكثر من|اكثر|فوق|اعلى من|الاكثر)\s+(\d[\d\s]*\d)\s*(?:dh|درهم)?/i);
    if (aboveMatch) {
      const val = parseInt(aboveMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) min = val;
    }
  }

  if (min === null && max === null) {
    const budgetWordMatch = t.match(/(?:budget|ميزانية|عندي|خاصني|بغيت)\s+(\d[\d\s]*\d)/i);
    if (budgetWordMatch) {
      const val = parseInt(budgetWordMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) {
        max = Math.round(val * 1.15);
        min = Math.round(val * 0.85);
      }
    }
  }

  // Darija patterns
  if (min === null && max === null) {
    const darMatch = t.match(/(?:ف|على|ب)\s*(\d[\d\s]*\d)\s*(?:درهم|دهم|dh)?/i);
    if (darMatch) {
      const val = parseInt(darMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) {
        max = Math.round(val * 1.15);
        min = Math.round(val * 0.85);
        tolerance = 0.15;
      }
    }
  }

  if (min === null && max === null) {
    const budgetMatch = t.match(/(\d[\d\s]*\d)\s*(?:dh|mad|درهم|دهم)/i);
    if (budgetMatch) {
      const val = parseInt(budgetMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 5000000) {
        max = Math.round(val * 1.15);
        min = Math.round(val * 0.85);
        tolerance = 0.15;
      }
    }
  }

  // Nombre seul (ex. "200000", "200 000") : considéré comme un budget en DH,
  // sauf s'il s'agit d'une année (20xx) ou d'une petite valeur (modèle, km).
  if (min === null && max === null) {
    const bareMatch = t.match(/(\d[\d\s]*\d)/);
    if (bareMatch) {
      const val = parseInt(bareMatch[1].replace(/\s/g, ""));
      if (val >= 10000 && val <= 9000000 && !(val >= 2000 && val <= 2026)) {
        max = Math.round(val * 1.15);
        min = Math.round(val * 0.85);
        tolerance = 0.15;
      }
    }
  }

  return { min, max, tolerance };
}

function extractYear(text: string, ignored?: string[]): { min: number | null; max: number | null } {
  let min: number | null = null;
  let max: number | null = null;

  if (ignored && ignored.length) {
    for (const token of ignored) {
      text = text.split(token).join(" ");
    }
  }

  const sinceMatch = text.match(/(?:depuis|a partir de|apres|post|من|بعد)\s*(\d{4})/i);
  if (sinceMatch) {
    const year = parseInt(sinceMatch[1]);
    if (year >= 2000 && year <= 2026) min = year;
  }

  const beforeMatch = text.match(/(?:avant|jusqua|قبل)\s*(\d{4})/i);
  if (beforeMatch) {
    const year = parseInt(beforeMatch[1]);
    if (year >= 2000 && year <= 2026) max = year;
  }

  if (min === null && max === null) {
    const yearMatch = text.match(/(?<!\d)(20[0-2]\d)(?!\d)/g);
    if (yearMatch) {
      const years = yearMatch.map(Number).filter((y) => y >= 2000 && y <= 2026);
      if (years.length === 1) { min = years[0]; max = years[0] + 1; }
      else if (years.length >= 2) { min = Math.min(...years); max = Math.max(...years); }
    }
  }

  return { min, max };
}

function extractKmMax(text: string): number | null {
  const kmMatch = text.match(/(?:moins de|sous|max|maximum|تحت|اقل|اقل من|اقصى)\s*(\d[\d\s]*)\s*(?:km|كلم|كيلومتر)/i);
  if (kmMatch) {
    const val = parseInt(kmMatch[1].replace(/\s/g, ""));
    if (val > 0 && val <= 500000) return val;
  }
  const kmExact = text.match(/(\d[\d\s]*)\s*(?:km|كلم|كيلومتر)/i);
  if (kmExact) {
    const val = parseInt(kmExact[1].replace(/\s/g, ""));
    if (val > 0 && val <= 500000) return val;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tables pre-triees (plus specifique d'abord)
// ---------------------------------------------------------------------------

const BRAND_ENTRIES = Object.entries(BRAND_NAMES).sort((a, b) => b[0].length - a[0].length);
const CITY_ENTRIES = Object.entries(CITY_NAMES)
  .flatMap(([city, aliases]) => aliases.map((a) => [a, city] as [string, string]))
  .sort((a, b) => b[0].length - a[0].length);
const MODEL_ENTRIES = Object.entries(MODELS)
  .flatMap(([model, aliases]) => aliases.map((a) => [normalizeAlias(a), model] as [string, string]))
  .sort((a, b) => b[0].length - a[0].length);

export function parseQuery(query: string): SearchCriteria {
  const normalized = normalizeText(query);
  const normalizedAr = transliterateArabizi(normalized);

  let carrosserie: string | null = null;
  for (const [key, value] of Object.entries(CARROSSERIES)) {
    if (normalized.includes(key) || normalizedAr.includes(key)) { carrosserie = value; break; }
  }

  let motorisation: string | null = null;
  for (const [key, value] of Object.entries(FUELS)) {
    if (normalized.includes(key) || normalizedAr.includes(key)) { motorisation = value; break; }
  }

  let transmission: string | null = null;
  for (const [key, value] of Object.entries(TRANSMISSIONS)) {
    if (hasKeyword(normalized, key) || hasKeyword(normalizedAr, key)) { transmission = value; break; }
  }

  let marque: string | null = null;
  for (const [alias, canonical] of BRAND_ENTRIES) {
    if (normalized.includes(alias) || normalizedAr.includes(alias)) { marque = canonical; break; }
  }

  let ville: string | null = null;
  for (const [alias, canonical] of CITY_ENTRIES) {
    if (normalized.includes(alias) || normalizedAr.includes(alias)) { ville = canonical; break; }
  }

  let modele: string | null = null;
  for (const [alias, canonical] of MODEL_ENTRIES) {
    const matched = alias.includes(" ")
      ? normalized.includes(alias) || normalizedAr.includes(alias)
      : hasKeyword(normalized, alias) || hasKeyword(normalizedAr, alias);
    if (matched) { modele = canonical; break; }
  }

  const { min: budgetMin, max: budgetMax, tolerance: budgetTolerance } = extractBudget(normalized);
  const numericModel = modele && /^\d+$/.test(modele) ? [modele] : [];
  const { min: anneeMin, max: anneeMax } = extractYear(normalized, numericModel);
  const kmMax = extractKmMax(normalized);

  const intent: string[] = [];
  for (const [key, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (normalized.includes(kw.toLowerCase()) || normalizedAr.includes(kw.toLowerCase())) { intent.push(key); break; }
    }
  }

  return {
    carrosserie, motorisation, transmission, marque, modele,
    budgetMin, budgetMax, budgetTolerance,
    ville, anneeMin, anneeMax, kmMax, intent,
  };
}

/** Construit un texte de recherche canonique (entites normalisees). */
export function queryFromCriteria(c: SearchCriteria): string {
  const parts: string[] = [];
  if (c.marque) parts.push(c.marque);
  if (c.modele) parts.push(c.modele);
  if (c.carrosserie) parts.push(c.carrosserie);
  if (c.motorisation) parts.push(c.motorisation);
  if (c.transmission) parts.push(c.transmission);
  if (c.ville) parts.push(c.ville);
  return parts.join(" ").trim();
}

/** Détecte une salutation / formule de politesse en francais et darija. */
export function isGreeting(text: string): boolean {
  const n = normalizeText(text);
  return startsWithPhrase(n, ["bonjour", "bonsoir", "salut", "hello", "hi", "hey", "salam", "salamo", "السلام", "سلام"]) ||
    /bonjour|bonsoir|salut|hello|hi|hey|salam|صباح|مساء|السلام/.test(n);
}

export function isThanks(text: string): boolean {
  return /merci|choukran|chokran|chokra|shukran|thanks|thank|thx|شكرا|الله يخليك|بارك الله/.test(normalizeText(text));
}

export function isHelp(text: string): boolean {
  return /aide|help|comment|aidez|besoin|exemple|شنو|فهمني|كيفاش|عاونني/.test(normalizeText(text));
}

export function isSkip(text: string): boolean {
  return /passer|passe|skip|sauter|peu importe|n'importe|nimporte|aucune|aucun|je ne sais pas|jsp|لا فرق|غير مهم|اي شيء|ماشي مهم|خلاص|بلاها/.test(normalizeText(text));
}

export function isYes(text: string): boolean {
  return /oui|ouais|yes|yep|ok|dac|daccord|d'accord|bien sur|نعم|ايه|اوك|واه|يه/.test(normalizeText(text));
}
