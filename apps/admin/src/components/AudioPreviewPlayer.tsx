'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioAsset {
  id: string;
  kind: string;
  lineIndex?: number;
  storageKey: string;
  durationMs?: number;
}

interface AudioPreviewPlayerProps {
  sessionId: string;
  assets: AudioAsset[];
  affirmations: Array<{ id: string; idx: number; text: string }>;
  mergedAudioUrl?: string;
}

export default function AudioPreviewPlayer({
  sessionId,
  assets,
  affirmations,
  mergedAudioUrl,
}: AudioPreviewPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [layers, setLayers] = useState({
    affirmations: true,
    binaural: false,
    background: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get audio URL for current selection
  const getAudioUrl = (): string | null => {
    if (selectedLine !== null) {
      // Find affirmation line audio
      const lineAsset = assets.find(
        (a) => a.kind === 'affirmation_line' && a.lineIndex === selectedLine
      );
      if (lineAsset) {
        // Convert storage key to full URL if needed
        if (lineAsset.storageKey.startsWith('http')) {
          return lineAsset.storageKey;
        }
        // For local files, construct URL (adjust based on your setup)
        return `/api/audio/${lineAsset.storageKey}`;
      }
    }

    // Return merged audio if available
    if (mergedAudioUrl) {
      return mergedAudioUrl;
    }

    return null;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime * 1000);
    const updateDuration = () => setDuration(audio.duration * 1000);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setPlaying(false));
    };
  }, [selectedLine, mergedAudioUrl]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = newTime / 1000;
    setCurrentTime(newTime);
  };

  const handleLineSelect = (lineIndex: number) => {
    setSelectedLine(lineIndex);
    setPlaying(false);
    // Reset audio when switching lines
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const audioUrl = getAudioUrl();

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Audio Preview</h3>

        {/* Layer Toggles */}
        <div className="mb-4 flex gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={layers.affirmations}
              onChange={(e) => setLayers({ ...layers, affirmations: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Affirmations</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={layers.binaural}
              onChange={(e) => setLayers({ ...layers, binaural: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Binaural</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={layers.background}
              onChange={(e) => setLayers({ ...layers, background: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Background</span>
          </label>
        </div>

        {/* Audio Player */}
        {audioUrl ? (
          <>
            <audio ref={audioRef} src={audioUrl} preload="metadata" />
            
            <div className="space-y-4">
              {/* Playback Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePlayPause}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {playing ? '⏸ Pause' : '▶ Play'}
                </button>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={duration > 0 ? (currentTime / duration) * 100 : 0}
                    onChange={handleSeek}
                    className="w-full"
                  />
                </div>
                <div className="text-sm text-gray-600 min-w-[80px] text-right">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Current Selection */}
              <div className="text-sm text-gray-600">
                {selectedLine !== null ? (
                  <span>
                    Playing: Line {selectedLine + 1} - {affirmations[selectedLine]?.text.substring(0, 50)}...
                  </span>
                ) : (
                  <span>Playing: Full Mix</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-500 py-4">
            No audio available for preview
          </div>
        )}

        {/* Line-by-Line Selection */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Play by Line</h4>
          <div className="space-y-2">
            <button
              onClick={() => {
                setSelectedLine(null);
                setPlaying(false);
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                }
              }}
              className={`w-full text-left px-3 py-2 rounded border ${
                selectedLine === null
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-medium">Full Mix</span>
            </button>
            {affirmations.map((aff, index) => {
              const hasAudio = assets.some(
                (a) => a.kind === 'affirmation_line' && a.lineIndex === index
              );
              return (
                <button
                  key={aff.id}
                  onClick={() => handleLineSelect(index)}
                  disabled={!hasAudio}
                  className={`w-full text-left px-3 py-2 rounded border ${
                    selectedLine === index
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!hasAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      <span className="font-medium">Line {index + 1}:</span>{' '}
                      {aff.text.substring(0, 60)}
                      {aff.text.length > 60 ? '...' : ''}
                    </span>
                    {!hasAudio && (
                      <span className="text-xs text-gray-400">No audio</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

