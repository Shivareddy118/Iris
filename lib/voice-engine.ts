// Voice engine utility for speech synthesis and recognition

let voices: SpeechSynthesisVoice[] = []

export function initVoices() {
  voices = window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices()
  }
}

export function speak(text: string, rate = 1, volume = 1, pitch = 1) {
  if (!text) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = rate
  utter.volume = volume
  utter.pitch = pitch

  const femaleVoice = voices.find((v) =>
    v.name.toLowerCase().includes("female")
  )
  if (femaleVoice) utter.voice = femaleVoice

  window.speechSynthesis.speak(utter)
}

export function wishMe() {
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 12) {
    speak("Good Morning Boss...")
  } else if (hour >= 12 && hour < 17) {
    speak("Good Afternoon Master...")
  } else {
    speak("Good Evening Sir...")
  }
}

export function createRecognition() {
  const SpeechRecognitionAPI =
    (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
  if (!SpeechRecognitionAPI) return null
  return new SpeechRecognitionAPI()
}
