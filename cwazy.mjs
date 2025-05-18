const MORSE_CODE = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '/': '-..-.', '?': '..--..', '.': '.-.-.-', '!': '-.-.--',
    'AR': '.-.-.', 'BK': '-...-.-',
};

export class Cwazy {
    constructor(options) {
        options = options || {};
        this.wpm = options.wpm || 20;
        this.toneFreq = options.toneFreq || 600;
        this.oscVolume = options.oscVolume || 0.9;
        this.noiseVolume = options.noiseVolume || 0.9;
        this.bandpassLowFreq = 300;
        this.bandpassHighFreq = 900;
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

    get oscVolume() {
        return this._oscVolume;
    }
    set oscVolume(x) {
        this._oscVolume = x;
        if (this._audioContext && this._oscVolumeNode) {
            this._oscVolumeNode.gain.setValueAtTime(x, this._audioContext.currentTime);
        }
    }

    get noiseVolume() {
        return this._noiseVolume;
    }
    set noiseVolume(x) {
        this._noiseVolume = x;
        if (this._audioContext && this._noiseGainNode) {
            this._noiseGainNode.gain.setValueAtTime(x, this._audioContext.currentTime);
        }
    }

    get toneFreq() {
        return this._toneFreq;
    }
    set toneFreq(x) {
        this._toneFreq = x;
        if (this._audioContext && this._oscNode) {
            this._oscNode.frequency.setValueAtTime(x, this._audioContext.currentTime);
        }
    }

    get bandpassLowFreq() {
        return this._bandpassLowFreq;
    }
    set bandpassLowFreq(x) {
        this._bandpassLowFreq = x;
        if (this._audioContext && this._highpassNode) {
            this._highpassNode.frequency.setValueAtTime(x, this._audioContext.currentTime);
        }
    }
    
    get bandpassHighFreq() {
        return this._bandpassHighFreq;
    }
    set bandpassHighFreq(x) {
        this._bandpassHighFreq = x;
        if (this._audioContext && this._lowpassNode) {
            this._lowpassNode.frequency.setValueAtTime(x, this._audioContext.currentTime);
        }
    }

    async start() {
        if (this._audioContext) return;

        const audioContext = new AudioContext();
        this._audioContext = audioContext;

        await audioContext.audioWorklet.addModule("random-noise-processor.js");
        const randomNoiseNode = new AudioWorkletNode(
            audioContext,
            "random-noise-processor",
        );
    
        const noiseGainNode = audioContext.createGain();
        this._noiseGainNode = noiseGainNode;
        noiseGainNode.gain.setValueAtTime(this._noiseVolume, audioContext.currentTime);
    
        const oscNode = audioContext.createOscillator();
        this._oscNode = oscNode;
        oscNode.frequency.setValueAtTime(this.toneFreq, audioContext.currentTime);
        oscNode.type = "sine";
        oscNode.start();

        const oscVolumeNode = audioContext.createGain();
        this._oscVolumeNode = oscVolumeNode;
        oscVolumeNode.gain.setValueAtTime(this.oscVolume, audioContext.currentTime);
    
        const oscGainNode = audioContext.createGain();
        this._oscGainNode = oscGainNode;
        oscGainNode.gain.setValueAtTime(0, audioContext.currentTime);

        const mergerNode = audioContext.createChannelMerger();
    
        const lowpassNode = audioContext.createBiquadFilter();
        this._lowpassNode = lowpassNode;
        lowpassNode.type = "lowpass";
        lowpassNode.frequency.setValueAtTime(this.bandpassHighFreq, audioContext.currentTime);
    
        const highpassNode = audioContext.createBiquadFilter();
        this._highpassNode = highpassNode;
        highpassNode.type = "highpass";
        highpassNode.frequency.setValueAtTime(this.bandpassLowFreq, audioContext.currentTime);
    
        randomNoiseNode.connect(noiseGainNode);
        noiseGainNode.connect(mergerNode, 0, 0);
    
        oscNode.connect(oscVolumeNode);
        oscVolumeNode.connect(oscGainNode);
        oscGainNode.connect(mergerNode, 0, 1);
    
        mergerNode.connect(lowpassNode);
        lowpassNode.connect(highpassNode);
        highpassNode.connect(audioContext.destination);        
    }

    async stop() {
        if (this._audioContext === undefined) return;
        await this._audioContext.close();
        this._audioContext = undefined;
        this._oscNode = undefined;
        this._oscVolumeNode = undefined;
        this._oscGainNode = undefined;
        this._noiseGainNode = undefined;
        this._lowpaasNode = undefined;
        this._highpassNode = undefined;
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