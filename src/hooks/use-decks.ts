
"use client";

import { useState, useEffect } from 'react';
import type { Deck } from '@/types';

// IMPORTANT: This should match the repoName in next.config.ts
const repoName = 'deckmatch';
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const basePath = isGithubActions ? `/${repoName}` : '';

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDecks() {
      try {
        setLoading(true);
        // Prepend the base path to the fetch request
        const response = await fetch(`${basePath}/decks.json`);
        const data: Deck[] = await response.json();
        setDecks(data);
      } catch (error) {
        console.error("Failed to fetch or parse decks.json", error);
        setDecks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchDecks();
  }, []);

  return { decks, loading };
}
