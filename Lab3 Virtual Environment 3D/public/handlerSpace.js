// JS By DaNau

console.log("Hello from DaNau Space!");
//const WebSocket = require('ws');
// Socket Client side

/*var socket = new WebSocket("wss://ecv-etic.upf.edu/node/9002/ws/");*/
var url = "wss://ecv-etic.upf.edu/node/9014/ws/";
//var url = "ws://localhost:9014";
var socket = new WebSocket(url);

var username = "unknown";
var password = "unknown";

//var selectedRoom = 1;
var myAgentID = 0;
var myAgent;
//var receiverID;

var is_mine = 1;
//var current_room = 'hall';


socket.onopen = function(){
    // Check if myAgent exists in localStorage
    if(localStorage.getItem('myAgent')) {
        if(!myAgent) {
            myAgent = new Agent();
            myAgent.setWebSocket(socket);
            console.log("MY AGENT WS: ", myAgent.ws)
            console.log("MY AGENT WS: ")
        }
        // Parse the JSON string to an object and restore it to myAgent
        myAgent.fromJSON(JSON.parse(localStorage.getItem('myAgent')));
        console.log("MY AGENT WS: ", myAgent.ws)
        console.log("MY AGENT WS: ")
        myAgent.setWebSocket(socket);
        current_room = myAgent.room_name;
    }
    console.log("Connected succesfully")
};

function WelcomeCase(data){
    myAgentID = data.id; //Update ID from the userID of the database
    if (!myAgent)
        myAgent = new Agent();
    console.log("AGENT WELCOME: ", data.agent)
    myAgent.fromJSON(data.agent);
    //myAgent.fromJSON( data.agent );
    //console.log(myAgent.ws);
    myAgent.setWebSocket(data.agent.ws);
    myAgent.id = myAgentID;
    current_room = myAgent.room_name;
    EnterRoom();
    console.log("WELCOME to World: " + data.world);

    if(data.world)
        Classrooms.load(data.world);

    myAgent = Classrooms.updateAgent(myAgent.toJSON(), myAgent.ws);

    console.log("WORLD TO LOAD ", data.world);
}

function StateCase(data){
    var agent = new Agent();
    agent.fromJSON(data.agent)
    agent.setWebSocket(data.agent.ws);
    agent.id = data.agent.id;

    
    if(agent.id == myAgentID){
        myAgent = Classrooms.updateAgent(agent.toJSON(), agent.ws);
        myAgent.setWebSocket(agent.ws);
        myAgent.room_name = current_room;
        localStorage.setItem('myAgent', JSON.stringify(myAgent.toJSON()));
        //get out of the else if
        return;
    }

    Classrooms.updateAgent(agent.toJSON(), agent.ws);
}

function RoomStateCase(data){
    var people = data.people;
    //console.log("ENTRO ROOMSTATE")
    for (var i in people){

        var agent = new Agent();
        agent.fromJSON(data.people[i]);
        agent.setWebSocket(data.people[i].ws);
        agent.id = data.people[i].id;
        if (agent.id == myAgentID){
            myAgent = Classrooms.updateAgent(agent.toJSON(), agent.ws);
            //myAgent.fromJSON(agent);
            myAgent.setWebSocket(agent.ws);
            localStorage.setItem('myAgent', JSON.stringify(myAgent.toJSON()));
            continue;
        }
        agent = Classrooms.updateAgent(agent.toJSON(), agent.ws);
        //MIRAR SI TIENE SCENENODE EN TU MUNDO (AgentsInWorld)
        var idx = AgentsInWorld.findIndex( (node) => node.name === agent.username)
        if(idx == -1){
            //No -> Creamos sceneNode con los parametros de agent         
            var [NewChar, NewPlane] = CreateNewSceneNode(agent);//Function that returns a scenenode with agent params
            AgentsInWorld.push(NewChar) // problema, añade chars todo el rato
            AgentsActions.push(agent.action)
            AgentsPlanes.push(NewPlane)
            continue;
        }
        
        //Si -> Actualizamos valores del agent
        var charToUpdate = AgentsInWorld[idx];
        //var actionToUpdate = AgentsActions[idx];
        var planeToUpdate = AgentsPlanes[idx];
        
        charToUpdate.position = agent.position;
        charToUpdate.rotation = agent.rotation;
        AgentsActions[idx] = agent.action;

        if(AgentsActions[idx] == "sit")
            planeToUpdate.position = [agent.position[0], agent.position[1] + 0.8, agent.position[2]];
        else if(AgentsActions[idx] == "raiseHand")
            planeToUpdate.position = [agent.position[0], agent.position[1] + 0.8, planeToUpdate.position[2]];
        else
            planeToUpdate.position = [agent.position[0], agent.position[1] + 0.9, agent.position[2]];
        
        planeToUpdate.rotation = charToUpdate.rotation;

    }
}

