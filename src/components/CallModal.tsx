import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Volume2,
  Flame,
} from 'lucide-react';

interface CallModalProps {
  partnerName: string;
  partnerAvatar: string;
  callType: 'voice' | 'video';
  onEndCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  partnerName,
  partnerAvatar,
  callType,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected'>('connecting');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    const connTimeout = setTimeout(() => {
      setConnectionStatus('connected');
    }, 1200);

    return () => {
      clearInterval(timer);
      clearTimeout(connTimeout);
    };
  }, []);

  // Real getUserMedia for authentic live microphone and camera stream!
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === 'video',
          });
          if (!active) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          localStreamRef.current = stream;
          if (localVideoRef.current && callType === 'video') {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err: any) {
        console.warn('User media notice (camera/mic permission not yet granted or denied):', err);
        setPermissionError('Camera or microphone permission was not granted; running in simulated preview mode.');
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [callType]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = isMuted));
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => (t.enabled = isVideoOff));
    }
    setIsVideoOff(!isVideoOff);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-[#13192B] border border-[#1F293D] rounded-3xl overflow-hidden shadow-2xl flex flex-col aspect-[4/3] sm:aspect-[16/10]">
        {/* Top Call Info Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-white">
              <Flame className="w-3.5 h-3.5 text-[#FF5E1E] fill-[#FF5E1E]" />
              <span>COOK {callType === 'video' ? 'LIVE VIDEO' : 'SECURE AUDIO'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{connectionStatus === 'connected' ? 'Connected (Encrypted P2P)' : 'Connecting...'}</span>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-xs font-mono font-bold text-white border border-white/10">
            {formatDuration(callDuration)}
          </div>
        </div>

        {/* Remote Partner Center Stage */}
        <div className="relative flex-1 bg-gradient-to-b from-[#0F1424] to-[#0B0F19] flex items-center justify-center overflow-hidden">
          {callType === 'video' ? (
            <div className="w-full h-full relative flex items-center justify-center">
              {/* Simulated remote partner video stream */}
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=80"
                alt={partnerName}
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-white">{partnerName}</span>
                <Volume2 className="w-3.5 h-3.5 text-gray-300" />
              </div>
            </div>
          ) : (
            /* Voice Call Graphic Screen */
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500 shadow-2xl"
                />
                <span className="absolute inset-0 rounded-full border-4 border-[#FF5E1E] animate-ping opacity-30" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-xl">{partnerName}</h3>
                <p className="text-xs text-gray-400">COOK Voice Session</p>
              </div>

              {/* Sound wave simulation */}
              <div className="flex items-center justify-center gap-1.5 h-8">
                {[40, 75, 90, 50, 85, 30, 95, 60, 40].map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-indigo-500 to-[#FF5E1E] rounded-full animate-pulse"
                    style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Local User Picture-in-Picture Video Box */}
          {callType === 'video' && (
            <div className="absolute bottom-6 right-6 w-36 sm:w-48 aspect-video rounded-2xl overflow-hidden border-2 border-indigo-500/80 shadow-2xl bg-black z-30">
              {!isVideoOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-[11px] text-gray-400 font-medium">
                  Camera Paused
                </div>
              )}
              <span className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                You (Local)
              </span>
            </div>
          )}

          {permissionError && (
            <div className="absolute top-16 left-6 right-6 bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs px-3 py-1.5 rounded-xl text-center">
              {permissionError}
            </div>
          )}
        </div>

        {/* Bottom Call Controls Bar */}
        <div className="p-4 sm:p-5 bg-[#0B0F19] border-t border-[#1F293D] flex items-center justify-center gap-4 z-30">
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${
              isMuted ? 'bg-rose-600' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition ${
                isVideoOff ? 'bg-rose-600' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={onEndCall}
            className="w-14 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition cursor-pointer"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
