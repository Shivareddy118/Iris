const btn = document.querySelector('.talk');
const content = document.querySelector('.content');
let voices = [];
let speakingInterval = null;
let isSpeakingContinuously = false;

// ----------------------------
// SPEAK FUNCTION
// ----------------------------
function speak(text, rate = 1, volume = 1, pitch = 1) {
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.volume = volume;
    utter.pitch = pitch;

    const femaleVoice = voices.find(v => v.name.toLowerCase().includes('female'));
    if (femaleVoice) utter.voice = femaleVoice;

    window.speechSynthesis.speak(utter);
}

// ----------------------------
// WISH FUNCTION
// ----------------------------
function wishMe() {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 12) {
        speak("Good Morning Boss...");
    } else if (hour >= 12 && hour < 17) {
        speak("Good Afternoon Master...");
    } else {
        speak("Good Evening Sir...");
    }
}

// ----------------------------
// CONTINUOUS SPEAKING
// ----------------------------
function startSpeakingTime() {
    stopSpeaking();
    isSpeakingContinuously = true;

    const speakTime = () => {
        if (!isSpeakingContinuously) return;
        speak("The current time is " + new Date().toLocaleTimeString());
    };

    speakTime(); // immediate
    speakingInterval = setInterval(speakTime, 60000); // every 1 minute
}

function startSpeakingDate() {
    stopSpeaking();
    isSpeakingContinuously = true;

    const speakDate = () => {
        if (!isSpeakingContinuously) return;
        speak("Today's date is " + new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }));
    };

    speakDate(); // immediate
    speakingInterval = setInterval(speakDate, 3600000); // every 1 hour
}

function stopSpeaking() {
    isSpeakingContinuously = false;
    if (speakingInterval) {
        clearInterval(speakingInterval);
        speakingInterval = null;
    }
    speak("Stopped continuous speech.");
}

// ----------------------------
// LOAD VOICES
// ----------------------------
window.addEventListener('load', () => {
    speak("Initializing IRIS...");
    wishMe();
    voices = window.speechSynthesis.getVoices();
});
window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
};

// ----------------------------
// SPEECH RECOGNITION
// ----------------------------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.onresult = (event) => {
    const transcript = event.results[event.resultIndex][0].transcript.toLowerCase();
    content.textContent = transcript;
    takeCommand(transcript);
};

btn.addEventListener('click', () => {
    content.textContent = "Listening....";
    recognition.start();
});

// ----------------------------
// COMMANDS
// ----------------------------
function takeCommand(message) {
    if (message.includes('hey') || message.includes('hello')) {
        speak("Hello Sir, How May I Help You?");
    } else if (message.includes("who are you")) {
        speak("I am IRIS, your personal assistant.");
    } else if (message.includes("what is my name")) {
        speak("Your name is Shiva");
    } else if (message.includes("open google")) {
        window.open("https://google.com", "_blank");
        speak("Opening Google...");
    } else if (message.includes("open youtube")) {
        window.open("https://youtube.com", "_blank");
        speak("Opening YouTube...");
    } else if (message.includes("open facebook")) {
        window.open("https://facebook.com", "_blank");
        speak("Opening Facebook...");
    } else if (message.includes("time")) {
        startSpeakingTime();
    } else if (message.includes("date")) {
        startSpeakingDate();
    } else if (message.includes("stop")) {
        stopSpeaking();
    } else if (message.includes('wikipedia')) {
        const search = message.replace("wikipedia", "").trim();
        window.open(`https://en.wikipedia.org/wiki/${search}`, "_blank");
        speak("Here is what I found on Wikipedia for " + search);
    } 
    // ---------------------------- Calculator ----------------------------
    else if (message.includes('calculator')) {
        openCalculator();
    } 
    // ---------------------------- Note App ----------------------------
    else if (message.includes('note') || message.includes('notepad')) {
        openNoteApp();
    } 
    else {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        speak("I found some information for " + message + " on Google");
    }
}

// ----------------------------
// CALCULATOR
// ----------------------------
function openCalculator() {
    try {
        window.open('calculator:///'); // Windows calculator
        speak("Opening Calculator");
    } catch {
        speak("Sorry, I cannot open the calculator on this device.");
    }
}

// ----------------------------
// NOTE APP
// ----------------------------
function openNoteApp() {
    const noteWindow = window.open("", "Notes", "width=400,height=400");
    noteWindow.document.write(`
        <html>
        <head>
            <title>IRIS Note App</title>
            <style>
                body { font-family: Arial; padding: 10px; }
                textarea { width: 100%; height: 90%; font-size: 16px; }
            </style>
        </head>
        <body>
            <h3>IRIS Note App</h3>
            <textarea placeholder="Write your notes here..."></textarea>
        </body>
        </html>
    `);
    speak("Opening Note App");
}

// ----------------------------
// READ SELECTED TEXT
// ----------------------------
document.addEventListener('selectionchange', () => {
    const selectedText = window.getSelection().toString();
    if (selectedText && !isSpeakingContinuously) speak(selectedText, 1.2, 1.5);
});

// ----------
// ------------------
// READ CENTER CONTENT WHEN SCROLLING
// ----------------------------
let lastScrollTime = 0;
window.addEventListener('scroll', () => {
    const now = Date.now();
    if (now - lastScrollTime < 2000) return;
    lastScrollTime = now;

    if (isSpeakingContinuously) return; // skip if time/date is speaking

    const centerElement = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    const text = centerElement?.textContent?.trim();
    if (text) speak(text, 1, 1.5);
});
