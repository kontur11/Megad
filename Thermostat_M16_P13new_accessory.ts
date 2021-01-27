import { Accessory, AccessoryEventTypes, Categories, Characteristic, CharacteristicEventTypes, CharacteristicSetCallback, CharacteristicValue, NodeCallback, Service, uuid, VoidCallback } from "..";
import http from "http";

var options: Record<string, any> = {
  host: "http://192.168.0.16",
  path: ""
};

const THERMOSTAT: Record<string, any> = {
  СurrentTemperature: 50,
  TargetTemperature: 18,
   getTargetTemperature() {
    var data: string = "";
    var temp: string = "";
    var str: number = 0;
          var request = http.get(options.host + "/sec/?pt=33", function (res: any) {
      res.on("data", function (chunk: any) {
        data += chunk;
      });
      res.on("end", () => {
        try {
          str = data.indexOf("<input name=misc size=4 value=");
          temp = data.substring(str + 30, 428);
          if (Number(temp) > 0) 
          THERMOSTAT.TargetTemperature = parseFloat(temp);
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
  },

  getTargetHeatingCoolingState() {
    var data: string = "";
    var temp: string = "";
    var str: number = 0;
    var request = http.get(options.host + "/sec/?pt=33", function (res: any) {
      res.on("data", function (chunk: any) {
        data += chunk;
      });
      res.on("end", () => {
        try {
          str = data.indexOf("<input name=misc size=4 value=");
          temp = data.substring(str + 30, 428);
            if  (Number(temp) > 0) THERMOSTAT.TargetHeatingCoolingState = 1;
            else  THERMOSTAT.TargetHeatingCoolingState = 0;
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
  },
  
  setTargetTemperature(temperature: CharacteristicValue) {
    THERMOSTAT.TargetTemperature = temperature;
    console.log("Set Target Temperature ", temperature);
    var data: string = "";
    var request = http.get(
      options.host + "/sec/?pt=33&misc=" + temperature,
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
  
  },
  setTargetHeatingCoolingState(state: CharacteristicValue) {
    this.TargetHeatingCoolingState = state;
    console.log("Set Target Heating Cooling State ", state);
    var data: string = "";
    if (state == 0) {
      var request = http.request(
        options.host + "/sec/?pt=33&misc=-50",
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
        options.host + "/sec/?pt=33&misc=" + THERMOSTAT.TargetTemperature,
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
  },

  getCurrentTemperature() {
    var data: string = "";
    var temp: string[] = [];
    var request = http.get(options.host + "/sec/?pt=33&cmd=get", function (res: any) {
      res.on("data", function (chunk: any) {
        data += chunk;
      });
      res.on("end", function () {
        temp = data.split(":");
        THERMOSTAT.CurrentTemperature = parseFloat(temp[1]);
      });
    });
    request.on("error", function (e: any) {
      console.log(e.message);
    });
    request.end();
    return this.CurrentTemperature;
  },

  getCurrentHeatingCoolingState() {
    var data: string = "";
    var request = http.get(options.host + "/sec/?pt=13&cmd=get", function (res: any) {
      res.on("data", (chunk: any) => {
        data += chunk;
      });
      res.on("end", () => {
           if (data == "ON") {
              THERMOSTAT.CurrentHeatingCoolingState = 1;
              ThermostatService
              .getService(Service.Thermostat)!.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(1);
        } else if (data == "OFF") {
              THERMOSTAT.CurrentHeatingCoolingState = 0;
              ThermostatService
              .getService(Service.Thermostat)!.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(0);
        }
      });
    });
    request.on("error", function (e: any) {
      console.log(e.message);
    });
    request.end();
    return this.CurrentHeatingCoolingState;
  },

  identify: () => {
    console.log("Thermostat Identified!");
  }
};

var thermoUUID = uuid.generate('hap-nodejs:accessories:thermo');
var ThermostatService = exports.accessory = new Accessory('Thermostat', thermoUUID);

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
  .setCharacteristic(Characteristic.SerialNumber, "210121");

ThermostatService.on(AccessoryEventTypes.IDENTIFY, (paired: boolean, callback: VoidCallback) => {
  THERMOSTAT.identify();
  callback();
});

ThermostatService.addService(Service.Thermostat,"Термостат")!
.getCharacteristic(Characteristic.CurrentHeatingCoolingState)!
  .setProps({
    minValue: 0,
    maxValue: 1,
  })!
  .on(CharacteristicEventTypes.GET,(callback: NodeCallback<CharacteristicValue>) => {
     callback(null, THERMOSTAT.getCurrentHeatingCoolingState());
   }
  );

ThermostatService.getService(Service.Thermostat)!
.getCharacteristic(Characteristic.TargetHeatingCoolingState)!
  .setProps({
    minValue: 0,
    maxValue: 1,
  })!
  .on(CharacteristicEventTypes.GET,(callback: NodeCallback<CharacteristicValue>) => {
      callback(null, THERMOSTAT.getTargetHeatingCoolingState());
    }
  )
  .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
      THERMOSTAT.setTargetHeatingCoolingState(value);
      console.log( "Characteristic TargetHeatingCoolingState changed to %s",value);
      callback();
    }
  );

ThermostatService.getService(Service.Thermostat)!
.getCharacteristic(Characteristic.CurrentTemperature)!
 .on(CharacteristicEventTypes.GET,(callback: NodeCallback<CharacteristicValue>) => {
    callback(null, THERMOSTAT.getCurrentTemperature());
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
      callback(null, THERMOSTAT.getTargetTemperature());
    }
  )
  .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
      THERMOSTAT.setTargetTemperature(value);
      console.log("Characteristic TargetTemperature changed to %s", value);
      callback();
      }
 );