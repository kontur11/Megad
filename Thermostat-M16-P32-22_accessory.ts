// Локальный термостат MegaD 2561 порт 32
import {
  Accessory,
  AccessoryEventTypes,
  Categories,
  Characteristic,
  CharacteristicEventTypes, CharacteristicGetCallback, CharacteristicSetCallback,
  CharacteristicValue,
  Service,
  uuid,
} from '..';
import { NodeCallback, VoidCallback } from '../types';
import http from "http";

var settings: Record<string, any> = {
  accessoryName: "Термостат",
  accessoryPinCode: "031-45-154",
  accessoryUsername: "12:34:56:AA:A:A1",
};

var options: Record<string, any> = {
  host: "http://192.168.0.16",
  path: "",
};

var THERMOSTAT: Record<string, any> = {
   СurrentTemperature: 50,
   TargetHeatingCoolingState: 0,
   TargetTemperature: 5,

// Включение-выключение термостата
  setTargetHeatingCoolingState: (state: CharacteristicValue) => {
    THERMOSTAT.TargetHeatingCoolingState = state;
    console.log("Set Target Heating Cooling State ", state);
    var data: string = "";
    if (state == 0) {
      var request = http.request(options.host + "/sec/?pt=32&misc=-50", function (res: any) {
        res.on("data", function (chunk: any) {
          data += chunk;
        });
        res.on("end", function () {
          console.log("Set Target Heating Cooling State ", state);
        });
      });
      request.on("error", function (e: any) {
        console.log(e.message);
      });
      request.end();
    } else if (state == 1) {
      var request = http.request(options.host + "/sec/?pt=32&misc=" + THERMOSTAT.TargetTemperature, function (res: any) {
        res.on("data", function (chunk: any) {
          data += chunk;
        });
        res.on("end", function () {
          console.log("Set Target Heating Cooling State ", state);
        });
      });
      request.on("error", function (e: any) {
        console.log(e.message);
      });
      request.end();
    }
  },

// Выставление температуры (VAL)
setTargetTemperature: (temperature: CharacteristicValue) => {
    THERMOSTAT.TargetTemperature = temperature;
    console.log("Set Target Temperature ", temperature);
    var data: string = "";
    var request = http.get(options.host + "/sec/?pt=32&misc=" + temperature, function (res: any) {
      res.on("data", function (chunk: any) {
        data += chunk;
      });
      res.on("end", function () {
        console.log("Set Target Temperature ", temperature);
      });
    });
    request.on("error", function (e: any) {
      console.log(e.message);
    });
    request.end();
  }, 

// Считывание установленной температуры (VAL) при запуске
//  getTargetTemperature: () => {
//    var data: string = "";
//    var temp: string = "";
//    var str: number = 0;
//    var request = http.get(options.host + "/sec/?pt=32", function (res: any) {
//      res.on("data", function (chunk: any) {
//        data += chunk;
//      });
//      res.on("end", function () {
//        str = data.indexOf("<input name=misc size=4 value=");
//        temp = data.substring(str + 30, 427);
//        THERMOSTAT.TargetTemperature = parseFloat(temp);
//        console.log("Get Target Temperature ", THERMOSTAT.TargetTemperature);
//      });
//    });
//    request.on("error", function (e: any) {
//      console.log(e.message);
//    });
//    request.end();
//  return THERMOSTAT.TargetTemperature;
 // },

// Температура DS1B20
 getCurrentTemperature: () => {
    var data: string = "";
    var temp: string[] = [];
    var request = http.get(options.host + "/sec/?pt=32&cmd=get", function (res: any) {
      res.on("data", function (chunk: any) {
        data += chunk;
      });
      res.on("end", function () {
        console.log("Get Current Temperature ", data);
        temp = data.split(":");
        THERMOSTAT.CurrentTemperature = parseFloat(temp[1]);
      });
    });
    request.on("error", function (e: any) {
      console.log(e.message);
    });
    request.end();
    return THERMOSTAT.CurrentTemperature;
   },

// Опрос состояния термостата (22 порт)
getCurrentHeatingCoolingState: () => {
    var data: string = "";
    var request = http.get(options.host + "/sec/?pt=22&cmd=get", function (res: any) {
      res.on("data", (chunk: any) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log("Get Current Heating Cooling State ", data);
        if (data == "ON") {
          THERMOSTAT.CurrentHeatingCoolingState = 1;
        } else if (data == "OFF") {
          THERMOSTAT.CurrentHeatingCoolingState = 0;
        }
      });
    });
    request.on("error", function (e: any) {
      console.log(e.message);
    });
    request.end();
    return THERMOSTAT.CurrentHeatingCoolingState;
  },
 }


var thermostat = (exports.accessory = new Accessory(settings.accessoryName, uuid.generate("hap-nodejs:accessories:thermostat")));


// @ts-ignore
thermostat.username = settings.accessoryUsername;
// @ts-ignore
thermostat.pincode = settings.accessoryPinCode;
// @ts-ignore
thermostat.category = Categories.THERMOSTAT;


thermostat
  .getService(Service.AccessoryInformation)!
  .setCharacteristic(Characteristic.Manufacturer, "[KONTUR.HOME]")
  .setCharacteristic(Characteristic.Model, "Local-Thermo")
  .setCharacteristic(Characteristic.SerialNumber, "130420")
  .setCharacteristic(Characteristic.FirmwareRevision, 3.0);

var ThermostatService =  thermostat.addService(Service.Thermostat,"Термостат");


ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)!
.setProps({
    minValue: 0,
    maxValue: 1,
  })!
   .on(CharacteristicEventTypes.GET, (callback: NodeCallback <CharacteristicValue>) => {
    callback(null, THERMOSTAT.CurrentHeatingCoolingState);
     });

 ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)!
.setProps({
    minValue: 0,
    maxValue: 1,
  })!
  .on(CharacteristicEventTypes.GET, (callback: NodeCallback <CharacteristicValue>) => {
    callback(null, THERMOSTAT.TargetHeatingCoolingState);
  })
  .on(CharacteristicEventTypes.SET,(value: CharacteristicValue, callback: CharacteristicSetCallback) => {
      THERMOSTAT.setTargetHeatingCoolingState(value);
      console.log( "Characteristic TargetHeatingCoolingState changed to %s",value);
      callback();
    });

 ThermostatService.getCharacteristic(Characteristic.CurrentTemperature)!
  .on(CharacteristicEventTypes.GET, (callback: NodeCallback <CharacteristicValue>) => {
    callback(null, THERMOSTAT.CurrentTemperature);
     });

 ThermostatService.getCharacteristic(Characteristic.TargetTemperature)!
 .setProps({
    minValue: 1,
    maxValue: 29,
    minStep: 0.5,
  })!
  .on(CharacteristicEventTypes.GET,(callback: NodeCallback <CharacteristicValue>) => {
    callback(null, THERMOSTAT.TargetTemperature);
  })
  .on(CharacteristicEventTypes.SET,(value: CharacteristicValue, callback: CharacteristicSetCallback) => {
      THERMOSTAT.setTargetTemperature(value);
      console.log( "Characteristic TargetTemperature changed to %s",value);
      callback();
    });

setInterval(() => {
  ThermostatService.getCharacteristic(Characteristic.CurrentTemperature)!.updateValue(THERMOSTAT.getCurrentTemperature());
  ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)!.updateValue(THERMOSTAT.getCurrentHeatingCoolingState());

}, 5000);
