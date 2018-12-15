var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

var http = require('http');

var options = {
    host: '192.168.0.14',
    path:  '/sec/?pt=30&scl=31&i2c_dev=htu21d'
}

// here's a fake temperature sensor device that we'll expose to HomeKit
var FAKE_SENSOR = {
  currentTemperature: 0,
  getTemperature: function() { 
    //console.log("Getting the current temperature!");

	var temp = [];
	var request = http.request(options, function (res) {
	    var data = '';
	    res.on('data', function (chunk) {
	        data += chunk;
	    });
	    res.on('end', function () {
	 	temp = data.split(':');
		FAKE_SENSOR.currentTemperature = parseFloat(data);
	    });
	});
	request.on('error', function (e) {
	    console.log(e.message);
	});
	request.end();

	//console.log(FAKE_SENSOR.currentTemperature);

    return FAKE_SENSOR.currentTemperature;
  }
}

FAKE_SENSOR.getTemperature();


// Generate a consistent UUID for our Temperature Sensor Accessory that will remain the same
// even when restarting our server. We use the `uuid.generate` helper function to create
// a deterministic UUID based on an arbitrary "namespace" and the string "temperature-sensor".
var sensorUUID = uuid.generate('hap-nodejs:accessories:humedity-sensor31');

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake lock.
var sensor = exports.accessory = new Accessory('Humidity', sensorUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
sensor.username = "C1:5D:3A:AE:5E:5D";
sensor.pincode = "031-45-154";

// Add the actual TemperatureSensor Service.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
sensor
  .addService(Service.HumiditySensor)
  .getCharacteristic(Characteristic.CurrentRelativeHumidity)
  .on('get', function(callback) {
    
    // return our current value
    callback(null, FAKE_SENSOR.getTemperature());
  });

// randomize our temperature reading every 3 seconds
setInterval(function() {
  
  FAKE_SENSOR.getTemperature();
  
  // update the characteristic value so interested iOS devices can get notified
  sensor
    .getService(Service.HumiditySensor)
    .setCharacteristic(Characteristic.CurrentRelativeHumidity, FAKE_SENSOR.currentTemperature);
  
}, 3000);
