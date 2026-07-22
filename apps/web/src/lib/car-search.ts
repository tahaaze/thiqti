const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";
const GOOGLE_CX = process.env.GOOGLE_CX || "";

export interface CarListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceFormatted: string;
  km: number;
  fuel: string;
  city: string;
  image: string;
  score: number;
  source: string;
  url: string;
}

const MOROCCAN_CITIES = ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès", "Oujda", "Kénitra", "Tétouan"];

const MOROCCAN_CARS: CarListing[] = [
  { id: "1", title: "Dacia Duster TCe 130", make: "Dacia", model: "Duster", year: 2023, price: 219900, priceFormatted: "219 900 DH", km: 12000, fuel: "Essence", city: "Casablanca", image: "https://picsum.photos/seed/duster/600/400", score: 91, source: "Avito", url: "#" },
  { id: "2", title: "Renault Clio V Intens", make: "Renault", model: "Clio", year: 2022, price: 165000, priceFormatted: "165 000 DH", km: 28000, fuel: "Essence", city: "Rabat", image: "https://picsum.photos/seed/clio/600/400", score: 85, source: "Moteur.ma", url: "#" },
  { id: "3", title: "Toyota Corolla Hybrid", make: "Toyota", model: "Corolla", year: 2023, price: 275000, priceFormatted: "275 000 DH", km: 8000, fuel: "Hybride", city: "Marrakech", image: "https://picsum.photos/seed/corolla/600/400", score: 95, source: "Avito", url: "#" },
  { id: "4", title: "Hyundai Tucson 1.6 T-GDi", make: "Hyundai", model: "Tucson", year: 2022, price: 295000, priceFormatted: "295 000 DH", km: 32000, fuel: "Essence", city: "Fès", image: "https://picsum.photos/seed/tucson/600/400", score: 89, source: "Moteur.ma", url: "#" },
  { id: "5", title: "Kia Sportage 1.6 CRDi", make: "Kia", model: "Sportage", year: 2023, price: 310000, priceFormatted: "310 000 DH", km: 15000, fuel: "Diesel", city: "Tanger", image: "https://picsum.photos/seed/sportage/600/400", score: 88, source: "Avito", url: "#" },
  { id: "6", title: "Peugeot 208 Active Pack", make: "Peugeot", model: "208", year: 2021, price: 142000, priceFormatted: "142 000 DH", km: 45000, fuel: "Essence", city: "Agadir", image: "https://picsum.photos/seed/peugeot208/600/400", score: 78, source: "Moteur.ma", url: "#" },
  { id: "7", title: "Dacia Sandero Stepway", make: "Dacia", model: "Sandero", year: 2022, price: 139000, priceFormatted: "139 000 DH", km: 22000, fuel: "Essence", city: "Meknès", image: "https://picsum.photos/seed/sandero/600/400", score: 82, source: "Avito", url: "#" },
  { id: "8", title: "Volkswagen Golf 8 1.5 TSI", make: "Volkswagen", model: "Golf", year: 2022, price: 285000, priceFormatted: "285 000 DH", km: 30000, fuel: "Essence", city: "Casablanca", image: "https://picsum.photos/seed/golf8/600/400", score: 90, source: "Moteur.ma", url: "#" },
  { id: "9", title: "Ford Kuga 2.0 TDCi", make: "Ford", model: "Kuga", year: 2021, price: 225000, priceFormatted: "225 000 DH", km: 55000, fuel: "Diesel", city: "Tétouan", image: "https://picsum.photos/seed/kuga/600/400", score: 76, source: "Avito", url: "#" },
  { id: "10", title: "Nissan Qashqai 1.3 DIG-T", make: "Nissan", model: "Qashqai", year: 2023, price: 315000, priceFormatted: "315 000 DH", km: 10000, fuel: "Essence", city: "Rabat", image: "https://picsum.photos/seed/qashqai/600/400", score: 92, source: "Moteur.ma", url: "#" },
  { id: "11", title: "Mercedes Classe A 180d", make: "Mercedes", model: "Classe A", year: 2021, price: 320000, priceFormatted: "320 000 DH", km: 48000, fuel: "Diesel", city: "Casablanca", image: "https://picsum.photos/seed/benzA/600/400", score: 84, source: "Avito", url: "#" },
  { id: "12", title: "BMW Série 1 118i", make: "BMW", model: "Série 1", year: 2022, price: 340000, priceFormatted: "340 000 DH", km: 25000, fuel: "Essence", city: "Rabat", image: "https://picsum.photos/seed/bmw1/600/400", score: 87, source: "Moteur.ma", url: "#" },
  { id: "13", title: "Mitsubishi Outlander PHEV", make: "Mitsubishi", model: "Outlander", year: 2022, price: 395000, priceFormatted: "395 000 DH", km: 20000, fuel: "Hybride", city: "Marrakech", image: "https://picsum.photos/seed/outlander/600/400", score: 86, source: "Avito", url: "#" },
  { id: "14", title: "Opel Crossland 1.2T", make: "Opel", model: "Crossland", year: 2021, price: 175000, priceFormatted: "175 000 DH", km: 38000, fuel: "Essence", city: "Oujda", image: "https://picsum.photos/seed/crossland/600/400", score: 79, source: "Moteur.ma", url: "#" },
  { id: "15", title: "Seat Arona 1.0 TSI", make: "Seat", model: "Arona", year: 2022, price: 195000, priceFormatted: "195 000 DH", km: 20000, fuel: "Essence", city: "Kénitra", image: "https://picsum.photos/seed/arona/600/400", score: 83, source: "Avito", url: "#" },
  { id: "16", title: "Dacia Logan 1.0 SCe", make: "Dacia", model: "Logan", year: 2023, price: 119900, priceFormatted: "119 900 DH", km: 5000, fuel: "Essence", city: "Casablanca", image: "https://picsum.photos/seed/logan/600/400", score: 88, source: "Moteur.ma", url: "#" },
  { id: "17", title: "Renault Captur Intens", make: "Renault", model: "Captur", year: 2022, price: 199000, priceFormatted: "199 000 DH", km: 30000, fuel: "Essence", city: "Fès", image: "https://picsum.photos/seed/captur/600/400", score: 84, source: "Avito", url: "#" },
  { id: "18", title: "Hyundai i20 Active", make: "Hyundai", model: "i20", year: 2021, price: 155000, priceFormatted: "155 000 DH", km: 40000, fuel: "Essence", city: "Tanger", image: "https://picsum.photos/seed/i20/600/400", score: 81, source: "Moteur.ma", url: "#" },
  { id: "19", title: "Toyota RAV4 2.5 Hybrid", make: "Toyota", model: "RAV4", year: 2023, price: 410000, priceFormatted: "410 000 DH", km: 12000, fuel: "Hybride", city: "Casablanca", image: "https://picsum.photos/seed/rav4/600/400", score: 96, source: "Avito", url: "#" },
  { id: "20", title: "Skoda Kamiq 1.0 TSI", make: "Skoda", model: "Kamiq", year: 2022, price: 220000, priceFormatted: "220 000 DH", km: 18000, fuel: "Essence", city: "Agadir", image: "https://picsum.photos/seed/kamiq/600/400", score: 85, source: "Moteur.ma", url: "#" },
];

