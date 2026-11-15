import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Eye,
} from 'lucide-react';
import { formatDuration } from '../utils/mediaUpload';

interface VideoPlayerProps {
  src: string;
  caption?: string;
  viewsCount?: number;
  initialDurationSeconds?: number;
  onFirstPlay?: () => void;
  onWatchComplete?: () => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  caption,
  viewsCount,
  initialDurationSeconds,
  onFirstPlay,
  onWatchComplete,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDurationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const hasTrackedPlayRef = useRef(false);
  const hasTrackedCompleteRef = useRef(false);

  useEffect(() => {
    hasTrackedPlayRef.current = false;
    hasTrackedCompleteRef.current = false;
  }, [src]);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  };

  const handlePlayEvent = () => {
    setIsPlaying(true);
    if (!hasTrackedPlayRef.current) {
      hasTrackedPlayRef.current = true;
      onFirstPlay?.();
    }
  };

  const handleEndedEvent = () => {
    setIsPlaying(false);
    if (!hasTrackedCompleteRef.current) {
      hasTrackedCompleteRef.current = true;
      onWatchComplete?.();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = next;
    }
    setCurrentTime(next);
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const nextMuted = !isMuted;
    vid.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVol = Number(e.target.value);
    setVolume(nextVol);
    if (videoRef.current) {
      videoRef.current.volume = nextVol;
      videoRef.current.muted = nextVol === 0;
      setIsMuted(nextVol === 0);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const handleFullscreen = () => {
    const el = containerRef.current || videoRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      ref={containerRef}
      className={`relative group bg-black rounded-2xl overflow-hidden select-none ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onPlay={handlePlayEvent}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEndedEvent}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
            setDuration(videoRef.current.duration);
          }
        }}
        className="w-full max-h-[480px] object-contain bg-black cursor-pointer"
      />

      {/* Views pill in top-left */}
      {typeof viewsCount === 'number' && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white flex items-center gap-1.5 pointer-events-none">
          <Eye className="w-3.5 h-3.5 text-[#FF5E1E]" />
          <span>{viewsCount.toLocaleString()} {viewsCount === 1 ? 'view' : 'views'}</span>
        </div>
      )}

      {/* Center Play Overlay when paused */}
      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/35 transition cursor-pointer"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FF5E1E]/90 hover:bg-[#FF5E1E] text-white flex items-center justify-center shadow-2xl shadow-orange-500/30 transition transform group-hover:scale-105">
            <Play className="w-7 h-7 fill-white ml-0.5" />
          </div>
        </button>
      )}

      {/* Bottom Playback Controls Bar */}
      <div className="bg-gradient-to-t from-black/95 via-black/75 to-transparent px-3 pt-4 pb-2.5 space-y-1.5">
        {/* Timeline Scrub Bar */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek video timeline"
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#FF5E1E] bg-white/20"
            style={{
              background: `linear-gradient(to right, #FF5E1E ${progressPct}%, rgba(255,255,255,0.2) ${progressPct}%)`,
            }}
          />
        </div>

        {/* Control Buttons Row */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-1.5 rounded-lg hover:bg-white/15 transition"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-1.5 rounded-lg hover:bg-white/15 transition"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="Volume"
                className="hidden sm:block w-16 h-1 accent-indigo-400 cursor-pointer"
              />
            </div>

            <span className="text-[11px] font-mono text-gray-300">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {caption && (
              <span className="hidden md:inline text-[11px] text-gray-400 truncate max-w-[160px]">
                {caption}
              </span>
            )}
            <button
              type="button"
              onClick={cyclePlaybackRate}
              title="Playback speed"
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold transition"
            >
              {playbackRate}x
            </button>
            <button
              type="button"
              onClick={handleFullscreen}
              aria-label="Toggle fullscreen"
              className="p-1.5 rounded-lg hover:bg-white/15 transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
