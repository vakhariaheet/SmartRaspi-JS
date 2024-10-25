import { Gpio } from "pigpio";
import { PINS } from "../constants/pins.js";

class RGB {
    constructor() {
        this.redLED = new Gpio(PINS.LED_RED, { mode: Gpio.OUTPUT });
        this.greenLED = new Gpio(PINS.LED_GREEN, { mode: Gpio.OUTPUT });
        this.blueLED = new Gpio(PINS.LED_BLUE, { mode: Gpio.OUTPUT });
    }

    setColor(color) {
        this.redLED.pwmWrite(color.r);
        this.greenLED.pwmWrite(color.g);
        this.blueLED.pwmWrite(color.b);
    }

    turnOff() {
        this.setColor({ r: 255, g: 255, b: 255 });
    }

    generateRandomColor() {
        return {
            r: Math.floor(Math.random() * 256), 
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256),
        };
    }

    async showColors() {
        while (true) {
            this.setColor(this.generateRandomColor());
            await this.delay(1000);
        }
    }

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    cleanup() {
        this.turnOff();
    }
}

export default new RGB();