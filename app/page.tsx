"use client"

import { useState, useCallback, useMemo } from "react"
import {
  FolderOpen,
  Music,
  Cpu,
  Monitor,
  HardDrive,
} from "lucide-react"
import { FileManager, type VirtualFile } from "@/components/file-manager"
import { MusicPlayer } from "@/components/music-player"
import { IrisAssistant } from "@/components/iris-assistant"
import { speak } from "@/lib/voice-engine"

type ActivePanel = "files" | "music" | "assistant"

export default function IrisPage() {
  const [files, setFiles] = useState<VirtualFile[]>([])
  const [currentTrack, setCurrentTrack] = useState<VirtualFile | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>("assistant")
  const [irisResponse, setIrisResponse] = useState("")

  // Collect all audio files recursively
  const audioFiles = useMemo(() => {
    const collect = (items: VirtualFile[]): VirtualFile[] => {
      const result: VirtualFile[] = []
      for (const item of items) {
        if (item.type === "file" && item.mimeType?.startsWith("audio/")) {
          result.push(item)
        }
        if (item.children) {
          result.push(...collect(item.children))
        }
      }
      return result
    }
    return collect(files)
  }, [files])

  const handlePlayAudio = useCallback((file: VirtualFile) => {
    setCurrentTrack(file)
    setActivePanel("music")
    speak(`Now playing ${file.name.replace(/\.[^/.]+$/, "")}`)
  }, [])

  const handleCommand = useCallback(
    (command: string) => {
      // File management commands
      if (command.includes("open file") || command.includes("open files") || command.includes("file manager")) {
        setActivePanel("files")
        const msg = "Opening File Manager..."
        setIrisResponse(msg)
        speak(msg)
      }
      // Music commands
      else if (command.includes("play music") || command.includes("music player") || command.includes("open music")) {
        setActivePanel("music")
        const msg = "Opening Music Player..."
        setIrisResponse(msg)
        speak(msg)
        if (audioFiles.length > 0 && !currentTrack) {
          setCurrentTrack(audioFiles[0])
        }
      }
      else if (command.includes("next song") || command.includes("next track") || command.includes("skip")) {
        if (audioFiles.length > 0) {
          const currentIndex = currentTrack
            ? audioFiles.findIndex((f) => f.id === currentTrack.id)
            : -1
          const nextIndex = (currentIndex + 1) % audioFiles.length
          setCurrentTrack(audioFiles[nextIndex])
          setActivePanel("music")
          const msg = `Playing next: ${audioFiles[nextIndex].name.replace(/\.[^/.]+$/, "")}`
          setIrisResponse(msg)
          speak(msg)
        } else {
          speak("No audio files in your library.")
        }
      }
      else if (command.includes("previous song") || command.includes("previous track")) {
        if (audioFiles.length > 0) {
          const currentIndex = currentTrack
            ? audioFiles.findIndex((f) => f.id === currentTrack.id)
            : 0
          const prevIndex = (currentIndex - 1 + audioFiles.length) % audioFiles.length
          setCurrentTrack(audioFiles[prevIndex])
          setActivePanel("music")
          const msg = `Playing: ${audioFiles[prevIndex].name.replace(/\.[^/.]+$/, "")}`
          setIrisResponse(msg)
          speak(msg)
        }
      }
      else if (command.includes("stop music") || command.includes("pause music") || command.includes("pause")) {
        setCurrentTrack(null)
        const msg = "Music paused."
        setIrisResponse(msg)
        speak(msg)
      }
      // Create file command
      else if (command.includes("create file") || command.includes("new file")) {
        setActivePanel("files")
        const nameMatch = command.match(/(?:create file|new file)\s+(.+)/)
        const fileName = nameMatch ? nameMatch[1].trim() : `new-file-${Date.now()}.txt`
        const newFile: VirtualFile = {
          id: crypto.randomUUID(),
          name: fileName.includes(".") ? fileName : `${fileName}.txt`,
          type: "file",
          mimeType: "text/plain",
          content: "",
          createdAt: new Date(),
        }
        setFiles((prev) => [...prev, newFile])
        const msg = `Created file: ${newFile.name}`
        setIrisResponse(msg)
        speak(msg)
      }
      // Create folder command
      else if (command.includes("create folder") || command.includes("new folder")) {
        setActivePanel("files")
        const nameMatch = command.match(/(?:create folder|new folder)\s+(.+)/)
        const folderName = nameMatch ? nameMatch[1].trim() : `new-folder-${Date.now()}`
        const newFolder: VirtualFile = {
          id: crypto.randomUUID(),
          name: folderName,
          type: "folder",
          children: [],
          createdAt: new Date(),
        }
        setFiles((prev) => [...prev, newFolder])
        const msg = `Created folder: ${newFolder.name}`
        setIrisResponse(msg)
        speak(msg)
      }
      // Web commands (preserved from original)
      else if (command.includes("open google")) {
        window.open("https://google.com", "_blank")
        speak("Opening Google...")
      }
      else if (command.includes("open youtube")) {
        window.open("https://youtube.com", "_blank")
        speak("Opening YouTube...")
      }
      else if (command.includes("open facebook")) {
        window.open("https://facebook.com", "_blank")
        speak("Opening Facebook...")
      }
      else if (command.includes("wikipedia")) {
        const search = command.replace("wikipedia", "").trim()
        window.open(`https://en.wikipedia.org/wiki/${search}`, "_blank")
        speak("Here is what I found on Wikipedia for " + search)
      }
      else if (command.includes("time")) {
        const msg = "The current time is " + new Date().toLocaleTimeString()
        setIrisResponse(msg)
        speak(msg)
      }
      else if (command.includes("date")) {
        const msg = "Today's date is " + new Date().toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
        setIrisResponse(msg)
        speak(msg)
      }
      else if (command.includes("hello") || command.includes("hey")) {
        speak("Hello Sir, How May I Help You?")
        setIrisResponse("Hello Sir, How May I Help You?")
      }
      else if (command.includes("who are you")) {
        speak("I am IRIS, your personal assistant.")
        setIrisResponse("I am IRIS, your personal assistant.")
      }
      else if (command.includes("calculator")) {
        const noteWindow = window.open("", "Calculator", "width=350,height=500")
        if (noteWindow) {
          noteWindow.document.write(`
            <html>
            <head><title>IRIS Calculator</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: monospace; background: #0a0a0f; color: #e0f0f0; padding: 20px; }
              .display { width: 100%; padding: 20px; font-size: 28px; text-align: right; background: #0d1117; border: 1px solid #1e3a4a; border-radius: 8px; color: #00bcd4; margin-bottom: 16px; }
              .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
              button { padding: 16px; font-size: 18px; border: 1px solid #1e3a4a; background: #1a2332; color: #c8e0e0; border-radius: 8px; cursor: pointer; font-family: monospace; }
              button:hover { background: #00bcd4; color: #0a0a0f; }
              .op { background: #00bcd4; color: #0a0a0f; }
            </style></head>
            <body>
              <input class="display" id="display" value="0" readonly />
              <div class="grid">
                <button onclick="c()">C</button><button onclick="a('(')">(</button><button onclick="a(')')">)</button><button class="op" onclick="a('/')">/</button>
                <button onclick="a('7')">7</button><button onclick="a('8')">8</button><button onclick="a('9')">9</button><button class="op" onclick="a('*')">*</button>
                <button onclick="a('4')">4</button><button onclick="a('5')">5</button><button onclick="a('6')">6</button><button class="op" onclick="a('-')">-</button>
                <button onclick="a('1')">1</button><button onclick="a('2')">2</button><button onclick="a('3')">3</button><button class="op" onclick="a('+')">+</button>
                <button onclick="a('0')">0</button><button onclick="a('.')">.</button><button onclick="del()">DEL</button><button class="op" onclick="eq()">=</button>
              </div>
              <script>
                let d=document.getElementById('display'),v='';
                function a(x){v+=x;d.value=v}
                function c(){v='';d.value='0'}
                function del(){v=v.slice(0,-1);d.value=v||'0'}
                function eq(){try{d.value=eval(v);v=d.value}catch(e){d.value='Error';v=''}}
              </script>
            </body></html>
          `)
        }
        speak("Opening Calculator")
      }
      else if (command.includes("note") || command.includes("notepad")) {
        const noteWindow = window.open("", "Notes", "width=400,height=400")
        if (noteWindow) {
          noteWindow.document.write(`
            <html>
            <head><title>IRIS Notes</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: monospace; background: #0a0a0f; color: #e0f0f0; padding: 20px; }
              h3 { color: #00bcd4; margin-bottom: 12px; }
              textarea { width: 100%; height: calc(100vh - 60px); font-size: 14px; background: #0d1117; color: #c8e0e0; border: 1px solid #1e3a4a; border-radius: 8px; padding: 12px; resize: none; outline: none; font-family: monospace; }
              textarea:focus { border-color: #00bcd4; }
            </style></head>
            <body>
              <h3>IRIS Notes</h3>
              <textarea placeholder="Write your notes here..."></textarea>
            </body></html>
          `)
        }
        speak("Opening Note App")
      }
      // Default: search Google
      else {
        window.open(`https://www.google.com/search?q=${command.replace(" ", "+")}`, "_blank")
        speak("I found some information for " + command + " on Google")
      }
    },
    [audioFiles, currentTrack, setFiles]
  )

  const panels = [
    { id: "assistant" as const, label: "IRIS", icon: Cpu },
    { id: "files" as const, label: "Files", icon: FolderOpen },
    { id: "music" as const, label: "Music", icon: Music },
  ]

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Top header bar */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Monitor className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-wider">I R I S</h1>
            <p className="text-[10px] text-muted-foreground">Intelligent Response Interface System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {irisResponse && (
            <p className="hidden text-xs text-primary sm:block">
              {irisResponse}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5" />
            <span>{files.length} items</span>
            <span className="text-border">|</span>
            <Music className="h-3.5 w-3.5" />
            <span>{audioFiles.length} tracks</span>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {panels.map((panel) => (
          <button
            key={panel.id}
            onClick={() => setActivePanel(panel.id)}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-xs font-medium transition-colors ${
              activePanel === panel.id
                ? "border-b-2 border-primary bg-secondary/30 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <panel.icon className="h-4 w-4" />
            <span>{panel.label}</span>
            {panel.id === "music" && currentTrack && (
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col" style={{ height: "calc(100vh - 105px)" }}>
        {activePanel === "assistant" && (
          <IrisAssistant onCommand={handleCommand} />
        )}
        {activePanel === "files" && (
          <FileManager
            files={files}
            setFiles={setFiles}
            onPlayAudio={handlePlayAudio}
          />
        )}
        {activePanel === "music" && (
          <MusicPlayer
            audioFiles={audioFiles}
            currentTrack={currentTrack}
            setCurrentTrack={setCurrentTrack}
          />
        )}
      </div>

      {/* Mini player bar (shown when music is playing and not on music tab) */}
      {currentTrack && activePanel !== "music" && (
        <div
          className="flex cursor-pointer items-center gap-3 border-t border-border bg-card px-4 py-2"
          onClick={() => setActivePanel("music")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setActivePanel("music")}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
            <Music className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">
              {currentTrack.name.replace(/\.[^/.]+$/, "")}
            </p>
            <p className="text-[10px] text-muted-foreground">Now Playing</p>
          </div>
          <div className="flex items-center gap-px">
            <span className="inline-block h-3 w-0.5 animate-pulse rounded-full bg-primary" />
            <span className="inline-block h-2 w-0.5 animate-pulse rounded-full bg-primary" style={{ animationDelay: "0.15s" }} />
            <span className="inline-block h-3.5 w-0.5 animate-pulse rounded-full bg-primary" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>
      )}
    </main>
  )
}
