"use client";

import { Heart, Star, MapPin, Fuel, ExternalLink } from "lucide-react";

export default function FavoritesPage() {
  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-400 fill-red-400" />
            Mes favoris
          </h1>
          <p className="mt-2 text-gray-400">Ajoutez des véhicules en favoris depuis les résultats de recherche</p>
        </div>

        <div className="glass-card p-12 text-center">
          <Heart className="mx-auto mb-4 h-12 w-12 text-gray-600" />
          <p className="text-gray-400">Aucun favori pour le moment</p>
          <p className="mt-2 text-sm text-gray-500">Cliquez sur le coeur dans les résultats pour sauvegarder</p>
          <a href="/results" className="btn-primary mt-6 inline-flex items-center gap-2">
            Explorer les annonces
          </a>
        </div>
      </div>
    </div>
  );
}
