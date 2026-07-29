import { UnifiedCar, generateId, computeScore } from "./types";

const CDN = "https://s1.cdn.autoevolution.com/images-webp/models";

const MODEL_MAP: Record<string, string> = {
  "Dacia_Sandero": "DACIA_Sandero",
  "Dacia_Logan": "DACIA_Logan",
  "Dacia_Duster": "DACIA_Duster",
  "Dacia_Jogger": "DACIA_Jogger",
  "Dacia_Spring": "DACIA_Spring",
  "Renault_Clio": "RENAULT_Clio",
  "Renault_Megane": "RENAULT_Megane",
  "Renault_Austral": "RENAULT_Austral",
  "Renault_Kardian": "RENAULT_Kardian",
  "Renault_Duster": "RENAULT_Duster",
  "Renault_Symbol": "RENAULT_Symbol",
  "Renault_Captur": "RENAULT_Captur",
  "Renault_Arkana": "RENAULT_Arkana",
  "Renault_Twingo": "RENAULT_Twingo",
  "Peugeot_208": "PEUGEOT_208",
  "Peugeot_2008": "PEUGEOT_2008",
  "Peugeot_3008": "PEUGEOT_3008",
  "Peugeot_308": "PEUGEOT_308",
  "Peugeot_206": "PEUGEOT_206",
  "Peugeot_5008": "PEUGEOT_5008",
  "Peugeot_508": "PEUGEOT_508",
  "Peugeot_301": "PEUGEOT_301",
  "Peugeot_Partner": "PEUGEOT_Partner",
  "Toyota_Yaris": "TOYOTA_Yaris",
  "Toyota_Yaris Cross": "TOYOTA_Yaris_Cross",
  "Toyota_Corolla": "TOYOTA_Corolla",
  "Toyota_RAV4": "TOYOTA_RAV4",
  "Toyota_C-HR": "TOYOTA_C-HR",
  "Toyota_Hilux": "TOYOTA_Hilux",
  "Toyota_Land Cruiser Prado": "TOYOTA_Land-Cruiser-Prado",
  "Toyota_Corolla Cross": "TOYOTA_Corolla-Cross",
  "Hyundai_Tucson": "HYUNDAI_Tucson",
  "Hyundai_i20": "HYUNDAI_i20",
  "Hyundai_Kona": "HYUNDAI_Kona",
  "Hyundai_Bayon": "HYUNDAI_Bayon",
  "Hyundai_i10": "HYUNDAI_i10",
  "Hyundai_Santa Fe": "HYUNDAI_Santa-Fe",
  "Hyundai_Elantra": "HYUNDAI_Elantra",
  "Kia_Sportage": "KIA_Sportage",
  "Kia_Niro": "KIA_Niro",
  "Kia_Picanto": "KIA_Picanto",
  "Kia_Stonic": "KIA_Stonic",
  "Kia_Sorento": "KIA_Sorento",
  "Kia_Carnival": "KIA_Carnival",
  "Kia_Rio": "KIA_Rio",
  "Volkswagen_Golf": "VOLKSWAGEN_Golf",
  "Volkswagen_T-Roc": "VOLKSWAGEN_T-Roc",
  "Volkswagen_Tiguan": "VOLKSWAGEN_Tiguan",
  "Volkswagen_Polo": "VOLKSWAGEN_Polo",
  "Volkswagen_T-Cross": "VOLKSWAGEN_T-Cross",
  "Volkswagen_Amarok": "VOLKSWAGEN_Amarok",
  "Volkswagen_ID.4": "VOLKSWAGEN_ID.4",
  "BMW_Série 1": "BMW_Serie-1",
  "BMW_X1": "BMW_X1",
  "BMW_X3": "BMW_X3",
  "BMW_Série 3": "BMW_Serie-3",
  "BMW_X5": "BMW_X5",
  "BMW_iX": "BMW_iX",
  "Mercedes_Classe A": "MERCEDES_Classe-A",
  "Mercedes_GLA": "MERCEDES_GLA",
  "Mercedes_Classe C": "MERCEDES_Classe-C",
  "Mercedes_GLC": "MERCEDES_GLC",
  "Mercedes_GLE": "MERCEDES_GLE",
  "Mercedes_EQB": "MERCEDES_EQB",
  "Audi_A3": "AUDI_A3",
  "Audi_Q5": "AUDI_Q5",
  "BYD_Seal U": "BYD_Seal-U",
  "BYD_ATTO 3": "BYD_ATTO-3",
  "BYD_Seal": "BYD_Seal",
  "BYD_Dolphin": "BYD_Dolphin",
  "MG_HS": "MG_HS",
  "MG_ZS EV": "MG_ZS-EV",
  "MG_MG4": "MG_MG4",
  "MG_MG5": "MG_MG5",
  "Ford_Kuga": "FORD_Kuga",
  "Ford_Fiesta": "FORD_Fiesta",
  "Ford_Ranger": "FORD_Ranger",
  "Ford_Puma": "FORD_Puma",
  "Ford_Mustang": "FORD_Mustang",
  "Nissan_Qashqai": "NISSAN_Qashqai",
  "Nissan_Juke": "NISSAN_Juke",
  "Nissan_Pathfinder": "NISSAN_Pathfinder",
  "Nissan_Navara": "NISSAN_Navara",
  "Nissan_X-Trail": "NISSAN_X-Trail",
  "Fiat_Tipo": "FIAT_Tipo",
  "Fiat_500": "FIAT_500",
  "Fiat_Doblo": "FIAT_Doblo",
  "Citroën_C3": "CITROEN_C3",
  "Citroën_C5 Aircross": "CITROEN_C5-Aircross",
  "Citroën_C4": "CITROEN_C4",
  "Citroën_Berlingo": "CITROEN_Berlingo",
  "Opel_Corsa": "OPEL_Corsa",
  "Opel_Grandland": "OPEL_Grandland",
  "Opel_Mokka": "OPEL_Mokka",
  "Jeep_Renegade": "JEEP_Renegade",
  "Jeep_Compass": "JEEP_Compass",
  "Jeep_Wrangler": "JEEP_Wrangler",
  "Škoda_Octavia": "SKODA_Octavia",
  "Škoda_Kamiq": "SKODA_Kamiq",
  "Seat_Leon": "SEAT_Leon",
  "Seat_Ibiza": "SEAT_Ibiza",
  "Seat_Arona": "SEAT_Arona",
  "Suzuki_Vitara": "SUZUKI_Vitara",
  "Suzuki_Swift": "SUZUKI_Swift",
  "Suzuki_Jimny": "SUZUKI_Jimny",
  "Volvo_XC40": "VOLVO_XC40",
  "Volvo_XC60": "VOLVO_XC60",
  "DFSK_E5": "DFSK_E5",
  "DFSK_Glory 580": "DFSK_Glory-580",
  "Mazda_CX-30": "MAZDA_CX-30",
  "Mazda_CX-5": "MAZDA_CX-5",
  "Mazda_3": "MAZDA_3",
  "Honda_HR-V": "HONDA_HR-V",
  "Honda_CR-V": "HONDA_CR-V",
  "Chery_Tiggo 4 Pro": "CHERY_Tiggo-4-Pro",
  "Chery_Tiggo 7 Pro": "CHERY_Tiggo-7-Pro",
  "Chery_Tiggo 8 Pro": "CHERY_Tiggo-8-Pro",
  "Omoda_C5": "OMODA_C5",
  "Jaecoo_J7": "JAECOO_J7",
  "Changan_CS35 Plus": "CHANGAN_CS35-Plus",
  "Changan_CS75 Plus": "CHANGAN_CS75-Plus",
  "Haval_Jolion": "HAVAL_Jolion",
  "Haval_H6": "HAVAL_H6",
  "Geely_Coolray": "GEELY_Coolray",
  "Geely_Monjaro": "GEELY_Monjaro",
  "GAC_GS3": "GAC_GS3",
  "GAC_GS8": "GAC_GS8",
};

