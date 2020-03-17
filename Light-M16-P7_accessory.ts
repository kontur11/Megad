import {
    Accessory,
    Service,
    Characteristic,
    uuid,
    NodeCallback,
    CharacteristicValue,
    AccessoryEventTypes,
    CharacteristicEventTypes,
    CharacteristicSetCallback,
    VoidCallback
} from "../";
import http from "http";

type StatusType = 0 | 1;

type Options = {
    host: string,
    path: string
};

interface MegadLight {
    powerOn: CharacteristicValue,
    brightness: CharacteristicValue,
    setPowerOn: (on: CharacteristicValue) => void,
    setBrightness: (brightness: CharacteristicValue) => void,
    identify: () => void
}

const opts : Options = {
    host: '192.168.0.16',
    path: ''
};

let checkFlag : StatusType = 0;

const MEGAD_LIGHT : MegadLight = {
    powerOn: false,
    brightness: 100,
    setPowerOn: function (on) {
        this.powerOn = on;
        if (checkFlag === 0) {
            let status : StatusType = 0;
            if ( on === true || Number(on) === 1 ) status = 1;
            opts.path = "/sec/?cmd=7:" + status;

            const request = http.request(opts, (res) => {
                let data = '';
                res.on('data', function (chunk) {
                    data += chunk;
                });
                res.on('end', function () {

                });
            });
            request.on('error', function (e) {
                console.log(e.message);
            });
            request.end();
        }
        checkFlag = 0;
    },
    setBrightness: function (brightness) {
        this.brightness = brightness;
    },
    identify: () => {
        console.log("Identify the accessory!");
    }
};

const lightUUID = uuid.generate('hap-nodejs:accessories:megad-16');

export const accessory = new Accessory('Light', lightUUID);
// @ts-ignore
accessory.username = "1A:2B:3C:4D:5E:04";
// @ts-ignore
accessory.pincode = "031-45-154";

accessory
    .getService(Service.AccessoryInformation)!
    .setCharacteristic(Characteristic.Manufacturer, "Kontur-home")
    .setCharacteristic(Characteristic.Model, "Light-1")
    .setCharacteristic(Characteristic.SerialNumber, "150320");


accessory.on(AccessoryEventTypes.IDENTIFY, function(paired : boolean, callback : VoidCallback) {
    MEGAD_LIGHT.identify();
    callback(); // success
});

accessory
    .addService(Service.Lightbulb, "Холл")! // services exposed to the user should have "names" like "Fake Light" for us
    .getCharacteristic(Characteristic.On)!
    .on(CharacteristicEventTypes.SET, function(value: CharacteristicValue, callback: CharacteristicSetCallback) {
        MEGAD_LIGHT.setPowerOn(value);
        callback(); // Our fake Light is synchronous - this value has been successfully set
    });

accessory
    .getService(Service.Lightbulb)!
    .getCharacteristic(Characteristic.On)!
    .on(CharacteristicEventTypes.GET, function(callback : NodeCallback<CharacteristicValue>) {
        // this event is emitted when you ask Siri directly whether your accessory is on or not. you might query
        // the accessory hardware itself to find this out, then call the callback. But if you take longer than a
        // few seconds to respond, Siri will give up.
        let err = undefined,
            value : CharacteristicValue = MEGAD_LIGHT.powerOn; // in case there were any problems
        callback(err, value);
    });
accessory
    .getService(Service.Lightbulb)!
    .addCharacteristic(Characteristic.Brightness)!
    .on(CharacteristicEventTypes.GET, function(callback: NodeCallback<CharacteristicValue>) {
        callback(null, MEGAD_LIGHT.brightness);
    })
    .on(CharacteristicEventTypes.SET, function(value : CharacteristicValue, callback: CharacteristicSetCallback) {
        MEGAD_LIGHT.setBrightness(value);
        callback();
    });

setInterval(() => {
    opts.path = '/sec/?pt=7&cmd=get';
    const request = http.request(opts, function (res) {
        let data : string = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {

            checkFlag = 1;
            if ( data === 'ON') {
                accessory.getService(Service.Lightbulb)!.setCharacteristic(Characteristic && Characteristic.On, true);
            } else {
                accessory.getService(Service.Lightbulb)!.setCharacteristic(Characteristic && Characteristic.On, false);
            }
        });
    });
    request.on('error', function (e) {
        console.log(e.message);
    });
    request.end();
    MEGAD_LIGHT.powerOn;
}, 28000);