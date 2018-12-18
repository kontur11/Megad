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
var FAKE_GARAGE = {
  opened: false,
  open: function() {
if ( check_flag == 0 )
{
console.log("Opening the Garage!");
options['path'] = "/sec/?cmd=13:1;p2;13:0"; // кнопка на ворота
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
  ;
    //add your code here which allows the garage to open
    FAKE_GARAGE.opened = true;
  },

  close: function() {
if ( check_flag == 0 )
    {
console.log("Closing the Garage!");
options['path'] = "/sec/?cmd=13:1;p2;13:0"; // кнопка на ворота
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

    //add your code here which allows the garage to close
    FAKE_GARAGE.opened = false;
  },

  identify: function() {
    //add your code here which allows the garage to be identified
    console.log("Identify the Garage");
  },
  status: function(){

    //use this section to get sensor values. set the boolean FAKE_GARAGE.opened with a sensor value.
    console.log("Sensor queried!");
   // FAKE_GARAGE.opened = true/false;
  }
};

var garageUUID = uuid.generate('hap-nodejs:accessories:'+'GarageDoor');
var garage = exports.accessory = new Accessory('Ворота', garageUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
garage.username = "C1:5D:3F:EE:5E:FA"; //edit this if you use Core.js
garage.pincode = "031-45-154";

garage
  .getService(Service.AccessoryInformation)
  .setCharacteristic(Characteristic.Manufacturer, "kontur-home")
  .setCharacteristic(Characteristic.Model, "1")
  .setCharacteristic(Characteristic.SerialNumber, "181218");

garage.on('identify', function(paired, callback) {
  FAKE_GARAGE.identify();
  callback();
});

garage
  .addService(Service.GarageDoorOpener, "Ворота")
  .setCharacteristic(Characteristic.TargetDoorState, Characteristic.TargetDoorState.CLOSED) // force initial state to CLOSED
  .getCharacteristic(Characteristic.TargetDoorState)
  .on('set', function(value, callback) {

    if (value == Characteristic.TargetDoorState.CLOSED) {
      FAKE_GARAGE.close();
      callback();
      garage
        .getService(Service.GarageDoorOpener)
        .setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
    }
    else if (value == Characteristic.TargetDoorState.OPEN) {
      FAKE_GARAGE.open();
      callback();
      garage
        .getService(Service.GarageDoorOpener)
        .setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPEN);
    }
  });


garage
  .getService(Service.GarageDoorOpener)
  .getCharacteristic(Characteristic.CurrentDoorState)
  .on('get', function(callback) {

    var err = null;
    FAKE_GARAGE.status();

    if (FAKE_GARAGE.opened) {
      console.log("Query: Is Garage Open? Yes.");
      callback(err, Characteristic.CurrentDoorState.OPEN);
    }
    else {
      console.log("Query: Is Garage Open? No.");
      callback(err, Characteristic.CurrentDoorState.CLOSED);
    }
  });

setInterval(function() {

	options['path'] = '/sec/?pt=6&cmd=get'; // вход (P&R) датчик открытия ворот 

	var request = http.request(options, function (res) {
	    var data = '';
	    res.on('data', function (chunk) {
	        data += chunk;
	    });
	    res.on('end', function () {
  
		check_flag = 1
 
		if ( data.substring (0,2) == 'ON')
 
         garage
        .getService(Service.GarageDoorOpener)
        .setCharacteristic(Characteristic.CurrentDoorState, false)
        .setCharacteristic(Characteristic.TargetDoorState, Characteristic.CurrentDoorState.OPEN);
 
        else 
         garage
        .getService(Service.GarageDoorOpener)
        .setCharacteristic(Characteristic.CurrentDoorState, true)
        .setCharacteristic(Characteristic.TargetDoorState, Characteristic.CurrentDoorState.CLOSED);
	    })
 
	});
	request.on('error', function (e) {
	    console.log(e.message);
	});
	request.end();

	FAKE_GARAGE.opened

}, 28000);

