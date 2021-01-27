import {
  Accessory,
  AccessoryEventTypes,
  Categories,
  Characteristic,
  CharacteristicEventTypes, CharacteristicSetCallback,
  CharacteristicValue,
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
  host: '192.168.0.14',
  path: ''
};

class LightControllerClass {

  name: CharacteristicValue = "Коридор"; //name of accessory
  pincode: CharacteristicValue = "031-45-154";
  username: CharacteristicValue = "FA:3C:ED:5A:1A:1A"; // MAC like address used by HomeKit to differentiate accessories.
  manufacturer: CharacteristicValue = "[KONTUR.HOME]"; //manufacturer (optional)
  model: CharacteristicValue = "v1.0"; //model (optional)
  serialNumber: CharacteristicValue = "160121"; //serial number (optional)

  power: CharacteristicValue = false; //current power status
  brightness: CharacteristicValue = 255; //current brightness

  outputLogs = false; //output logs

  setPower(status: CharacteristicValue) {
          opts.path = "/sec/?cmd=11:" + Number(status); 
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
          this.power = status;
  }

  getPower() { 
    opts.path = '/sec/?pt=11&cmd=get'
	const request = http.request(opts, function (res) {
	    let data = '';
	    res.on('data', function (chunk) {
	        data += chunk;
	    });
	    res.on('end', function () {
    if ( data === 'ON' ) {LightController.power = true;
    lightAccessory
   .getService(Service.Lightbulb)!.getCharacteristic(Characteristic.On)!.updateValue(true);}

    else if ( data === 'OFF' ) {LightController.power = false;
    lightAccessory
    .getService(Service.Lightbulb)!.getCharacteristic(Characteristic.On)!.updateValue(false);}
      });
  });
  request.on('error', function (e) {
      console.log(e.message);
  });
  request.end();
   return this.power;
  }

  setBrightness(brightness: CharacteristicValue) { 
   
    this.brightness = brightness;
  }

  getBrightness() { 
    
    return this.brightness;
  }

  identify() { //identify the accessory
    if(this.outputLogs) console.log("Identify the '%s'", this.name);
  }
}

const LightController = new LightControllerClass();

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "light".
var lightUUID = uuid.generate('hap-nodejs:accessories:light' + LightController.name);

// This is the Accessory that we'll return to HAP-NodeJS that represents our light.
var lightAccessory = exports.accessory = new Accessory(LightController.name as string, lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
// @ts-ignore
lightAccessory.username = LightController.username;
// @ts-ignore
lightAccessory.pincode = LightController.pincode;
// @ts-ignore
lightAccessory.category = Categories.LIGHTBULB;

// set some basic properties (these values are arbitrary and setting them is optional)
lightAccessory
  .getService(Service.AccessoryInformation)!
    .setCharacteristic(Characteristic.Manufacturer, LightController.manufacturer)
    .setCharacteristic(Characteristic.Model, LightController.model)
    .setCharacteristic(Characteristic.SerialNumber, LightController.serialNumber);

// listen for the "identify" event for this Accessory
lightAccessory.on(AccessoryEventTypes.IDENTIFY, (paired: boolean, callback: VoidCallback) => {
  LightController.identify();
  callback();
});

lightAccessory
  .addService(Service.Lightbulb, LightController.name) // services exposed to the user should have "names" like "Light" for this case
  .getCharacteristic(Characteristic.On)!
  .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
    LightController.setPower(value);
    callback();
  })

  .on(CharacteristicEventTypes.GET, (callback: NodeCallback<CharacteristicValue>) => {
  callback(null, LightController.getPower());
  });

 //  setInterval(function() {  
 // LightController.getPower();
//lightAccessory
 //  .getService(Service.Lightbulb)!.getCharacteristic(Characteristic.On)!.updateValue(LightController.power);
 // }, 10000);