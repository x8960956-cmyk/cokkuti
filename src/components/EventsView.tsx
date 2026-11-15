import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Award, Clock, Share2, Check, Plus, X } from 'lucide-react';
import { StartupEvent } from '../types';
import { ShareItem } from './ShareModal';

interface EventsViewProps {
  onShare: (item: ShareItem) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ onShare }) => {
  const [events, setEvents] = useState<StartupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Demo Day');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('Virtual');
  const [description, setDescription] = useState('');
  const [prizes, setPrizes] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('cook_auth_token');
        const res = await fetch('/api/events', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (Array.isArray(data.events)) {
          setEvents(data.events);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const toggleRSVP = async (id: string) => {
    const token = localStorage.getItem('cook_auth_token');
    if (!token) return;
    try {
      const res = await fetch(`/api/events/${id}/rsvp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.event) {
        setEvents((prev) => prev.map((e) => (e.id === id ? data.event : e)));
      }
    } catch (err) {
      // ignore
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim()) return;
    const token = localStorage.getItem('cook_auth_token');
    if (!token) return;

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          type,
          date: date.trim(),
          time: time.trim() || 'TBD',
          location: location.trim() || 'Virtual',
          description: description.trim(),
          prizes: prizes.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.event) {
        setEvents([data.event, ...events]);
        setTitle('');
        setDate('');
        setTime('');
        setDescription('');
        setPrizes('');
        setIsModalOpen(false);
      }
    } catch (err) {
      // ignore
    }
  };

  const getGoogleCalendarUrl = (event: StartupEvent) => {
    const t = encodeURIComponent(event.title);
    const d = encodeURIComponent(event.description);
    const l = encodeURIComponent(event.location);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${t}&details=${d}&location=${l}`;
  };

  return (
    <div className="w-full flex-1 min-w-0 max-w-6xl space-y-6 pb-8">
      {/* Header */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#13192B] via-[#1E1B4B] to-[#13192B] border border-indigo-500/30 p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300">
              VENTURE EVENTS & CHALLENGES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pitch competitions, hackathons & mixers
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
            Host or RSVP to real virtual demo days, hackathons, and founder networking mixers on COOK.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Host Event</span>
        </button>
      </div>

      {/* Events Stream */}
      {!loading && events.length === 0 ? (
        <div className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-10 text-center space-y-3 shadow-xl">
          <Calendar className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No upcoming events scheduled</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
            Host a Demo Day, Hackathon, or Founder Mixer to bring the COOK community together.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 space-y-4 hover:border-gray-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B0F19] border border-indigo-500/30 flex flex-col items-center justify-center text-center p-1 flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#FF5E1E] uppercase">
                      {evt.date.split(' ')[0] || 'EVT'}
                    </span>
                    <span className="text-sm font-extrabold text-white leading-none">
                      {evt.date.split(' ')[1]?.replace(',', '') || ''}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{evt.title}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        {evt.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        {evt.time}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        {evt.location}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    onShare({
                      id: evt.id,
                      type: 'event',
                      title: evt.title,
                      description: evt.description,
                    })
                  }
                  className="w-8 h-8 rounded-lg bg-[#0B0F19] text-gray-400 hover:text-white border border-gray-800 flex items-center justify-center transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{evt.description}</p>

              {evt.prizes && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-semibold">
                  <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Prizes: {evt.prizes}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{evt.attendeesCount} registered</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={getGoogleCalendarUrl(evt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Add to Calendar</span>
                  </a>
                  <button
                    onClick={() => toggleRSVP(evt.id)}
                    className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      evt.attending
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                    }`}
                  >
                    {evt.attending ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{evt.attending ? 'RSVP Confirmed' : 'RSVP Free'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Host Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#13192B] border border-gray-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-white">Host an Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event Title"
                className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Demo Day">Demo Day</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Mixer">Mixer</option>
                  <option value="Workshop">Workshop</option>
                </select>
                <input
                  type="text"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="Date (e.g. Nov 24, 2026)"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="Time (e.g. 6:00 PM UTC)"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location / Stream link"
                  className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <input
                type="text"
                value={prizes}
                onChange={(e) => setPrizes(e.target.value)}
                placeholder="Prizes / Grants (optional)"
                className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what attendees will learn or pitch..."
                className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
