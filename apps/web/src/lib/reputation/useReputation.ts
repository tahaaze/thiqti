"use client";

import { useState, useEffect, useCallback } from "react";
import type { LLMReputationResult } from "./types";

interface UseReputationResult {
  reputation: LLMReputationResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useReputation(make: string, model: string): UseReputationResult {
  const [reputation, setReputation] = useState<LLMReputationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReputation = useCallback(async () => {
    if (!make || !model) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reputation/scrape?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`);
      if (!res.ok) throw new Error("Erreur lors du chargement de la réputation");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReputation(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [make, model]);

  useEffect(() => {
    fetchReputation();
  }, [fetchReputation]);

  return { reputation, loading, error, refresh: fetchReputation };
}
