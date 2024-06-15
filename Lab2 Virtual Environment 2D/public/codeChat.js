// JS By DaNau

console.log("Hello from DaNau Chat!");

// Socket Client side

/*var socket = new WebSocket("wss://ecv-etic.upf.edu/node/9002/ws/");*/
var url = "wss://ecv-etic.upf.edu/node/9014/ws/";
//var url = "ws://" + location.host;
var socket = new WebSocket(url);


var chatContainer = document.querySelector("div#chat_container");

var usernameInput = document.querySelector("input#input_username");
var passwordInput = document.querySelector("input#input_password");
var numberUsers = document.getElementById("number_users");

var messageInput = document.querySelector("input#input_chat");
var buttonSend =  document.querySelector("button#button_send");
var buttonAvatar =  document.querySelector("button#button_avatar");

var usersContainer = document.getElementById("usersContainer");
//var selectedAvatar = "imgs/boy_1_chat.png"; //Predefined avatar
var buttonSelectRoom= document.getElementById("button_selectroom");
var buttonRegister= document.getElementById("button_register");

var buttonUsers = document.getElementById("button_users");


var username = "unknown";
var password = "unknown";

//var selectedRoom = 1;
var myAgentID = 0;
//var receiverID;

var is_mine = 1;
//var current_room = 'hall';

socket.onopen = function(){
    // Check if myAgent exists in localStorage
    if(localStorage.getItem('myAgent')) {
        if(!myAgent) {
            myAgent = new Agent();
        }
        // Parse the JSON string to an object and restore it to myAgent
        myAgent.fromJSON(JSON.parse(localStorage.getItem('myAgent')));
        myAgent.setWebSocket(socket);
        current_room = myAgent.room_name;
    }
    console.log("Connected succesfully")
};



