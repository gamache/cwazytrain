export const MORSE_LETTERS = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..',
};
export const MORSE_NUMBERS = {
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
};
export const MORSE_SYMBOLS = {
    '/': '-..-.', '?': '..--..', '.': '.-.-.-', '!': '-.-.--',
}
export const MORSE_PROSIGNS = {
    'AR': '.-.-.', 'BK': '-...-.-', 'BT': '-...-', 'KN': '-.--.', 'SK': '...-.-', 'SOS': '...---...',
};
export const MORSE_CODE = {
    ...MORSE_LETTERS,
    ...MORSE_NUMBERS,
    ...MORSE_SYMBOLS,
    ...MORSE_PROSIGNS,
};

/**
 * Cwazy simulates received CW (Morse code) audio, using the Web Audio API.
 * It provides control over transmission speed (wpm), CW tone, received noise,
 * bandpass filtering, transmission timing, and more.
 */
export class CWazy {
    /**
     * Returns a Cwazy instance. All options can be also be set directly on
     * the instance object (e.g., `const cwazy = new Cwazy(); cwazy.wpm = 20;`).
     * 
     * @param {Object} options - Starting values for various parameters.
     * @param {number} options.wpm - Words per minute. Default 20.
     * @param {number} options.toneFreq - CW tone frequency (Hz). Default 600.
     * @param {number} options.toneVolume - CW tone volume, 0-1. Default 0.9.
     * @param {number} options.noiseVolume - Reception noise volume, 0-1. Default 0.9.
     * @param {number} options.bandpassLowFreq - Low frequency corner (Hz) of bandpass filter. Default 300.
     * @param {number} options.bandpassHighFreq - High frequency corner (Hz) of bandpass filter. Default 900.
     * @param {number} options.jitter - Randomness applied to dit, dah, and space length, specified as a number 0 (perfect sending rhythm) to 0.5 (a given symbol may be 50% shorter, 50% longer, or anywhere in between). Default 0.
     */
    constructor(options = {}) {
        this.wpm = options.wpm || 20;
        this.toneFreq = options.toneFreq || 600;
        this.toneVolume = options.toneVolume || 1.0;
        this.noiseVolume = options.noiseVolume || 0.5;
        this.bandpassLowFreq = options.bandpassLowFreq || 300;
        this.bandpassHighFreq = options.bandpassHighFreq || 900;
        this.jitter = options.jitter || 0;
    }

    /**
     * Returns the values of all settable fields.
     * @returns Object
     */
    fields() {
        return {
            wpm: this.wpm,
            toneFreq: this.toneFreq,
            toneVolume: this.toneVolume,
            noiseVolume: this.noiseVolume,
            bandpassLowFreq: this.bandpassLowFreq,
            bandpassHighFreq: this.bandpassHighFreq,
            jitter: this.jitter,
        };
    }

