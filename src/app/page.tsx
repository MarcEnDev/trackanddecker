
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Users, Dices, ArrowRight, X, Trophy } from 'lucide-react';

import type { Group, GroupType, User, Match } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Header from '@/components/header';
import { Badge } from '@/components/ui/badge';

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required.'),
  type: z.enum(['league', 'eliminatory'], {
    required_error: 'You need to select a group type.',
  }),
  members: z.array(z.object({ name: z.string().min(1, 'Member name cannot be empty') })).min(2, "At least two members are required."),
});

const generateBracket = (members: User[]): Match[] => {
    let players = [...members].sort(() => Math.random() - 0.5); // Randomize players
    let bracket: Match[] = [];
    let round = 1;
    let matchNumber = 1;

    // Handle bye for odd number of players
    if (players.length % 2 !== 0) {
        const luckyPlayer = players.pop()!;
        bracket.push({
            id: uuidv4(),
            round: 1,
            match: matchNumber++,
            participants: [luckyPlayer, null],
            winner: luckyPlayer,
            isBye: true
        });
    }

    for (let i = 0; i < players.length; i += 2) {
        bracket.push({
            id: uuidv4(),
            round: round,
            match: matchNumber++,
            participants: [players[i], players[i + 1]],
            winner: null,
            isBye: false
        });
    }

    return bracket;
};


export default function Home() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [open, setOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    try {
      const storedGroups = localStorage.getItem('deckmatch-groups');
      if (storedGroups) {
        setGroups(JSON.parse(storedGroups));
      }
    } catch (error) {
      console.error("Failed to read from localStorage", error);
    }
  }, []);

  const form = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      type: 'league',
      members: [],
    },
  });

  const onSubmit = (values: z.infer<typeof createGroupSchema>) => {
    const newMembers: User[] = values.members?.map(m => ({
        id: uuidv4(),
        name: m.name,
        preferredDeck: null,
        decksIHave: [],
        decksIWant: [],
        score: 0,
      })) || [];

    const newGroup: Group = {
      id: uuidv4(),
      name: values.name,
      type: values.type as GroupType,
      members: newMembers,
      isFinished: false,
    };

    if (newGroup.type === 'eliminatory') {
        newGroup.bracket = generateBracket(newMembers);
    }

    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    try {
      localStorage.setItem('deckmatch-groups', JSON.stringify(updatedGroups));
    } catch (error) {
      console.error("Failed to write to localStorage", error);
    }
    form.reset();
    setOpen(false);
  };
  
    const handleDeleteGroup = (groupId: string) => {
        const updatedGroups = groups.filter(group => group.id !== groupId);
        setGroups(updatedGroups);
        try {
            localStorage.setItem('deckmatch-groups', JSON.stringify(updatedGroups));
        } catch (error) {
            console.error("Failed to write to localStorage", error);
        }
    };

  const members = form.watch('members') || [];

  const addMember = () => {
    if (newMemberName.trim()) {
      form.setValue('members', [...(form.getValues('members') || []), { name: newMemberName.trim() }]);
      setNewMemberName("");
    }
  };

  const removeMember = (index: number) => {
    const currentMembers = form.getValues('members') || [];
    form.setValue('members', currentMembers.filter((_, i) => i !== index));
  };
  
  const activeGroups = groups.filter(group => !group.isFinished);
  const finishedGroups = groups.filter(group => group.isFinished);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold font-headline">Your Groups</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create a new group</DialogTitle>
                <DialogDescription>
                  Give your group a name and choose the type. Click create when you're done.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Friday Night Magic" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Group Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="league" />
                              </FormControl>
                              <FormLabel className="font-normal">League</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="eliminatory" />
                              </FormControl>
                              <FormLabel className="font-normal">Eliminatory Tournament</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Members</FormLabel>
                     <p className="text-sm text-muted-foreground">You need at least 2 members for a group.</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add member name..."
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addMember();
                          }
                        }}
                      />
                      <Button type="button" onClick={addMember}><Plus className="h-4 w-4" /></Button>
                    </div>
                     <div className="flex flex-wrap gap-2">
                      {members.map((member, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {member.name}
                          <button type="button" onClick={() => removeMember(index)} className="rounded-full hover:bg-destructive/20 p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                     <FormMessage>{form.formState.errors.members?.message}</FormMessage>
                  </div>

                  <DialogFooter>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isClient && groups.length > 0 ? (
          <div className='space-y-12'>
            <div>
              <h2 className="text-2xl font-bold font-headline border-b pb-2 mb-6">Active Groups</h2>
              {activeGroups.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeGroups.map((group) => (
                    <Card key={group.id} className="group flex flex-col hover:shadow-lg transition-all duration-300 hover:border-accent">
                      <CardHeader className="relative">
                          <CardTitle className="font-headline text-2xl">
                            {group.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            {group.type === 'league' ? <Dices className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                            <span className="capitalize">{group.type}</span>
                          </CardDescription>
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10">
                                      <X className="h-4 w-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the "{group.name}" group.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteGroup(group.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-muted-foreground">{group.members.length} member(s)</p>
                      </CardContent>
                      <CardFooter>
                        <Link href={`/groups/${group.id}`} className="w-full">
                          <Button className="w-full" variant="outline">
                            View Group <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <h3 className="text-xl font-semibold mb-2">No active groups</h3>
                  <p className="text-muted-foreground">Create a group to get started!</p>
                </div>
              )}
            </div>

            {finishedGroups.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold font-headline border-b pb-2 mb-6">Finished Tournaments</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {finishedGroups.map((group) => (
                    <Card key={group.id} className="group flex flex-col bg-card/50">
                        <CardHeader className="relative">
                            <div className="flex justify-between items-start">
                                <CardTitle className="font-headline text-2xl pr-8">
                                    {group.name}
                                </CardTitle>
                                <Badge variant="default" className="bg-accent text-accent-foreground text-xs whitespace-nowrap">
                                    <Trophy className="mr-1 h-3 w-3" /> Finished
                                </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-2 pt-1">
                                <Users className="h-4 w-4" />
                                <span className="capitalize">{group.type}</span>
                            </CardDescription>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the "{group.name}" group.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteGroup(group.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardHeader>
                        <CardContent className="flex-grow">
                        <p className="text-muted-foreground">{group.members.length} member(s)</p>
                        </CardContent>
                        <CardFooter>
                        <Link href={`/groups/${group.id}`} className="w-full">
                            <Button className="w-full" variant="outline">
                            View Results <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        </CardFooter>
                    </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          isClient && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold mb-2">No groups yet</h2>
              <p className="text-muted-foreground">Create a group to start matching decks with friends!</p>
            </div>
          )
        )}
      </main>
    </div>
  );
}
