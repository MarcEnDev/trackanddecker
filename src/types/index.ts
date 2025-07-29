

export interface Deck {
    id: string;
    name: string;
}

export interface User {
  id: string;
  name:string;
  preferredDeck: Deck | null;
  decksIWant: Deck[];
  decksIHave: Deck[];
  score: number;
}

export type GroupType = 'league' | 'eliminatory';

export interface Match {
  id: string;
  round: number;
  match: number;
  participants: (User | null)[];
  winner: User | null;
  isBye: boolean;
}

export interface Group {
  id: string;
  name: string;
  type: GroupType;
  members: User[];
  isFinished?: boolean;
  bracket?: Match[] | null;
}

export interface MatchAlertData {
  user1: string;
  user2: string;
  sharedDecks: string[];
}

    