    /**
     * Attaches input handlers to HTML elements, to allow setting and displaying option
     * values via HTML elements, as well as start/stop/send functions.
     * For a given getter/setter, e.g., `wpm`, an input element with `id=wpm-input`
     * and a display-element with `id=wpm-display` are used.
     * Additionally, `start-button`, `stop-button`, `send-button`, and `send-input`
     * are used.
     * 
     * @param {Document} document - The HTML document.
     * @param {object} elementIds - Overrides for element IDs, if any.
     */
    attachHandlers(document, elementIds = {}) {
        const self = this;

        const ids = {
            "start-button": "start-button",
            "stop-button": "stop-button",
            "send-button": "send-button",
            "send-input": "send-input",
            "wpm-input": "wpm-input",
            "wpm-display": "wpm-display",
            "toneFreq-input": "toneFreq-input",
            "toneFreq-display": "toneFreq-display",
            "toneVolume-input": "toneVolume-input",
            "toneVolume-display": "toneVolume-display",
            "noiseVolume-input": "noiseVolume-input",
            "noiseVolume-display": "noiseVolume-display",
            "bandpassLowFreq-input": "bandpassLowFreq-input",
            "bandpassLowFreq-display": "bandpassLowFreq-display",
            "bandpassHighFreq-input": "bandpassHighFreq-input",
            "bandpassHighFreq-display": "bandpassHighFreq-display",
            "jitter-input": "jitter-input",
            "jitter-display": "jitter-display",
            ...elementIds
        };

        const updateDisplays = function (document, ids) {
            const fields = self.fields();
            for (const key in fields) {
                const value = fields[key];
                const input = document.getElementById(ids[`${key}-input`]);
                if (input) { input.value = value; }
                const display = document.getElementById(ids[`${key}-display`]);
                if (display) { display.innerHTML = value; }
            }
        }

        let elt;

        elt = document.getElementById(ids["start-button"]);
        if (elt) {
            elt.addEventListener("click", () => self.start());
        }

        elt = document.getElementById(ids["stop-button"]);
        if (elt) {
            elt.addEventListener("click", () => self.stop());
        }

        elt = document.getElementById(ids["send-button"]);
        if (elt) {
            elt.addEventListener("click", () => {
                const input = document.getElementById(ids["send-input"]);
                if (input) { self.sendText(input.value); }
            });
        }

        elt = document.getElementById(ids["wpm-input"]);
        if (elt) {
            elt.addEventListener("input", (e) => {
                const value = e.target.value;
                self.wpm = parseInt(value, 10);
                updateDisplays(document, ids);
            });
        }
       
        elt = document.getElementById(ids["toneFreq-input"]);
        if (elt) {
            elt.addEventListener("input", (e) => {
                const value = e.target.value;
                self.toneFreq = parseInt(value, 10);
                updateDisplays(document, ids);
            });
        }
        
        elt = document.getElementById(ids["toneVolume-input"]);
        if (elt) {
            elt.addEventListener("input", (e) => {
                const value = e.target.value;
                self.toneVolume = parseFloat(value, 10);
                updateDisplays(document, ids);
            });
        }

        elt = document.getElementById(ids["noiseVolume-input"]);
        if (elt) {
            elt.addEventListener("input", (e) => {
                const value = e.target.value;
                self.noiseVolume = parseFloat(value, 10);
                updateDisplays(document, ids);
            });
        }
 
        elt = document.getElementById(ids["bandpassLowFreq-input"]);
        if (elt) {
            elt.addEventListener("input", (e) => {
                const value = e.target.value;
                self.bandpassLowFreq = parseInt(value, 10);
                updateDisplays(document, ids);
            });
        }
 
        elt = document.getElementById(ids["bandpassHighFreq-input"]);
        if (elt) {
            elt.addEventListener("input", (e) => {
                const value = e.target.value;
                self.bandpassHighFreq = parseInt(value, 10);
                updateDisplays(document, ids);
            });
        }
 
        elt = document.getElementById(ids["jitter-input"]);
        if (elt) {
            elt.addEventListener("input", (e) => {
                const value = e.target.value;
                self.jitter = parseFloat(value, 10);
                updateDisplays(document, ids);
            });
        }

        updateDisplays(document, ids);
    }

