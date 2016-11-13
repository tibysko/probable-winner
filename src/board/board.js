const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const SerialPort = require('serialport');
const logger = require('../core/logger');

const config = require('../config/config.js');

class Board extends EventEmitter {

    constructor() {
        super(); // EventEmitter constructor
        this.pins = {};
        this.serialPort = {};
        this.moduleName = 'Board';
    }

    setup(cb) {
        this.pins = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/pins.json')));

        // Initialize this.pins with value 0
        for (var key in this.pins) {
            if (this.pins.hasOwnProperty(key)) {
                this.pins[key].value = 0;
            }
        }

        this.serialPort = new SerialPort(config.usbPort, {
            parser: SerialPort.parsers.readline('\n')
        }, (err) => {
            if (err) {
                logger.logError(this.moduleName, 'Setup', 'Could not open port');
                logger.logError(this.moduleName, 'Setup', err);
                cb(err);

                return;
            } else {
                this.serialPort.on('data', (data) => {
                    let dataArray = data.split("|");
                    let pinId = dataArray[0];
                    let value = dataArray[1];

                    let pin = this.pins[pinId];

                    if (pin && value) {
                        pin.value = value.replace('\r', '');
                    }
                });

                setInterval(() => {
                    this.emit('data', this.getPinData());
                }, 500);

                cb(null);
            }
        });
    }

    writePin(pinName, value, cb) {
        let foundPin = {};

        for (var key in this.pins) {
            if (this.pins.hasOwnProperty(key)) {
                let pin = this.pins[key];

                if (pin.name === pinName) { // pin found
                    foundPin = pin;
                    break;
                }
            }
        }

        if (foundPin) {
            let pinIdTemp = "000" + foundPin.id;
            pinIdTemp = pinIdTemp.substring(pinIdTemp.length - 3, pinIdTemp.length);

            let pinValueTemp = "0000" + value;
            pinValueTemp = pinValueTemp.substring(pinValueTemp.length - 4, pinValueTemp.length);

            let cmd = foundPin.mode + pinIdTemp + pinValueTemp + '\n';

            this.serialPort.write(cmd, cb);
        } else {
            logger.logWarning(this.moduleName, 'WitePin', 'Pin with name [' + pinName + '] was not found');
        }
    }

    getPinData() {
        let pinObject = {};

        for (var key in this.pins) {
            if (this.pins.hasOwnProperty(key)) {

                let pin = this.pins[key];
                pinObject[pin.name] = pin;
            }
        }

        return pinObject;
    }
}

module.exports = Board;