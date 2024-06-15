// JS By Daniel Lizarte Cáceres

console.log("Hello from Daniel Lizarte Cáceres Chat!");

// Global variables used in the Chat instance
var chatContainer = document.querySelector("div#chat_container");
var messageInput = document.querySelector("input#input_chat");
var usernameInput = document.querySelector("input#input_username");
var buttonSend =  document.querySelector("button#button_send");
var enterRoom = document.querySelector("input#input_room");
var numberUsers = document.getElementById("number_users");

var numberRoom= document.getElementById("number_room");

var selectRoom= document.getElementById("select_rooms");
var buttonSelectRoom= document.getElementById("button_selectroom");
var buttonUsers = document.getElementById("button_users");

var server = new SillyClient();

var usersContainer = document.getElementById("usersContainer");
var selectedAvatar = "imgs/avatarDefault.png"; //Predefined avatar
var username = "unknown";
var selectedRoom = 1;
var myUserId = 0;
var receiverID;


var DB_rooms = {};


// Prints the message recived on the chat showing his username, avatar and content

function showMessage(username, msg, avatar, is_mine){

    if (chatContainer.classList.contains("initial_message")) {
        chatContainer.classList.remove("initial_message");
    }
    
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
    if(is_mine){
        elem.classList.add("mine");
    }

    
    // Adds the message to the chat and autoscrolls it
    chatContainer.appendChild(elem);
    chatContainer.scrollTop = chatContainer.scrollHeight;

}

//Useful function to get the avatar of an exisiting user on the DB room using the username
function getAvatarByUsername(username) {
    var avatar_username = null;
    var count = 0;
    DB_rooms[selectedRoom].users.forEach(function (user) {
        if (user.username == username) {
            avatar_username = user.avatar;
            count++;
        }
    });

    // If there is more than one user with the same username on the room, the default avatar is assigned in the history 
    //because we cannot know to whom the message belongs to without a user_id in the protocol message. We only have the username and it is not unique.
    if (count > 1) {
        avatar_username = "imgs/avatarDefault.png";
    }

    return avatar_username;
}


//Useful function to get the avatar of an exisiting user on the DB room using the userID
function getAvatarByUserID(userID) {
    var avatar_userID = null;
    DB_rooms[selectedRoom].users.forEach(function (user) {
        if (user.user_id == userID) {
           avatar_userID = user.avatar;  
        }
    });

    return avatar_userID;
}




