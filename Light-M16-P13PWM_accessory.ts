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
  host: '192.168.0.16',
  path: ''
};

class LightControllerClass {

  name: CharacteristicValue = "Dimmer"; //name of accessory
  pincode: CharacteristicValue = "031-45-154";
  username: CharacteristicValue = "FA:3C:ED:5A:1A:1A"; // MAC like address used by HomeKit to differentiate accessories.
  manufacturer: CharacteristicValue = "[KONTUR.HOME]"; //manufacturer (optional)
  model: CharacteristicValue = "Dimmer"; //model (optional)
  serialNumber: CharacteristicValue = "020221"; //serial number (optional)

  power: CharacteristicValue = false; //current power status
  brightness: CharacteristicValue = 255; //current brightness

  setPower(status: CharacteristicValue) {
    if ( status == "true" || status == 1 ) opts.path = "/sec/?cmd=13:" + LightController.brightness; // включение
    else opts.path = "/sec/?cmd=13:0"; // выключение
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
    opts.path = '/sec/?pt=13&cmd=get'; // считывание состояния 13 порта
	  const request = http.request(opts, function (res) {
      let data = '';
	    res.on('data', function (chunk) {
	        data += chunk;
	    });
	    res.on('end', function () {
		if ( Number(data) == 0 ) {
       LightController.power = false;
  }
    else {
       LightController.power = true;
    }
    lightAccessory.getService(Service.Lightbulb)!.getCharacteristic(Characteristic.On)!.updateValue(LightController.power);
      });
      
  });
  request.on('error', function (e) {
      console.log(e.message);
  });
  request.end();
  
   return this.power;
  }

  setBrightness(brightness: CharacteristicValue) {
     opts.path = "/sec/?cmd=13:" + brightness; // установка ярости
    const request = http.request(opts, function (res) {
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
    this.brightness = brightness;
  }

  getBrightness() { 
   opts.path = '/sec/?pt=13&cmd=get' // Считывание состояния 13 порта 
   	const request = http.request(opts, function (res) {
       	    let data = '';
	    res.on('data', function (chunk) {
	        data += chunk;
	    });
	    res.on('end', function () {
        if (Number(data) > 0) {
        LightController.brightness = data;
       lightAccessory.getService(Service.Lightbulb)!.getCharacteristic(Characteristic.Brightness)!.updateValue(data);}
      });
 });
  request.on('error', function (e) {
      console.log(e.message);
  });
  request.end();
    return this.brightness;
  }

  identify() { //identify the accessory
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

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKit.ts`
lightAccessory
  .addService(Service.Lightbulb, LightController.name) // services exposed to the user should have "names" like "Light" for this case
  .getCharacteristic(Characteristic.On)!
  .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
    LightController.setPower(value);

    callback();
  })

  .updateValue(LightController.getPower())
  .on(CharacteristicEventTypes.GET, (callback: NodeCallback<CharacteristicValue>) => {
  callback(null, LightController.getPower());
  });

  lightAccessory
  .getService(Service.Lightbulb)!
  .addCharacteristic(Characteristic.Brightness)
  .setProps({
   minValue: 0,
   maxValue: 255,
   })
  .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
    LightController.setBrightness(value);
    callback();
  })
  .on(CharacteristicEventTypes.GET, (callback: NodeCallback<CharacteristicValue>) => {
  callback(null, LightController.getBrightness());
  });

  // обновление значений характеристики происходит при открытии Home App,
  // для обновления значений характеристики с интервалом 10 сек раскомментить строки
 // setInterval(() => {
   // LightController.getPower();
  //  LightController.getBrightness();
 // }, 10000);