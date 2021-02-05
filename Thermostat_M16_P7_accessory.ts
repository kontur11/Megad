import {
  Accessory,
  AccessoryEventTypes,
  Categories,
  Characteristic,
  CharacteristicEventTypes, CharacteristicSetCallback, CharacteristicValue,
  NodeCallback,
  Service,
  uuid,
  VoidCallback
} from '..';

import http from "http";

type Options = {
  host: string,
  path: string
};

const opts : Options = {
  host: 'http://192.168.0.16',
  path: ''
};

class ThermoControllerClass {
  CurrentHeatingCoolingState: CharacteristicValue = 0;
  TargetHeatingCoolingState: CharacteristicValue = 0;
  CurrentTemperature: CharacteristicValue = 50;
  TargetTemperature: CharacteristicValue = 18;
  name: CharacteristicValue = "Теплый пол";

   getTargetTemperature() {
    var data: string = "";
    var temp: string = "";
    var str: number = 0;
          var request = http.get(opts.host + "/sec/?pt=33", function (res: any) {
      res.on("data", function (chunk: any) {
        data += chunk;
      });
      res.on("end", () => {
        try {
          str = data.indexOf("<input name=misc size=4 value=");
          temp = data.substring(str + 30, 428);
          if (Number(temp) > 0) 
          ThermoController.TargetTemperature = parseFloat(temp);
                   } catch (error) {
          console.error(error);
         }
      });
    });
    request.on("error", function (e: any) {
      console.log(e.message);
    });
    request.end();
      return this.TargetTemperature;
  }

  getTargetHeatingCoolingState() {
    var data: string = "";
    var temp: string = "";
    var str: number = 0;
    var request = http.get(opts.host + "/sec/?pt=33", function (res: any) {
      res.on("data", function (chunk: any) {
        data += chunk;
      });
      res.on("end", () => {
        try {
          str = data.indexOf("<input name=misc size=4 value=");
          temp = data.substring(str + 30, 428);
            if  (Number(temp) > 0) ThermoController.TargetHeatingCoolingState = 1;
            else  ThermoController.TargetHeatingCoolingState = 0;
        }   catch (error) {
          console.error(error);
        }
      });
    });
    request.on("error", function (e: any) {
      console.log(e.message);
    });
       request.end();
    return this.TargetHeatingCoolingState;
  }
  
  setTargetTemperature(temperature: CharacteristicValue) {
    ThermoController.TargetTemperature = temperature;
    console.log("Set Target Temperature ", temperature);
    var data: string = "";
    var request = http.get(
      opts.host + "/sec/?pt=33&misc=" + temperature,
      function (res: any) {
        res.on("data", function (chunk: any) {
          data += chunk;
        });
        res.on("end", function () {
          console.log("Set Target Temperature ", temperature);
        });
      }
    );
    request.on("error", function (e: any) {
      console.log(e.message);
    });
    request.end();
  }

  setTargetHeatingCoolingState(state: CharacteristicValue) {
    this.TargetHeatingCoolingState = state;
    console.log("Set Target Heating Cooling State ", state);
    var data: string = "";
    if (state == 0) {
      var request = http.request(
        opts.host + "/sec/?pt=33&misc=-50",
        function (res: any) {
          res.on("data", function (chunk: any) {
            data += chunk;
          });
          res.on("end", function () {
            console.log("Set Target Heating Cooling State ", state);
          });
        }
      );
      request.on("error", function (e: any) {
        console.log(e.message);
      });
      request.end();
    } else if (state == 1) {
      var request = http.request(
        opts.host + "/sec/?pt=33&misc=" + ThermoController.TargetTemperature,
        function (res: any) {
          res.on("data", function (chunk: any) {
            data += chunk;
          });
          res.on("end", function () {
            console.log("Set Target Heating Cooling State ", state);
          });
        }
      );
      request.on("error", function (e: any) {
        console.log(e.message);
      });
      request.end();
    }
  }