function AgentsListMsgsCase(data){
    var currentUsers = data.agents.length;
        
    console.log(currentUsers)
    console.log("AUTHOR " + data.authorid)
    console.log("ME " + myAgentID);

    if(data.authorid == myAgentID){
        // Primero, añade al usuario actual
        showMessage(username, "Server DaNau" + " Connected. Your userID: " + myAgentID, myAgent.avatarChat, true);
        
        // New user recieves the last 10 messages on the server
        handleMessages(data);

        newUser("(You) " +username, myAgentID, myAgent.avatarChat);

        // Luego, añade a los demás usuarios
        data.agents.forEach(agent => {
            // Solo añade al agente si su userid es diferente del userid del usuario actual
            if (agent.id !== myAgentID) {
                newUser(agent.username, agent.id, agent.avatarChat);
            }
        });
    } else {
        // Si el agente ya estaba conectado, solo añade el último usuario que se ha unido
        var lastUser = data.agents[data.agents.length - 1];
        newUser(lastUser.username, lastUser.id, lastUser.avatarChat);
    }

    //Updates and shows current number of users on the chat
    //numberUsers.textContent = currentUsers;
    //numberUsers.style.display = "inline";

}

function AgentsListUpdateCase(data){
//     if(current_room == data.room){
//         var disconnectcurrentUsers = data.agents.length;
    
//         console.log(disconnectcurrentUsers);

                
//         //numberUsers.textContent = disconnectcurrentUsers;
//         numberUsers.style.display = "inline";
//     }
}

function ServermsgCase(data){
    console.log("server: " +data.authorID);
    console.log("chat : "+ myAgentID);
    var msg = {
        type: "text",
        content: data.content,
        username: data.username, // asumimos que cualquier mensaje entrante es del otro usuari
        room: data.room,
    };
    
    is_mine = data.authorID === myAgentID
    console.log("NEW MSG: ", msg)
    refresh(msg, 0, data.authorID, 0); // actualiza el chat para mostrar solo el nuevo mensaje
}

function joinedRoomCase(data){
    console.log("Agent:"+ data.agent.username + ". Joined Room: " + data.agent.room_name);
    var toNewRoom = data.agent.room_name;
    var oldRoom = data.oldroom;

    
    //porque sale que esta registrada en cliente si solo esta hecho en servidor con packet join:roomState
    var room = Classrooms.rooms[toNewRoom];
    console.log("ROOM to JOIN: ", room);
    var urlbckround = getBackground(toNewRoom);
    
    if(!Classrooms.rooms[toNewRoom]) {
        var room = new Room();
        room.fromJSON({
            id: toNewRoom,
            position: [0,0],
            background: urlbckround,
            people: []
        });
        Classrooms.registerRoom(room)
    }
    
    var agent = new Agent();
    agent.fromJSON(data.agent);
    agent.setWebSocket(data.agent.ws);
    agent.position = [0,0,0];
    GoTodistance = 0;
    agent.action = "init";
    agent.id = data.agent.id;
    
    // Add the client to the room
    Classrooms.rooms[toNewRoom].enterAgent(agent);
    
    Classrooms.rooms[oldRoom].leaveAgent(agent);
    agent.room_name = toNewRoom;

    current_room = toNewRoom;
    //myAgent.room_name = current_room;
    //myAgent.lastRoomConnected = current_room;
    
    if(data.agent.id == myAgentID){
        resetUsersandMessages();

        showMessage(username, "Joined in Room: " + current_room + ". Your userID: " + myAgentID, myAgent.avatarChat, true);
        myAgent.fromJSON(agent);
        myAgent.setWebSocket(agent.ws);
        myAgent.room_name = current_room;
        localStorage.setItem('myAgent', JSON.stringify(myAgent.toJSON()));

    }  
    entered = true; 
}

function userLeftRoomCase(data){
    //Other user left the room
    var leftRoomID = data.room;
    var joinedRoom = data.newroom;
    
    var leftAgent = new Agent();
    leftAgent.fromJSON(data.agent);
    leftAgent.setWebSocket(data.agent.ws);
    leftAgent.id = data.agent.id;
    
    console.log("Left Room: " + leftRoomID);
    console.log("Left Agent: " + leftAgent);
    
    var room = Classrooms.rooms[joinedRoom];
    
    if(!room) {
        var urlbckround = getBackground(joinedRoom);

        var room = new Room();
        room.fromJSON({
            id: joinedRoom,
            position: [0,0],
            background: urlbckround,
            people: []
        });
        Classrooms.registerRoom(room)
    }
    var leftRoom = Classrooms.rooms[leftRoomID];

    room.enterAgent(leftAgent);
    leftRoom.leaveAgent(leftAgent);
    leftAgent.room_name = joinedRoom;
}

