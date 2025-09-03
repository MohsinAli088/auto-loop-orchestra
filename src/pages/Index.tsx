import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, RotateCcw, Upload, FolderOpen, Music, FileAudio, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Audio Container Component
interface AudioContainerProps {
  file: File;
  index: number;
  isActive: boolean;
  onPlay: (index: number) => void;
  onStop: () => void;
}

const AudioContainer: React.FC<AudioContainerProps> = ({
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
      handlePause();
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

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      onPlay(index);
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
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
        loop={false}
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

// File Selector Component
interface FileSelectorProps {
  onFilesSelected: (files: File[]) => void;
}

const FileSelector: React.FC<FileSelectorProps> = ({ onFilesSelected }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const isAudioFile = (file: File): boolean => {
    const audioTypes = [
      'audio/mpeg',
      'audio/wav', 
      'audio/ogg',
      'audio/mp3',
      'audio/mp4',
      'audio/aac',
      'audio/flac',
      'audio/webm'
    ];
    
    const audioExtensions = [
      '.mp3', '.wav', '.ogg', '.m4a', 
      '.aac', '.flac', '.wma', '.opus'
    ];
    
    return audioTypes.includes(file.type) || 
           audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const extractNumber = (filename: string): number => {
    const match = filename.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : Infinity;
  };

  const sortAudioFiles = (files: File[]): File[] => {
    return files.sort((a, b) => {
      const numA = extractNumber(a.name);
      const numB = extractNumber(b.name);
      
      if (numA !== numB) {
        return numA - numB;
      }
      
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  };

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const audioFiles = files.filter(isAudioFile);
    
    if (audioFiles.length === 0) {
      alert('No audio files found. Please select audio files (.mp3, .wav, .ogg, etc.)');
      return;
    }

    const sortedFiles = sortAudioFiles(audioFiles);
    onFilesSelected(sortedFiles);
  }, [onFilesSelected]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFolderSelect = () => {
    folderInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drag & Drop Zone */}
      <div
        className={cn(
          "file-drop-zone rounded-xl p-12 text-center transition-all duration-300",
          isDragActive && "drag-active"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Music className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              Drop your audio files here
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Drag and drop audio files or folders, or use the buttons below. 
              Files will be automatically sorted by number in filename.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Supported formats: MP3, WAV, OGG, M4A, AAC, FLAC</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="default"
          size="lg"
          onClick={handleFileSelect}
          className="space-x-2"
        >
          <FileAudio className="w-5 h-5" />
          <span>Select Files</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handleFolderSelect}
          className="space-x-2"
        >
          <FolderOpen className="w-5 h-5" />
          <span>Select Folder</span>
        </Button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.wma,.opus"
        className="hidden"
        onChange={handleFileInputChange}
      />
      
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Instructions */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-2">Smart Sorting:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Files starting with numbers are prioritized (1-track.mp3, 2-music.wav)</li>
          <li>• Numerical order is preserved (1, 2, 10 not 1, 10, 2)</li>
          <li>• Files without numbers are sorted alphabetically</li>
          <li>• Only one audio can play at a time (auto-stop others)</li>
          <li>• Each audio loops automatically until manually stopped</li>
        </ul>
      </div>
    </div>
  );
};

// Main Audio Manager Component
const Index = () => {
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);

  const handleFilesSelected = useCallback((files: File[]) => {
    setAudioFiles(files);
    setActiveAudioIndex(null);
  }, []);

  const handleAudioPlay = useCallback((index: number) => {
    setActiveAudioIndex(index);
  }, []);

  const handleAudioStop = useCallback(() => {
    setActiveAudioIndex(null);
  }, []);

  const handleClearAll = () => {
    setAudioFiles([]);
    setActiveAudioIndex(null);
  };

  const handleStopAll = () => {
    setActiveAudioIndex(null);
  };

  if (audioFiles.length === 0) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Robust Audio Player
            </h1>
            <p className="text-muted-foreground text-lg">
              Professional multi-audio player for educational programs
            </p>
          </header>

          <FileSelector onFilesSelected={handleFilesSelected} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Audio Player
            </h1>
            <p className="text-muted-foreground">
              {audioFiles.length} audio file{audioFiles.length !== 1 ? 's' : ''} loaded
            </p>
          </div>

          <nav className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleStopAll}
              className="space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Stop All</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleClearAll}
              className="space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </Button>

            <Button
              variant="default"
              onClick={() => setAudioFiles([])}
              className="space-x-2"
            >
              <Info className="w-4 h-4" />
              <span>Load New Files</span>
            </Button>
          </nav>
        </header>

        {activeAudioIndex !== null && (
          <section className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6" role="status">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              <span className="font-medium text-primary">
                Currently Playing: {audioFiles[activeAudioIndex]?.name}
              </span>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {audioFiles.map((file, index) => (
            <AudioContainer
              key={`${file.name}-${file.size}-${index}`}
              file={file}
              index={index}
              isActive={activeAudioIndex === index}
              onPlay={handleAudioPlay}
              onStop={handleAudioStop}
            />
          ))}
        </section>

        <footer className="mt-12 text-center text-muted-foreground">
          <p className="text-sm">
            Auto-loop enabled • Only one audio plays at a time • Sorted by numerical priority
          </p>
        </footer>
      </div>
    </main>
  );
};

export default Index;