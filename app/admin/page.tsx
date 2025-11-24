'use client';

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, X, Users, UserCheck, UserX, Music, List } from 'lucide-react';

interface RSVP {
  _id: string;
  name: string;
  guests: number;
  guestNames: string;
  favoriteSong: string;
  isAttending: boolean;
  createdAt: string;
}

interface Message {
  _id: string;
  name: string;
  message: string;
}

// --- Sub-components for better organization ---

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      <Icon className="h-4 w-4 text-gray-400" />
    </CardHeader>
    <CardContent>
      <div className={`text-3xl font-bold ${color || ''}`}>{value}</div>
    </CardContent>
  </Card>
);

const TopSongsCard = ({ songs }: { songs: [string, number][] }) => (
  <Card className="lg:col-span-1">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
        <Music className="h-4 w-4" /> Top 5 Requested Songs
      </CardTitle>
    </CardHeader>
    <CardContent>
      {songs.length > 0 ? (
        <ol className="list-decimal list-inside space-y-1 text-sm">
          {songs.map(([song, count]) => (
            <li key={song} className="capitalize truncate">
              {song} <span className="text-gray-500">({count})</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-gray-500">No song requests yet.</p>
      )}
    </CardContent>
  </Card>
);

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Skeleton className="h-10 w-full" />
        </div>
        <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </CardContent>
        </Card>
    </div>
    <Card>
        <CardContent className="p-0">
            <div className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
        </CardContent>
    </Card>
  </div>
);

export default function AdminDashboard() {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('rsvps');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('adminAuthenticated');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [rsvpResponse, messagesResponse] = await Promise.all([
            fetch('/api/rsvps'),
            fetch('/api/messages'),
          ]);
          if (!rsvpResponse.ok) throw new Error('Failed to fetch RSVPs');
          if (!messagesResponse.ok) throw new Error('Failed to fetch messages');
          const rsvpData = await rsvpResponse.json();
          const messagesData = await messagesResponse.json();
          setRsvps(rsvpData);
          setMessages(messagesData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
    } else {
      setError('Invalid password');
    }
  };

  const filteredRsvps = useMemo(() => 
    rsvps.filter(rsvp =>
      rsvp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rsvp.guestNames?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [rsvps, searchTerm]);

  const stats = useMemo(() => ({
    total: rsvps.length,
    attending: rsvps.filter(r => r.isAttending).length,
    notAttending: rsvps.filter(r => !r.isAttending).length,
    totalGuests: rsvps.reduce((sum, r) => sum + (r.isAttending ? (r.guests || 0) : 0), 0),
  }), [rsvps]);

  const topSongs = useMemo(() => {
    const songCounts = rsvps.reduce((acc, rsvp) => {
      if (rsvp.isAttending && rsvp.favoriteSong) {
        const song = rsvp.favoriteSong.trim().toLowerCase();
        acc[song] = (acc[song] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(songCounts).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [rsvps]);

  const exportToCSV = () => window.location.href = '/api/rsvps/download';

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>
              <Button type="submit" className="w-full">Sign In</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">RSVP Dashboard</h1>
          <Button onClick={exportToCSV} variant="outline" className="gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </header>

        {isLoading ? <DashboardSkeleton /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total RSVPs" value={stats.total} icon={List} />
              <StatCard title="Attending" value={stats.attending} icon={UserCheck} color="text-green-600" />
              <StatCard title="Not Attending" value={stats.notAttending} icon={UserX} color="text-red-600" />
              <StatCard title="Total Guests" value={stats.totalGuests} icon={Users} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input type="text" placeholder="Search by name or guest name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10" />
              </div>
              <TopSongsCard songs={topSongs} />
            </div>

            <div className="sm:hidden mb-4">
              <div className="flex border-b">
                <button className={`flex-1 py-2 text-sm font-medium ${activeTab === 'rsvps' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`} onClick={() => setActiveTab('rsvps')}>RSVPs</button>
                <button className={`flex-1 py-2 text-sm font-medium ${activeTab === 'messages' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`} onClick={() => setActiveTab('messages')}>Messages</button>
              </div>
            </div>

            <div className={`${activeTab === 'rsvps' ? 'block' : 'hidden'} sm:block`}>
              <Card>
                <CardContent className="p-0">
                  {filteredRsvps.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Guests</TableHead>
                            <TableHead>Guest Names</TableHead>
                            <TableHead>Favorite Song</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRsvps.map((rsvp) => (
                            <TableRow key={rsvp._id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{rsvp.name}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rsvp.isAttending ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {rsvp.isAttending ? 'Attending' : 'Not Attending'}
                                </span>
                              </TableCell>
                              <TableCell>{rsvp.isAttending ? rsvp.guests || 0 : '-'}</TableCell>
                              <TableCell className="max-w-xs truncate">{rsvp.guestNames || '-'}</TableCell>
                              <TableCell className="max-w-xs truncate">{rsvp.favoriteSong || '-'}</TableCell>
                              <TableCell>{new Date(rsvp.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">No RSVPs found</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className={`${activeTab === 'messages' ? 'block' : 'hidden'} sm:block`}>
              <Card>
                <CardHeader>
                  <CardTitle>Handwritten Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  {messages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {messages.map((msg) => (
                        <div key={msg._id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          {msg.message.startsWith('data:image') ? (
                            <img src={msg.message} alt={`Message from ${msg.name}`} className="w-full h-auto rounded-md cursor-pointer transition-transform hover:scale-105" onClick={() => setSelectedImage(msg.message)} />
                          ) : (
                            <p className="text-gray-700">{msg.message}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-2 text-right">- {msg.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No messages yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative bg-white p-4 rounded-lg max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedImage(null)} className="absolute -top-3 -right-3 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <img src={selectedImage} alt="Enlarged message" className="w-full h-auto rounded-md mb-4" style={{ maxHeight: '80vh' }} />
            <Button onClick={() => handleDownload(selectedImage, `message-${Date.now()}.png`)} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download Image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
