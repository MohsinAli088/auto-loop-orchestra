import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioContainerProps {
  file: File;
  index: number;
  isActive: boolean;
  onPlay: (index: number) => void;
  onStop: () => void;
}

export const AudioContainer: React.FC<AudioContainerProps> = ({
  file,
  index,
  isActive,
  onPlay,
  onStop,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>('');

  // Create audio URL from file
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Handle active state changes
  useEffect(() => {
    if (!isActive && isPlaying) {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, isPlaying]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      // Auto-loop: restart immediately
      audio.currentTime = 0;
      audio.play().catch(console.error);
    };

    const handleCanPlay = () => {
      // Audio is ready to play
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl]);

  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      // First notify parent to stop other audios
      onPlay(index);
      
      // Small delay to ensure other audios are stopped
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Then start this audio
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handlePause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
    onStop();
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    if (isPlaying) {
      audio.play().catch(console.error);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    if (!isFinite(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "audio-container rounded-xl p-6 space-y-4",
      isActive && isPlaying && "playing"
    )}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        loop={false} // We handle looping manually for instant restart
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-foreground truncate">
            {file.name}
          </h3>
          <p className="text-sm text-audio-time">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-audio-time" />
          <span className="text-sm font-mono text-audio-time">
            #{index + 1}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div 
        className="audio-progress-track h-2 rounded-full cursor-pointer"
        onClick={handleProgressClick}
      >
        <div 
          className="audio-progress-fill h-full rounded-full"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Time Display */}
      <div className="flex justify-between items-center text-sm font-mono text-audio-time">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          className="audio-button h-10 w-10"
          onClick={handleRestart}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant={isPlaying ? "secondary" : "default"}
          size="lg"
          className="h-12 w-12 rounded-full"
          onClick={isPlaying ? handlePause : handlePlay}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="audio-button h-10 w-10"
          onClick={() => {
            const audio = audioRef.current;
            if (audio) {
              audio.volume = audio.volume === 0 ? 1 : 0;
            }
          }}
        >
          <Volume2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Status Indicator */}
      {isActive && isPlaying && (
        <div className="flex items-center justify-center space-x-2 text-primary">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-medium">Playing</span>
        </div>
      )}
    </div>
  );
};