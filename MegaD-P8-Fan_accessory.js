var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;


var http = require('http');

var options = {
    host: '192.168.0.14',
    path: ''
}

var check_flag = 0;

// here's a fake hardware device that we'll expose to HomeKit
var FAKE_FAN = {
  powerOn: false,
  rspeed: 100, // percentage
  
  setPowerOn: function(on) { 
    //console.log("Turning the light %s!", on ? "on" : "off");

    FAKE_FAN.powerOn = on;

    //console.log(on);

	if ( check_flag == 0 )
	{


	var status = 0;
	if ( on == "true" || on == 1 )
	status = 1;
	
	options['path'] = "/sec/?cmd=8:" + status;

	var request = http.request(options, function (res) {
	    var data = '';
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

	check_flag = 0;

  },
  setSpeed: function(value) {
    console.log("Setting fan value to %s", value);
    FAKE_FAN.rSpeed = value;
  },
  identify: function() {
    console.log("Identify the fan!");
  }
}

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake fan.
var fan = exports.accessory = new Accessory('Fan', uuid.generate('hap-nodejs:accessories:Fan'));

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
fan.username = "1A:2B:3C:4D:5E:FF";
fan.pincode = "031-45-154";

// set some basic properties (these values are arbitrary and setting them is optional)
fan
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "Sample Company")

// listen for the "identify" event for this Accessory
fan.on('identify', function(paired, callback) {
  FAKE_FAN.identify();
  callback(); // success
});

// Add the actual Fan Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
fan
  .addService(Service.Fan, "Fan") // services exposed to the user should have "names" like "Fake Light" for us
  .getCharacteristic(Characteristic.On)
  .on('set', function(value, callback) {
    FAKE_FAN.setPowerOn(value);
    callback(); // Our fake Fan is synchronous - this value has been successfully set
  });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
fan
  .getService(Service.Fan)
  .getCharacteristic(Characteristic.On)
  .on('get', function(callback) {

    // this event is emitted when you ask Siri directly whether your fan is on or not. you might query
    // the fan hardware itself to find this out, then call the callback. But if you take longer than a
    // few seconds to respond, Siri will give up.

    var err = null; // in case there were any problems

    if (FAKE_FAN.powerOn) {
      callback(err, true);
    }
    else {
      callback(err, false);
    }
  });

// also add an "optional" Characteristic for spped
fan
  .getService(Service.Fan)
  .addCharacteristic(Characteristic.RotationSpeed)
  .on('get', function(callback) {
    callback(null, FAKE_FAN.rSpeed);
  })
  .on('set', function(value, callback) {
    FAKE_FAN.setSpeed(value);
    callback();
  })
setInterval(function() {

/*
  .on('set', function(value, callback) {
    MEGAD_LIGHT.setPowerOn(true);
    callback(); // Our fake Light is synchronous - this value has been successfully set
  });
*/
   //setCharacteristic(Characteristic.powerOn, true);

	options['path'] = '/sec/?pt=8&cmd=get';

	var request = http.request(options, function (res) {
	    var data = '';
	    res.on('data', function (chunk) {
	        data += chunk;
	    });
	    res.on('end', function () {
  
		check_flag = 1;
		if ( data == 'ON')	
          fan.getService(Service.Fan).setCharacteristic(Characteristic.On, true);  
        else 
            fan.getService(Service.Fan).setCharacteristic(Characteristic.On, false);

	    });
	});
	request.on('error', function (e) {
	    console.log(e.message);
	});
	request.end();
	FAKE_FAN.powerOn

}, 28000);