socket.onmessage = function(event){
    //console.log("msg received: ", event.data);
    
   
    var data = JSON.parse(event.data);


    if (data.type == "initID") { // si el mensaje contiene un campo 'agentID', lo guarda como el ID de este agente
        myAgentID = data.agentID;

        console.log("MyAgentID: " + myAgentID);
        
        

    } else if (data.type == "welcome"){ /*VIRTUAL SPACE myState*/
        myAgentID = data.id; //Update ID from the userID of the database
        if (!myAgent)
            myAgent = new Agent();
        myAgent.fromJSON( data.agent );
        myAgent.setWebSocket(data.agent.ws);
        myAgent.id = myAgentID;
        current_room = myAgent.room_name;
        EnterRoom();
        console.log("WELCOME to World: " + data.world);
        if(data.world)
            worldrooms.load(data.world);

        myAgent = worldrooms.updateAgent(myAgent.toJSON());

        console.log("WORLD TO LOAD ", data.world);
        
    } else if (data.type == "state"){ /*VIRTUAL SPACE */
        console.log("ENTRO STATE")
        
        var agent = new Agent();
        agent.fromJSON(data.state)
        agent.setWebSocket(data.state.ws);
        agent.id = data.state.id;

        
        if(agent.id == myAgentID){
            myAgent = worldrooms.updateAgent(agent.toJSON());
            myAgent.setWebSocket(agent.ws);
            myAgent.room_name = current_room;
            localStorage.setItem('myAgent', JSON.stringify(myAgent.toJSON()));
            //get out of the else if
            return;
        }

        worldrooms.updateAgent(agent.toJSON());
        
    } else if (data.type == "roomState"){ /*VIRTUAL SPACE */
        
        var people = data.people;
        //console.log("ENTRO ROOMSTATE")
        for (var i in people){

            var agent = data.people[i]
            if (agent.id == myAgentID){
                myAgent = worldrooms.updateAgent(agent.toJSON());
                myAgent.fromJSON(agent);
                myAgent.setWebSocket(agent.ws);
                localStorage.setItem('myAgent', JSON.stringify(myAgent.toJSON()));
                continue;
            }
            worldrooms.updateAgent(agent);           
        }

    } else if (data.type == "agentsListMsgs"){

        var currentUsers = data.agents.length;
        
        console.log(currentUsers)
        console.log("AUTHOR " + data.authorid)
        console.log("ME " + myAgentID);

        if(data.authorid == myAgentID){
            // Primero, añade al usuario actual
            showMessage(username, "Server DaNau" + " Connected. Your userID: " + myAgentID, myAgent.avatarChat, true);
            
            // New user recieves the last 10 messages on the server
            //handleMessages(data);

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
        numberUsers.textContent = currentUsers;
        numberUsers.style.display = "inline";

             
    } 
    else if (data.type == "agentsListUpdate"){

        if(current_room == data.room){
            var disconnectcurrentUsers = data.agents.length;
        
            console.log(disconnectcurrentUsers);

                    
            numberUsers.textContent = disconnectcurrentUsers;
            numberUsers.style.display = "inline";

            // worldrooms.people.forEach(agent => {
            //     var newagent = new Agent();
            //     newagent.fromJSON(agent);
            //     newagent.setWebSocket(agent.ws);
            //     newagent.id = agent.id;

            //     worldrooms.updateAgent(newagent.toJSON());
            //     //insert into the room

            // });
        }
                
    }  
    else if (data.type == "agentDisconnected"){

        var disconnectedAgent = data.agentID;
      
        console.log(disconnectedAgent);
        

        deleteUser(disconnectedAgent);
            

    } else if (data.type == "servermsg") { // verifica si el mensaje contiene un campo 'msg'
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
    // else if (data.type == "user_connected"){
    //     myAgentID = data.agentID; //Update ID from the userID of the database
    //     EnterRoom();
    //     /* VIRTUAL SPACE */
    //     var state = data.state;
    //     user_state = updateCharacter(state); //myState
    //     //socket.send(JSON.stringify({ type: 'joinRoom', room: '0', userid: 'user1' }));
    // }
    else if (data.type == "control_error"){
        console.log("Error: " + data.content);
        var content_error = data.content;
        content_error = "error";
        alert(content_error);

    } 
    else if (data.type == "joinedRoom"){
        console.log("Agent:"+ data.agent.username + ". Joined Room: " + data.agent.room_name);
        var toNewRoom = data.agent.room_name;
        var oldRoom = data.oldroom;

        
        //porque sale que esta registrada en cliente si solo esta hecho en servidor con packet join:roomState
        var room = worldrooms.rooms[toNewRoom];
        console.log("ROOM to JOIN: ", room);
        var urlbckround = getBackground(toNewRoom);
        
        if(!worldrooms.rooms[toNewRoom]) {
            var room = new Room();
            room.fromJSON({
                id: toNewRoom,
                position: [0,0],
                background: urlbckround,
                people: []
            });
            worldrooms.registerRoom(room)
        }
        
        var agent = new Agent();
        agent.fromJSON(data.agent);
        agent.setWebSocket(data.agent.ws);
        agent.position = [0,0];
        GoTodistance = 0;
        agent.action = "init";
        agent.facing = facing.front;
        agent.id = data.agent.id;
        
        // Add the client to the room
        worldrooms.rooms[toNewRoom].enterAgent(agent);
        
        worldrooms.rooms[oldRoom].leaveAgent(agent);
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
    else if (data.type == "userLeftRoom") {
        //Other user left the room
        var leftRoomID = data.room;
        var joinedRoom = data.newroom;
        
        var leftAgent = new Agent();
        leftAgent.fromJSON(data.agent);
        leftAgent.setWebSocket(data.agent.ws);
        leftAgent.id = data.agent.id;
        
        console.log("Left Room: " + leftRoomID);
        console.log("Left Agent: " + leftAgent);
        
        var room = worldrooms.rooms[joinedRoom];
        
        if(!room) {
            var urlbckround = getBackground(joinedRoom);

            var room = new Room();
            room.fromJSON({
                id: joinedRoom,
                position: [0,0],
                background: urlbckround,
                people: []
            });
            worldrooms.registerRoom(room)
        }
        var leftRoom = worldrooms.rooms[leftRoomID];

        room.enterAgent(leftAgent);
        leftRoom.leaveAgent(leftAgent);
        leftAgent.room_name = joinedRoom;        
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
    for (var i in data.lastmsgs){
        var msg = data.lastmsgs[i].msg;
        var agentmsgid = data.lastmsgs[i].agentID;
        console.log("LAST msgs : " + msg);
        console.log("LAST BY: " + agentmsgid);

        // Ahora puedes usar await dentro de esta función
        var msg_username = await getUsernameByUserID(agentmsgid);
        var msg_avatar = await getAvatarByUserID(agentmsgid);

        showMessage(msg_username, msg, msg_avatar, 0 , 0);
    }
}

//Hides the Rooms' menu selector when you enter a room

function EnterRoom() {
    var rooms = document.getElementById('rooms');
    var currentDisplay = window.getComputedStyle(rooms).display;

    if (currentDisplay === "block") {
       
        rooms.style.display = "none";
        buttonAvatar.style.visibility = "visible";
        canvas.style.visibility = "visible";
        chatContainer.style.visibility = "visible";
        messageInput.style.visibility = "visible";
        buttonSend.style.visibility = "visible";
        
    }

}

//Function to control when the user selects all available options on the Rooms menu selector
function SelectRoomUser(e) {
    
    // Check if the fields are completed before assigning it to a new user
    if((!e || e.code === "Enter" || e.type === "click") && usernameInput.value.trim() !== '' && passwordInput.value !== '') {
       
        username = usernameInput.value;
        usernameInput.value = '';

        password = passwordInput.value;
        passwordInput.value = '';

        //myAgent = JSON.parse(localStorage.getItem('myAgent'));

        if (!myAgent) {
            myAgent = new Agent();
            myAgent.id = myAgentID;
            myAgent.username = username;
            myAgent.room_name = 'hall';
            current_room = 'hall';
            //localStorage.setItem('myAgent', JSON.stringify(myAgent));
        }
        var user =  {
            type: "userInfo",
            username: username,
            password: password,
            userid: myAgentID,
            avatar: myAgent.avatar,
            room: current_room ? current_room : 'hall',
        }

        socket.send(JSON.stringify(user));
        
       
    }
    
}

function RegisterUser(e) {
    if((!e || e.code === "Enter" || e.type === "click") && usernameInput.value.trim() !== '' && passwordInput.value.trim() !== ''){
       
        username = usernameInput.value;
        usernameInput.value = '';

        password = passwordInput.value;
        passwordInput.value = '';

        
        myAgent = new Agent();
        myAgent.id = myAgentID;
        myAgent.username = username;
        myAgent.room_name = 'hall';
        current_room = 'hall';
        //localStorage.setItem('myAgent', JSON.stringify(myAgent.toJSON()));
        

        var user =  {
            type: "userRegister",
            username: username,
            password: password,
            userid: myAgentID,
            avatar: myAgent.avatar,
            room: current_room
        }

        socket.send(JSON.stringify(user));
       
    }
}

//Hides or shows the Users connected list
function showUsersInRoom() {

    var users = document.getElementById('users');
    var currentDisplay = window.getComputedStyle(users).display;

    if (currentDisplay == "none") {
       
        users.style.display = "block";
        
    } else {
        
        users.style.display = "none";
        
    }

}

function onKey(e)
{
    if((e.code == "Enter" || e.type === "click")  && messageInput.value.trim() !== ''){
        
        //Gets all the users selected to send private message
        var selectedPrivateUsers = getSelectedPrivateUsers();

        //Message packet to communicate with other room with the protocol proposal
        var msg = {
            type: "text",
            content: messageInput.value,
            username: username,
            room: current_room
        };

        
        if (selectedPrivateUsers.length > 0){

            var msgPrivate= {
                type: "textPrivate",
                content: messageInput.value,
                username: username,
                receiverUsers : selectedPrivateUsers,
                room: current_room
            };
            
            socket.send(JSON.stringify(msgPrivate));
            
            var msg_content = msgPrivate.content;

            selectedPrivateUsers.forEach(function(user){
                getUsernameByUserID(user).then(toSelectedUser => {
                    var modifiedContent = "Private Message to User " + toSelectedUser + " : " + msg_content;
                    var newMsgPrivate = {...msgPrivate, content: modifiedContent};
                    refresh(newMsgPrivate, 1, myAgentID, 1);
                });
            });

        }else{
            
            socket.send(JSON.stringify(msg));
            
            showMessage(msg.username, msg.content, myAgent.avatarChat, 1, 0)
        }
        
        
        
        //Cleans the chat input
        messageInput.value = '';
    } 
        
};

async function refresh(msg, is_mine, authorID, private){
    if (chatContainer.classList.contains("initial_message")) {
        chatContainer.classList.remove("initial_message");
    }

    // if (msg.room == current_room) {
    //     console.log("ENTRO EN EL REFRESH")
    //     showMessage(msg.username, msg.content, "imgs/avatarDefault.png" , is_mine, private);
    // }

    getAvatarByUserID(authorID).then(currentAvatar => {
        console.log("MESSAGE AVATAR: " + currentAvatar);
        //check if the user is in the same room
        if (msg.room == current_room) {
            showMessage(msg.username, msg.content, currentAvatar , is_mine, private);
        }
     });
}

// Get all checked users and adds them to a list
function getSelectedPrivateUsers() {
    var selectedUsers = [];
    var checkboxes = document.querySelectorAll('.privateMsgCheckbox');
    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            selectedUsers.push(checkbox.getAttribute('data-user-id'));
        }
    });
    console.log(selectedUsers)
    return selectedUsers;
}

// Prints the message recived on the chat showing his username, avatar and content

function showMessage(username, msg, avatar, is_mine, private){
    
    //Adds the content and the username to the message
    var chatMsg = document.querySelector("#chat_container .msg");
    var elem = chatMsg.cloneNode(true)
    elem.querySelector(".username").innerText = username;
    elem.querySelector(".text").innerText = msg;

    //If there is an existing avatar append it to the message
    if (avatar){
        var avatarElem = document.createElement('img');
        avatarElem.src = avatar;
        avatarElem.style.width = '32px'; 
        avatarElem.style.height = '32px';
        elem.prepend(avatarElem); 
    }
  
    //Controls if the message sent is mine or not
    if (private && is_mine){
        elem.classList.add("private_mine");
    } else if( private && !is_mine){
        elem.classList.add("private");
    
    }else if(is_mine == 1 && private != 1){
        elem.classList.add("mine");   
    }

    
    // Adds the message to the chat and autoscrolls it
    chatContainer.appendChild(elem);
    chatContainer.scrollTop = chatContainer.scrollHeight;

}

//Function to handle a new user joining a room
function newUser(username, user_id, avatar) {
   
  
    //Shows the current connected users on the room on the Users connected list
    var newUserElement = document.createElement("p");
    newUserElement.setAttribute("class", "user");
    newUserElement.textContent = username + " (ID: " + user_id + ")";
    newUserElement.setAttribute("data-user-id", user_id); 
    usersContainer.appendChild(newUserElement);

    // Adds a checkbox for private messaging on each User connected
    // Also mine to send only a message for me
    var privateMsgCheckbox = document.createElement("input");
    privateMsgCheckbox.setAttribute("type", "checkbox");
    privateMsgCheckbox.setAttribute("class", "privateMsgCheckbox");
    privateMsgCheckbox.setAttribute("data-user-id", user_id);
    newUserElement.appendChild(privateMsgCheckbox);
    usersContainer.appendChild(newUserElement);

    // Event listener to each checkbox to detect if the user wants to send a Private Message
     privateMsgCheckbox.addEventListener("change", function() {
       
        var checkCount = document.querySelectorAll(".privateMsgCheckbox:checked").length;

        if (checkCount  > 0 ) {
            messageInput.placeholder = "Enter Private Message...";
        } else {
            
            messageInput.placeholder = "Enter Message...";
        }
    });

    // Shows the avatar of an user_id
    var avatarImg = document.createElement("img");
    avatarImg.src = avatar;
    avatarImg.style.width = '32px'; 
    avatarImg.style.height = '32px'; 
    newUserElement.prepend(avatarImg);

}

//Deletes the disconnected user from the Users connected list and the DB room
function deleteUser(user_id) {
   
    //Search for an existing user on the Users connected list
    var userElement = document.querySelector('.user[data-user-id="' + user_id + '"]');

    //If exists, delete it from the list and from the selected DB_room
    if (userElement) {
       
        userElement.parentNode.removeChild(userElement);
        
        //var index = DB_rooms[selectedRoom].users.findIndex(user => user.user_id === user_id);
        //DB_rooms[selectedRoom].users.splice(index, 1);
               
    }
    worldrooms.removeAgent(user_id);
}

//Resets the users connected list (remove all childs) and the messages
function resetUsersandMessages() {
    while (usersContainer.firstChild) {
        usersContainer.removeChild(usersContainer.firstChild);
    }
    //I want to keep the initial message and the button room
    while (chatContainer.childNodes.length > 2) {
        chatContainer.removeChild(chatContainer.lastChild);
    }

}


//Useful function to get the username of an exisiting user on the DB room using the userid
async function getUsernameByUserID(authorID) {
    // var username = null;
    // var data = await fetch("clients").then((a)=>a.json());
   
    var username = null;
    var data = await fetch("clients").then((a)=>a.json());
    data.forEach(function (agent) {
        if (agent.userid == authorID) {
            username = agent.username;  
        }
    });
    console.log(username);
    return username;
}

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

//User selects the clicked avatar
function selectAvatar(avatarChat, avatarUrl) {
    console.log(avatarUrl);
    myAgent.avatarChat = avatarChat;
    myAgent.avatar = avatarUrl;
}



messageInput.addEventListener("keydown", onKey);
buttonSend.addEventListener('click', onKey);

usernameInput.addEventListener("keydown", SelectRoomUser);
buttonSelectRoom.addEventListener('click', SelectRoomUser);
document.body.addEventListener('keydown', SelectRoomUser);
buttonRegister.addEventListener('click', RegisterUser);

buttonUsers.addEventListener('click', showUsersInRoom);


document.getElementById('button_avatar').addEventListener('click', function() {
    var avatarPicker = document.getElementById('choose_avatar');
    avatarPicker.style.display = avatarPicker.style.display === 'none' ? 'block' : 'none';
});

