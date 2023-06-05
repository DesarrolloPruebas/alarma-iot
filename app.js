var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);

server.listen(3000, function () {
    console.log("Servidor corriendo en http://localhost:3000");
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

var five = require("johnny-five");
var arduino = new five.Board({ port: '/dev/ttyUSB0' });
var led;
var boton;
var proximity;
var sensor;
var buzzer = 3;

var estado = false;

arduino.on('ready', function () {
    led = new five.Led(12);

    boton = new five.Button(2);

    proximity = new five.Proximity({
        controller: "HCSR04",
        pin: 7
    });

    sensor = new five.Sensor({
        pin: "A0",
        freq: 4000
    });

    this.pinMode(buzzer, five.Pin.PWM);

    this.loop(500, () => {
        if(estado) {
            io.emit('arduino:alarma', {
                value: "activar"
            });
        } else {
            io.emit('arduino:alarma', {
                value: "desactivar"
            });
        }
    });


    app.get('/', function (req, res) {
        res.send(index.html);
    });

    app.get('/encender', function (req, res) {
        led.on();
        arduino.analogWrite(buzzer, 100);
        estado = true;
        res.redirect('/');
    });

    app.get('/apagar', function (req, res) {
        led.off();
        arduino.analogWrite(buzzer, 0);
        estado = false;
        res.redirect('/');
    });

    boton.on("press", function () {
        if(estado) {
            led.off();
            arduino.analogWrite(buzzer, 0);
            estado = false;
        } else {
            led.on();
            arduino.analogWrite(buzzer, 100);
            estado = true;
        }
    });

    proximity.on("change", () => {
        const {centimeters, inches} = proximity;
        if(centimeters <= 10) {
            led.on();
            arduino.analogWrite(buzzer, 100);
            estado = true;
        }
    });

    sensor.on("data", function () {
        if(this.value > 300) {
            led.on();
            arduino.analogWrite(buzzer, 100);
            estado = true;
        }
        io.emit('arduino:data', {
            value: this.value
        });
    });
});
