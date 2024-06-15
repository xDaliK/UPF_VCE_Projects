// Module imports
const express = require('express');
const expressWs = require('express-ws');

const url = require('url');
//const session = require('express-session');

// Custom imports
var VirtualWorld = require('./myapp.js').VirtualWorld;
console.log('VirtualWorld imported:', VirtualWorld);
var WORLDDATA = require('./public/data.js');
var WORLD = WORLDDATA.worldrooms;

var vw = new VirtualWorld();


vw.start()

// Server setup
const app = expressWs(express()).app;
app.use(express.static('public')); // to handle static files, redirect to public folder

// // Set up session
// app.use(session({
//   secret: salt,
//   resave: false,
//   saveUninitialized: true,
// }));

// // Middleware to check if user is logged in
// function checkLoggedIn(req, res, next) {
//   if (req.session && req.session.user) {
//     next();
//   } else {
//     //res.status(401).send('Unauthorized');
//     window.alert("Usuario o contraseña incorrectos");
//   }
// }

// app.post('/login', (req, res) => {
//   var username = req.query.username;
//   var password = req.query.password;
//   var query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
//   DB.query(query, (err, result) => {
//     if (err) res.status
//     if (result.length > 0) {
//       req.session.user = result[0];
//       res.send('Logged in!');
//     } else {
//       //res.status(401).send('Unauthorized');
//       window.alert("Usuario o contraseña incorrectos");
//     }
//   });
// });

// Variables
var msgs = [];
//var clients = [];
//var rooms = {};
var clientId = 0;

// Routes
app.get('/', (req, res) => res.send('Hello World!'));
app.all('/msgs', (req, res) => res.send(JSON.stringify(msgs)));
app.all('/clients', function(req, res) {
    //res.json(WORLD.people.map(agent => agent.userInfo));
    res.json(WORLD.people.map(agent => agent)); /*VIRTUAL STATE*/
});

app.all('/addChat', (req, res) => {
    var msg = url.parse(req.url, true).query.msg;
    if(msg) msgs.push({msg: msg});
    res.send("OK");
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
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
        var msg = JSON.parse(msg);
        vw.onUserMessage(this, msg);
    });

    ws.on('close', function(msg){
        var id = vw.onUserLeft(this);
        return id;    
    });
});

// Server launch
app.listen(9014, () => console.log('Example app listening on port 9014!'));



