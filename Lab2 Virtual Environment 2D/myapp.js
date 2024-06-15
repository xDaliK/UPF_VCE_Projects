var WORLDDATA = require('./public/data.js');
const mysql = require('mysql');
//var clientId = 0;

//var clients = [];

var WORLD = WORLDDATA.worldrooms;

// Database setup
const DB = mysql.createConnection({  
    database:'ecv-2019', 
    user: 'ecv-user',  
    password: 'ecv-upf-2019', 
    host: '127.0.0.1'
  });
  
  const salt = "l2352ojk437uty5rr3243c587i";
  
  DB.connect(err => {
    if (err) console.log(err);
    else console.log("DB Connected!");
  });

class VirtualWorld {

  constructor() {
	console.log("Welcome to the Virtual World");
    WORLD.init()
    console.log("WORLD: ", WORLD.toJSON());
  }

  start(){
	console.log("Starting Virtual World");
	setInterval(this.onTick.bind(this), 1000/60);
  }

  onTick(){	
       
        for (var i in WORLD.people ){
            
            var agent = WORLD.people[i];
            var room = WORLD.rooms[agent.room_name];
            //console.log(room)
            if (!room) continue;
            
            var visible_people = []
            
            //console.log("PEOPLE IN ROOM: ",room.people.length) // problem
            for (var j in room.people){
                var another = room.people[j]
                if (another == agent) continue;
                visible_people.push(another);
            }
            //console.log("VISIBLE: ", visible_people)
            var msg_tick = {
                type: "roomState",
                people: visible_people,
            }

            //console.log('ws is WebSocket: ', ws instanceof WebSocket);

            if (agent.ws) {
                agent.ws.send(JSON.stringify(msg_tick));
            } else {
                console.log('agent.ws is not a WebSocket: ', agent.ws);
            }
        }
        
    
  }

  
  onNewUser(ws){
	
    //clients[ws.id] = ws;

    var agent = new WORLDDATA.Agent();
    agent.id = ws.id
    console.log("antes ", agent)
    agent.username = ws.state.username
    agent.room_name = ws.state.room_name
    agent.avatar = ws.state.avatar
    agent.avatarChat = ws.state.avatarChat
    console.log("despues ", agent)
    agent = WORLDDATA.createAgent(agent.toJSON());
    agent.setWebSocket(ws)

    //WORLD.registerAgent(agent)
    Object.keys(WORLD.rooms).forEach(function(roomKey){
        var room = WORLD.rooms[roomKey];
        if(room.id == agent.room_name){
            room.enterAgent(agent);
        }
    });
    //WORLD.rooms.hall.enterAgent(agent)
    agent.setWebSocket(ws);

    ws.send(JSON.stringify({
        type:"welcome",
        id: ws.id, 
        agent: agent.toJSON(),
        room: WORLD.rooms[agent.room_name].toJSON(),
        world: WORLD.toJSON()
    }))
    
  }

  onUserMessage(ws, message){
	//console.log("New Message from User");
    
    //if (!agent) return;
	//var message = JSON.parse(msg);
        switch (message.type) {
        case "userInfo":
            caseUserInfo(ws, message, this);
            break;
        case "userRegister":
            caseUserRegister(ws, message, this);
            break;
        case "text":
            caseText(ws, message, this);
            break;
        case "textPrivate":
            caseTextPrivate(ws, message, this);
            break;
        case "state":
            caseState(ws, message, this);
            break;
        case "changeRoom":
            caseChangeRoom(ws, message, this);
            break;
        default:
            console.log("Unknown message type: " + message.type);
        }	
  }

