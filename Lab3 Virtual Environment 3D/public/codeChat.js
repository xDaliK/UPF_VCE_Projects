var chatContainer = document.querySelector("div#chat_container");

var usernameInput = document.querySelector("input#input_username");
var passwordInput = document.querySelector("input#input_password");
var numberUsers = document.getElementById("number_users");

var messageInput = document.getElementById("input_chat");
var buttonSend =  document.getElementById("button_send");
var buttonAvatar =  document.querySelector("button#button_avatar");

var usersContainer = document.getElementById("usersContainer");
//var selectedAvatar = "imgs/boy_1_chat.png"; //Predefined avatar
var typing = false;


var buttonUsers = document.getElementById("button_users");

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
        avatarElem.style.width = '38px'; 
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
    //REVISAR
    var avatarImg = document.createElement("img");
    avatarImg.src = avatar;
    avatarImg.style.width = '38px'; 
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
               
    }
    var agentidx = Classrooms.people.findIndex((agent) => agent.id === user_id)
    var agentToDelete = Classrooms.people[agentidx];
    var idx = AgentsInWorld.findIndex((agentnode) => agentnode.name === agentToDelete.username)


    // Encuentra el objeto de renderizado correspondiente en AgentsInWorld
    var renderObject = AgentsInWorld[idx];
    var planeObject = AgentsPlanes[idx];

    // Elimina el objeto de renderizado de la escena
    if (renderObject) {
        scene.root.removeChild(renderObject);
        scene.root.removeChild(planeObject);
    }

    
    AgentsInWorld.splice(idx, 1)
    AgentsActions.splice(idx, 1)
    AgentsPlanes.splice(idx, 1)
    Classrooms.removeAgent(user_id);
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

//Hides or shows the Users connected list
//REVISAR
function showUsersInRoom() {

    var users = document.getElementById('users');
    var currentDisplay = window.getComputedStyle(users).display;

    if (currentDisplay == "none") {
        users.style.display = "block";
    } else {
        users.style.display = "none";
    }

}

messageInput.addEventListener("keydown", onKey);
buttonSend.addEventListener('click', onKey);

// Add event listener for input event
messageInput.addEventListener('input', function() {
    console.log('User is typing...');
    typing = true;
});

//usernameInput.addEventListener("keydown", SelectRoomUser);


// buttonUsers.addEventListener('click', showUsersInRoom);


// document.getElementById('button_avatar').addEventListener('click', function() {
//     var avatarPicker = document.getElementById('choose_avatar');
//     avatarPicker.style.display = avatarPicker.style.display === 'none' ? 'block' : 'none';
// });