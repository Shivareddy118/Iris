"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Mic, MicOff, Terminal, X, Minimize2, Maximize2, HelpCircle } from "lucide-react"
import { speak, wishMe, initVoices, createRecognition } from "@/lib/voice-engine"

interface IrisAssistantProps {
  onCommand: (command: string) => void
}

interface LogEntry {
  id: string
  text: string
  type: "user" | "iris" | "system"
  timestamp: Date
}

export function IrisAssistant({ onCommand }: IrisAssistantProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("Click mic to speak...")
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const addLog = useCallback((text: string, type: LogEntry["type"]) => {
    setLogs((prev) => [
      ...prev.slice(-50),
      { id: crypto.randomUUID(), text, type, timestamp: new Date() },
    ])
  }, [])

  useEffect(() => {
    initVoices()
    const timeout = setTimeout(() => {
      addLog("IRIS initialized. Ready for commands.", "system")
      speak("Initializing IRIS...")
      wishMe()
    }, 500)
    return () => clearTimeout(timeout)
  }, [addLog])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const startListening = () => {
    const recognition = createRecognition()
    if (!recognition) {
      addLog("Speech recognition not supported in this browser.", "system")
      return
    }

    recognitionRef.current = recognition
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex][0].transcript.toLowerCase()
      setTranscript(result)
      addLog(result, "user")
      onCommand(result)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
      addLog("Listening stopped.", "system")
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
    setIsListening(true)
    setTranscript("Listening...")
    addLog("Listening...", "system")
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Terminal header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Terminal className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-foreground">IRIS Console</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setShowHelp((p) => !p)}
            className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${showHelp ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title="Show commands"
          >
            <HelpCircle className="h-3 w-3" />
          </button>
          <button
            onClick={() => setIsMinimized((p) => !p)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </button>
          <button
            onClick={() => setLogs([])}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            title="Clear logs"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Help panel */}
      {showHelp && !isMinimized && (
        <div className="border-b border-border bg-secondary/30 p-3">
          <h4 className="mb-2 text-xs font-medium text-primary uppercase tracking-wider">Available Voice Commands</h4>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {[
              { cmd: "open files / file manager", desc: "Open file manager" },
              { cmd: "create file [name]", desc: "Create a new file" },
              { cmd: "create folder [name]", desc: "Create a new folder" },
              { cmd: "play music / open music", desc: "Open music player" },
              { cmd: "next song / skip", desc: "Play next track" },
              { cmd: "previous song", desc: "Play previous track" },
              { cmd: "pause / stop music", desc: "Pause playback" },
              { cmd: "open google / youtube", desc: "Open websites" },
              { cmd: "calculator", desc: "Open calculator" },
              { cmd: "notepad / note", desc: "Open note app" },
              { cmd: "time / date", desc: "Get current time or date" },
              { cmd: "wikipedia [topic]", desc: "Search Wikipedia" },
            ].map((item) => (
              <div key={item.cmd} className="flex items-start gap-2 rounded px-2 py-1 text-[11px]">
                <code className="shrink-0 rounded bg-card px-1.5 py-0.5 text-primary">{item.cmd}</code>
                <span className="text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isMinimized && (
        <>
          {/* Log area */}
          <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
            {logs.length === 0 && (
              <p className="text-muted-foreground">
                {'> '} Welcome to IRIS. Say a command or type below.
              </p>
            )}
            {logs.map((log) => (
              <div key={log.id} className="mb-1 flex gap-2">
                <span className="shrink-0 text-muted-foreground">
                  {log.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span
                  className={
                    log.type === "user"
                      ? "text-accent"
                      : log.type === "iris"
                        ? "text-primary"
                        : "text-muted-foreground"
                  }
                >
                  {log.type === "user" ? "> " : log.type === "iris" ? "IRIS: " : "// "}
                  {log.text}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>

          {/* Voice input area */}
          <div className="flex items-center gap-3 border-t border-border p-3">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
                isListening
                  ? "animate-pulse bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
              aria-label={isListening ? "Stop listening" : "Start listening"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{transcript}</p>
              <p className="text-[10px] text-muted-foreground">
                {isListening ? "Listening for voice command..." : "Click mic or say a command"}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
