import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  audioPath: string;
  audioName: string;
  className?: string;
  autoPlay?: boolean;
  showWaveform?: boolean;
  compact?: boolean;
}

export function AudioPlayer({ 
  audioPath, 
  audioName, 
  className = '', 
  autoPlay = false, 
  showWaveform = false,
  compact = false
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load audio file path from Electron
  useEffect(() => {
    const loadAudioPath = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await window.electronAPI.audioGetFilePath(audioPath);
        
        if (result.success && result.exists) {
          // Create a file URL for the audio file
          const fileUrl = `file://${result.fullPath}`;
          setAudioUrl(fileUrl);
        } else {
          setError('Audio file not found');
        }
      } catch (err) {
        console.error('Error loading audio file:', err);
        setError('Failed to load audio file');
      } finally {
        setIsLoading(false);
      }
    };

    if (audioPath) {
      loadAudioPath();
    }
  }, [audioPath]);

  // Handle audio metadata loaded
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      
      if (autoPlay) {
        handlePlay();
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Error playing audio file');
      setIsPlaying(false);
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, autoPlay]);

  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Error playing audio');
      setIsPlaying(false);
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    if (isPlaying) {
      audio.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading audio...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-600 dark:text-red-400 ${className}`}>
        <Volume2 size={16} />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div 
        className={`flex items-center space-x-2 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePlay();
          }}
          className="w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {audioName}
        </span>
        {duration > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" />
      
      {/* Audio Name */}
      <div className="flex items-center space-x-2 mb-3">
        <Volume2 size={16} className="text-gray-600 dark:text-gray-400" />
        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {audioName}
        </span>
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgb(37 99 235) 0%, rgb(37 99 235) ${(currentTime / duration) * 100}%, rgb(209 213 219) ${(currentTime / duration) * 100}%, rgb(209 213 219) 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRestart();
          }}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title="Restart"
        >
          <RotateCcw size={16} />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePlay();
          }}
          className="w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>
    </div>
  );
}
