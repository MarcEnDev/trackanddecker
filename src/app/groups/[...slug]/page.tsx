"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { Group, User, Match, Deck } from '@/types';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User as UserIcon, Trophy } from 'lucide-react';
import UserProfile from '@/components/user-profile';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LeagueGroup, EliminatoryGroup } from '@/components/Groups';

const addUserSchema = z.object({
  name: z.string().min(1, { message: 'User name cannot be empty.' }),
});


export default function GroupPage() {
  const [group, setGroup] = useState<Group | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [selectedUserForSession, setSelectedUserForSession] = useState<string | null>(null);
  const [modalUser, setModalUser] = useState<User | null>(null);

  const params = useParams();
  const router = useRouter();
  const groupId = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    if (groupId) {
      try {
        const storedGroups = localStorage.getItem('deckmatch-groups');
        if (storedGroups) {
          const groups: Group[] = JSON.parse(storedGroups);
          const currentGroup = groups.find((g) => g.id === groupId);
          setGroup(currentGroup || null);
        }
        
        const sessionUserId = localStorage.getItem(`deckmatch-session-user-${groupId}`);
        setSelectedUserForSession(sessionUserId);

      } catch (error) {
        console.error("Failed to read from localStorage", error);
      }
    }
  }, [groupId]);
  
  useEffect(() => {
    if (group && selectedUserForSession) {
      const user = group.members.find(m => m.id === selectedUserForSession);
      setActiveUser(user || null);
    } else {
      setActiveUser(null);
    }
  }, [group, selectedUserForSession]);


  const updateGroupInStorage = (updatedGroup: Group) => {
    try {
      const storedGroups = localStorage.getItem('deckmatch-groups');
      const groups: Group[] = storedGroups ? JSON.parse(storedGroups) : [];
      const groupIndex = groups.findIndex((g) => g.id === updatedGroup.id);
      if (groupIndex !== -1) {
        groups[groupIndex] = updatedGroup;
        localStorage.setItem('deckmatch-groups', JSON.stringify(groups));
      }
    } catch (error) {
      console.error("Failed to write to localStorage", error);
    }
  };

  const form = useForm<z.infer<typeof addUserSchema>>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { name: '' },
  });

  const handleAddUser = (values: z.infer<typeof addUserSchema>) => {
    if (!group) return;
    const newUser: User = {
      id: uuidv4(),
      name: values.name,
      preferredDeck: null,
      decksIHave: [],
      decksIWant: [],
      score: 0,
    };
    const updatedGroup = { ...group, members: [...group.members, newUser] };
    setGroup(updatedGroup);
    updateGroupInStorage(updatedGroup);
    form.reset();
  };
  
  const checkForMatches = (allMembers: User[], updatedUser: User, newDeck: Deck) => {
    const otherMembers = allMembers.filter(m => m.id !== updatedUser.id);
    otherMembers.forEach(member => {
        const hasMatch = member.decksIWant.some(d => d.id === newDeck.id);
        if (hasMatch) {
            toast({
                title: "Deck Match Found!",
                description: (
                    <p>
                        <strong>{updatedUser.name}</strong> and <strong>{member.name}</strong> both want:{' '}
                        <span className="font-semibold text-accent-foreground">{newDeck.name}</span>
                    </p>
                ),
            });
        }
    });
  };


  const handleUpdateUser = (updatedUser: User, newDeckAdded?: Deck) => {
    if (!group) return;

    const updatedMembers = group.members.map((member) =>
      member.id === updatedUser.id ? updatedUser : member
    );
    const updatedGroup = { ...group, members: updatedMembers };
    setGroup(updatedGroup);
    updateGroupInStorage(updatedGroup);
    if (modalUser?.id === updatedUser.id) {
      setModalUser(updatedUser);
    }
    
    if (newDeckAdded) {
       checkForMatches(updatedMembers, updatedUser, newDeckAdded);
    }
  };
  
  const handleAddWin = (userId: string) => {
    if (!group || group.isFinished) return;
    const updatedMembers = group.members.map((member) =>
      member.id === userId ? { ...member, score: member.score + 1 } : member
    );
    const updatedGroup = { ...group, members: updatedMembers };
    setGroup(updatedGroup);
    updateGroupInStorage(updatedGroup);
  };

  const handleRemoveUser = (userId: string) => {
    if (!group) return;
    const updatedMembers = group.members.filter(member => member.id !== userId);
    const updatedGroup = { ...group, members: updatedMembers };
    setGroup(updatedGroup);
    updateGroupInStorage(updatedGroup);
    if (activeUser?.id === userId) {
      handleSetSessionUser(null);
    }
     if (modalUser?.id === userId) {
      setModalUser(null);
    }
  };
  
  const handleSetWinner = (matchId: string, winnerId: string) => {
        if (!group || !group.bracket || group.isFinished) return;

        let updatedBracket = [...group.bracket];
        const matchIndex = updatedBracket.findIndex(m => m.id === matchId);
        if (matchIndex === -1) return;

        const winner = group.members.find(m => m.id === winnerId);
        if (!winner) return;

        updatedBracket[matchIndex].winner = winner;

        const currentRound = updatedBracket[matchIndex].round;
        const winnersOfCurrentRound = updatedBracket
            .filter(m => m.round === currentRound && m.winner)
            .map(m => m.winner!);

        const allMatchesInRoundDecided = updatedBracket
            .filter(m => m.round === currentRound)
            .every(m => m.winner !== null);

        let isFinished = false;

        if (allMatchesInRoundDecided) {
            const winnersToNextRound = updatedBracket.filter(m => m.round === currentRound && m.isBye && m.winner).map(m => m.winner!);
            winnersOfCurrentRound.push(...winnersToNextRound);

            if (winnersOfCurrentRound.length === 1) {
                isFinished = true;
            } else {
                const nextRound = currentRound + 1;
                let matchNumber = 1;
                for (let i = 0; i < winnersOfCurrentRound.length; i += 2) {
                    if (winnersOfCurrentRound[i + 1]) {
                        updatedBracket.push({
                            id: uuidv4(),
                            round: nextRound,
                            match: matchNumber++,
                            participants: [winnersOfCurrentRound[i], winnersOfCurrentRound[i + 1]],
                            winner: null,
                            isBye: false
                        });
                    } else {
                        // Handle bye for odd number of winners
                        updatedBracket.push({
                            id: uuidv4(),
                            round: nextRound,
                            match: matchNumber++,
                            participants: [winnersOfCurrentRound[i], null],
                            winner: winnersOfCurrentRound[i],
                            isBye: true
                        });
                    }
                }
            }
        }
        
        const updatedGroup = { ...group, bracket: updatedBracket, isFinished };
        setGroup(updatedGroup);
        updateGroupInStorage(updatedGroup);
  };

  const handleSetSessionUser = (userId: string | null) => {
    if (group?.isFinished) return;
    if (userId && groupId) {
      localStorage.setItem(`deckmatch-session-user-${groupId}`, userId);
      setSelectedUserForSession(userId);
    } else if(groupId) {
      localStorage.removeItem(`deckmatch-session-user-${groupId}`);
      setSelectedUserForSession(null);
      setActiveUser(null);
    }
  };

  if (!isClient) {
    return (
        <div className="flex flex-col min-h-screen"><Header /><div className="flex-grow flex items-center justify-center"><p>Loading group...</p></div></div>
    );
  }

  if (!group) {
    return (
        <div className="flex flex-col min-h-screen"><Header /><div className="flex-grow flex items-center justify-center flex-col gap-4">
            <p>Group not found.</p>
            <Button onClick={() => router.push('/')}>Go Back to Groups</Button>
        </div></div>
    );
  }
  
  const maxScore = group.type === 'league' && group.members.length > 0 ? Math.max(...group.members.map((m) => m.score)) : 0;
  const isFinished = group.isFinished;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.push('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to all groups
        </Button>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-2">
            <div className='flex items-center gap-4'>
                <h1 className="text-4xl font-bold font-headline">{group.name}</h1>
                {isFinished && (
                    <Badge variant="default" className="bg-accent text-accent-foreground text-base">
                        <Trophy className="mr-2 h-4 w-4" /> Finished
                    </Badge>
                )}
            </div>
            {activeUser && (
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                        <UserIcon className="mr-2 h-4 w-4 text-accent" />
                        Signed in as: <span className="font-bold ml-1">{activeUser.name}</span>
                    </Badge>
                    <Button variant="link" size="sm" onClick={() => handleSetSessionUser(null)}>Sign out</Button>
                </div>
            )}
        </div>
        <p className="text-lg text-muted-foreground capitalize mb-8">{group.type}</p>

        {group.type === 'league' ? (
            <LeagueGroup group={group} activeUser={activeUser} handleSetSessionUser={handleSetSessionUser} setModalUser={setModalUser} handleAddWin={handleAddWin} maxScore={maxScore} isFinished={isFinished ?? false}/>
        ) : (
            <EliminatoryGroup group={group} handleSetWinner={handleSetWinner} isFinished={isFinished ?? false}/>
        )}

      </main>
      
      {modalUser && (
        <UserProfile 
          user={modalUser} 
          onClose={() => setModalUser(null)} 
          onUpdateUser={handleUpdateUser} 
          onRemoveUser={handleRemoveUser}
          isEditable={activeUser?.id === modalUser.id && !isFinished}
        />
      )}
    </div>
  );
}