  onUserLeft(ws){
        console.log("User left");
    
        // Buscar al cliente por su id
        //var index = clients.findIndex(client => client.websocket.id === ws.id);
        //delete WORLD.people[ws.id]
        var index = WORLD.people.findIndex( (a) => a.id === ws.id);
       

        if (index !== -1) {
            var agent = WORLD.people[index]
            

            if(!agent.room_name) return;
            
            var room = WORLD.rooms[agent.room_name]
            if(!room ) return;
            
            var disconnectedAgent = agent
            //people.splice(index, 1); // elimina el cliente de la lista cuando se desconecta
        
        
            console.log("DISC : " + disconnectedAgent);
            //console.log("DISC : " + disconnectedClient.userinfo);
        
            var disconnectPacket = {
                type: "agentDisconnected",
                agentID: disconnectedAgent.ws.id,
                username: disconnectedAgent.username,
                room: disconnectedAgent.room_name
            };
        
            // Notificar a todos los clientes que un usuario se ha desconectado
            // go throgh every person and inform that this person is gone
            BroadcastMessage(ws, disconnectPacket);

            WORLD.removeAgent(ws.id)
        
        
            var agentListPacket = {
                type: "agentsListUpdate",
                agents: WORLD.rooms[room.id].people.map(agent => agent.toJSON()),
                room: room.id
            };
            
            
            BroadcastMessage(ws, agentListPacket);

            
        }
        return ws.id

    }

}

function caseUserInfo(ws, message, vw) {
    console.log(message);

    var username = message.username;
    var password = message.password;
    //var avatar = message.avatar;

    //LOGIN

    var query = 'SELECT userID, username, pword, avatar FROM users_DaNau0102Ent WHERE username = ? AND pword = MD5(?)';

    DB.query(query, [username, password+salt], function(err, result) {
    if (err) {
        console.log('Error: ' + err.stack);
        //result.status(500).send('Error on register');
    } else {
        if(result.length != 0){
            
            message.userid = result[0].userID;

            //clients.push({userInfo: message, websocket: ws});
            
            ws.id = message.userid;

            /* VIRTUAL SPACE */
            ws.state = 
            {
                id: ws.id,
                avatar: "./imgs/boy_1.png",
                avatarChat: "./imgs/boy_1_chat.png",
                position:[0,0],
                facing: 0,
                action: "init",
                room_name: message.room,
                username: username
            }
            console.log("roomID: ", ws.state.room_name)
            var defaultroom = WORLD.rooms[ws.state.room_name];
            console.log("ROOM: ", defaultroom);
            if(!defaultroom){
                defaultroom = new WORLDDATA.Room();
                defaultroom.fromJSON({
                    id: ws.state.room_name,
                    position: [0,0],
                    background: null,
                    people: []
                });
                WORLD.registerRoom(defaultroom);
            }
            console.log("HEY MIRA WS: ", ws)
            vw.onNewUser(ws);
            
            //message.room = ws.state.room;
            console.log("ID:" + ws.id);
            /* ------------ */

            var LastMsgs = getLastMsgsfromRoom(message.room);

            var AgentListMsgsPacket = {
                type: "agentsListMsgs",
                agents: WORLD.people.map(agent => agent.toJSON()),
                authorid: ws.id,
                lastmsgs: LastMsgs
            };
            ws.send(JSON.stringify(AgentListMsgsPacket))
            console.log("AgentPacket: "+ AgentListMsgsPacket);

            console.log("User logged successfully");
            console.log(result.length);
            console.log("AUTHOR: "+ message.userid)

            //Get the people of the same room as the new user and send the new user to the people of the room
            
            console.log("ROOM info: "+ Object.keys(defaultroom));

            for (var key in defaultroom.people) {
                var person = defaultroom.people[key];
                console.log("PEOPLE: "+ Object.keys(person));
                console.log("ws: "+ typeof person.ws);
                if (person.id != ws.id){                    
                    person.ws.send(JSON.stringify(AgentListMsgsPacket));
                }
            }
            //Inicializar canvas y enviar state

        } else{
            console.log("ERROOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOR");
            var controlError = {
                type: "control_error",
                content: "User not Found",
            }
            ws.send(JSON.stringify(controlError));
            console.log("User not found");
        }
    }
    });
}
  
function caseUserRegister(ws, message, vw) {
    console.log(message);

    
    var username = message.username;
    var password = message.password;
    var avatar = message.avatar;
    
    //Check if username exists --> REGISTER
    var query = 'SELECT username FROM users_DaNau0102Ent WHERE username = ?';
    
    DB.query(query, [username], function(err, result) {
        if (err) {
            console.log('Error: ' + err.stack);
            //result.status(500).send('Error on register');
        } else {
            if(result.length != 0){
                console.log("ERROOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOR");
                var controlError = {
                    type: "control_error",
                    content: "User already exists",
                }
                ws.send(JSON.stringify(controlError));
                console.log('Error: '+ controlError.content);
            } else{
                console.log("Registered");
                InsertUser(ws, message, vw);
                console.log("AUTHOR: "+ message.userid)
            }
        }
    });
}