// Function executed when the user press enter or clicks the Send Message button as long as the input msg is not empty
function onKey(e){
    
    if((e.code == "Enter" || e.type === "click")  && messageInput.value.trim() !== ''){
        
        //Gets all the users selected to send private message
        var selectedPrivateUsers = getSelectedPrivateUsers();
        
        //Message packet to communicate with other room with the protocol proposal
        var msg = {
            type: "text",
            content: messageInput.value,
            username: username,
        };

        //If there is any user/s checked, send message to them
        if (selectedPrivateUsers.length > 0) {
            msg.type = "private"; // Change type to private message if the user wants to send only to checked people.
            showMessage(username+`: ${myUserId}`, `Private message to ${selectedPrivateUsers}: ` + messageInput.value, selectedAvatar, true);
            msg.content = "Private message: " + messageInput.value;
            server.sendMessage(msg, selectedPrivateUsers);
        } else { // If there is not any user checked, send the message to the room
            //Adds the message on the corresponding DB room, and sends msg to the server room
            showMessage(username+`: ${myUserId}`, messageInput.value, selectedAvatar, true);
            server.sendMessage(JSON.stringify(msg));
            DB_rooms[selectedRoom].msgs.push(msg);
        }
        
       //Cleans the chat input
        messageInput.value = '';
        
        
    }
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

//User selects the clicked avatar
function selectAvatar(avatarUrl) {
    console.log(avatarUrl);
    selectedAvatar = avatarUrl;
}

//Inserts a selected emoji to the input message
function insertEmoji(emoji) {
    
    messageInput.value += emoji;
}

//Useful function to know the room of where an exisiting user on the DB room is, using the userid
function getRoomByUserId(user_id) {
    for (var room in DB_rooms) {
        for (var user in DB_rooms[room].users){
            if(user.user_id = user_id){
                return room;
            }
        }
    }
    return null; 
}



//Hides the Rooms' menu selector when you enter a room
function EnterRoom() {
    var rooms = document.getElementById('rooms');
    var currentDisplay = window.getComputedStyle(rooms).display;

    if (currentDisplay === "block") {
       
        rooms.style.display = "none";
        
    }

}


//Function to control when the user selects all available options on the Rooms menu selector
function SelectRoomUser(e) {
    
    // Check if the fields are completed before assigning it to a new user
    if((!e || e.code === "Enter" || e.type === "click") && usernameInput.value.trim() !== '' && selectRoom.value.trim() !== '') {
       
        username = usernameInput.value;
        selectedRoom = selectRoom.value;
        usernameInput.value = '';
        avatar = selectedAvatar;

        EnterRoom();

        // If the user enters the room name manually, it takes prority, otherwise the default room selector is used
        if(enterRoom.value.trim() !== ''){
            selectedRoom = enterRoom.value;
            initServer(username, selectedRoom);
        }else{
            initServer(username, selectedRoom);
        }
       
    }
    
}

// Saves the user data (username, userid, selected room and avatar)
function saveUserContent(isNewConnection, content) {
    var profileInfo = content.split(" ");
    var receivedUsername = profileInfo[0];
    var receivedUserId = profileInfo[1];
    var receivedRoom = profileInfo[2];
    var receivedAvatar = profileInfo[3];

      // Check if the user already exists in the DB room
    var existingUser = DB_rooms[receivedRoom].users.find(function (user) {
        return user.user_id === receivedUserId;
    });

    // If the user does not exist, add them to the DB room with all the data collected
    if (!existingUser) {
        
        DB_rooms[receivedRoom].users.push({ username: receivedUsername, user_id: receivedUserId, room: receivedRoom, avatar: receivedAvatar });
       
        newUser(receivedUsername, receivedUserId, receivedRoom);

        //If the user is new on the Room, show a message indicating that the user has connected to the room
        if (isNewConnection) {
            showMessage(receivedUsername +": "+ receivedUserId, "Connected to Room: " + receivedRoom, receivedAvatar, false);
        }
    }

    console.log("Received profile:", receivedUsername, receivedUserId, receivedRoom);
    return receivedUserId
}


// Function that handles when the server receives a message
function onServerMessage(authorID, msg){
    console.log("ServerMessage" + msg);
   
    // Parses the incoming message into a packet
    var packet = JSON.parse(msg);

    // Gets the room and the avatar from the user that sent the packet
    packet_room = getRoomByUserId(authorID)
    user_avatar = getAvatarByUserID(authorID)

    //Controls if the incoming packet is from the selectedRoom
    if (packet_room == selectedRoom) {

        //If the packet is a text (message), show it on the chat and save it on the DB room, or checks if it is a private message
        if(packet.type === "text" || packet.type === "private"){
            
            showMessage(packet.username +`: ${authorID}`, packet.content, user_avatar , false);  
            
            var msg = {
                content: packet.content,
                username: packet.username,
                
            };

            //Only if packet is a normal message, saves it to the DB room
            if (packet.type === "text"){
                DB_rooms[selectedRoom].msgs.push(msg); 
            }
            
        
        }
        
        //If the packet is a history (log), show it on the chat and save it on the DB room
        if (packet.type === "history"){
          
            //Search for the older user on the room chat by the minimum userid connected on the DB room
            var minUserId = Math.min.apply(Math, DB_rooms[selectedRoom].users.map(function(user) { return user.user_id; }));
          
            //Controls if the sender packet is the older user on the room chat and that the new connection is me to send the packet only to that new user
            if (authorID == minUserId && receiverID == myUserId) {

                //For every message on the packet, saves the content on the DB room and shows them on the chat
                packet.content.forEach(function(msg) {
                    
                        DB_rooms[selectedRoom].msgs.push(msg);

                        //To get the avatar of the orginal creator of the message by his username, if the username is duplicated: Default avatar
                        var avatar_msg = getAvatarByUsername(msg.username) 
                        showMessage(msg.username, msg.content, avatar_msg, false);
                
                    });
                }
        }
        
        // Checks if it is a profile packet (user information) and saves it on the DB room
        if(packet.type === "profile"){
            var receivedNewUserID = saveUserContent(true, packet.content);


            //Keeps the ID of the new connection user and sends a packet to the new connection
            var recievedID = {
                type: "ID",
                id: receivedNewUserID
            };
            server.sendMessage(JSON.stringify(recievedID));

        }
        
        //Saves the ID of the new connection 
        if(packet.type === "ID"){
            receiverID = packet.id; 
        }

        //Controls if the packet is type all_users and the new connection receiver is me to send the packet only to that new user
        if(packet.type === "all_users" && receiverID == myUserId){
            
            //Saves all the users information connected to the selected Room to the DB room
            packet.content.forEach(function(user) {
                saveUserContent(false, user.username + " " + user.user_id + " " + user.room + " " + user.avatar);
              
            });

            //Updates the current users connected to the selected Room
            DB_rooms[selectedRoom].currentUsers = packet.content.length;
            
            
        }
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


function initServer(username, selectedRoom){
    
    //Server connects to the selected Room by the user
    server.connect( "wss://ecv-etic.upf.edu/node/9000/ws", selectedRoom);

    //Handles when the user connects to the room
    server.on_ready = function (user_id) {
        myUserId = user_id;
        showMessage(username, "Server" + " Connected. Your userID: " + myUserId + ". Room: " + selectedRoom, selectedAvatar, true);
       
        //Checks if the room already exists on the DB
        if (!DB_rooms[selectedRoom]) {
            //If it is not on the DB create the structure to that room
            DB_rooms[selectedRoom] = {
                msgs:[],
                currentUsers: 0,
                users: []
            };
        }

        // Checks if the user already exists on the DB room
        var existingUser = DB_rooms[selectedRoom].users.find(function (user) {
            return user.user_id === myUserId;
        });

        // If the user is not on the DB room, creates a field for him 
        if (!existingUser) {
            
            DB_rooms[selectedRoom].users.push({ username: username, user_id: myUserId, room: selectedRoom, avatar: selectedAvatar});

            //Updates and shows current number of users on the room
            DB_rooms[selectedRoom].currentUsers = DB_rooms[selectedRoom].users.length;
            numberUsers.style.display = "inline";

            //handle when a new user is joining the selected room
            newUser(username, user_id, selectedRoom)
        }

        //User sends a packet with his information to the server (username, userid, selectedRoom and selectedAvatar)
        var packetUser = {
            type: "profile",
            content: username + " " + myUserId + " " + selectedRoom + " " + selectedAvatar,
            room: selectedRoom,
            avatar: selectedAvatar

        };
       
        server.sendMessage(JSON.stringify(packetUser));
        

    };

}

//Function to handle a new user joining a room
function newUser(username, user_id, selectedRoom) {
    //Updates the current users on the DB room
    DB_rooms[selectedRoom].currentUsers = DB_rooms[selectedRoom].users.length;
   
    //Updates the current users connected to the selected Room
    updateNumberUsers(selectedRoom);

    //Shows the current selected Room 
    numberRoom.style.display = "inline";
    numberRoom.textContent = selectedRoom;
  
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

    // Shows the avatar of an user_id
    var avatarImg = document.createElement("img");
    avatarImg.src = getAvatarByUserID(user_id); 
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
        
        var index = DB_rooms[selectedRoom].users.findIndex(user => user.user_id === user_id);
        DB_rooms[selectedRoom].users.splice(index, 1);
        
    }
}

//Shows the current number of users connected on the selected Room 
function updateNumberUsers(selectedRoom) {
   
    numberUsers.textContent = DB_rooms[selectedRoom].currentUsers;
}


//When user loads the page, the initial function SelectRoomUser is called
document.addEventListener('DOMContentLoaded', function () {
    SelectRoomUser();
});


//Useful function to get the username of an exisiting user on the DB room using the userid
function getUsernameByUserId(user_id, room) {
    var username = null;
   
    DB_rooms[room].users.forEach(function (user) {
        if (user.user_id == user_id) {
            username = user.username;
        }
    });

    return username;
}


//Useful function to get the userid of an exisiting user on the DB room using the username
/*function getUserIdByUsername(username, room) {
    var user_id = null;
   
    DB_rooms[room].users.forEach(function (user) {
        if (user.username == username) {
            user_id = user.user_id;
        }
    });

    return user_id;
}*/


// Triggered function onServerMessage when the server recieves a messge
server.on_message = onServerMessage;

//When the server detects that a new user has connected 
server.on_user_connected = function(user_id) {
    console.log("NEW USER CONECTED: "+ user_id);

    //Sends a packet to know if the reciever recieves the packet correctly
    var recievedID = {
        type: "ID",
        id: user_id
    };
    server.sendMessage(JSON.stringify(recievedID));

    //Sends a packet to know the current users connected to the room
    var allUsers = DB_rooms[selectedRoom].users;
    console.log("all users on room: " + allUsers);
    var responsePacket = {
        type: "all_users",
        content: allUsers
        
    };
    server.sendMessage(JSON.stringify(responsePacket));
   
    //Updates (shows) current number of users on the room 
    updateNumberUsers(selectedRoom)

    //Sends a packet (log) to know the last 10 messages on the room to the new connection with the protocol proposal
    var lastMessages = DB_rooms[selectedRoom].msgs.slice(-10);
    console.log("last msgs: " + lastMessages);

    var msg = {
        type: "history",
        content: lastMessages,
       
    };
    server.sendMessage(JSON.stringify(msg));

    
};

//When the server detects that a user has disconnected 
server.on_user_disconnected = function (user_id) {
    // Get the username using the user_id on the room
    var username = getUsernameByUserId(user_id, selectedRoom);


    //If the username exists on the selected Room
    if (username) {
        // Delete the user from the database and from the Users connected list
        deleteUser(user_id);

        //Updates the current users on the selected Room
        DB_rooms[selectedRoom].currentUsers = DB_rooms[selectedRoom].users.length;
        updateNumberUsers(selectedRoom);
    } else {
        console.error("No user with user_id: ", user_id);
    }
};

//If the server closes, try to reconnect with the same username and room.
server.on_close = function () {
    
    initServer(username,selectedRoom);
};



//Handles the user’s interaction with the chat room interfaces, such as clicking on buttons and pressing keys.

buttonSend.addEventListener('click', onKey);
buttonUsers.addEventListener('click', showUsersInRoom);
buttonSelectRoom.addEventListener('click', SelectRoomUser);

messageInput.addEventListener("keydown", onKey);
usernameInput.addEventListener("keydown", SelectRoomUser);


//Event handler for an emoji button that shows or hides an emoji selector when the user clicks on it. 
document.getElementById('button_emoji').addEventListener('click', function() {
    var emojiPicker = document.getElementById('choose_emoji');
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
});