  getCurrentTemperature() {
    var data: string = "";
    var temp: string[] = [];
    var request = http.get(opts.host + "/sec/?pt=33&cmd=get", function (res: any) {
      res.on("data", function (chunk: any) {
        data += chunk;
      });
      res.on("end", function () {
        temp = data.split(":");
        ThermoController.CurrentTemperature = parseFloat(temp[1]);
        ThermostatService
          .getService(Service.Thermostat)!.getCharacteristic(Characteristic.CurrentTemperature)!.updateValue(parseFloat(temp[1]));
      });
    });
    request.on("error", function (e: any) {
      console.log(e.message);
    });
    request.end();
    return this.CurrentTemperature;
  }

  getCurrentHeatingCoolingState() {
    var data: string = "";
    var request = http.get(opts.host + "/sec/?pt=7&cmd=get", function (res: any) {
      res.on("data", (chunk: any) => {
        data += chunk;
      });
      res.on("end", () => {
           if (data == "ON") {
              ThermoController.CurrentHeatingCoolingState = 1;
              ThermostatService
              .getService(Service.Thermostat)!.getCharacteristic(Characteristic.CurrentHeatingCoolingState)!.updateValue(1);
        } else if (data == "OFF") {
              ThermoController.CurrentHeatingCoolingState = 0;
              ThermostatService
              .getService(Service.Thermostat)!.getCharacteristic(Characteristic.CurrentHeatingCoolingState)!.updateValue(0);
        }
      });
    });
    request.on("error", function (e: any) {
      console.log(e.message);
    });
    request.end();
    return this.CurrentHeatingCoolingState;
  }
  identify() { //identify the accessory
  }
}
const ThermoController = new ThermoControllerClass();

var thermoUUID = uuid.generate('hap-nodejs:accessories:thermo' + ThermoController.name);
var ThermostatService = exports.accessory = new Accessory(ThermoController.name as string, thermoUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
// @ts-ignore
ThermostatService.username = "C1:5D:3A:EE:5E:FA";
// @ts-ignore
ThermostatService.pincode = "031-45-154";
// @ts-ignore
ThermostatService.category = Categories.THERMOSTAT;

ThermostatService
  .getService(Service.AccessoryInformation)!
  .setCharacteristic(Characteristic.Manufacturer, "[KONTUR.HOME]")
  .setCharacteristic(Characteristic.Model, "Local-thermo")
  .setCharacteristic(Characteristic.SerialNumber, "050221");

ThermostatService.on(AccessoryEventTypes.IDENTIFY, (paired: boolean, callback: VoidCallback) => {
  ThermoController.identify();
  callback();
});

ThermostatService
.addService(Service.Thermostat, ThermoController.name)
.getCharacteristic(Characteristic.CurrentHeatingCoolingState)!
  .setProps({
    minValue: 0,
    maxValue: 1,
  })!
  .on(CharacteristicEventTypes.GET,(callback: NodeCallback<CharacteristicValue>) => {
     callback(null, ThermoController.getCurrentHeatingCoolingState());
   }
  );

ThermostatService.getService(Service.Thermostat)!
.getCharacteristic(Characteristic.TargetHeatingCoolingState)!
  .setProps({
    minValue: 0,
    maxValue: 1,
  })!
  .on(CharacteristicEventTypes.GET,(callback: NodeCallback<CharacteristicValue>) => {
      callback(null, ThermoController.getTargetHeatingCoolingState());
    }
  )
  .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
      ThermoController.setTargetHeatingCoolingState(value);
      console.log( "Characteristic TargetHeatingCoolingState changed to %s",value);
      callback();
    }
  );

ThermostatService.getService(Service.Thermostat)!
.getCharacteristic(Characteristic.CurrentTemperature)!
.setProps({
  minValue: -50,
  maxValue: 150,
})!
 .on(CharacteristicEventTypes.GET,(callback: NodeCallback<CharacteristicValue>) => {
    callback(null, ThermoController.getCurrentTemperature());
  }
);

ThermostatService.getService(Service.Thermostat)!
 .getCharacteristic(Characteristic.TargetTemperature)!
   .setProps({
    minValue: 5,
    maxValue: 33,
    minStep: 0.5,
  })!
  .on(CharacteristicEventTypes.GET, (callback: NodeCallback<CharacteristicValue>) => {
      callback(null, ThermoController.getTargetTemperature());
    }
  )
  .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
      ThermoController.setTargetTemperature(value);
      console.log("Characteristic TargetTemperature changed to %s", value);
      callback();
      }
 );