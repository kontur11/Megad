// here's a DS18B20 (negative values)  temperature sensor device that we'll expose to HomeKit
import { 
Accessory,
Categories,
Characteristic,
CharacteristicEventTypes,
CharacteristicValue,
CharacteristicGetCallback,
Service,
uuid 
} from '../';
import http from "http";

type Options = {
    host: string,
    path: string
};

const opts : Options = {
    host: '192.168.0.16',
    path:  '/sec/?pt=32&cmd=get'
};

class SensorClass {
    currentTemperature: CharacteristicValue = 50;
    name: CharacteristicValue = 'Гараж'; //name of accessory

    getTemperature () {
        let temp : any[] = [];
        const req = http.request(opts, (res) => {
            let data : string = '';
            res.on('data', (chunk: string) => {
                data += chunk;
            });
            res.on('end', () => {
                temp = data.split(":");
                SENS.currentTemperature = parseFloat(temp[1]);
    SensorAccessory
       .getService(Service.TemperatureSensor)!.getCharacteristic(Characteristic.CurrentTemperature).updateValue(SENS.currentTemperature);
            });
        });
        req.on("error", (e) => {
            console.error(e);
        });
        req.end();
        return this.currentTemperature;
    }
}

const SENS = new SensorClass();

// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".
const sensorUUID = uuid.generate('hap-nodejs:accessories:temperature-sensor' + SENS.name);

// This is the Accessory that we'll return to HAP-NodeJS that represents our light.
var SensorAccessory = exports.accessory = new Accessory(SENS.name as string, sensorUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
// @ts-ignore
SensorAccessory.username = "C1:5D:3A:AE:5E:FA";
// @ts-ignore
SensorAccessory.pincode = "031-45-154";
// @ts-ignore
SensorAccessory.category = Categories.SENSOR;
SensorAccessory
    .getService(Service.AccessoryInformation)!
    .setCharacteristic(Characteristic.Manufacturer, "[KONTUR-HOME]")
    .setCharacteristic(Characteristic.Model, "DS18B20")
    .setCharacteristic(Characteristic.SerialNumber, "170221");

// Add the actual TemperatureSensor Service.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKit.ts`
SensorAccessory
    .addService(Service.TemperatureSensor)!
    .getCharacteristic(Characteristic.CurrentTemperature)!
    .setProps({
        minValue: -50,
        maxValue: 150
    })
    .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        callback(null, SENS.getTemperature());
    });

// our temperature reading every 60 seconds
//setInterval(function() {
//   SENSOR.getTemperature();
//}, 60000);