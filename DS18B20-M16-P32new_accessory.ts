// here's a DS18B20 (negative values)  temperature sensor device that we'll expose to HomeKit
import { Accessory, Categories, Characteristic, CharacteristicEventTypes, CharacteristicValue, NodeCallback, Service, uuid } from '../';
import http from "http";

interface Sensor {
    currentTemperature: number,
    getTemperature: () => number
};

type Options = {
    host: string,
    path: string
};

const opts : Options = {
    host: '192.168.0.16',
    path:  '/sec/?pt=32&cmd=get'
};

const SENSOR : Sensor = {
    currentTemperature: 50,
    getTemperature: function() {
        let temp : any[] = [];
        const req = http.request(opts, (res) => {
            let data : string = '';
            res.on('data', (chunk: string) => {
                data += chunk;
            });
            res.on('end', () => {
                temp = data.split(":");
                SENSOR.currentTemperature = parseFloat(temp[1]);
      accessory
       .getService(Service.TemperatureSensor)!.getCharacteristic(Characteristic.CurrentTemperature).updateValue(SENSOR.currentTemperature);
            });
        });
        req.on("error", (e) => {
            console.error(e);
        });
        req.end();
        return this.currentTemperature;
    }
};


// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".
const sensorUUID = uuid.generate('hap-nodejs:accessories:temperature-sensor32new');

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake lock.
export const accessory = new Accessory('Гараж', sensorUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
// @ts-ignore
accessory.username = "C1:5D:3A:AE:5E:FA";
// @ts-ignore
accessory.pincode = "031-45-154";
// @ts-ignore
accessory.category = Categories.SENSOR;
accessory
    .getService(Service.AccessoryInformation)!
    .setCharacteristic(Characteristic.Manufacturer, "[KONTUR-HOME]")
    .setCharacteristic(Characteristic.Model, "DS18B20")
    .setCharacteristic(Characteristic.SerialNumber, "200121");

// Add the actual TemperatureSensor Service.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKit.ts`
accessory
    .addService(Service.TemperatureSensor)!
    .getCharacteristic(Characteristic.CurrentTemperature)!
    .setProps({
        minValue: -50,
        maxValue: 150
    })
    .on(CharacteristicEventTypes.GET, (callback: NodeCallback<CharacteristicValue>) => {

        // return our current value
        callback(null, SENSOR.getTemperature());
    });

// our temperature reading every 20 seconds
//setInterval(function() {
//   SENSOR.getTemperature();
//}, 10000);