function caseText(ws, message, vw) {
    // parsea 'msg' a un objeto JavaScript
    
    console.log("MsgReceived: "+ message.content)
    console.log("ByName: "+ message.username)
    console.log("ByID: "+ ws.id)
    // añade el mensaje a la lista con el identificador del cliente que lo envió
    // msgs.push({msg: message.content, clientId: ws.id});
    // retransmite el mensaje a todos los clientes

    var servermsg = {
        type: "servermsg",
        content: message.content,
        username: message.username,
        authorID: ws.id,
		room: message.room,
    }

    //Add message to the database

    var query = 'INSERT INTO msgs_DaNau0102Ent (userID, content, type, room) VALUES (?, ?, ?, ?)';

    DB.query(query, [servermsg.authorID, servermsg.content, servermsg.type, servermsg.room], function(err, result) {
        if (err) { 
            console.error('Error: ' + err.stack);
        //result.status(500).send('Error on register');
        } else {
            console.log("Message added successfully");
        //result.status(200).send('User registered successfully');
        }
    });



    BroadcastMessage(ws, servermsg);
}

function caseTextPrivate(ws, message, vw) {
    console.log("MsgPrivateReceived: "+ message.content)
    console.log("ByName: "+ message.username)
    console.log("ByID: "+ ws.id)

    var servermsg = {
        type: "servermsg",
        content: "Private message from ID " + ws.id + " : "+ message.content,
        username: message.username,
        authorID: ws.id,
        private: 1
    }
    console.log("PRIVATE CLIENTS :" + message.receiverUsers);

    // Recorre la lista de IDs de usuarios seleccionados
    for (var i in message.receiverUsers) {
        // Obtiene el ID del usuario seleccionado actual
        
        var selectedUserId = message.receiverUsers[i];
        console.log("SELECTED : " + selectedUserId);

        // Busca al cliente en la lista de gente en la sala del mundo
        for (var ID in WORLD.rooms[message.room].peopleID){
            if(ID){
                if ( selectedUserId == ID){
                    WORLD.rooms[message.room].people[ID].ws.send(JSON.stringify(servermsg));
                    console.log("FOUNDED ");
                }
            }
        }
    }
}

function caseState(ws, message, vw) {
    var idx = WORLD.people.findIndex( (a) => a.id === ws.id);
    if(idx === -1) return;
    var agent = WORLD.people[idx];
    agent.fromJSON(message.state);
    agent.setWebSocket(ws);
    agent.id = ws.id;
   
    for (var key in WORLD.rooms[agent.room_name].people) {
        var person = WORLD.rooms[agent.room_name].people[key];
        // console.log("PEOPLE: "+ Object.keys(person));
        // console.log("ws: "+ Object.keys(person.ws));
        if (person.id != ws.id)
            person.ws.send(JSON.stringify(message));
        else{
            person.fromJSON(agent.toJSON());
            person.setWebSocket(ws);
            person.id = agent.id;
        }

    }
}

