import bleno from '@abandonware/bleno';
import { connectToWifi, getWifiConnection } from './Wifi.js';
import { writeFileSync } from 'fs';

class PairCharacteristic extends bleno.Characteristic {
    constructor() {
        super({
            uuid: process.env.Characteristic_UUID,
            properties: ['read', 'write', 'notify'],
            value: null,
            descriptors: [
                new bleno.Descriptor({
                    uuid: '2901',
                    value: 'Pair with WiFi'
                })
            ]
        });
        
        this._updateValueCallback = null;
        this.currentWifi = "";
        this.value = Buffer.alloc(0);
        
        getWifiConnection().then((connection) => {
            if (connection)
                this.currentWifi = connection.ssid;
            else {
                this.currentWifi = '';
            }
        });
    }

    onReadRequest(offset, callback) {
        console.log('PairCharacteristic - onReadRequest: value = ');
        callback(this.RESULT_SUCCESS, this.currentWifi ? Buffer.from(this.currentWifi) : Buffer.alloc(0));
    }

    async onWriteRequest(data, offset, withoutResponse, callback) {
        this.value = data;
        const [ssid, password, userId] = Buffer.from(data, 'hex').toString('utf8').split(':');
        console.log('SSID:', ssid);
        console.log('UserId:', userId);
        writeFileSync('currentUserId.txt', userId);
        
        if (!ssid || !password) {
            console.log('Invalid SSID or password');
            return;
        }

        try {
            await connectToWifi(ssid, password);
            const currentConnection = await getWifiConnection();
            if (!currentConnection) {
                console.log('Failed to connect to WiFi:', ssid);
                callback(this.RESULT_UNLIKELY_ERROR);
                return;
            }
            const { ssid: connectedSsid } = currentConnection;
            if (connectedSsid === ssid) {
                console.log('Connected to WiFi:', ssid);
                this.currentWifi = ssid;
                callback(this.RESULT_SUCCESS);
            }
            else {
                console.log('Failed to connect to WiFi:', ssid);
                callback(this.RESULT_UNLIKELY_ERROR);
            }
        } catch (err) {
            console.log('Error connecting to WiFi:', err);
        }

        console.log('PairCharacteristic - onWriteRequest: value = ' + (this.value ? this.value.toString('hex') : ''));
        callback(this.RESULT_SUCCESS);
    }

    onSubscribe(maxValueSize, updateValueCallback) {
        console.log('PairCharacteristic - onSubscribe');
        this._updateValueCallback = updateValueCallback;
    }

    onUnsubscribe() {
        console.log('PairCharacteristic - onUnsubscribe');
        this._updateValueCallback = null;
    }
}

const startBLE = () => {
    bleno.on('stateChange', (state) => {
        console.log('on -> stateChange: ' + state);
        if (state === 'poweredOn') {
            bleno.startAdvertising('SmartGlassESraspi', [process.env.Service_UUID]);
        } else {
            bleno.stopAdvertising();
        }
    });

    bleno.on('advertisingStart', (error) => {
        console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

        if (!error) {
            bleno.setServices([
                new bleno.PrimaryService({
                    uuid: process.env.Service_UUID,
                    characteristics: [
                        new PairCharacteristic()
                    ]
                })
            ]);
        }
    });
}

export { startBLE };