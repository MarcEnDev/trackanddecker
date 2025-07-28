
"use client";

import { useState, useEffect } from 'react';
import type { User, Deck } from '@/types';
import DeckList from './deck-list';
import { Button } from './ui/button';
import { Save, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from './ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDecks } from '@/hooks/use-decks';
import Combobox from './combobox';

interface UserProfileProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User, newDeckAdded?: Deck) => void;
  onRemoveUser: (userId: string) => void;
  isEditable: boolean;
}

export default function UserProfile({ user, onClose, onUpdateUser, onRemoveUser, isEditable }: UserProfileProps) {
  const [preferredDeck, setPreferredDeck] = useState<Deck | null>(user.preferredDeck);
  const { decks, loading } = useDecks();

  useEffect(() => {
    setPreferredDeck(user.preferredDeck);
  }, [user.preferredDeck]);

  const handleUpdate = (updates: Partial<User>, newDeckAdded?: Deck) => {
    onUpdateUser({ ...user, ...updates }, newDeckAdded);
  };
  
  const handlePreferredDeckSave = (deckId: string) => {
    const deck = decks.find(d => d.id === deckId) || null;
    setPreferredDeck(deck);
    handleUpdate({ preferredDeck: deck });
  };
  
  const handleRemove = () => {
    onRemoveUser(user.id);
    onClose();
  }

  const handleAddDeck = (list: 'decksIHave' | 'decksIWant', deck: Deck) => {
    const newList = [...user[list], deck];
    if (list === 'decksIWant') {
        handleUpdate({ [list]: newList }, deck);
    } else {
        handleUpdate({ [list]: newList });
    }
  }

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-[425px] md:sm:max-w-[550px] bg-card">
            <DialogHeader>
                <DialogTitle className="text-2xl font-headline flex justify-between items-center">
                    {user.name}'s Profile
                    {isEditable && (
                        <Badge variant="outline" className="text-sm border-accent text-accent">Editable</Badge>
                    )}
                </DialogTitle>
                <DialogDescription>
                    <Badge variant="secondary" className="mt-1 bg-accent/20 text-accent-foreground hover:bg-accent/30">
                        Score: {user.score}
                    </Badge>
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto px-1">
                 <div>
                    <h4 className="font-semibold text-muted-foreground mb-2">Preferred Deck</h4>
                    {isEditable ? (
                        <Combobox
                          items={decks.map(d => ({ value: d.id, label: d.name }))}
                          onSelect={handlePreferredDeckSave}
                          placeholder="Select preferred deck..."
                          searchPlaceholder="Search decks..."
                          selectedValue={preferredDeck?.id}
                          loading={loading}
                        />
                    ) : (
                        <p className="text-sm italic min-h-[36px] flex items-center">{user.preferredDeck?.name || 'Not set'}</p>
                    )}
                </div>

                <DeckList
                    title="Decks I Have"
                    decks={user.decksIHave}
                    allDecks={decks}
                    onAddDeck={(deck) => handleAddDeck('decksIHave', deck)}
                    onRemoveDeck={(deckId) => handleUpdate({ decksIHave: user.decksIHave.filter((d) => d.id !== deckId) })}
                    isEditable={isEditable}
                />

                <DeckList
                    title="Decks I Want"
                    decks={user.decksIWant}
                    allDecks={decks}
                    onAddDeck={(deck) => handleAddDeck('decksIWant', deck)}
                    onRemoveDeck={(deckId) => handleUpdate({ decksIWant: user.decksIWant.filter((d) => d.id !== deckId) })}
                    isEditable={isEditable}
                />
            </div>
            
            <DialogFooter className="flex justify-between w-full">
                {isEditable && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash className="mr-2 h-4 w-4" /> Remove User
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete {user.name} from the group.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRemove}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}

    