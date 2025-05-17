import { Cwazy } from "./cwazy.mjs";

const cwazy = new Cwazy();
document.getElementById("start-button").onclick = async () => await cwazy.start();
document.getElementById("stop-button").onclick = async () => await cwazy.stop();
document.getElementById("transmit-button").onclick = () => {
    const text = document.getElementById("transmit-text");
    cwazy.sendText(text.value);
};

