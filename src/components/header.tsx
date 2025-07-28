import Link from 'next/link';
import { Swords } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Swords className="h-7 w-7 text-accent" />
            DeckMatch
          </Link>
          {/* Future navigation items can go here */}
        </div>
      </div>
    </header>
  );
}