function InactivityCase(data){
    for(var i in AgentsPlanes){
        console.log(AgentsPlanes[i].texture)
        if(AgentsPlanes[i].texture == (':username' + data.agentid)){

            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext('2d');
            canvas.width = 1024;
            canvas.height = 1024;
            ctx.fillStyle = data.color;
            ctx.fillRect(0, 0, canvasuser.width, canvasuser.height); 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle'; 	
            ctx.font = "30em Arial";
            ctx.fillStyle = 'black'; 
            ctx.fillText(data.agentname, canvasuser.width/2, canvasuser.height/2);

            var texture = new GL.Texture.fromImage(canvas);
            gl.textures[":username" + data.agentid] = texture;
            AgentsPlanes[i].texture = ":username" + data.agentid;
        }
    }
}

function NewQuestionCase(data){
    yourQuestion = data.newQuestion;
    yourAnswer = data.newAnswer;
    generateYourQuestion(yourQuestion, yourAnswer);

}

function AnswerCase(data){
    if(!myAgent.isTeacher)
        return;
    AnswersList.push(data);
}



socket.onmessage = function(event){
    //console.log("msg received: ", event.data);
      
    var data = JSON.parse(event.data);

    switch(data.type){
        case "initID":
            myAgentID = data.agentID;
            console.log("MyAgentID: " + myAgentID);
            break;
        case "welcome":
            WelcomeCase(data);
            break;
        case "state":
            StateCase(data);
            break;
        case "roomState":
            RoomStateCase(data);
            break;
        case "agentsListMsgs":
            AgentsListMsgsCase(data);
            break;
        case "agentsListUpdate":
            AgentsListUpdateCase(data);
            break;
        case "agentDisconnected":
            var disconnectedAgent = data.agentID;
            console.log(disconnectedAgent);
            deleteUser(disconnectedAgent);
            break;
        case "servermsg":
            ServermsgCase(data);
            break;
        case "control_error":
            console.log("Error: " + data.content);
            var content_error = data.content;
            //content_error = "error";
            alert(content_error);
            break;
        case "joinedRoom":
            joinedRoomCase(data);
            break;
        case "userLeftRoom":
            userLeftRoomCase(data);
            break;
        case "inactivity":
            InactivityCase(data)
            break;
        case "newQuestion":
            NewQuestionCase(data)
            break;
        case "answerquestion":
            AnswerCase(data)
            break;

    }
};

socket.onclose = function(){console.log("User left.")};

//Try to reconnect to the same websocket
socket.stop = function(){
    var url = "wss://ecv-etic.upf.edu/node/9014/ws/";
    //var url = "ws://" + location.host;
    socket = new WebSocket(url);};


// Keep the last 10 messages of the server
async function handleMessages(data) {
    for (var i = data.lastmsgs.length - 1; i >= 0; i--){
        var msg = data.lastmsgs[i].content;
        var agentmsgid = data.lastmsgs[i].userID;
        console.log("LAST msgs : " + msg);
        console.log("LAST BY: " + agentmsgid);
        var minemessage = false;
        if(agentmsgid == myAgent.id)
            minemessage = true;


        // Ahora puedes usar await dentro de esta función
        // var msg_username = await getUsernameByUserID(agentmsgid);
        // var msg_avatar = await getAvatarByUserID(agentmsgid);
        // if (!msg_username) msg_username = "User Disconnected";

        var user = data.agentsInDB.find(agent => agent.userID === agentmsgid);
        var msg_username = user ? user.username : "User Disconnected";
        var msg_avatar = user ? user.avatarChat : null;

        showMessage(msg_username, msg, msg_avatar, minemessage , 0);
    }
}

//Hides the Rooms' menu selector when you enter a room

//REVISAR
function EnterRoom() {
    var body = document.getElementById('initChat');
    var rooms = document.getElementById('rooms');
    var currentDisplay = window.getComputedStyle(rooms).display;
    var container = document.getElementById('container_window_info')
    if (currentDisplay === "block") {
        container.style.display = "none";
        rooms.style.display = "none";
        body.style.backgroundImage = "none";
        //REVISAR
        //Implementar botones HUD (chat,elementos chat, userlist)
        init();
    }
}



//REVISAR
//Useful function to get the username of an exisiting user on the DB room using the userid
async function getUsernameByUserID(authorID) {
    // var username = null;
    // var data = await fetch("clients").then((a)=>a.json());
   
    var username = null;
    var data = await fetch("clients").then((a)=>a.json()); //No coge todos los clients, solo los que estan conectados
    data.forEach(function (agent) {
        if (agent.id == authorID) {
            username = agent.username;  
        }
    });
    console.log(username);
    return username;
}
//REVISAR
//Useful function to get the avatar of an exisiting user on the DB room using the userID
async function getAvatarByUserID(authorID) {
    var avatar_userID = null;
    var data = await fetch("clients").then((a)=>a.json());
    console.log("FETCH: ", data)
    data.forEach(function (agent) {
        if (agent.id == authorID) {
           avatar_userID = agent.avatarChat;  
        }
    });

    return avatar_userID;
}




