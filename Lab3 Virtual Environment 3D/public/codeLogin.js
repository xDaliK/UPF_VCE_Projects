var buttonSelectRoom = document.getElementById("button_selectroom");
var buttonRegister= document.getElementById("button_register");

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
            myAgent.room_name = 'generalclassroom';
            myAgent.peerID = myPeerID;
            current_room = 'generalclassroom';
            //localStorage.setItem('myAgent', JSON.stringify(myAgent));
        }
        var user =  {
            type: "userInfo",
            username: username,
            password: password,
            userid: myAgentID,
            peerID: myPeerID,
            avatarChat: myAgent.avatarChat,
            
            room: current_room ? current_room : 'generalClassroom',
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

        myAgent.id = myAgentID;
        myAgent.username = username;
        myAgent.room_name = 'generalclassroom';
        current_room = 'generalclassroom';
        //localStorage.setItem('myAgent', JSON.stringify(myAgent.toJSON()));
        if(myAgent.isTeacher == null){
            myAgent.isTeacher = false;
        }

        var user =  {
            type: "userRegister",
            username: username,
            password: password,
            userid: myAgentID,
            avatarChat: myAgent.avatarChat,
            avatarTexture: myAgent.avatarTexture,
            isTeacher: myAgent.isTeacher,
            room: current_room,

        }

        socket.send(JSON.stringify(user));
       
    }
}

//User selects the clicked avatar
function selectAvatar(avatarChat, avatarUrl, avatarPreview) {
    try{
        if (!myAgent) myAgent = new Agent();
        myAgent.avatarChat = avatarChat;
        myAgent.avatarTexture = avatarUrl;
        console.log("MY SKIN: ", myAgent.avatarTexture);
        
        var selectedAvatarPreview = document.getElementById('selected-avatar');
        selectedAvatarPreview.src = avatarPreview;
        
        if(avatarChat == "./imgs/avatars/avatarChat_boy_1.png") {
            selectedAvatarPreview.style.width = '410px'; 
            selectedAvatarPreview.style.height = '430px'; 
            selectedAvatarPreview.style.marginLeft = '8%';
            
        } else if (avatarChat == "./imgs/avatars/avatarChat_boy_3.png"){
            selectedAvatarPreview.style.width = '270px'; 
            selectedAvatarPreview.style.height = '400px'; 
            selectedAvatarPreview.style.marginLeft = '17%';

        
        } else if (avatarChat == "./imgs/avatars/avatarChat_teacherboy_2.png"){
            selectedAvatarPreview.style.width = '270px'; 
            selectedAvatarPreview.style.height = '400px'; 
            selectedAvatarPreview.style.marginLeft = '17%';

        
        } else if (avatarChat == "./imgs/avatars/avatarChat_girl_2.png"){
            selectedAvatarPreview.style.width = '240px'; 
            selectedAvatarPreview.style.height = '400px'; 
            selectedAvatarPreview.style.marginLeft = '17%';

        
        } else if (avatarChat == "./imgs/avatars/avatarChat_girl_3.png"){
            selectedAvatarPreview.style.width = '240px'; 
            selectedAvatarPreview.style.height = '400px'; 
            selectedAvatarPreview.style.marginLeft = '17%';

        
        } else {
            selectedAvatarPreview.style.width = '300px'; 
            selectedAvatarPreview.style.height = '400px'; 
            selectedAvatarPreview.style.marginLeft = '15%';
            
        }
        
        selectedAvatarPreview.style.visibility = 'visible';  
    

        


    }catch(e){
        console.log(e)
    }
}

function CheckIsTeacher(){
    if (!myAgent) myAgent = new Agent();
    var check = document.getElementById("Teacher");

    var teacherAvatarrow1 = document.getElementById("avatar-row1-teachers")
    var teacherAvatarrow2 = document.getElementById("avatar-row2-teachers")
    var studentsAvatarrow1 = document.getElementById("avatar-row1")
    var studentsAvatarrow2 = document.getElementById("avatar-row2")

    if(check.checked){
        myAgent.isTeacher = true;
        teacherAvatarrow1.style.display = 'block'
        teacherAvatarrow2.style.display = 'block'
        studentsAvatarrow1.style.display = 'none'
        studentsAvatarrow2.style.display = 'none'

    }else{
        myAgent.isTeacher = false;
        teacherAvatarrow1.style.display = 'none'
        teacherAvatarrow2.style.display = 'none'
        studentsAvatarrow1.style.display = 'block'
        studentsAvatarrow2.style.display = 'block'
    }


}

document.body.addEventListener('keydown', SelectRoomUser);
buttonSelectRoom.addEventListener('click', SelectRoomUser);
buttonRegister.addEventListener('click', RegisterUser);