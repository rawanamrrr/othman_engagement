'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Download, MessageSquare, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RSVP {
  id: string;
  name: string;
  guests: number;
  guestNames: string;
  favoriteSong: string;
  isAttending: boolean;
  createdAt: string;
  handwrittenMessageUrl?: string;
}

interface HandwrittenMessage {
  name: string;
  messageUrl: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [messages, setMessages] = useState<HandwrittenMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('rsvps');

  const [selectedImage, setSelectedImage] = useState<{url: string, name: string} | null>(null);

  const handleDownloadImage = async (url: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `message-${name.replace(/\s+/g, '-').toLowerCase()}-${new Date().getTime()}.jpg`;
      link.style.display = 'none';
      
      // For iOS devices
      if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const a = document.createElement('a');
          a.href = event.target?.result as string;
          a.download = link.download;
          a.click();
        };
        reader.readAsDataURL(blob);
      } else {
        // For other devices
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Error downloading image:', error);
      setError('Failed to download image. Please try again.');
    }
  };

  // In a real app, implement proper authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // This is a simple demo - in production, use proper authentication
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
    } else {
      setError('Invalid password');
    }
  };

  useEffect(() => {
    // Check if already authenticated
    const authStatus = localStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }

    if (isAuthenticated) {
      fetchRSVPs();
    }
  }, [isAuthenticated]);

  const fetchRSVPs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/rsvps');
      if (!response.ok) {
        throw new Error('Failed to fetch RSVPs');
      }
      const data = await response.json();
      // Separate RSVPs and messages
      const rsvpData = data.filter((item: any) => item.isAttending !== undefined);
      const messageData = data
        .filter((item: any) => item.handwrittenMessageUrl && !item.isAttending)
        .map((item: any) => ({
          name: item.name,
          messageUrl: item.handwrittenMessageUrl,
          timestamp: item.timestamp || new Date().toISOString()
        }));
      
      setRsvps(rsvpData);
      setMessages(messageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRsvps = rsvps.filter(rsvp =>
    rsvp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rsvp.guestNames?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const attendingCount = rsvps.filter(rsvp => rsvp.isAttending).length;
  const notAttendingCount = rsvps.filter(rsvp => !rsvp.isAttending).length;
  const totalGuests = rsvps.reduce((sum, rsvp) => sum + (rsvp.isAttending ? (rsvp.guests || 0) : 0), 0);
  
  // Get top 5 most requested songs
  const songCounts = rsvps
    .filter(rsvp => rsvp.favoriteSong && rsvp.favoriteSong.trim() !== '')
    .reduce((acc: Record<string, number>, rsvp) => {
      const song = rsvp.favoriteSong.trim();
      acc[song] = (acc[song] || 0) + 1;
      return acc;
    }, {});
    
  const topSongs = Object.entries(songCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const exportToCSV = () => {
    const headers = ['Name', 'Attending', 'Number of Guests', 'Guest Names', 'Favorite Song', 'Date', 'Handwritten Message'];
    const csvContent = [
      headers.join(','),
      ...filteredRsvps.map(rsvp => [
        `"${rsvp.name}"`,
        rsvp.isAttending ? 'Yes' : 'No',
        rsvp.guests || 0,
        `"${rsvp.guestNames || ''}"`,
        `"${rsvp.favoriteSong || ''}"`,
        new Date(rsvp.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rsvps-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tab content components
  const StatsSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total RSVPs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{rsvps.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Attending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{attendingCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Not Attending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{notAttendingCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Guests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalGuests}</div>
        </CardContent>
      </Card>
    </div>
  );

  const TopSongsSection = () => (
    topSongs.length > 0 && (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Top 5 Requested Songs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topSongs.map(([song, count], index) => (
              <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                <div className="flex items-center">
                  <span className="text-gray-500 w-6 text-right mr-3">{index + 1}.</span>
                  <span className="font-medium">{song}</span>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {count} {count === 1 ? 'request' : 'requests'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  );

  const RSVPsSection = () => (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-xl">RSVP Responses</CardTitle>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or guest name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading RSVPs...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filteredRsvps.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No RSVPs found</div>
        ) : (
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
                  <TableRow key={rsvp.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium">{rsvp.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rsvp.isAttending
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
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
        )}
      </CardContent>
    </Card>
  );

  const MessagesSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Handwritten Messages</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No handwritten messages yet</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message, index) => (
                  <TableRow key={`${message.name}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium">{message.name}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => setSelectedImage({ url: message.messageUrl, name: message.name })}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors inline-flex items-center gap-1"
                        title="View message"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </TableCell>
                    <TableCell>{new Date(message.timestamp).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-white rounded-t-lg p-4 flex justify-between items-center">
              <h3 className="font-medium">{selectedImage.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadImage(selectedImage.url, selectedImage.name, e as any);
                  }}
                  className="text-gray-700 hover:bg-gray-100 p-2 rounded transition-colors"
                  title="Download"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-700 hover:bg-gray-100 p-2 rounded transition-colors"
                  title="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="bg-gray-100 p-4 overflow-auto max-h-[calc(90vh-60px)] flex items-center justify-center">
              <img 
                src={selectedImage.url} 
                alt={`Message from ${selectedImage.name}`} 
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">RSVP Dashboard</h1>
          <Button onClick={exportToCSV} variant="outline" className="gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden mb-6">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rsvps" className="gap-2">
                <List className="h-4 w-4" />
                RSVPs
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Desktop View - Always show both sections */}
        <div className="hidden md:block">
          <StatsSection />
          <TopSongsSection />
          <RSVPsSection />
          <MessagesSection />
        </div>

        {/* Mobile View - Show active tab content */}
        <div className="md:hidden">
          {activeTab === 'rsvps' ? (
            <>
              <StatsSection />
              <TopSongsSection />
              <RSVPsSection />
            </>
          ) : (
            <MessagesSection />
          )}
        </div>

      </div>
    </div>
  );
}
