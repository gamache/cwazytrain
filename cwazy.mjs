const MORSE_CODE = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
    'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
    'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
    'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '/': '-..-.', 
};

export class Cwazy {
    constructor(options = {}) {
        this.wpm = options.wpm || 20;
        this.toneFreq = options.toneFreq || 600;
    }

    get wpm() {
        return this._wpm;
    }
    set wpm(x) {
        this._wpm = x;
        this._unit = 1.2 / x;
        this.dit = this._unit;
        this.dah = this.dit * 3;
        this.betweenSymbols = this.dit;
        this.betweenChars = this.dit * 3;
        this.betweenWords = this.dit * 7; 
    }

    async start() {
        if (this._audioContext) return;

        const audioContext = new AudioContext();
        this._audioContext = audioContext;

        const FL = 300;
        const FH = 800;

        await audioContext.audioWorklet.addModule("random-noise-processor.js");
        const randomNoiseNode = new AudioWorkletNode(
            audioContext,
            "random-noise-processor",
        );
    
        const noiseGainNode = audioContext.createGain();
        noiseGainNode.gain.setValueAtTime(0.9, audioContext.currentTime);
    
        const oscillatorNode = audioContext.createOscillator();
        oscillatorNode.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillatorNode.type = "sine";
        oscillatorNode.start();
    
        const oscGainNode = audioContext.createGain();
        this._oscGainNode = oscGainNode;
        oscGainNode.gain.setValueAtTime(0, audioContext.currentTime);
        /*
        for (let i=0; i<10; i++) {
            oscGainNode.gain.setValueAtTime(1, audioContext.currentTime + 0.2 + 0.4*i);
            oscGainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.4 + 0.4*i);
        }
        */
        
        const mergerNode = audioContext.createChannelMerger();
    
        const lowpassNode = audioContext.createBiquadFilter();
        lowpassNode.frequency.setValueAtTime(FH, audioContext.currentTime);
    
        const highpassNode = audioContext.createBiquadFilter();
        highpassNode.frequency.setValueAtTime(FL, audioContext.currentTime);
    
        randomNoiseNode.connect(noiseGainNode);
        noiseGainNode.connect(mergerNode, 0, 0);
    
        oscillatorNode.connect(oscGainNode);
        oscGainNode.connect(mergerNode, 0, 1);
    
        mergerNode.connect(lowpassNode);
        lowpassNode.connect(highpassNode);
        highpassNode.connect(audioContext.destination);        
    }

    async stop() {
        if (this._audioContext === undefined) return;
        await this._audioContext.close();
        this._audioContext = undefined;
    }

    sendText(text) {
        const chars = text.split("");
        this.sendChars(chars);
    }
    
    sendChars(chars) {
        if (this._audioContext === undefined) return;
        for (const char of chars) {
            this.sendChar(char);
        }
    }

    sendChar(char) {
        if (this._audioContext === undefined) return;

        if (!this._nextCharStartAfter) {
            this._nextCharStartAfter = this._audioContext.currentTime;
        }
        let t = Math.max(
            this._nextCharStartAfter,
            this._audioContext.currentTime
        );

        if (char === " ") {
            t += this.betweenWords;
        } else {
            const morse = MORSE_CODE[char.toUpperCase()] || "........:";

            for (const sym of morse.split("")) {
                if (sym === ".") {
                    this._oscGainNode.gain.setValueAtTime(1, t);
                    this._oscGainNode.gain.setValueAtTime(0, t + this.dit);
                    t += this.dit + this.betweenSymbols;
                }
                if (sym === "-") {
                    this._oscGainNode.gain.setValueAtTime(1, t);
                    this._oscGainNode.gain.setValueAtTime(0, t + this.dah);
                    t += this.dah + this.betweenSymbols;
                }
            }
            t += this.betweenChars - this.betweenSymbols;
        }

        this._nextCharStartAfter = t;
    }
}