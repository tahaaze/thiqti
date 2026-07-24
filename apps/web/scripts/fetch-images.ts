import { writeFileSync } from "fs";
import { join } from "path";

const API_KEY = "AIzaSyAdlPEXkhqIHhQBxvqYu5_pHxMa6hPjcjY";
const CX = "e0af8e4e17f5a4e65";

interface CarEntry {
  make: string;
  model: string;
  year: number;
}

const CARS: CarEntry[] = [
  { make: "Dacia", model: "Sandero", year: 2024 },
  { make: "Dacia", model: "Sandero Stepway", year: 2023 },
  { make: "Dacia", model: "Logan", year: 2024 },
  { make: "Dacia", model: "Duster", year: 2024 },
  { make: "Dacia", model: "Duster", year: 2023 },
  { make: "Dacia", model: "Jogger", year: 2024 },
  { make: "Renault", model: "Clio", year: 2024 },
  { make: "Renault", model: "Clio E-Tech", year: 2024 },
  { make: "Renault", model: "Megane E-TECH", year: 2024 },
  { make: "Renault", model: "Austral", year: 2024 },
  { make: "Renault", model: "Kardian", year: 2024 },
  { make: "Renault", model: "Duster", year: 2023 },
  { make: "Renault", model: "Symbol", year: 2022 },
  { make: "Peugeot", model: "208", year: 2024 },
  { make: "Peugeot", model: "2008", year: 2024 },
  { make: "Peugeot", model: "3008", year: 2024 },
  { make: "Peugeot", model: "308 GT", year: 2023 },
  { make: "Toyota", model: "Yaris Hybrid", year: 2024 },
  { make: "Toyota", model: "Yaris Cross", year: 2024 },
  { make: "Toyota", model: "Corolla Hybrid", year: 2024 },
  { make: "Toyota", model: "RAV4 Hybrid", year: 2024 },
  { make: "Toyota", model: "C-HR", year: 2023 },
  { make: "Hyundai", model: "Tucson", year: 2024 },
  { make: "Hyundai", model: "i20", year: 2024 },
  { make: "Hyundai", model: "Kona Hybrid", year: 2024 },
  { make: "Hyundai", model: "Bayon", year: 2023 },
  { make: "Kia", model: "Sportage", year: 2024 },
  { make: "Kia", model: "Niro Hybrid", year: 2024 },
  { make: "Kia", model: "Picanto", year: 2024 },
  { make: "Kia", model: "Stonic", year: 2023 },
  { make: "Volkswagen", model: "Golf", year: 2024 },
  { make: "Volkswagen", model: "T-Roc", year: 2024 },
  { make: "Volkswagen", model: "Tiguan", year: 2024 },
  { make: "Volkswagen", model: "Polo", year: 2023 },
  { make: "BMW", model: "Serie 1", year: 2024 },
  { make: "BMW", model: "X1", year: 2024 },
  { make: "BMW", model: "X3", year: 2023 },
  { make: "Mercedes", model: "Classe A", year: 2024 },
  { make: "Mercedes", model: "GLA", year: 2024 },
  { make: "BYD", model: "Seal U", year: 2024 },
  { make: "BYD", model: "ATTO 3", year: 2024 },
  { make: "MG", model: "HS", year: 2024 },
  { make: "MG", model: "ZS EV", year: 2024 },
  { make: "Ford", model: "Kuga", year: 2023 },
  { make: "Ford", model: "Fiesta", year: 2022 },
  { make: "Nissan", model: "Qashqai", year: 2024 },
  { make: "Nissan", model: "Juke", year: 2023 },
  { make: "Fiat", model: "Tipo", year: 2023 },
  { make: "Fiat", model: "500", year: 2024 },
  { make: "Citroen", model: "C3", year: 2024 },
  { make: "Citroen", model: "C5 Aircross", year: 2023 },
  { make: "Opel", model: "Corsa", year: 2024 },
  { make: "Opel", model: "Grandland", year: 2024 },
  { make: "Jeep", model: "Renegade", year: 2023 },
  { make: "Skoda", model: "Octavia", year: 2024 },
  { make: "Seat", model: "Leon", year: 2024 },
  { make: "Seat", model: "Ibiza", year: 2023 },
  { make: "Suzuki", model: "Vitara", year: 2024 },
  { make: "Volvo", model: "XC40", year: 2024 },
  { make: "DFSK", model: "E5", year: 2024 },
  { make: "Mazda", model: "CX-30", year: 2024 },
  { make: "Renault", model: "Clio", year: 2019 },
  { make: "Peugeot", model: "206", year: 2018 },
  { make: "Dacia", model: "Logan MCV", year: 2020 },
  { make: "Hyundai", model: "i10", year: 2021 },
  { make: "Kia", model: "Picanto", year: 2020 },
];

async function searchImage(query: string): Promise<string> {
  const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&searchType=image&imgSize=large&num=1&fields=items(link)`;
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    return data.items?.[0]?.link || "";
  } catch {
    return "";
  }
}

async function main() {
  const imageMap: Record<string, string> = {};
  const total = CARS.length;

  for (let i = 0; i < total; i++) {
    const car = CARS[i];
    const query = `${car.year} ${car.make} ${car.model}`;
    const key = `${car.make.toLowerCase()}_${car.model.toLowerCase()}_${car.year}`;

    if (imageMap[key]) continue;

    process.stdout.write(`[${i + 1}/${total}] ${query}...`);
    const imageUrl = await searchImage(query);
    if (imageUrl) {
      imageMap[key] = imageUrl;
      console.log(` OK`);
    } else {
      console.log(` FAILED`);
    }

    if (i < total - 1) await new Promise((r) => setTimeout(r, 200));
  }

  const outPath = join(__dirname, "image-cache.json");
  writeFileSync(outPath, JSON.stringify(imageMap, null, 2));
  console.log(`\nSaved ${Object.keys(imageMap).length} images to ${outPath}`);
}

main();
