import React, { useCallback, useRef, useState } from 'react';
import { Upload, FolderOpen, Music, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileSelectorProps {
  onFilesSelected: (files: File[]) => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({ onFilesSelected }) => {
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
    // Extract number from start of filename (e.g., "1-track.mp3" -> 1)
    const match = filename.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : Infinity;
  };

  const sortAudioFiles = (files: File[]): File[] => {
    return files.sort((a, b) => {
      const numA = extractNumber(a.name);
      const numB = extractNumber(b.name);
      
      // First sort by number
      if (numA !== numB) {
        return numA - numB;
      }
      
      // If numbers are same or both don't have numbers, sort alphabetically
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
        // @ts-ignore - webkitdirectory is not in standard but widely supported
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