import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

interface ChatMsg {
  role: "user" | "bot";
  text: string;
}

interface ChatRequest {
  message: string;
  history: ChatMsg[];
}

interface GeminiResponse {
  reply: string;
  criteria: {
    carrosserie: string | null;
    motorisation: string | null;
    transmission: string | null;
    marque: string | null;
    modele: string | null;
    budgetMin: number | null;
    budgetMax: number | null;
    ville: string | null;
    anneeMin: number | null;
    anneeMax: number | null;
    kmMax: number | null;
    inventoryType: "new" | "used" | null;
  };
  search: boolean;
  quickReplies: string[];
}

const SYSTEM_PROMPT = `Tu es Thiqti, assistant automobile pour le Maroc. Français + darija (arabizi).

Règles :
1. Extrais les critères auto de l'utilisateur et retourne-les en JSON.
2. Sans critères = demande budget/type/carburant/marque/ville.
3. Budget en DH. "moins de X"=budgetMax, "entre X et Y"=min/max.
4. Types: SUV, Berline, Citadine, Compacte, Crossover, Utilitaire.
5. Carburant: Diesel, Essence, Hybride, Electrique.
6. Transmission: Automatique, Manuelle.
7. "neuf"=new, "occasion"=used.
8. Si "c'est bon/parfait/merci" = fin.
9. "voir plus" = search=true, mêmes critères.

Darija: mazot=diesel, kaz=essence, hjin=hybride, kahraba=electrique, rab3=SUV, karosa=berline, madina=citadine, matik=automatique, manyal=manuelle, bghit=je veux, nchri=acheter, tomobil=voiture, chi=un/une, khasni=j'ai besoin, rkhiss=pas cher, ghalya=cher, jmi3a=familiale.

Réponds TOUJOURS en JSON :
{"reply":"texte","criteria":{"carrosserie":null,"motorisation":null,"transmission":null,"marque":null,"modele":null,"budgetMin":null,"budgetMax":null,"ville":null,"anneeMin":null,"anneeMax":null,"kmMax":null,"inventoryType":null},"search":false,"quickReplies":["opt1","opt2"]}

search=true si au moins 1 critère + volonté de chercher. quickReplies=2-4 suggestions. Critères non mentionnés=null. Pas de texte avant/après le JSON.`;

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, history } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chatHistory = history.map((m) => ({
      role: m.role === "bot" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "Bonjour" }] },
        { role: "model", parts: [{ text: JSON.stringify({ reply: "Salut 👋 Je suis Thiqti, votre conseiller auto pour le Maroc. Décrivez votre envie en quelques mots : budget, type, carburant, marque, ville...", criteria: { carrosserie: null, motorisation: null, transmission: null, marque: null, modele: null, budgetMin: null, budgetMax: null, ville: null, anneeMin: null, anneeMax: null, kmMax: null, inventoryType: null }, search: false, quickReplies: ["SUV", "Moins de 150 000 DH", "Toyota", "Diesel"] }) }],
      },
      ...chatHistory,
    ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
      systemInstruction: {
        role: "system",
        parts: [{ text: SYSTEM_PROMPT }],
      },
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const text = response.text().trim();

    let parsed: GeminiResponse;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed = {
        reply: text || "Je n'ai pas bien compris. Pouvez-vous reformuler ?",
        criteria: {
          carrosserie: null, motorisation: null, transmission: null,
          marque: null, modele: null, budgetMin: null, budgetMax: null,
          ville: null, anneeMin: null, anneeMax: null, kmMax: null, inventoryType: null,
        },
        search: false,
        quickReplies: ["SUV", "Moins de 150 000 DH", "Toyota", "Diesel"],
      };
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[Chat API]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
