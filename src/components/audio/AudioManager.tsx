import React, { useState, useCallback } from 'react';
import { AudioContainer } from './AudioContainer';
import { FileSelector } from './FileSelector';
import { Button } from '@/components/ui/button';
import { RotateCcw, Trash2, Info } from 'lucide-react';

export const AudioManager: React.FC = () => {
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);

  const handleFilesSelected = useCallback((files: File[]) => {
    setAudioFiles(files);
    setActiveAudioIndex(null); // Reset active audio when new files are loaded
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Robust Audio Player
            </h1>
            <p className="text-muted-foreground text-lg">
              Professional multi-audio player for educational programs
            </p>
          </div>

          {/* File Selector */}
          <FileSelector onFilesSelected={handleFilesSelected} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Audio Player
            </h1>
            <p className="text-muted-foreground">
              {audioFiles.length} audio file{audioFiles.length !== 1 ? 's' : ''} loaded
            </p>
          </div>

          <div className="flex space-x-3">
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
          </div>
        </div>

        {/* Status Info */}
        {activeAudioIndex !== null && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              <span className="font-medium text-primary">
                Currently Playing: {audioFiles[activeAudioIndex]?.name}
              </span>
            </div>
          </div>
        )}

        {/* Audio Containers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-sm">
            Auto-loop enabled • Only one audio plays at a time • Sorted by numerical priority
          </p>
        </div>
      </div>
    </div>
  );
};