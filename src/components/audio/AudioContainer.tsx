import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, VolumeX, Volume1, Volume2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Create audio URL from file
  useEffect(() => {
    try {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setHasError(false);
      setIsLoading(true);
      return () => {
        URL.revokeObjectURL(url);
        setAudioUrl('');
      };
    } catch (error) {
      console.error('Error creating audio URL:', error);
      setHasError(true);
      setIsLoading(false);
    }
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
    if (!audio || !audioUrl) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      audio.volume = volume;
      setIsLoading(false);
      setHasError(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      // Auto-loop: restart immediately if still active
      if (isActive) {
        audio.currentTime = 0;
        audio.play().catch((error) => {
          console.error('Error auto-looping audio:', error);
          setIsPlaying(false);
          setHasError(true);
        });
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setHasError(true);
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    // Add all event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      // Clean up all event listeners
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [audioUrl, volume, isActive]);

  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio || hasError || isLoading) return;

    try {
      // First notify parent to stop other audios
      onPlay(index);
      
      // Small delay to ensure other audios are stopped
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Ensure volume is set correctly
      audio.volume = volume;
      
      // Then start this audio
      await audio.play();
      setIsPlaying(true);
      setHasError(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setHasError(true);
      
      // Try to reset audio element
      try {
        audio.load();
      } catch (loadError) {
        console.error('Error reloading audio:', loadError);
      }
    }
  };

  const handlePause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.pause();
      setIsPlaying(false);
      onStop();
    } catch (error) {
      console.error('Error pausing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio || hasError) return;

    try {
      audio.currentTime = 0;
      if (isPlaying) {
        audio.play().catch((error) => {
          console.error('Error restarting audio:', error);
          setHasError(true);
          setIsPlaying(false);
        });
      }
    } catch (error) {
      console.error('Error restarting audio:', error);
      setHasError(true);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration || hasError) return;

    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = Math.max(0, Math.min((clickX / rect.width) * duration, duration));
      
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    } catch (error) {
      console.error('Error seeking audio:', error);
      setHasError(true);
    }
  };

  const formatTime = (time: number): string => {
    if (!isFinite(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const VolumeIcon = getVolumeIcon();
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Error state
  if (hasError) {
    return (
      <div className="audio-container rounded-xl p-6 space-y-4 border-2 border-destructive/20 bg-destructive/5">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {file.name}
            </h3>
            <p className="text-sm text-destructive">
              Error loading audio file
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-mono text-destructive">
              #{index + 1}
            </span>
          </div>
        </div>
        
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">Unable to load this audio file</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              const audio = audioRef.current;
              if (audio) {
                audio.load();
              }
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "audio-container rounded-xl p-6 space-y-4 transition-all duration-300",
      isActive && isPlaying && "playing",
      isLoading && "opacity-75"
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
            {isLoading && " • Loading..."}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <VolumeIcon className="w-4 h-4 text-audio-time" />
          <span className="text-sm font-mono text-audio-time">
            #{index + 1}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div 
        className="audio-progress-track h-2 rounded-full cursor-pointer transition-opacity duration-200 hover:opacity-80"
        onClick={handleProgressClick}
      >
        <div 
          className="audio-progress-fill h-full rounded-full transition-all duration-200"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Time Display */}
      <div className="flex justify-between items-center text-sm font-mono text-audio-time">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls - Rearranged with play and restart on left */}
      <div className="flex items-center justify-between space-x-4">
        {/* Left side: Play and Restart */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="audio-button h-10 w-10"
            onClick={handleRestart}
            disabled={isLoading || hasError}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            variant={isPlaying ? "secondary" : "default"}
            size="lg"
            className="h-12 w-12 rounded-full"
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={isLoading || hasError}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
        </div>

        {/* Right side: Volume Controls */}
          <div className="flex items-center space-x-3 flex-1 max-w-32">
            <VolumeIcon className="w-4 h-4 text-audio-time flex-shrink-0" />
            <div className="flex-1 volume-slider">
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                min={0}
                step={0.01}
                className="flex-1"
              />
            </div>
            <span className="text-xs text-audio-time w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
      </div>

      {/* Status Indicator */}
      {isActive && isPlaying && (
        <div className="flex items-center justify-center space-x-2 text-primary">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-medium">Playing</span>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
          <span className="text-sm">Loading audio...</span>
        </div>
      )}
    </div>
  );
};