    #updateDisplays(document, ids) {
        const fields = this.fields();
        for (const key in fields) {
            const value = fields[key];
            const input = document.getElementById(ids[`${key}-input`]);
            if (input) { input.value = value; }
            const display = document.getElementById(ids[`${key}-display`]);
            if (display) { display.innerHTML = value; }
        }
    }

    wpm;
    jitter;

    get toneFreq() {
        return this._toneFreq;
    }
    set toneFreq(x) {
        this._toneFreq = x;
        if (this._audioContext && this._toneNode) {
            this._toneNode.frequency.setValueAtTime(x, this._audioContext.currentTime);
        }
    }

    get toneVolume() {
        return this._toneVolume;
    }
    set toneVolume(x) {
        this._toneVolume = x;
        if (this._audioContext && this._toneVolumeNode) {
            this._toneVolumeNode.gain.setValueAtTime(x, this._audioContext.currentTime);
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

    /**
     * Starts audio, creating a new `AudioContext`.
     */
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
    
        const toneNode = audioContext.createOscillator();
        this._toneNode = toneNode;
        toneNode.frequency.setValueAtTime(this.toneFreq, audioContext.currentTime);
        toneNode.type = "sine";
        toneNode.start();

        const toneVolumeNode = audioContext.createGain();
        this._toneVolumeNode = toneVolumeNode;
        toneVolumeNode.gain.setValueAtTime(this.toneVolume, audioContext.currentTime);
    
        const toneSwitchNode = audioContext.createGain();
        this._toneSwitchNode = toneSwitchNode;
        toneSwitchNode.gain.setValueAtTime(0, audioContext.currentTime);

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
        noiseGainNode.connect(mergerNode, 0, 1);

        toneNode.connect(toneVolumeNode);
        toneVolumeNode.connect(toneSwitchNode);
        toneSwitchNode.connect(mergerNode, 0, 0);
        toneSwitchNode.connect(mergerNode, 0, 1);
    
        mergerNode.connect(lowpassNode);
        lowpassNode.connect(highpassNode);
        highpassNode.connect(audioContext.destination);        
    }

    /**
     * Stops audio, deleting the existing `AudioContext`.
     */
    async stop() {
        if (this._audioContext === undefined) return;

        await this._audioContext.close();
        this._audioContext = undefined;
        this._toneNode = undefined;
        this._toneVolumeNode = undefined;
        this._toneSwitchNode = undefined;
        this._noiseGainNode = undefined;
        this._lowpaasNode = undefined;
        this._highpassNode = undefined;
        this._nextCharStartAfter = undefined;
    }

    /**
     * Sends a Morse code transmission.
     * @param {string} text - Message to send. Prosigns (`AR`, `BK`, etc) are not recognized. Unknown characters are rendered as eight dots (`........`).
     */
    sendText(text) {
        const chars = text.split("");
        this.sendChars(chars);
    }
    
    /**
     * 
     * Sends a Morse code transmission.
     * @param {string[]} chars - Message to send, as an array of characters. Prosigns (`AR`, `BK`, etc) are allowed. Unknown characters are rendered as eight dots (`........`).
     */
    sendChars(chars) {
        for (const char of chars) {
            this.#sendChar(char);
        }
    }

    #sendChar(char) {
        if (this._audioContext === undefined) return;

        // Start as soon as possible after the last transmission
        if (!this._nextCharStartAfter) {
            this._nextCharStartAfter = this._audioContext.currentTime;
        }
        let t = Math.max(
            this._nextCharStartAfter,
            this._audioContext.currentTime
        );

        if (char === " ") {
            t += this.#betweenWords();
        } else {
            const morse = MORSE_CODE[char.toUpperCase()] || "........:";

            let betweenSymbols;
            for (const sym of morse.split("")) {
                betweenSymbols = this.#betweenSymbols();
                if (sym === ".") {
                    const dit = this.#dit();
                    this._toneSwitchNode.gain.setValueAtTime(1, t);
                    this._toneSwitchNode.gain.setValueAtTime(0, t + dit);
                    t += dit + betweenSymbols;
                }
                if (sym === "-") {
                    const dah = this.#dah();
                    this._toneSwitchNode.gain.setValueAtTime(1, t);
                    this._toneSwitchNode.gain.setValueAtTime(0, t + dah);
                    t += dah + betweenSymbols;
                }
            }
            t += this.#betweenChars() - betweenSymbols;
        }

        this._nextCharStartAfter = t;
    }

    #addJitter(t) {
        const rand = Math.random(2) - 1;
        return t * (1 + this.jitter * rand);
    }
    #unit() {
        return 1.2 / this.wpm;
    }
    #dit() {
        const unit = this.#unit();
        return this.#addJitter(unit);
    }
    #dah() {
        const unit = this.#unit();
        return this.#addJitter(3 * unit);
    }
    #betweenSymbols() {
        const unit = this.#unit();
        return this.#addJitter(unit);
    }
    #betweenChars() {
        const unit = this.#unit();
        return this.#addJitter(3 * unit);
    }
    #betweenWords() {
        const unit = this.#unit();
        return this.#addJitter(7 * unit);
    }

}