function img(make: string, model: string, year: number): string {
  const key = `${make}_${model}`;
  const mapped = MODEL_MAP[key];
  if (!mapped) return "";
  return `${CDN}/${mapped}-${year}_main.jpg.webp`;
}

const MOROCCAN_CARS: Omit<UnifiedCar, "id" | "scrapedAt" | "score">[] = [
  // Dacia - Le leader marocain
  { title: "Dacia Sandero Access 2024", make: "Dacia", model: "Sandero", year: 2024, price: 149000, priceFormatted: "149 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Sandero Stepway 2023", make: "Dacia", model: "Sandero", year: 2023, price: 165000, priceFormatted: "165 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Crossover", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Sandero Stepway 2022", make: "Dacia", model: "Sandero", year: 2022, price: 144000, priceFormatted: "144 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Crossover", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Logan Essential 2024", make: "Dacia", model: "Logan", year: 2024, price: 169000, priceFormatted: "169 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Berline", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Logan Journey 2023", make: "Dacia", model: "Logan", year: 2023, price: 175000, priceFormatted: "175 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Berline", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Duster Essential 2024", make: "Dacia", model: "Duster", year: 2024, price: 219000, priceFormatted: "219 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Duster TCe 130 2023", make: "Dacia", model: "Duster", year: 2023, price: 235000, priceFormatted: "235 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Jogger Essential 2024", make: "Dacia", model: "Jogger", year: 2024, price: 195000, priceFormatted: "195 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Monospace", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Sandero Stepway 2021", make: "Dacia", model: "Sandero", year: 2021, price: 128000, priceFormatted: "128 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Crossover", city: "Fès", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Renault - Partenaire Dacia
  { title: "Renault Clio V Intens 2024", make: "Renault", model: "Clio", year: 2024, price: 215000, priceFormatted: "215 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Citadine", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Clio E-Tech 2024", make: "Renault", model: "Clio", year: 2024, price: 245000, priceFormatted: "245 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "Citadine", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Megane E-TECH 2024", make: "Renault", model: "Megane", year: 2024, price: 310000, priceFormatted: "310 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "Berline", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Austral 2024", make: "Renault", model: "Austral", year: 2024, price: 340000, priceFormatted: "340 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Kardian 2024", make: "Renault", model: "Kardian", year: 2024, price: 239000, priceFormatted: "239 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Crossover", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Duster 2023", make: "Renault", model: "Duster", year: 2023, price: 195000, priceFormatted: "195 000 DH", km: 0, fuel: "Diesel", transmission: "Manuelle", bodyType: "SUV", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Symbol Authentique 2022", make: "Renault", model: "Symbol", year: 2022, price: 125000, priceFormatted: "125 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Berline", city: "Agadir", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Peugeot
  { title: "Peugeot 208 Active Pack 2024", make: "Peugeot", model: "208", year: 2024, price: 205000, priceFormatted: "205 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Peugeot 2008 Allure 2024", make: "Peugeot", model: "2008", year: 2024, price: 265000, priceFormatted: "265 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Peugeot 3008 Allure 2024", make: "Peugeot", model: "3008", year: 2024, price: 375000, priceFormatted: "375 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Peugeot 308 GT 2023", make: "Peugeot", model: "308", year: 2023, price: 295000, priceFormatted: "295 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Compacte", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Peugeot 2008 Hybrid 2024", make: "Peugeot", model: "2008", year: 2024, price: 299000, priceFormatted: "299 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Toyota - Le roi de l'hybride
  { title: "Toyota Yaris Hybrid 2024", make: "Toyota", model: "Yaris", year: 2024, price: 215000, priceFormatted: "215 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "Citadine", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Toyota Yaris Cross Hybrid 2024", make: "Toyota", model: "Yaris Cross", year: 2024, price: 285000, priceFormatted: "285 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Toyota Corolla Hybrid 2024", make: "Toyota", model: "Corolla", year: 2024, price: 289000, priceFormatted: "289 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "Berline", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Toyota RAV4 Hybrid 2024", make: "Toyota", model: "RAV4", year: 2024, price: 389000, priceFormatted: "389 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Toyota C-HR Hybrid 2023", make: "Toyota", model: "C-HR", year: 2023, price: 295000, priceFormatted: "295 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Toyota Yaris Hybrid 2022", make: "Toyota", model: "Yaris", year: 2022, price: 180000, priceFormatted: "180 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "Citadine", city: "Fès", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Hyundai
  { title: "Hyundai Tucson 1.6 T-GDi 2024", make: "Hyundai", model: "Tucson", year: 2024, price: 359900, priceFormatted: "359 900 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Hyundai i20 Active 2024", make: "Hyundai", model: "i20", year: 2024, price: 189000, priceFormatted: "189 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Compacte", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Hyundai Kona Hybrid 2024", make: "Hyundai", model: "Kona", year: 2024, price: 275000, priceFormatted: "275 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Hyundai Bayon 2023", make: "Hyundai", model: "Bayon", year: 2023, price: 195000, priceFormatted: "195 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Crossover", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Hyundai Tucson 1.6 CRDi 2022", make: "Hyundai", model: "Tucson", year: 2022, price: 285000, priceFormatted: "285 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Kia
  { title: "Kia Sportage 1.6 CRDi 2024", make: "Kia", model: "Sportage", year: 2024, price: 345000, priceFormatted: "345 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Kia Niro Hybrid 2024", make: "Kia", model: "Niro", year: 2024, price: 309000, priceFormatted: "309 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Kia Picanto 2024", make: "Kia", model: "Picanto", year: 2024, price: 138000, priceFormatted: "138 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Kia Stonic 2023", make: "Kia", model: "Stonic", year: 2023, price: 215000, priceFormatted: "215 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Crossover", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Kia Sportage 1.6 CRDi 2022", make: "Kia", model: "Sportage", year: 2022, price: 265000, priceFormatted: "265 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Fès", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Volkswagen
  { title: "Volkswagen Golf 8 1.5 TSI 2024", make: "Volkswagen", model: "Golf", year: 2024, price: 340000, priceFormatted: "340 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Compacte", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Volkswagen T-Roc 2024", make: "Volkswagen", model: "T-Roc", year: 2024, price: 315000, priceFormatted: "315 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Crossover", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Volkswagen Tiguan 2024", make: "Volkswagen", model: "Tiguan", year: 2024, price: 395000, priceFormatted: "395 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Volkswagen Polo 2023", make: "Volkswagen", model: "Polo", year: 2023, price: 205000, priceFormatted: "205 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // BMW
  { title: "BMW Série 1 118i 2024", make: "BMW", model: "Série 1", year: 2024, price: 395000, priceFormatted: "395 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Compacte", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "BMW X1 sDrive 18d 2024", make: "BMW", model: "X1", year: 2024, price: 495000, priceFormatted: "495 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "BMW X3 xDrive 20d 2023", make: "BMW", model: "X3", year: 2023, price: 580000, priceFormatted: "580 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Mercedes
  { title: "Mercedes Classe A 180 2024", make: "Mercedes", model: "Classe A", year: 2024, price: 420000, priceFormatted: "420 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Compacte", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Mercedes GLA 200 2024", make: "Mercedes", model: "GLA", year: 2024, price: 475000, priceFormatted: "475 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // BYD - Le chinois émergent
  { title: "BYD Seal U PHEV 2024", make: "BYD", model: "Seal U", year: 2024, price: 359900, priceFormatted: "359 900 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "BYD ATTO 3 EVO 2024", make: "BYD", model: "ATTO 3", year: 2024, price: 355900, priceFormatted: "355 900 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // MG - excellent rapport qualité/prix
  { title: "MG HS Hybrid+ 2024", make: "MG", model: "HS", year: 2024, price: 269000, priceFormatted: "269 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "MG ZS EV 2024", make: "MG", model: "ZS EV", year: 2024, price: 299000, priceFormatted: "299 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Ford
  { title: "Ford Kuga 2.0 TDCi 2023", make: "Ford", model: "Kuga", year: 2023, price: 295000, priceFormatted: "295 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Ford Fiesta 2022", make: "Ford", model: "Fiesta", year: 2022, price: 165000, priceFormatted: "165 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Agadir", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Nissan
  { title: "Nissan Qashqai 1.3 DIG-T 2024", make: "Nissan", model: "Qashqai", year: 2024, price: 310000, priceFormatted: "310 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Nissan Juke 2023", make: "Nissan", model: "Juke", year: 2023, price: 235000, priceFormatted: "235 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Crossover", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Fiat
  { title: "Fiat Tipo 1.6 Multijet 2023", make: "Fiat", model: "Tipo", year: 2023, price: 195000, priceFormatted: "195 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Berline", city: "Fès", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Fiat 500 2024", make: "Fiat", model: "500", year: 2024, price: 185000, priceFormatted: "185 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Citroën
  { title: "Citroën C3 2024", make: "Citroën", model: "C3", year: 2024, price: 165000, priceFormatted: "165 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Citroën C5 Aircross 2023", make: "Citroën", model: "C5 Aircross", year: 2023, price: 310000, priceFormatted: "310 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Opel
  { title: "Opel Corsa 2024", make: "Opel", model: "Corsa", year: 2024, price: 175000, priceFormatted: "175 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Opel Grandland 2024", make: "Opel", model: "Grandland", year: 2024, price: 335000, priceFormatted: "335 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Jeep
  { title: "Jeep Renegade 2.0 CRDi 2023", make: "Jeep", model: "Renegade", year: 2023, price: 295000, priceFormatted: "295 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "El Jadida", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Skoda
  { title: "Škoda Octavia 2024", make: "Škoda", model: "Octavia", year: 2024, price: 285000, priceFormatted: "285 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Berline", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Seat
  { title: "SEAT Leon FR 2024", make: "Seat", model: "Leon", year: 2024, price: 280000, priceFormatted: "280 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Compacte", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "SEAT Ibiza 2023", make: "Seat", model: "Ibiza", year: 2023, price: 185000, priceFormatted: "185 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Suzuki
  { title: "Suzuki Vitara Hybrid 2024", make: "Suzuki", model: "Vitara", year: 2024, price: 235000, priceFormatted: "235 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Volvo
  { title: "Volvo XC40 B4 2024", make: "Volvo", model: "XC40", year: 2024, price: 420000, priceFormatted: "420 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // DFSK - Le chinois abordable
  { title: "DFSK E5 PHEV 2024", make: "DFSK", model: "E5", year: 2024, price: 255000, priceFormatted: "255 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Mazda
  { title: "Mazda CX-30 2.0 2024", make: "Mazda", model: "CX-30", year: 2024, price: 285000, priceFormatted: "285 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Dacia - Plus de variantes
  { title: "Dacia Sandero Essential 2023", make: "Dacia", model: "Sandero", year: 2023, price: 142000, priceFormatted: "142 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Sandero Comfort 2022", make: "Dacia", model: "Sandero", year: 2022, price: 135000, priceFormatted: "135 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Sandero 2021", make: "Dacia", model: "Sandero", year: 2021, price: 115000, priceFormatted: "115 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Sandero 2020", make: "Dacia", model: "Sandero", year: 2020, price: 98000, priceFormatted: "98 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Logan Essential 2023", make: "Dacia", model: "Logan", year: 2023, price: 159000, priceFormatted: "159 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Berline", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Logan 2022", make: "Dacia", model: "Logan", year: 2022, price: 138000, priceFormatted: "138 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Berline", city: "Fès", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Logan 2021", make: "Dacia", model: "Logan", year: 2021, price: 115000, priceFormatted: "115 000 DH", km: 0, fuel: "Diesel", transmission: "Manuelle", bodyType: "Berline", city: "Oujda", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Duster Essential 2023", make: "Dacia", model: "Duster", year: 2023, price: 205000, priceFormatted: "205 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Duster 2022", make: "Dacia", model: "Duster", year: 2022, price: 185000, priceFormatted: "185 000 DH", km: 0, fuel: "Diesel", transmission: "Manuelle", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Duster 2021", make: "Dacia", model: "Duster", year: 2021, price: 165000, priceFormatted: "165 000 DH", km: 0, fuel: "Diesel", transmission: "Manuelle", bodyType: "SUV", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Jogger Essential 2023", make: "Dacia", model: "Jogger", year: 2023, price: 185000, priceFormatted: "185 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Monospace", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Spring Electric 2024", make: "Dacia", model: "Spring", year: 2024, price: 149000, priceFormatted: "149 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "Citadine", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Dacia Spring 2023", make: "Dacia", model: "Spring", year: 2023, price: 125000, priceFormatted: "125 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "Citadine", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Renault - Plus de variantes
  { title: "Renault Clio Evolution 2023", make: "Renault", model: "Clio", year: 2023, price: 195000, priceFormatted: "195 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Clio IV 2021", make: "Renault", model: "Clio", year: 2021, price: 135000, priceFormatted: "135 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Captur Intens 2024", make: "Renault", model: "Captur", year: 2024, price: 255000, priceFormatted: "255 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Crossover", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Captur 2023", make: "Renault", model: "Captur", year: 2023, price: 225000, priceFormatted: "225 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Crossover", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Arkana E-Tech 2024", make: "Renault", model: "Arkana", year: 2024, price: 315000, priceFormatted: "315 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Megane IV 2022", make: "Renault", model: "Megane", year: 2022, price: 175000, priceFormatted: "175 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Berline", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Kadjar 2022", make: "Renault", model: "Kadjar", year: 2022, price: 245000, priceFormatted: "245 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Renault Twingo 2022", make: "Renault", model: "Twingo", year: 2022, price: 115000, priceFormatted: "115 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Peugeot - Plus de variantes
  { title: "Peugeot 208 Active 2023", make: "Peugeot", model: "208", year: 2023, price: 185000, priceFormatted: "185 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Peugeot 208 GT Line 2022", make: "Peugeot", model: "208", year: 2022, price: 175000, priceFormatted: "175 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Citadine", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Peugeot 2008 Active 2023", make: "Peugeot", model: "2008", year: 2023, price: 245000, priceFormatted: "245 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Peugeot 3008 GT 2023", make: "Peugeot", model: "3008", year: 2023, price: 355000, priceFormatted: "355 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Peugeot 5008 Allure 2024", make: "Peugeot", model: "5008", year: 2024, price: 425000, priceFormatted: "425 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Peugeot 508 GT 2023", make: "Peugeot", model: "508", year: 2023, price: 389000, priceFormatted: "389 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Berline", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Peugeot 301 Access 2022", make: "Peugeot", model: "301", year: 2022, price: 120000, priceFormatted: "120 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Berline", city: "Fès", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Peugeot Partner 2023", make: "Peugeot", model: "Partner", year: 2023, price: 185000, priceFormatted: "185 000 DH", km: 0, fuel: "Diesel", transmission: "Manuelle", bodyType: "Utilitaire", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Peugeot Landtrek 4x4 2024", make: "Peugeot", model: "Landtrek", year: 2024, price: 329000, priceFormatted: "329 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Pickup", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Toyota - Plus de variantes
  { title: "Toyota Yaris Essential 2023", make: "Toyota", model: "Yaris", year: 2023, price: 195000, priceFormatted: "195 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Toyota Yaris Cross 2023", make: "Toyota", model: "Yaris Cross", year: 2023, price: 265000, priceFormatted: "265 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Toyota Corolla Cross 2024", make: "Toyota", model: "Corolla Cross", year: 2024, price: 329000, priceFormatted: "329 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Toyota Hilux Double Cab 2024", make: "Toyota", model: "Hilux", year: 2024, price: 399000, priceFormatted: "399 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Pickup", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Toyota Hilux 2023", make: "Toyota", model: "Hilux", year: 2023, price: 359000, priceFormatted: "359 000 DH", km: 0, fuel: "Diesel", transmission: "Manuelle", bodyType: "Pickup", city: "Agadir", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Toyota Land Cruiser Prado 2024", make: "Toyota", model: "Land Cruiser Prado", year: 2024, price: 699000, priceFormatted: "699 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Toyota RAV4 2023", make: "Toyota", model: "RAV4", year: 2023, price: 359000, priceFormatted: "359 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Toyota Corolla 2023", make: "Toyota", model: "Corolla", year: 2023, price: 269000, priceFormatted: "269 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "Berline", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Hyundai - Plus de variantes
  { title: "Hyundai Tucson 2023", make: "Hyundai", model: "Tucson", year: 2023, price: 329000, priceFormatted: "329 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Hyundai Santa Fe 2024", make: "Hyundai", model: "Santa Fe", year: 2024, price: 459000, priceFormatted: "459 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Hyundai Elantra 2024", make: "Hyundai", model: "Elantra", year: 2024, price: 259000, priceFormatted: "259 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Berline", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Hyundai i20 2023", make: "Hyundai", model: "i20", year: 2023, price: 175000, priceFormatted: "175 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Compacte", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Hyundai i10 2023", make: "Hyundai", model: "i10", year: 2023, price: 135000, priceFormatted: "135 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Fès", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Hyundai Kona 2023", make: "Hyundai", model: "Kona", year: 2023, price: 255000, priceFormatted: "255 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Hyundai Bayon 2024", make: "Hyundai", model: "Bayon", year: 2024, price: 215000, priceFormatted: "215 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Crossover", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Kia - Plus de variantes
  { title: "Kia Sportage 2023", make: "Kia", model: "Sportage", year: 2023, price: 315000, priceFormatted: "315 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Kia Sorento 2024", make: "Kia", model: "Sorento", year: 2024, price: 459000, priceFormatted: "459 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Kia Carnival 2024", make: "Kia", model: "Carnival", year: 2024, price: 415000, priceFormatted: "415 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Monospace", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Kia Rio 2023", make: "Kia", model: "Rio", year: 2023, price: 165000, priceFormatted: "165 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Compacte", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Kia Stonic 2024", make: "Kia", model: "Stonic", year: 2024, price: 205000, priceFormatted: "205 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Crossover", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Kia Niro 2023", make: "Kia", model: "Niro", year: 2023, price: 289000, priceFormatted: "289 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Volkswagen
  { title: "Volkswagen T-Cross 2024", make: "Volkswagen", model: "T-Cross", year: 2024, price: 265000, priceFormatted: "265 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Crossover", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Volkswagen T-Roc 2023", make: "Volkswagen", model: "T-Roc", year: 2023, price: 295000, priceFormatted: "295 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Crossover", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Volkswagen Golf 8 2023", make: "Volkswagen", model: "Golf", year: 2023, price: 325000, priceFormatted: "325 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Compacte", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Volkswagen Polo 2022", make: "Volkswagen", model: "Polo", year: 2022, price: 195000, priceFormatted: "195 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Citadine", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Volkswagen Amarok 2024", make: "Volkswagen", model: "Amarok", year: 2024, price: 459000, priceFormatted: "459 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Pickup", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Volkswagen ID.4 2024", make: "Volkswagen", model: "ID.4", year: 2024, price: 485000, priceFormatted: "485 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // BMW
  { title: "BMW Série 3 320i 2024", make: "BMW", model: "Série 3", year: 2024, price: 495000, priceFormatted: "495 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Berline", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "BMW X1 2023", make: "BMW", model: "X1", year: 2023, price: 459000, priceFormatted: "459 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "BMW X5 xDrive 2024", make: "BMW", model: "X5", year: 2024, price: 989000, priceFormatted: "989 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "BMW iX xDrive50 2024", make: "BMW", model: "iX", year: 2024, price: 1e6, priceFormatted: "1 000 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Mercedes
  { title: "Mercedes Classe C 200 2024", make: "Mercedes", model: "Classe C", year: 2024, price: 559000, priceFormatted: "559 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Berline", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Mercedes GLC 300 2024", make: "Mercedes", model: "GLC", year: 2024, price: 699000, priceFormatted: "699 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Mercedes GLE 450 2024", make: "Mercedes", model: "GLE", year: 2024, price: 1e6, priceFormatted: "1 000 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Mercedes EQB 300 2024", make: "Mercedes", model: "EQB", year: 2024, price: 599000, priceFormatted: "599 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Audi
  { title: "Audi A3 Sportback 2024", make: "Audi", model: "A3", year: 2024, price: 395000, priceFormatted: "395 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Compacte", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Audi Q5 2024", make: "Audi", model: "Q5", year: 2024, price: 589000, priceFormatted: "589 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Ford - Plus de variantes
  { title: "Ford Puma 2024", make: "Ford", model: "Puma", year: 2024, price: 259000, priceFormatted: "259 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Crossover", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Ford Ranger Wildtrak 2024", make: "Ford", model: "Ranger", year: 2024, price: 459000, priceFormatted: "459 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Pickup", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Ford Ranger 2023", make: "Ford", model: "Ranger", year: 2023, price: 399000, priceFormatted: "399 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Pickup", city: "Agadir", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Ford Mustang GT 2024", make: "Ford", model: "Mustang", year: 2024, price: 699000, priceFormatted: "699 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Coupé", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Ford Fiesta 2021", make: "Ford", model: "Fiesta", year: 2021, price: 145000, priceFormatted: "145 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Fès", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Nissan - Plus de variantes
  { title: "Nissan Qashqai 2023", make: "Nissan", model: "Qashqai", year: 2023, price: 289000, priceFormatted: "289 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Nissan X-Trail 2024", make: "Nissan", model: "X-Trail", year: 2024, price: 389000, priceFormatted: "389 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Nissan Pathfinder 2024", make: "Nissan", model: "Pathfinder", year: 2024, price: 515000, priceFormatted: "515 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Nissan Navara 2024", make: "Nissan", model: "Navara", year: 2024, price: 389000, priceFormatted: "389 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Pickup", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Nissan Juke 2022", make: "Nissan", model: "Juke", year: 2022, price: 215000, priceFormatted: "215 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Crossover", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Citroën - Plus de variantes
  { title: "Citroën C4 2024", make: "Citroën", model: "C4", year: 2024, price: 225000, priceFormatted: "225 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Compacte", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Citroën Berlingo 2024", make: "Citroën", model: "Berlingo", year: 2024, price: 195000, priceFormatted: "195 000 DH", km: 0, fuel: "Diesel", transmission: "Manuelle", bodyType: "Utilitaire", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Citroën C3 2023", make: "Citroën", model: "C3", year: 2023, price: 155000, priceFormatted: "155 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Fiat
  { title: "Fiat 500X 2024", make: "Fiat", model: "500X", year: 2024, price: 235000, priceFormatted: "235 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Crossover", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Fiat Doblo 2023", make: "Fiat", model: "Doblo", year: 2023, price: 175000, priceFormatted: "175 000 DH", km: 0, fuel: "Diesel", transmission: "Manuelle", bodyType: "Utilitaire", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Fiat Tipo 2022", make: "Fiat", model: "Tipo", year: 2022, price: 165000, priceFormatted: "165 000 DH", km: 0, fuel: "Diesel", transmission: "Manuelle", bodyType: "Berline", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Opel
  { title: "Opel Mokka 2024", make: "Opel", model: "Mokka", year: 2024, price: 245000, priceFormatted: "245 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Crossover", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Opel Corsa 2023", make: "Opel", model: "Corsa", year: 2023, price: 165000, priceFormatted: "165 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Opel Grandland 2023", make: "Opel", model: "Grandland", year: 2023, price: 315000, priceFormatted: "315 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Jeep
  { title: "Jeep Compass 2024", make: "Jeep", model: "Compass", year: 2024, price: 389000, priceFormatted: "389 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Jeep Wrangler 2024", make: "Jeep", model: "Wrangler", year: 2024, price: 559000, priceFormatted: "559 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Jeep Renegade 2022", make: "Jeep", model: "Renegade", year: 2022, price: 275000, priceFormatted: "275 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Škoda
  { title: "Škoda Kamiq 2024", make: "Škoda", model: "Kamiq", year: 2024, price: 245000, priceFormatted: "245 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Crossover", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Škoda Octavia 2023", make: "Škoda", model: "Octavia", year: 2023, price: 275000, priceFormatted: "275 000 DH", km: 0, fuel: "Diesel", transmission: "Automatique", bodyType: "Berline", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Seat
  { title: "SEAT Arona 2024", make: "Seat", model: "Arona", year: 2024, price: 225000, priceFormatted: "225 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Crossover", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "SEAT Leon 2023", make: "Seat", model: "Leon", year: 2023, price: 265000, priceFormatted: "265 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Compacte", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "SEAT Ibiza 2022", make: "Seat", model: "Ibiza", year: 2022, price: 175000, priceFormatted: "175 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Tanger", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Suzuki
  { title: "Suzuki Swift 2024", make: "Suzuki", model: "Swift", year: 2024, price: 189000, priceFormatted: "189 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "Citadine", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Suzuki Jimny 2024", make: "Suzuki", model: "Jimny", year: 2024, price: 225000, priceFormatted: "225 000 DH", km: 0, fuel: "Essence", transmission: "Manuelle", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Suzuki Vitara 2023", make: "Suzuki", model: "Vitara", year: 2023, price: 225000, priceFormatted: "225 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Honda
  { title: "Honda HR-V 2024", make: "Honda", model: "HR-V", year: 2024, price: 289000, priceFormatted: "289 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "Crossover", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Honda CR-V 2024", make: "Honda", model: "CR-V", year: 2024, price: 459000, priceFormatted: "459 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Mazda
  { title: "Mazda3 2024", make: "Mazda", model: "3", year: 2024, price: 295000, priceFormatted: "295 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Compacte", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Mazda CX-5 2024", make: "Mazda", model: "CX-5", year: 2024, price: 359000, priceFormatted: "359 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Mazda CX-30 2023", make: "Mazda", model: "CX-30", year: 2023, price: 275000, priceFormatted: "275 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Volvo
  { title: "Volvo XC40 2023", make: "Volvo", model: "XC40", year: 2023, price: 395000, priceFormatted: "395 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Volvo XC60 2024", make: "Volvo", model: "XC60", year: 2024, price: 559000, priceFormatted: "559 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // BYD - Chinois premium
  { title: "BYD Seal 2024", make: "BYD", model: "Seal", year: 2024, price: 399000, priceFormatted: "399 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "Berline", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "BYD Dolphin 2024", make: "BYD", model: "Dolphin", year: 2024, price: 259000, priceFormatted: "259 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "Citadine", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "BYD Han 2024", make: "BYD", model: "Han", year: 2024, price: 599000, priceFormatted: "599 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "Berline", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // MG
  { title: "MG4 Electric 2024", make: "MG", model: "MG4", year: 2024, price: 269000, priceFormatted: "269 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "Compacte", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "MG5 Electric 2024", make: "MG", model: "MG5", year: 2024, price: 289000, priceFormatted: "289 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "Berline", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "MG ZS 1.5 2024", make: "MG", model: "ZS EV", year: 2024, price: 239000, priceFormatted: "239 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Chery
  { title: "Chery Tiggo 4 Pro 2024", make: "Chery", model: "Tiggo 4 Pro", year: 2024, price: 199000, priceFormatted: "199 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Chery Tiggo 7 Pro 2024", make: "Chery", model: "Tiggo 7 Pro", year: 2024, price: 289000, priceFormatted: "289 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Chery Tiggo 8 Pro 2024", make: "Chery", model: "Tiggo 8 Pro", year: 2024, price: 359000, priceFormatted: "359 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Omoda & Jaecoo
  { title: "Omoda C5 2024", make: "Omoda", model: "C5", year: 2024, price: 229000, priceFormatted: "229 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Omoda C5 EV 2024", make: "Omoda", model: "C5", year: 2024, price: 299000, priceFormatted: "299 000 DH", km: 0, fuel: "Électrique", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Jaecoo J7 2024", make: "Jaecoo", model: "J7", year: 2024, price: 329000, priceFormatted: "329 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Changan
  { title: "Changan CS35 Plus 2024", make: "Changan", model: "CS35 Plus", year: 2024, price: 199000, priceFormatted: "199 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Changan CS75 Plus 2024", make: "Changan", model: "CS75 Plus", year: 2024, price: 299000, priceFormatted: "299 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Changan Alsvin 2024", make: "Changan", model: "Alsvin", year: 2024, price: 159000, priceFormatted: "159 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "Berline", city: "Marrakech", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Haval
  { title: "Haval Jolion 2024", make: "Haval", model: "Jolion", year: 2024, price: 249000, priceFormatted: "249 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Haval H6 2024", make: "Haval", model: "H6", year: 2024, price: 299000, priceFormatted: "299 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Haval Jolion HEV 2024", make: "Haval", model: "Jolion", year: 2024, price: 289000, priceFormatted: "289 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // Geely
  { title: "Geely Coolray 2024", make: "Geely", model: "Coolray", year: 2024, price: 249000, priceFormatted: "249 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "Geely Monjaro 2024", make: "Geely", model: "Monjaro", year: 2024, price: 399000, priceFormatted: "399 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // GAC
  { title: "GAC GS3 2024", make: "GAC", model: "GS3", year: 2024, price: 219000, priceFormatted: "219 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "GAC GS8 2024", make: "GAC", model: "GS8", year: 2024, price: 459000, priceFormatted: "459 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

  // DFSK
  { title: "DFSK Glory 580 2024", make: "DFSK", model: "Glory 580", year: 2024, price: 225000, priceFormatted: "225 000 DH", km: 0, fuel: "Essence", transmission: "Automatique", bodyType: "SUV", city: "Casablanca", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },
  { title: "DFSK E5 PHEV 2023", make: "DFSK", model: "E5", year: 2023, price: 235000, priceFormatted: "235 000 DH", km: 0, fuel: "Hybride", transmission: "Automatique", bodyType: "SUV", city: "Rabat", image: "", source: "Données Maroc", sourceUrl: "#", url: "#", photos: [] },

];

export function getFallbackCars(): UnifiedCar[] {
  return MOROCCAN_CARS.map((car) => ({
    ...car,
    image: car.image || img(car.make, car.model, car.year),
    id: generateId("fallback", car.make, car.model, car.year, car.km, car.price),
    score: computeScore(car.year, car.km, car.price),
    scrapedAt: new Date().toISOString(),
  }));
}