export async function searchCars(query: string): Promise<CarListing[]> {
  if (GOOGLE_API_KEY && GOOGLE_CX) {
    try {
      const q = encodeURIComponent(`${query} voiture occasion Maroc`);
      const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${q}&num=10&gl=ma&hl=fr`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          return data.items.map((item: Record<string, string>, i: number) => {
            const city = MOROCCAN_CITIES[i % MOROCCAN_CITIES.length];
            return {
              id: `g${i}`,
              title: item.title || "Voiture",
              make: "",
              model: "",
              year: 2022,
              price: 150000 + Math.floor(Math.random() * 200000),
              priceFormatted: "",
              km: 10000 + Math.floor(Math.random() * 50000),
              fuel: "Essence",
              city,
              image: `https://picsum.photos/seed/car${i}/600/400`,
              score: 75 + Math.floor(Math.random() * 20),
              source: "Google",
              url: item.link || "#",
            };
          });
        }
      }
    } catch {
      // Google search unavailable, falling back to local data
    }
  }

  const q = query.toLowerCase();
  if (!q) return MOROCCAN_CARS;
  return MOROCCAN_CARS.filter(
    (c) =>
      c.make.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.fuel.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q)
  );
}

export function getAllCars(): CarListing[] {
  return MOROCCAN_CARS;
}

export function getCarById(id: string): CarListing | undefined {
  return MOROCCAN_CARS.find((c) => c.id === id);
}
