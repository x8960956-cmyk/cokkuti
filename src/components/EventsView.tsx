import React, { useState } from 'react';
import { Calendar, MapPin, Users, Award, Clock, Share2, Check, ExternalLink } from 'lucide-react';
import { StartupEvent } from '../types';
import { eventsData } from '../data/mockData';
import { ShareItem } from './ShareModal';

interface EventsViewProps {
  onShare: (item: ShareItem) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ onShare }) => {
  const [events, setEvents] = useState<StartupEvent[]>(eventsData);

  const toggleRSVP = (id: string) => {
    setEvents(prev =>
      prev.map(e => {
        if (e.id === id) {
          const isAttending = !e.attending;
          return {
            ...e,
            attending: isAttending,
            attendeesCount: e.attendeesCount + (isAttending ? 1 : -1),
          };
        }
        return e;
      })
    );
  };

  const handleAddToCalendar = (event: StartupEvent) => {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description);
    const location = encodeURIComponent(event.location);
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(gCalUrl, '_blank');
  };

  return (
    <div className="flex-1 max-w-5xl space-y-6 pb-16">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#13192B] via-[#1E1B4B] to-[#13192B] border border-indigo-500/30 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
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
            Register for virtual demo days, win non-dilutive equity-free grants, and network directly with active syndicate leads.
          </p>
        </div>
      </div>

      {/* Events Stream */}
      <div className="space-y-4">
        {events.map(evt => (
          <div
            key={evt.id}
            className="bg-[#13192B] border border-[#1F293D] rounded-2xl p-5 space-y-4 hover:border-gray-700 transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#0B0F19] border border-indigo-500/30 flex flex-col items-center justify-center text-center p-1 flex-shrink-0">
                  <span className="text-[10px] font-bold text-[#FF5E1E] uppercase">
                    {evt.date.split(' ')[0]}
                  </span>
                  <span className="text-base font-extrabold text-white leading-none">
                    {evt.date.split(' ')[1]?.replace(',', '')}
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

              <div className="flex items-center gap-2">
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
                <span>{evt.attendeesCount} founders & investors registered</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddToCalendar(evt)}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Add to Calendar</span>
                </button>
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
    </div>
  );
};
