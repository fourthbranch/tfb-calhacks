"use client";
import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, Loader } from "lucide-react";

interface PodcastPlayerProps {
  audioData: string;
  transcript: string;
  durationEstimate: number;
  onClose?: () => void;
}

export default function PodcastPlayer({
  audioData,
  transcript,
  durationEstimate,
  onClose,
}: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleEnded);

      return () => {
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("ended", handleEnded);
      };
    }
  }, []);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleLoadAudio = () => {
    setIsLoading(true);
    if (audioRef.current) {
      audioRef.current.load();
    }
  };

  useEffect(() => {
    handleLoadAudio();
  }, [audioData]);

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Podcast Summary
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        )}
      </div>

      {/* Audio Player */}
      <div className="mb-4">
        <audio ref={audioRef} preload="metadata">
          <source src={`data:audio/mp3;base64,${audioData}`} type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>

        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white p-3 rounded-full transition-colors"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || durationEstimate)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || durationEstimate}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #9333ea 0%, #9333ea ${
                  (currentTime / (duration || durationEstimate)) * 100
                }%, #e5e7eb ${
                  (currentTime / (duration || durationEstimate)) * 100
                }%, #e5e7eb 100%)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Transcript
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {transcript}
        </p>
      </div>
    </div>
  );
}
