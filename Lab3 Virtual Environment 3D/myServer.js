// Module imports
const express = require('express');
const expressWs = require('express-ws');

const url = require('url');

// Custom imports
var VirtualSpace = require('./myapp.js').VirtualWorld;
console.log('VirtualWorld imported:', VirtualSpace);
var WORLDDATA = require('./public/data.js');
var WORLD = WORLDDATA.Classrooms;

var vw = new VirtualSpace();
vw.start()

// Server setup
const app = expressWs(express()).app;
app.use(express.static('public')); // to handle static files, redirect to public folder

/*USADO*/
// Variables
var msgs = [];
// //var clients = [];
// //var rooms = {};
var clientId = 0;

// Routes
app.get('/', (req, res) => res.send('Hello World!'));
app.all('/msgs', (req, res) => res.send(JSON.stringify(msgs)));
app.all('/clients', function(req, res) {
    //res.json(WORLD.people.map(agent => agent.userInfo));
   res.json(WORLD.people.map(agent => agent)); /*VIRTUAL STATE*/
});

// WebSocket setup
app.ws('/', (ws, req) => {
    console.log("user connected");
    //clients.push(ws); // añade el nuevo cliente a la lista
    ws.id = clientId++; // asigna un identificador único a cada cliente

    // envía el ID al cliente
    var packetID = {
        type: "initID",
        agentID: ws.id,
    };

    console.log("SERVER :" + ws.id);
    ws.send(JSON.stringify(packetID));

    ws.on('message', function(msg){
        //console.log("NEW MSG:", msg)
             
        var msg = JSON.parse(msg);
        //console.log("TYPE MSG: ", msg.type)
        
        vw.onUserMessage(this, msg);
    });

    ws.on('close', function(msg){
        var id = vw.onUserLeft(this);
        return id;    
    });
});

// Server launch
app.listen(9014, () => console.log('Example app listening on port 9014!'));



