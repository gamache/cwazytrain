import { Cwazy } from "./cwazy.mjs";

function updateDisplays() {
    const fields = ["wpm", "osc", "noise", "freq", "lowfreq", "highfreq"];
    for (const field of fields) {
        document.getElementById(`${field}-display`).innerHTML = document.getElementById(`${field}-input`).value;
    }
}
updateDisplays();

const cwazy = new Cwazy();

document.getElementById("start-button").onclick = async () => await cwazy.start();

document.getElementById("stop-button").onclick = async () => await cwazy.stop();

document.getElementById("transmit-button").onclick = () => {
    const text = document.getElementById("transmit-text");
    cwazy.sendText(text.value);
};

document.getElementById("wpm-input").oninput = (e) => {
    cwazy.wpm = parseInt(e.target.value, 10);
    updateDisplays();
};

document.getElementById("osc-input").oninput = (e) => {
    cwazy.oscVolume = parseFloat(e.target.value, 10);
    updateDisplays();
};

document.getElementById("noise-input").oninput = (e) => {
    cwazy.noiseVolume = parseFloat(e.target.value, 10);
    updateDisplays();
};

document.getElementById("freq-input").oninput = (e) => {
    cwazy.toneFreq = parseInt(e.target.value, 10);
    updateDisplays();
};

document.getElementById("lowfreq-input").oninput = (e) => {
    cwazy.bandpassLowFreq = parseInt(e.target.value, 10);
    updateDisplays();
};

document.getElementById("highfreq-input").oninput = (e) => {
    cwazy.bandpassHighFreq = parseInt(e.target.value, 10);
    updateDisplays();
};

