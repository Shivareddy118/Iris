"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  ListMusic,
  Music,
  X,
} from "lucide-react"
import type { VirtualFile } from "./file-manager"

interface MusicPlayerProps {
  audioFiles: VirtualFile[]
  currentTrack: VirtualFile | null
  setCurrentTrack: (file: VirtualFile | null) => void
}

export function MusicPlayer({ audioFiles, currentTrack, setCurrentTrack }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  const playTrack = useCallback(
    (file: VirtualFile) => {
      setCurrentTrack(file)
      setIsPlaying(true)
    },
    [setCurrentTrack]
  )

  const togglePlay = () => {
    if (!currentTrack) {
      if (audioFiles.length > 0) {
        playTrack(audioFiles[0])
      }
      return
    }
    setIsPlaying((prev) => !prev)
  }

  const playNext = useCallback(() => {
    if (audioFiles.length === 0) return
    if (!currentTrack) {
      playTrack(audioFiles[0])
      return
    }
    const currentIndex = audioFiles.findIndex((f) => f.id === currentTrack.id)
    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * audioFiles.length)
      playTrack(audioFiles[randomIndex])
    } else {
      const nextIndex = (currentIndex + 1) % audioFiles.length
      playTrack(audioFiles[nextIndex])
    }
  }, [audioFiles, currentTrack, isShuffled, playTrack])

  const playPrev = () => {
    if (audioFiles.length === 0) return
    if (!currentTrack) {
      playTrack(audioFiles[0])
      return
    }
    const currentIndex = audioFiles.findIndex((f) => f.id === currentTrack.id)
    const prevIndex = (currentIndex - 1 + audioFiles.length) % audioFiles.length
    playTrack(audioFiles[prevIndex])
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (currentTrack?.blobUrl) {
      audio.src = currentTrack.blobUrl
      if (isPlaying) {
        audio.play().catch(() => {
          setIsPlaying(false)
        })
      }
    }
  }, [currentTrack, isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0
        audio.play()
      } else {
        playNext()
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [isRepeat, playNext])

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const bar = progressRef.current
    if (!audio || !bar) return
    const rect = bar.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * duration
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const trackName = currentTrack?.name?.replace(/\.[^/.]+$/, "") || "No track selected"

  return (
    <div className="flex h-full flex-col">
      <audio ref={audioRef} preload="metadata" />

      {/* Album Art / Visualizer area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-2 border-border bg-secondary/50 sm:h-48 sm:w-48">
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-full bg-card sm:h-40 sm:w-40 ${
              isPlaying ? "animate-spin" : ""
            }`}
            style={{ animationDuration: "3s" }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
              <Music className="h-6 w-6 text-primary" />
            </div>
          </div>
          {isPlaying && (
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
          )}
        </div>

        <div className="text-center">
          <h3 className="text-balance text-sm font-medium text-foreground">{trackName}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {audioFiles.length} track{audioFiles.length !== 1 ? "s" : ""} in library
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4">
        <div
          ref={progressRef}
          className="group relative h-1.5 cursor-pointer rounded-full bg-secondary"
          onClick={handleProgressClick}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
            style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 p-4">
        <button
          onClick={() => setIsShuffled((prev) => !prev)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            isShuffled ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          title="Shuffle"
        >
          <Shuffle className="h-4 w-4" />
        </button>

        <button
          onClick={playPrev}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
          title="Previous"
        >
          <SkipBack className="h-5 w-5" />
        </button>

        <button
          onClick={togglePlay}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>

        <button
          onClick={() => playNext()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
          title="Next"
        >
          <SkipForward className="h-5 w-5" />
        </button>

        <button
          onClick={() => setIsRepeat((prev) => !prev)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            isRepeat ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          title="Repeat"
        >
          <Repeat className="h-4 w-4" />
        </button>
      </div>

      {/* Volume + Playlist toggle */}
      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <button
          onClick={() => setIsMuted((prev) => !prev)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            setVolume(Number(e.target.value))
            setIsMuted(false)
          }}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
        />
        <button
          onClick={() => setShowPlaylist((prev) => !prev)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            showPlaylist ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          title="Playlist"
        >
          <ListMusic className="h-4 w-4" />
        </button>
      </div>

      {/* Playlist panel */}
      {showPlaylist && (
        <div className="border-t border-border">
          <div className="flex items-center justify-between px-4 py-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Playlist
            </h4>
            <button
              onClick={() => setShowPlaylist(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {audioFiles.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                No audio files found. Upload music files to get started.
              </p>
            ) : (
              audioFiles.map((file) => (
                <button
                  key={file.id}
                  onClick={() => playTrack(file)}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left text-xs transition-colors hover:bg-secondary ${
                    currentTrack?.id === file.id ? "bg-secondary text-primary" : "text-foreground"
                  }`}
                >
                  {currentTrack?.id === file.id && isPlaying ? (
                    <div className="flex h-4 w-4 items-center justify-center gap-px">
                      <span className="inline-block h-3 w-0.5 animate-pulse bg-primary" />
                      <span className="inline-block h-2 w-0.5 animate-pulse bg-primary" style={{ animationDelay: "0.15s" }} />
                      <span className="inline-block h-3.5 w-0.5 animate-pulse bg-primary" style={{ animationDelay: "0.3s" }} />
                    </div>
                  ) : (
                    <Music className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="truncate">{file.name.replace(/\.[^/.]+$/, "")}</span>
                  <span className="ml-auto text-muted-foreground">{formatSize(file.size)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatSize(bytes?: number) {
  if (!bytes) return "--"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