function caseChangeRoom(ws, message, vw) {
    console.log("ChangeRoom to: "+ message.newroom);
    // If the room doesn't exist, create it
    if(!WORLD.rooms[message.newroom]) {
        var room = new WORLDDATA.Room();
        var urlbackground = WORLDDATA.getBackground(message.newroom);
        room.fromJSON({
            id: message.newroom,
            position: [0,0],
            background: urlbackground,
            people: []
        });
        WORLD.registerRoom(room);
        console.log("ROOM REGISTERED")
    }
    
    // Remove the client from the previous room
    var idx = WORLD.people.findIndex( (a) => a.id === ws.id);
    console.log("IDX: "+ idx);

    if(idx === -1) return;

    var agent = WORLD.people[idx];
    console.log("AGENT: "+ agent.toJSON());
    // Add the client to the room
    WORLD.rooms[message.newroom].enterAgent(agent);
    console.log("ROOM ENTERED ", message.newroom);
    
    // Update the client's room_name
    WORLD.rooms[message.currentroom].leaveAgent(agent);
    agent.room_name = message.newroom;
    console.log("ROOM LEFT ", WORLD.rooms[message.currentroom]);
    
    // Send a message to the users to confirm he joined the room
    var roomState = WORLD.rooms[message.newroom];
    // BroadcastMessage(ws, { 
    //     type: "joinedRoom", 
    //     agent: agent.toJSON(), 
    //     room: message.newroom, 
    //     oldroom: message.currentroom
    // });
    // Comunicate to other clients that you left the room and join another room
    var OldRoomAgentListPacket = {
        type: "agentsListUpdate",
        agents: WORLD.rooms[message.currentroom].people.map(agent => agent.toJSON()),
        room: message.currentroom
    };
    
    ws.send(JSON.stringify(OldRoomAgentListPacket));
    BroadcastMessage(ws, OldRoomAgentListPacket);

    ws.send(JSON.stringify({ 
        type: "joinedRoom", 
        agent: agent, 
        room: message.newroom, 
        oldroom: message.currentroom 
    }));

    console.log("ROOM JOINED ", message.newroom);


    var userLeftPacket = {
        type: "userLeftRoom",
        agent: agent.toJSON(),
        room: message.currentroom,
        newroom: message.newroom
    };

    //ws.send(JSON.stringify(userLeftPacket));
    BroadcastMessage(ws, userLeftPacket);

    var NewRoomAgentListPacket = {
        type: "agentsListUpdate",
        agents: WORLD.rooms[message.newroom].people.map(agent => agent.toJSON()),
        room: message.newroom
    };

    BroadcastMessage(ws, NewRoomAgentListPacket);
    ws.send(JSON.stringify(NewRoomAgentListPacket));

    var LastMsgs = getLastMsgsfromRoom(message.newroom);

    var AgentListMsgsPacket = {
        type: "agentsListMsgs",
        agents: WORLD.rooms[message.newroom].people.map(agent => agent.toJSON()),
        authorid: ws.id,
        lastmsgs: LastMsgs
    };

    ws.send(JSON.stringify(AgentListMsgsPacket));

}


// function caseJoinRoom(ws, message) {
//     // If the room doesn't exist, create it
//     if(!rooms[message.room]) {
//     rooms[message.room] = [];
//     }

//     // Add the client to the room
//     rooms[message.room].push(ws);

//     var clientListMsgsPacket = {
//         type: "clientsListMsgs",
//         clients: rooms[message.room].map(client => client.userInfo),
//         authorid: message.userid,
//         lastmsgs: msgs.slice(-10)
//     };

//     // Send a message to the client to confirm they joined the room
//     ws.send(JSON.stringify({ type: "joinedRoom", room: message.room }));
// }

// function caseLeaveRoom(ws, message) {
// // If the room exists find the client in the room and remove them
//     if(rooms[message.room]) {
//         var index = rooms[message.room].indexOf(ws);
//         if(index !== -1) {
//             rooms[message.room].splice(index, 1);
//         }

//         // Send a message to the client to confirm they left the room
//         ws.send(JSON.stringify({ type: "leftRoom", room: message.room }));
//     }
// }

// Helper function
function InsertUser(ws, message, vw) {
    
    var query = 'INSERT INTO users_DaNau0102Ent (username, pword, avatar) VALUES (?, MD5(?), ?)';
    DB.query(query, [message.username, message.password+salt, "./imgs/boy_1.png"], (err, result) => {
        if (err) console.log('Error: ' + err.stack);
        else {
            console.log("User registered successfully");
            
            caseUserInfo(ws, message , vw);
        }
    });
}

function BroadcastMessage(ws, message) {
    console.log(message);
    for (var key in WORLD.rooms[message.room].people) {
        var person = WORLD.rooms[message.room].people[key];
        // console.log("PEOPLE: "+ Object.keys(person));
        // console.log("ws: "+ Object.keys(person.ws));
        if (person.id != ws.id)
            person.ws.send(JSON.stringify(message));
    }
}

function getLastMsgsfromRoom(room){
    var query = 'SELECT * FROM msgs_DaNau0102Ent WHERE room = ? ORDER BY message_id DESC LIMIT 10';
    DB.query(query, [room],(err, result) => {
        if (err) console.log('Error: ' + err.stack);
        else {
            console.log("Messages retrieved successfully");
            return result;
        }
    });
}


if(typeof module !== 'undefined'){
   
    module.exports.VirtualWorld = VirtualWorld;
}
