import { User as UserIcon, Check, LogIn, Trophy } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Group, User, Match } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const LeagueGroup = ({ group, activeUser, handleSetSessionUser, setModalUser, handleAddWin, maxScore, isFinished } : {group: Group, activeUser: User | null, handleSetSessionUser: Function, setModalUser: Function, handleAddWin: Function, maxScore: number, isFinished : boolean }) => (
    <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
        <h2 className="text-2xl font-bold font-headline border-b pb-2">Members</h2>
        {group.members.length > 0 ? (
            <div className="grid gap-4">
                {group.members.map((member) => (
                <Card 
                    key={member.id} 
                    className={`p-4 flex items-center justify-between transition-all duration-200 ${activeUser?.id === member.id ? 'border-accent' : 'border-border'}`}
                >
                    <div className="flex items-center gap-4">
                        <UserIcon className="h-8 w-8 text-muted-foreground"/>
                        <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                {member.name}
                                {maxScore > 0 && member.score === maxScore && !isFinished && (
                                    <Badge variant="default" className="bg-accent text-accent-foreground">
                                        <Trophy className="mr-1 h-3 w-3" /> Winner
                                    </Badge>
                                )}
                            </h3>
                            <p className="text-sm text-muted-foreground">Score: {member.score}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isFinished && (
                            <Button variant="ghost" size="sm" onClick={() => handleAddWin(member.id)} className="text-accent hover:text-accent-foreground">
                                <Trophy className="mr-2 h-4 w-4" /> Add Win
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setModalUser(member)}>View Profile</Button>
                        {!activeUser && !isFinished && (
                            <Button size="sm" onClick={() => handleSetSessionUser(member.id)}>
                                <LogIn className="mr-2 h-4 w-4" /> This is me
                            </Button>
                        )}
                        {activeUser?.id === member.id && <Check className="h-5 w-5 text-green-500" />}
                    </div>
                </Card>
                ))}
            </div>
        ) : (
            <p className="text-muted-foreground italic">No members in this group yet. Add one to get started!</p>
        )}
        </div>
        {!isFinished && (
            <div>
                {/* Placeholder for Add member card etc. */}
            </div>
        )}
  </div>
);

export const EliminatoryGroup = ({ group, handleSetWinner, isFinished } : {group: Group, handleSetWinner: Function, isFinished: boolean}) => {
    if (!group.bracket) return <p>This tournament has no bracket yet.</p>;

    const rounds = group.bracket.reduce((acc: Record<number, Match[]>, match: Match) => {
        acc[match.round] = acc[match.round] || [];
        acc[match.round].push(match);
        return acc;
    }, {});
    
    const finalWinner = group.isFinished && group.bracket.find(m => m.round === Math.max(...Object.keys(rounds).map(Number)))?.winner;

    return (
        <div className="space-y-8">
            {finalWinner && (
                <Card className="p-6 bg-accent/10 border-accent">
                    <CardHeader className="text-center p-0">
                        <Trophy className="h-12 w-12 mx-auto text-accent" />
                        <CardTitle className="text-3xl font-bold mt-2">Tournament Winner</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center p-0 mt-4">
                        <p className="text-2xl font-semibold text-accent-foreground">{finalWinner.name}</p>
                    </CardContent>
                </Card>
            )}
            <div className="flex space-x-4 overflow-x-auto pb-4">
                {Object.entries(rounds).map(([roundNumber, matches]: [string, Match[]]) => (
                    <div key={roundNumber} className="flex-shrink-0 w-72 space-y-4">
                        <h3 className="text-xl font-bold font-headline text-center">Round {roundNumber}</h3>
                        {matches.map(match => (
                            <Card key={match.id} className={cn("p-4", match.winner ? 'bg-card/60' : '')}>
                                <div className="space-y-2">
                                    {match.participants.map((participant, index) => (
                                         <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {participant ? (
                                                    <>
                                                      {match.winner?.id === participant.id ? <Trophy className="h-4 w-4 text-accent" /> : <UserIcon className="h-4 w-4 text-muted-foreground" />}
                                                      <span className={cn(match.winner?.id === participant.id && "font-bold text-accent-foreground")}>
                                                          {participant.name}
                                                      </span>
                                                    </>
                                                ) : (
                                                     <span className="text-muted-foreground italic">BYE</span>
                                                )}
                                               
                                            </div>
                                            {!match.winner && participant && !isFinished && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                                                           Set as Winner
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirm Winner</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to set {participant.name} as the winner for this match?
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleSetWinner(match.id, participant.id)}>Confirm</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    ))}
                                    {match.isBye && <Badge variant="secondary" className="w-fit">BYE</Badge>}
                                </div>
                            </Card>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export async function generateStaticParams() {
  // Simulación: obtener los grupos desde localStorage no es posible en build
  // Así que para export estática, debes devolver una lista fija o cargada de un JSON

  const groups = [
    { slug: ['grupo-a'] },
    { slug: ['grupo-b'] },
    { slug: ['grupo-c'] },
  ];

  return groups;
}