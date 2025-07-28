
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';
import type { Deck } from '@/types';
import Combobox from './combobox';

interface DeckListProps {
  title: string;
  decks: Deck[];
  allDecks: Deck[];
  onAddDeck: (deck: Deck) => void;
  onRemoveDeck: (deckId: string) => void;
  isEditable: boolean;
}

export default function DeckList({ title, decks, allDecks, onAddDeck, onRemoveDeck, isEditable }: DeckListProps) {
  
  const handleAddDeck = (deckId: string) => {
    const deck = allDecks.find(d => d.id === deckId);
    if(deck && !decks.some(d => d.id === deck.id)) {
        onAddDeck(deck);
    }
  }

  const generateScryfallLink = (deckName: string) => {
    return `https://scryfall.com/search?q=!%22${encodeURIComponent(deckName)}%22`;
  };
  
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-muted-foreground">{title}</h4>
      <div className="space-y-2">
        {decks.length > 0 ? (
          decks.map((deck) => (
            <div key={deck.id} className="flex items-center justify-between bg-background/50 p-2 rounded-md">
                <a href={generateScryfallLink(deck.name)} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-accent transition-colors flex items-center gap-2 group">
                  {deck.name}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              {isEditable && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveDeck(deck.id)}>
                    <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground/70 italic px-2">No decks yet.</p>
        )}
      </div>
      {isEditable && (
        <Combobox
            items={allDecks.map(deck => ({value: deck.id, label: deck.name}))}
            onSelect={handleAddDeck}
            placeholder='Add a deck...'
            searchPlaceholder='Search for a deck...'
        />
      )}
    </div>
  );
}

    