var scene = null;
var renderer = null;
var camera = null;
var node = null;

var spaceWorld = null;
var worldobj = null;
var chairs = [];
//var spaceWorldMesh = null;

var character = null;
var characterMesh = null;
var characterGLB = null;
var canvasuser = document.createElement("canvas");
var nameText = null;
var userctx = canvasuser.getContext('2d');
var userPlaneVisible = true;
var AgentsInWorld = [];
var AgentsActions = [];
var AgentsPlanes = [];

var userplane = null;
var last_state = null;
var skybox = null;

var divSpace = document.getElementById("divSpace");

var blackboard = null;
var blackboardText = null;
var blackboardVideo = document.querySelector("video#me");
var blackboardAudio = document.querySelector("audio#screen");
var canvasBlackboard = document.querySelector("canvas#classCanvas");

var inputContainer = document.getElementById("input_container");
chatContainer.style.display = "none";
messageInput.style.display = "none";
buttonSend.style.display = "none";

var chatButton = document.getElementById("chat_button");
var microButton = document.getElementById("micro_button");
var hideButton = document.getElementById("hide_button");
var sharingButton = document.getElementById("sharing_button");
var answersButton = document.getElementById("answers_button");
var questionButton = document.getElementById("question_button");

var myStream = null;
var streaming = false;

//var debugSphere = null;
var pitch = 0;
var newPosition = [0,0,0];

var cameraChanged = false;
var cameraChange = [14.592966651916504, 0.8288397192955017, 2.4914996027946472]

var walkarea = null;
var closestChairpos = null;
var latestPos = null;
var sitting = false;

var sharing = false;

var professor = true;
var mod = false;
var target_id = null;

var AnswersList = [];

var paperCanvas = document.getElementById("paperCanvas");
paperCanvas.style.display = "none";
paperCanvas.width = paperCanvas.clientWidth;
paperCanvas.height = paperCanvas.clientHeight;

var ctxPaper = paperCanvas.getContext("2d");
ctxPaper.imageSmoothingEnabled = false;

var num1 = null;
var num2 = null;
var correctAnswer = null;

// Define the coordinates of the answer zone
var answerZoneX;
var answerZoneHeight;
var answerZoneY;
var answerZoneWidth;

// function generateRandomQuestion(){
//     paperCanvas.style.display = "block";
//     paperCanvas.width = paperCanvas.clientWidth;
//     paperCanvas.height = paperCanvas.clientHeight;

//     answerZoneX = 0;
//     answerZoneHeight = paperCanvas.height * 0.2;
//     answerZoneY = (paperCanvas.height - 80) - answerZoneHeight;
//     answerZoneWidth = paperCanvas.width;
    
//     num1 = Math.floor(Math.random() * 10);
//     num2 = Math.floor(Math.random() * 10);
//     correctAnswer = num1 + num2;
//     ctxPaper.clearRect(0, 0, paperCanvas.width, paperCanvas.height);
//     ctxPaper.font = "2em Arial";
//     ctxPaper.fillText("What is " + num1 + " + " + num2 + "?", 10, paperCanvas.height * 0.2);
//     //ctxPaper.fillRect(answerZoneX, answerZoneY, answerZoneWidth, answerZoneHeight);
//     ctxPaper.fillText("Click here to answer", 10, paperCanvas.height * 0.8);
// }

function repeatQuestion(){
    paperCanvas.style.display = "block";
    paperCanvas.width = paperCanvas.clientWidth;
    paperCanvas.height = paperCanvas.clientHeight;

    ctxPaper.clearRect(0, 0, paperCanvas.width, paperCanvas.height);
    ctxPaper.font = "3em Arial";
    ctxPaper.fillText("What is " + num1 + " + " + num2 + "?", 3, paperCanvas.height * 0.2);
    //ctxPaper.fillRect(answerZoneX, answerZoneY, answerZoneWidth, answerZoneHeight);
    ctxPaper.fillText("Respuesta", 5, paperCanvas.height * 0.8);
}

function generateYourQuestion(yourQuestion, yourAnswer){
    paperCanvas.style.display = "block";
    paperCanvas.width = paperCanvas.clientWidth;
    paperCanvas.height = paperCanvas.clientHeight;

    answerZoneX = 0;
    answerZoneHeight = paperCanvas.height * 0.2;
    answerZoneY = (paperCanvas.height - 80) - answerZoneHeight;
    answerZoneWidth = paperCanvas.width;
    if(!yourQuestion && !yourAnswer ){

        var yourQuestion = prompt("Enter your question:");
        var yourAnswer = prompt("Enter your answer:");

    }
    correctAnswer = yourAnswer;
    ctxPaper.clearRect(0, 0, paperCanvas.width, paperCanvas.height);
    ctxPaper.font = "3em Arial";
    ctxPaper.fillText(yourQuestion, 10, paperCanvas.height * 0.2);
    //ctxPaper.fillRect(answerZoneX, answerZoneY, answerZoneWidth, answerZoneHeight);
    ctxPaper.fillText("Respuesta", 10, paperCanvas.height * 0.8);

    if (myAgent.isTeacher) {
        paperCanvas.style.display = "none";
        var newQuestionPacket = {
            type: "newQuestion",
            newQuestion: yourQuestion,
            newAnswer: yourAnswer,
            room: myAgent.room_name, 
        }
    
        socket.send(JSON.stringify(newQuestionPacket));
        ctxPaper.clearRect(0, 0, paperCanvas.width, paperCanvas.height);
    }

}

// Listen for click events on the canvas
paperCanvas.addEventListener('click', function(event) {
    var rect = paperCanvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;

        // Check if the click was inside the answer zone
    if (x > answerZoneX && x < answerZoneX + answerZoneWidth && y > answerZoneY && y < answerZoneY + answerZoneHeight) {
        var userAnswer = prompt("Enter your answer:");
        if (userAnswer == correctAnswer) {
            ctxPaper.clearRect(0, 0, paperCanvas.width, paperCanvas.height);
            ctxPaper.fillText("Correcto!", 10, 50);
            //New question after 1 second
            setTimeout(function() {
                paperCanvas.style.display = 'none';
                var Answer = {
                    type: 'answerquestion',
                    correct: 'correcto',
                    username: myAgent.username,
                    room: 'generalclassroom'
                }
                socket.send(JSON.stringify(Answer))
            }, 1000);
        }else if(userAnswer == null || userAnswer == ""){
            ctxPaper.clearRect(0, 0, paperCanvas.width, paperCanvas.height);
            ctxPaper.fillText("Please enter an answer.", 10, 50);
            setTimeout(function() {
                repeatQuestion();
            }, 1000);
        } 
        else {
            ctxPaper.clearRect(0, 0, paperCanvas.width, paperCanvas.height);
            ctxPaper.fillText("Incorrecto!", 10, 50);
            setTimeout(function() {
                paperCanvas.style.display = 'none';
                var Answer = {
                    type: 'answerquestion',
                    correct: 'incorrecto',
                    username: myAgent.username,
                    room: 'generalclassroom'
                }
                socket.send(JSON.stringify(Answer))
            }, 1000);
        }
        
    }    
});

paperCanvas.addEventListener('mousemove', function(event) {
    var rect = paperCanvas.getBoundingClientRect();
    var paperx = event.clientX - rect.left;
    var papery = event.clientY - rect.top;

    if(paperx > 0 && paperx < paperCanvas.width && papery > 0 && papery < paperCanvas.height){
        console.log("paper");
        //If you are inside the answer zone, print in the console
        if(paperx > answerZoneX && paperx < answerZoneX + answerZoneWidth && papery > answerZoneY && papery < answerZoneY + answerZoneHeight){
            console.log("answer zone");
        }
    }
});

var userState = {
    rootNode: null,
    characterNode: null,
    action: "idle",
}

var ACTIONS = {};

// Initialize PeerJS
var peer = new Peer();
var connections = {}; // Store connections to multiple viewers
var microphonesAudio = {};
var myPeerID = null;

// Fetch user ID from server
peer.on('open', function(id) {
    console.log('My peer ID is: ' + id);
    myPeerID = id;
    if(myAgent)
        myAgent.peerID = id;
});

// Handle incoming connections
// peer.on('connection', function(conn) {
//     console.log("Connected to: " + conn.peer);
//     connections[conn.peer] = conn;
//     conn.on('data', function(data) {
//         console.log('Received:', data);
//     });
//     conn.send("HELLO VIEWERS!!!!!!!")
// });




// Answer incoming calls
peer.on('call', function(call) {
    navigator.getUserMedia({video: false, audio: true}, function(stream) {
        call.answer(stream); // Answer the call with an A/V stream.
        call.on('stream', function(remoteStream) {
          // Store the stream using the call.peer (the other peer's id) as the key
          microphonesAudio[call.peer] = remoteStream;
    
          // Create a new audio element
          var audio = document.createElement('audio');
    
          // Set the source of the audio element to the stream
          audio.srcObject = remoteStream;
    
          // When the metadata has been loaded, play the audio
          audio.onloadedmetadata = function(e) {
            audio.play();
          };
    
          // Attach the audio element to the DOM
          document.body.appendChild(audio);
        });
      }, function(err) {
        console.log('Failed to get local stream' ,err);
      });
});

// Function to connect to another peer
function connectToId(id, stream) {
    return new Promise((resolve, reject) => {
        var call = peer.call(id, stream);
        call.on('stream', function(remoteStream) {
            // Show stream in some <audio> element.
            var audio = document.querySelector('audio#micro');
            audio.srcObject = remoteStream;
            audio.onloadedmetadata = function(e) {
                audio.play();
            };
            resolve(call);
        });
        call.on('error', reject);
    });
}

peer.on('error', function(err) {
    console.log('Error on Peer:', err);
});
  

classCanvas.width = classCanvas.clientWidth;
classCanvas.height = classCanvas.clientHeight;
var ctx = classCanvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

//draw a circle in the classcanvas
var currentCircle = null;


function drawCircle(x, y, radius, color){
    if (currentCircle) {
        //Cleans last circle
        var margin = ctx.lineWidth / 2 + 10; 
        ctx.clearRect(currentCircle.x - currentCircle.radius - margin, currentCircle.y - currentCircle.radius - margin, currentCircle.radius * 2 + margin * 2, currentCircle.radius * 2 + margin * 2);
        currentCircle = null;
        //drawNoDrawZone();
    }
    
    // draws new circle (current)
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color; // color argument
    ctx.fill(); 
    ctx.stroke();

    //text inside circle
    ctx.fillStyle = 'black'; 
    ctx.font = '2vh Arial'; 
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle'; 
    ctx.fillText('Press', x, y); 
    
    currentCircle = {x: x, y: y, radius: radius, fillStyle: color};
}

function drawCircleAtRandomInterval() {
    var radius = 50;
    var x, y;

    if (!currentCircle) {
        do {
            x = Math.random() * (classCanvas.width - 2 * radius) + radius;
            y = Math.random() * (classCanvas.height - 2 * radius) + radius;
        } while (x > noDrawZone.x && x < noDrawZone.x + noDrawZone.width && y > noDrawZone.y && y < noDrawZone.y + noDrawZone.height); //not draw in the rectangular zone

        currentCircle = {x: x, y: y, radius: radius, fillStyle: 'lime'};
        
    } else {
        if(currentCircle.fillStyle != 'red'){
            currentCircle.fillStyle = 'orange';
            setTimeout(function() {
                currentCircle.fillStyle = 'red';
                drawCircle(currentCircle.x, currentCircle.y, currentCircle.radius, currentCircle.fillStyle);
            }, 10000);
        }else{
            //CAMBIAR FONDO DE USERPLANE A ROJO
            userctx.fillStyle = 'red';
            userctx.fillRect(0, 0, canvasuser.width, canvasuser.height); 
            userctx.textAlign = 'center';
            userctx.textBaseline = 'middle'; 	
            userctx.font = "30em Arial";
            userctx.fillStyle = 'black'; 
            userctx.fillText(myAgent.username, canvasuser.width/2, canvasuser.height/2);
            
            var texture = new GL.Texture.fromImage(canvasuser);
            gl.textures[":username"] = texture;
            userplane.texture = ":username";
            //ENVIAR PAQUETE A TODO EL MUNDO DEL USERPLANE ROJO
            var InactivityPackage = {
                type: 'inactivity',
                agentid: myAgent.id,
                agentname: myAgent.username,
                color: 'red',
                room: myAgent.room_name, 
            }

            socket.send(JSON.stringify(InactivityPackage));
        }
    }

    drawCircle(currentCircle.x, currentCircle.y, currentCircle.radius, currentCircle.fillStyle);


    var randomInterval = Math.floor(Math.random() * (15000 - 10000 + 1) + 10000);
    setTimeout(drawCircleAtRandomInterval, randomInterval);
}

//Rectangular zone not draw inside
var noDrawZone = {
    x: classCanvas.width / 2 - ((classCanvas.clientWidth - 500)/2), 
    y: classCanvas.height / 2 - ((classCanvas.clientHeight - 300)/2),
    width: classCanvas.clientWidth - 500,
    height: classCanvas.clientHeight - 300,
};

// Dibuja la zona rectangular
function drawNoDrawZone() {
    ctx.beginPath();
    ctx.rect(noDrawZone.x, noDrawZone.y, noDrawZone.width, noDrawZone.height);
    ctx.stroke();
}

// Llama a esta función después de definir noDrawZone
//drawNoDrawZone();

function init()
{  
    //Init Rendering Context
    var context = GL.create({width: window.innerWidth, height: window.innerHeight});

    renderer = new RD.Renderer(context);
    //document.body.appendChild(blackboardVideo);
    document.body.appendChild(renderer.canvas);
    divSpace.style.visibility = "visible";

    // var randomInterval = Math.floor(Math.random() * (15000 - 10000 + 1) + 10000)
    
    // setInterval(function() {
    //     var radius = 50;
    //     var x, y;
    
    //     do {
    //         x = Math.random() * (classCanvas.width - 2 * radius) + radius;
    //         y = Math.random() * (classCanvas.height - 2 * radius) + radius;
    //     } while (x > noDrawZone.x && x < noDrawZone.x + noDrawZone.width && y > noDrawZone.y && y < noDrawZone.y + noDrawZone.height); //not draw in the rectangular zone
    
    //    drawCircle(x, y, radius);
    // }, randomInterval).then(() => randomInteval = Math.floor(Math.random() * (15000 - 10000 + 1) + 10000));
    if(!myAgent.isTeacher)
        drawCircleAtRandomInterval();

    activateEventListeners();

    
    //Assets for 3D
    renderer.setDataFolder("data");
    renderer.autoload_assets = true;

    // //Character assets Actions 
    ACTIONS.idle = new RD.SkeletalAnimation();
    ACTIONS.idle.load("./data/students/charactersAssets/actions/idle.skanim"); 

    ACTIONS.walking = new RD.SkeletalAnimation();
    ACTIONS.walking.load("./data/students/charactersAssets/actions/walking.skanim"); 

    ACTIONS.walk_right = new RD.SkeletalAnimation();
    ACTIONS.walk_right.load("./data/students/charactersAssets/actions/walk_right.skanim"); 

    ACTIONS.walk_left = new RD.SkeletalAnimation();
    ACTIONS.walk_left.load("./data/students/charactersAssets/actions/walk_left.skanim"); 
    
    ACTIONS.walking_back = new RD.SkeletalAnimation();
    ACTIONS.walking_back.load("./data/students/charactersAssets/actions/walking_back.skanim"); 

    ACTIONS.walk_fast = new RD.SkeletalAnimation();
    ACTIONS.walk_fast.load("./data/students/charactersAssets/actions/walk_fast.skanim");
    
    ACTIONS.sit = new RD.SkeletalAnimation();
    ACTIONS.sit.load("./data/students/charactersAssets/actions/sit.skanim");

    ACTIONS.raiseHand = new RD.SkeletalAnimation();
    ACTIONS.raiseHand.load("./data/students/charactersAssets/actions/raiseHand.skanim");

    //Init scene
    scene = new RD.Scene();

    // //Debug sphere onclick
    // debugSphere = new RD.SceneNode();
    // debugSphere.mesh = "sphere";
    // debugSphere.scale(0.15);
    // debugSphere.layers = 2;
    // scene.root.addChild(debugSphere)    

    //Space
    classWorld = new RD.SceneNode()
    scene.root.addChild ( classWorld ) //global node
    classWorld.loadGLTF('./data/class/classroom.glb');
    //spaceWorld.mesh = "class/scene.bin";
    classWorld.scale(0.005);
    classWorld.position = [15,0,3];

    var materialClass = new RD.Material({textures: {color: "/data/class/textures/StingrayPBS1_baseColor.png", albedo: "/data/class/textures/StingrayPBS1_metallicRoughness.png"}});

    materialClass.register("classMaterial");
    classWorld.material = "classMaterial"

    //Blackboard to screen sharing
    blackboard = new RD.SceneNode();
    blackboard.mesh = "plane";
    blackboard.scaling = [1.78*1.5,1*1.5,1];
    blackboard.position = [14.592966651916504, 0.8288397192955017, 5.380000114440918];
    //blackboard.flags.two_sided = true;
    scene.root.addChild(blackboard);
    //ROTAR PARA QUE NO SE VEA INVERTIDO
    blackboard.rotate(180 * DEG2RAD, [0,1,0]);
    


    //Character Student Assets

    userState.rootNode = character = new RD.SceneNode();
    scene.root.addChild(character);
    userState.characterNode = characterGLB = new RD.SceneNode();
    character.addChild(characterGLB);

    characterGLB.mesh = "./students/charactersAssets/avatar.wbin";
    characterGLB.scale(0.0027);

    //characterGLB.rotate(180 * DEG2RAD, [0,1,0]); //debug
    //characterGLB.position = [15,0,-2] //debug
    console.log("MY SKIN IS: ", myAgent.avatarTexture)
    var materialChar = new RD.Material({ textures: { color: myAgent.avatarTexture  }});

    materialChar.register("aMaterial");
    characterGLB.material = "aMaterial";
    characterGLB.layers = 2;

    characterGLB.skeleton = new RD.Skeleton();
    character.name = myAgent.username
    character.position = [13.28004264831543, 7.536376500638653e-8, 4.698934078216553]

    //CHARACTER NAME ABOVE
    
    userplane = new RD.SceneNode();
    scene.root.addChild(userplane);
    userplane.mesh = "plane";
    
    userplane.scaling = [0.1,0.05,0.3];
    userplane.position = [character.position[0], character.position[1] + 1, character.position[2]];
    userplane.flags.two_sided = true;
    userplane.rotate(90*DEG2RAD, [0,1,0]);

    //var materialUserCanvas = new RD.Material({textures: {color: "../imgs/cardboard.png"}, flags: {two_sided: true}});
    //materialUserCanvas.register("RMaterialUserCanvas");
    //userplane.material = "RMaterialUserCanvas";
    
    userplane.layers = 2;
    canvasuser.width = 1024;
    canvasuser.height = 1024;
    userctx.fillStyle = 'springgreen';
    userctx.fillRect(0, 0, canvasuser.width, canvasuser.height); 
    userctx.textAlign = 'center';
    userctx.textBaseline = 'middle'; 	
    userctx.font = "30em Arial";
    userctx.fillStyle = 'black'; 
    userctx.fillText(myAgent.username, canvasuser.width/2, canvasuser.height/2);


    for (var agent in AgentsInWorld ){
        //if(myAgent.id != AgentsInWorld[agent].id)
            CreateNewSceneNode(AgentsInWorld[agent]);

    }


    //SKYBOX
    skybox = new RD.SceneNode();
    skybox.mesh = "sphere";
    skybox.scaling = [100,100,100];
    skybox.position = [15.050399780273438, 0, 2.60071063041687];
    skybox.flags.two_sided = true;
    skybox.rotate(90 * DEG2RAD, [0,1,0]);
    scene.root.addChild(skybox);
    
    
    var skymaterial = new RD.Material({textures: {color: "./sky/skybox.jpg"}, flags: {two_sided: true}});
    skymaterial.register("skyboxMaterial");
    skybox.material = "skyboxMaterial";



    //var scaleWalkarea = 1;

    walkarea = new WalkArea();
    //Parametros: 1=donde empieza rect, 2= ancho clase (lado corto), 3= largo clase (lado largo)
    //Parametros 1: ancho,alto, largo clase
    //walkarea.addRect([13.398444175720215,3.729523712081573e-7, 4.23108434677124 ],0.51,-0.5); // mesa 1
    
	//walkarea.addRect([13.3,6.65,5.2],3.2,-4.3); // whole room

    walkarea.addRect([13.3,0,5.2],2.15,-0.9); // entrada

    walkarea.addRect([14.09,0,5.2],0.1,-4.3); //fila1-2

    walkarea.addRect([14.98,0,5.2],0.15,-4.3); //fila2-3

    walkarea.addRect([15.925,0,4.3],0.1,-3.45); //fila3-4

    walkarea.addRect([15.269710540771484,0,4.3],1,0.0001); //acceso fila3-4

    walkarea.addRect([14.8,0,5.2],1.5,-0.05); //area profe
    


    //Init camera
    camera = new RD.Camera();
    camera.lookAt ( [0,0.5,2], [0,0.5,0], [0,0.5,0]);
    //camera.position = [15,1,-2];
    
    var background_color = [0.1,0.1,0.1,1];
    
    context.ondraw = function(){
        gl.canvas.width = document.body.offsetWidth;
        gl.canvas.height = document.body.offsetHeight;
        gl.viewport(0,0,gl.canvas.width, gl.canvas.height);
        
        // var eye = vec3.lerp(vec3.create(), camera.position,  userState.rootNode.localToGlobal([0,2,-2]), 0.05) //lerp position of the camera
        // var target = userState.rootNode.localToGlobal([0,1,0]) //where the camera is pointing at
        // var up = [0,1,0] // height of the camera
        // camera.lookAt ( eye , target, up); 
        
        camera.perspective(60, gl.canvas.width / gl.canvas.height, 0.1, 1000);
        if(!sitting)
            camera.lookAt( userState.rootNode.localToGlobal([0,0.9,-0.35]),  userState.rootNode.localToGlobal([0,0.5+ pitch,1]) , [0,1,0])
            //camera.lookAt( userState.rootNode.localToGlobal([0,0.9,-1.35]),  userState.rootNode.localToGlobal([0,0.5+ pitch,1]) , [0,1,0]) //debug
        else{
                
            var blackboardPos = blackboard.localToGlobal([0,0,0]);

            if(cameraChanged){
                camera.lookAt( cameraChange,  blackboardPos , [0,1,0])
            }else{
                camera.lookAt( userState.rootNode.localToGlobal([0,0.8,-0.3]),  blackboardPos , [0,1,0])
            }
            camera.moveLocal(newPosition);            
        }

        //Move the camera to the position of the character
        //camera.position = userState.rootNode.localToGlobal([0,1,-2]);
        // if(myStream)
        //     blackboardVideo.srcObject = myStream

        if(blackboardVideo.videoWidth){
            if(!blackboardText){
                blackboardText = new GL.Texture.fromImage(blackboardVideo);
                gl.textures[":sharedScreen"] = blackboardText;
                blackboard.texture = ":sharedScreen";

            }
            else
                blackboardText.uploadImage(blackboardVideo);
            //CREAR PAQUETE PARA ENVIAR TEXTURA I AUDIO AL RESTO

            
        }

        if(!nameText){
            nameText = new GL.Texture.fromImage(canvasuser);
            gl.textures[":username"] = nameText;
            userplane.texture = ":username";
        }
        
        //console.log("SILLAS: ", classWorld.children.length);

        if(chairs.length == 0 && classWorld.children.length > 0){
            
            worldobj = classWorld.children[0].children[0].children[0].children;
            worldobj.forEach(node => {
                if(node.name.includes("chair"))
                {
                    chairs.push(node);  
                }
            });
    
        }
        if(Classrooms.rooms['generalclassroom'].node === null){
            Classrooms.rooms['generalclassroom'].node = classWorld;
        }

        //Get all character nodes of each user in class
        //console.log("PEOPLE IN SERVER: ", Classrooms.rooms['generalclassroom'].people);

        renderer.clear ( background_color);
        renderer.render(scene, camera, undefined); // can define which layers you want to render on the space

        var vertices = walkarea.getVertices();
		renderer.renderPoints( vertices, null, camera, null,null,null, gl.LINES );

    }

    context.onupdate = function(dt){

        //myAgent.characterNode.visible = false; to hide your character (not render it)
        scene.update(dt);
        var t = getTime() * 0.001;
    
        var currentAnimation = ACTIONS[myAgent.action];
        currentAnimation.assignTime(t);
        userState.characterNode.skeleton.copyFrom(currentAnimation.skeleton);

        for(var i in AgentsActions){
            var AgentAction = AgentsActions[i]
            var AgentAnim = ACTIONS[AgentAction]
            AgentAnim.assignTime(t);
            AgentsInWorld[i].children[0].skeleton.copyFrom(AgentAnim.skeleton);
        }

        skybox.rotate(1 * DEG2RAD * dt, [0,1,0]);

        if(myStream != null){
            if(!streaming){
                blackboardVideo.srcObject = myStream;
                blackboardVideo.play()
                streaming = true
            }
        }
        //console.log(pos);
        if(!sitting){
            var pos = UserMovement(dt);
            var nearest_pos = walkarea.adjustPosition( pos );
            userState.rootNode.position = nearest_pos;
            myAgent.position = nearest_pos;
            camera.position = nearest_pos;
            userplane.position = [userState.rootNode.position[0], userState.rootNode.position[1] + 0.9, userState.rootNode.position[2]];
            userplane.rotation = userState.rootNode.rotation;
            myAgent.rotation = userState.rootNode.rotation;
            var threshold = 0.45; // Distance to detect if user is near the chair
    
            if (chairs.length == 0 ) return;

            for(var i = 0; i < chairs.length; i++) {
                var chair = chairs[i];
    
                // chair position
                var chairPosition = chair.localToGlobal([0,1,0]);
    
                // distance between user and chair
                var distance = vec3.distance(pos, chairPosition);
    
                // Detect if the user is near the chair
                if(distance < threshold){
                    console.log('User near the chair: ' + (i + 1));
                    closestChairpos = chairPosition;
                }
            }
            if (closestChairpos == null) return;
            var closestChairposDistance = vec3.distance(pos, closestChairpos);
            //var closestChairposDistance = null;
            if(closestChairposDistance > threshold){
                closestChairpos = null;
            }
        }
    }

    context.onmouseup = function(e)
	{
        //Ray Debug Positions
		// if(e.click_time < 200) 
		// {
		// 	var ray = camera.getRay(e.canvasx, e.canvasy); // from the init positon to where the click direction points (rayo)
			
			
		// 	// if( ray.testPlane( [0,0,0], [0,1,0] ) ) //collision with infinite plane
		// 	// {
		// 	// 	console.log( "floor position clicked", ray.collision_point );
        //     //     debugSphere.position = ray.collision_point 
				
		// 	// }
        //     var result = vec3.create();
        //     var node = scene.testRay(ray, result, 1000, 1, true );
        //     if (node){ //collision with space (more expensive)
        //         //debugSphere.position = result;
        //         console.log( "floor position clicked", result);
        //     } 
		// }
	}

    context.onmousedown = function(e) {
        console.log(e.button)
        if (e.button === 2 && sitting) { // right click and the character is sitting
            if (!cameraChanged) {
                //var lastCamera = camera.position;
                camera.moveLocal(cameraChange);
                cameraChanged = true;
                newPosition = [0,0,0];
            } else {
               // camera.position = lastCamera;
                cameraChanged = false;
                newPosition = [0,0,0];
            }
        }
    }

	context.onmousemove = function(e)
	{
        
		if(!sitting)
		{
            pitch = pitch - e.deltay*0.001;
            userState.rootNode.rotate(-90 * DEG2RAD *  e.deltax * 0.001,[0,1,0]);
			//camera.moveLocal([-e.deltax*0.01, e.deltay*0.01,0]); //local to the object
            
            context.canvas.requestPointerLock();
			
		}else{

        }
	}

	context.onmousewheel = function(e)
    {
        // move camera forward(+) or backwards(-) with the mouse wheel
        
        var speed = 0.025; 

        

        var initDepth=  5; //limit init long class
        var finalDepth =  1; //limit end long class

        var initWidth= 13.1 //limit init width class
        var finalWidth= 16.85 //limit end width class

        
        if (camera.position[2] > initDepth ){
            
            newPosition[2] += e.wheel < 0 ? speed : 0; // camera in front, only backwards
        } else if( camera.position[2] < finalDepth || camera.position[0] < initWidth || camera.position[0] > finalWidth) {
            newPosition[2] += e.wheel < 0 ? 0 : -speed; //camera in end or the sides, only forward
        } else{
            newPosition[2] += e.wheel < 0 ? speed : -speed;
        }

        //camera.moveLocal(newPosition)
    
    }
	//Callbacks mouse actions
	context.captureMouse(true);
	context.captureKeys();

    context.animate();

}



document.addEventListener('mousemove', function(event) {
    //Controls the mouse in between the canvas and the worldclass (whole document)
    var x = event.clientX - classCanvas.getBoundingClientRect().left;
    var y = event.clientY - classCanvas.getBoundingClientRect().top;
    
    if (currentCircle && Math.hypot(x - currentCircle.x, y - currentCircle.y) <= currentCircle.radius) {
        classCanvas.style.pointerEvents = ''; // if you are inside a circle, allow interaction with mouse
        console.log("circle")
    } else {
        classCanvas.style.pointerEvents = 'none'; // if you are not inside the circle ignore interaction with mouse
        console.log("not circle")
    }
});


classCanvas.addEventListener('click', function(event) {
    //delete the circle from the canvas if the users clicks inside of it.
    classCanvas.style.pointerEvents = '';
    var x = event.clientX - classCanvas.getBoundingClientRect().left;
    var y = event.clientY - classCanvas.getBoundingClientRect().top;
    
    if (currentCircle && Math.hypot(x - currentCircle.x, y - currentCircle.y) <= currentCircle.radius) {
        var margin = ctx.lineWidth / 2 + 10; 
        ctx.clearRect(currentCircle.x - currentCircle.radius - margin, currentCircle.y - currentCircle.radius - margin, currentCircle.radius * 2 + margin * 2, currentCircle.radius * 2 + margin * 2);
        currentCircle = null;
        if(nameText){
            //CAMBIAR FONDO DE USERPLANE A VERDE
            userctx.fillStyle = 'springgreen';
            userctx.fillRect(0, 0, canvasuser.width, canvasuser.height); 
            userctx.textAlign = 'center';
            userctx.textBaseline = 'middle'; 	
            userctx.font = "30em Arial";
            userctx.fillStyle = 'black'; 
            userctx.fillText(myAgent.username, canvasuser.width/2, canvasuser.height/2);
            
            var texture = new GL.Texture.fromImage(canvasuser);
            gl.textures[":username"] = texture;
            userplane.texture = ":username";
    
            //ENVIAR PAQUETE A TODO EL MUNDO DEL USERPLANE VERDE
            var InactivityPackage = {
                type: 'inactivity',
                agentid: myAgent.id,
                agentname: myAgent.username,
                color: 'springgreen',
                usertexture: userplane.texture,
                room: myAgent.room_name, 
            }
    
            socket.send(JSON.stringify(InactivityPackage));
        }
        //drawNoDrawZone();
    }
    
});

function CreateNewSceneNode (NewAgent){

    var NewCharacter;
    var NewCharacterNode 

    NewCharacter = new RD.SceneNode();
    scene.root.addChild(NewCharacter);
    NewCharacterNode = new RD.SceneNode();
    NewCharacter.addChild(NewCharacterNode);

    NewCharacterNode.mesh = "./students/charactersAssets/avatar.wbin";
    NewCharacterNode.scale(0.0027);
    //characterGLB.rotate(180 * DEG2RAD, [0,1,0]); //debug
    //characterGLB.position = [15,0,-2] //debug
    //console.log("MY SKIN IS: ", NewAgent.avatarTexture)
    var NewmaterialChar = new RD.Material({ textures: { color: NewAgent.avatarTexture  }});

    NewmaterialChar.register("NewMaterial" + NewAgent.id.toString());
    NewCharacterNode.material = "NewMaterial"+ NewAgent.id.toString();
    
    NewCharacterNode.layers = 2;
    
    NewCharacterNode.skeleton = new RD.Skeleton();
    NewCharacter.name = NewAgent.username
    NewCharacter.position = [13.28004264831543, 7.536376500638653e-8, 4.698934078216553]

    //CHARACTER NAME ABOVE
    var NewUserPlane;
    NewUserPlane = new RD.SceneNode();
    NewUserPlane.mesh = "plane";
    
    NewUserPlane.scaling = [0.1,0.05,0.3];
    NewUserPlane.position = [NewCharacter.position[0], NewCharacter.position[1]+ 0.9, NewCharacter.position[2]];
    NewUserPlane.flags.two_sided = true;
    scene.root.addChild(NewUserPlane);
    NewUserPlane.rotate(90*DEG2RAD, [0,1,0]);

    //var materialUserCanvas = new RD.Material({textures: {color: "../imgs/cardboard.png"}, flags: {two_sided: true}});
    //materialUserCanvas.register("RMaterialUserCanvas");
    //userplane.material = "RMaterialUserCanvas";
    
    NewUserPlane.layers = 2;

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 1024;
    ctx.fillStyle = 'springgreen';
    ctx.fillRect(0, 0, canvasuser.width, canvasuser.height); 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; 	
    ctx.font = "30em Arial";
    ctx.fillStyle = 'black'; 
    ctx.fillText(NewAgent.username, canvasuser.width/2, canvasuser.height/2);

    var texture = new GL.Texture.fromImage(canvas);
    gl.textures[":username" + NewAgent.id.toString()] = texture;
    NewUserPlane.texture = ":username" + NewAgent.id.toString();

    return [NewCharacter, NewUserPlane]
    
}

function UserMovement(dt){
    var speed = 1;
    
   
    if (gl.keys["LEFT"]){
        //move the character to the left 
        userState.rootNode.moveLocal([speed*dt,0,0]) // relative to pointing char;
        myAgent.action = "walk_left"
        console.log(myAgent.action)
    }

    else if (gl.keys["RIGHT"]){
        //move the character to the right 
        userState.rootNode.moveLocal([-speed*dt,0,0]) // relative to pointing char 
        myAgent.action = "walk_right"
    }

    else if (gl.keys["UP"]){
        userState.rootNode.moveLocal([0,0,speed*dt]) // relative to pointing char
        myAgent.action = "walking"
        if (gl.keys["SHIFT"]) {
            myAgent.action = "walk_fast"
            speed = 2 ;
            userState.rootNode.moveLocal([0,0,speed*dt])
        }
    }

    else if (gl.keys["DOWN"]){
        userState.rootNode.moveLocal([0,0,-speed*dt]) // relative to pointing char
        myAgent.action = "walking_back"
    } 
    
    else{
        myAgent.action ="idle"
    }
    return userState.rootNode.position;
}

window.addEventListener('resize', () => {
    try {
        // Get the new window dimensions
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        // Calculate the scale factors
        const scaleX = newWidth / classCanvas.width;
        const scaleY = newHeight / classCanvas.height;

        // Update the circle's position and radius
        if (currentCircle) {
            currentCircle.x *= scaleX;
            currentCircle.y *= scaleY;
            currentCircle.radius *= (scaleX + scaleY) / 2; // average scale factor for radius
        }

        // Update the canvas dimensions
        classCanvas.width = newWidth;
        classCanvas.height = newHeight;

        // Update the noDrawZone dimensions and position
        noDrawZone.width = newWidth - 300;
        noDrawZone.height = newHeight - 300;
        noDrawZone.x = classCanvas.width / 2 - ((newWidth - 300) / 2);
        noDrawZone.y = classCanvas.height / 2 - ((newHeight - 300) / 2);

        //drawNoDrawZone();
    } catch(e) {
        console.log(e);
    }
});

function activateEventListeners() {
    document.addEventListener("keydown", function(e) {
        console.log(e.key)
        if(!typing){
            if(e.key == "Tab" && myAgent.isTeacher){
                navigator.mediaDevices.getDisplayMedia({video: true, audio: true}).then(stream => {
        
                    if(blackboardVideo.videoWidth){
                        if(!blackboard.texture){
                            blackboardText = new GL.Texture.fromImage(blackboardVideo);
                            gl.textures[":sharedScreen"] = blackboardText;
                            blackboard.texture = ":sharedScreen";
            
                        }
                    }
                    myStream = stream;
                    blackboardVideo.srcObject = stream;
                    blackboardVideo.play();
        
                    blackboardAudio.srcObject = stream;
                    blackboardAudio.play();
        
                    for(var i in Classrooms.people){
                        if(Classrooms.people[i].id == myAgent.id)
                            continue;
                        if(!connections[Classrooms.people[i].peerID])
                            connectToId(Classrooms.people[i].peerID, stream);
                    }
        
                    // var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
                    // // Create a PannerNode
                    // var panner = audioContext.createPanner();
                    // panner.panningModel = 'HRTF';
                    // panner.distanceModel = 'inverse';
                    // panner.refDistance = 1;
                    // panner.maxDistance = 10;
                    // panner.rolloffFactor = 1;
                    // panner.coneInnerAngle = 360;
                    // panner.coneOuterAngle = 0;
                    // panner.coneOuterGain = 0;
        
                    // // Set the position of the PannerNode to the position of the blackboard
                    // panner.positionX.value = blackboard.position[0];
                    // panner.positionY.value = blackboard.position[1];
                    // panner.positionZ.value = blackboard.position[2];
        
                    // // Create a MediaStreamAudioSourceNode
                    // var source = audioContext.createMediaStreamSource(stream);
        
                    // // Connect the source to the panner
                    // source.connect(panner);
        
                    // // Connect the panner to the destination
                    // panner.connect(audioContext.destination);
                    
                    //sharing = true;
                    stream.getTracks()[0].onended = function() {
                        console.log('El usuario ha dejado de compartir la pantalla');
                        blackboard.texture =null;
                        streaming = false;
                    };
                
                }).catch(err => {
                    //sharing = true;
                    console.log('Error: ', err);
                });
            }
        
            if(e.key === "Control"){
                //change animation to sitting
                if(closestChairpos){
                    console.log('User is sitting in the chair');
                    if(!sitting){
                        
                        latestPos = userState.rootNode.position;
                        userState.rootNode.position = closestChairpos;
                        userState.rootNode.position[2] = closestChairpos[2] + 0.15;
                        userState.rootNode.position[1] += 0.058;
                        //change rotation of the character as same as the chair
                        userState.rootNode.rotation = chairs[0].rotation;
                        //rotate the character in y axis 90 degrees
                        userState.rootNode.rotate(90 * DEG2RAD, [1,0,0])
        
                        myAgent.position = userState.rootNode.position;
                        myAgent.rotation = userState.rootNode.rotation;
                        //camera points the blackboard position
                        var blackboardPos = blackboard.localToGlobal([0,0,0]);
                        camera.lookAt( userState.rootNode.localToGlobal([0,0.8,-0.3]),  blackboardPos , [0,1,0])
                        
                        //camera.lookAt( userState.rootNode.localToGlobal([0,0.9,-0.35]),  userState.rootNode.localToGlobal([0,0.5+ pitch,1]) , [0,1,0])
        
                        userplane.position = [userState.rootNode.position[0],userState.rootNode.position[1] + 0.7,userState.rootNode.position[2]];
                        userplane.rotation =  userState.rootNode.rotation;
        
                        myAgent.action = "sit";
                        sitting = true;
                    }
                    else{
                        //myAgent.action = "idle";
                        userState.rootNode.position = latestPos;
                        newPosition[2] = 0;
                        sitting = false;
                        //init actions
                        gl.keys["LEFT"] = false;
                        gl.keys["RIGHT"] = false;
                        gl.keys["UP"] = false;
                        gl.keys["DOWN"] = false;
        
        
                    }
                }
                console.log(sitting)
            }
            if(e.key === "q" || e.key === "Q"){
        
                if (myAgent.action == "raiseHand"){
                    myAgent.action ="sit"
                    userState.rootNode.position = closestChairpos;
                    userState.rootNode.position[2] = closestChairpos[2] + 0.15;
                    newPosition = [0,0,0]
                    camera.moveLocal(newPosition)
                    userState.rootNode.position[1] += 0.06;
                    userplane.position[1] = userState.rootNode.position[1] + 0.7;
        
                } else if(sitting){
                    userState.rootNode.position = closestChairpos;
                    userState.rootNode.position[2] = closestChairpos[2] - 0.05;
                    myAgent.action = "raiseHand"
                    newPosition = [0,0,-0.3]
                    camera.moveLocal(newPosition)
                    userState.rootNode.position[1] += 0.058;  
                    userplane.position[1] = userState.rootNode.position[1] + 0.9;
                } 
                
            }
            if((e.key === "e" || e.key === "E") && myAgent.isTeacher){
                if(paperCanvas.style.display != "none"){
                    paperCanvas.style.display = "none";          
                }else{
                    AnswersList = [];
                    generateYourQuestion();
                }
            }
            if((e.key === "r" || e.key === "R") && myAgent.isTeacher){
                if(paperCanvas.style.display != "none"){
                    paperCanvas.style.display = "none";          
                }else{
                    var ycounter = 50;
                    if(AnswersList.length != 0){
                        paperCanvas.style.display = 'block';  
                        ctxPaper.clearRect(0, 0, paperCanvas.width, paperCanvas.height);  
                        for(var i in AnswersList){
                            ctxPaper.fillStyle = 'black';
                            ctxPaper.font = "2em Arial";
                            ctxPaper.fillText(AnswersList[i].username + ': ' + AnswersList[i].correct, 20, ycounter);
                            ycounter += 35;
                        }
                    }
                }
            }        
            if(e.key === "c" || e.key === "C"){
                if(chatContainer.style.display != "none"){
                    chatContainer.style.display = "none";
                    messageInput.style.display = "none";
                    buttonSend.style.display = "none";
                    inputContainer.style.display = "none";
        
                }else{
                    chatContainer.style.display = "block"; 
                    messageInput.style.display = "block";
                    buttonSend.style.display = "block";
                    inputContainer.style.display = "block";
                    
                }
            }
        
            if(e.key == "t" || e.key === "T"){
                navigator.getUserMedia({video: false, audio: true}, function(stream) {
                    // Call each peer
                    var callPromises = [];
                    for(var i in Classrooms.people){
                        var agent = Classrooms.people[i]
                        callPromises.push(connectToId(agent.peerID, stream));
                    }
                    Promise.all(callPromises)
                        .then(() => console.log('All calls made successfully'))
                        .catch(err => console.log('Error making calls:', err));
                }, function(err) {
                    console.log('Failed to get local stream' ,err);
                });
            }
        
            if(e.key == "n" || e.key === "N"){
                userPlaneVisible = !userPlaneVisible; 
        
                if(userPlaneVisible) {
                    userplane.layers = 2;
                    for(var i in AgentsPlanes){
                        AgentsPlanes[i].layers = 2;
                    } 
                } else {
                    userplane.layers = 0; 
                    for(var i in AgentsPlanes){
                        AgentsPlanes[i].layers = 0;
                    }
                }
            }
            
        
        
            if(e.key === "w" || e.key === "W"){
                gl.keys["UP"] = true;
            }
            if(e.key === "s" || e.key === "S"){
                gl.keys["DOWN"] = true;
            }
            if(e.key === "a" || e.key === "A"){
                gl.keys["LEFT"] = true;
            }
            if(e.key === "d" || e.key === "D"){
                gl.keys["RIGHT"] = true;
            }
        }else{
            if(e.key === 'Escape'){
                typing = false;
            }
        }
    });
        
    document.addEventListener("keyup", function(e) {
            if(e.key === "w" || e.key === "W"){
                gl.keys["UP"] = false;
            }
            if(e.key === "s" || e.key === "S"){
                gl.keys["DOWN"] = false;
            }
            if(e.key === "a" || e.key === "A"){
                gl.keys["LEFT"] = false;
            }
            if(e.key === "d" || e.key === "D"){
                gl.keys["RIGHT"] = false;
            }
    });


    //EVENTO BOTONES HUD

    chatButton.addEventListener('click', function() {

        if(chatContainer.style.display != "none"){
            chatContainer.style.display = "none";
            messageInput.style.display = "none";
            buttonSend.style.display = "none";
            inputContainer.style.display = "none";

        }else{
            chatContainer.style.display = "block"; 
            messageInput.style.display = "block";
            buttonSend.style.display = "block";
            inputContainer.style.display = "block";
            
        }
        
    });

    microButton.addEventListener('click', function() {

        navigator.getUserMedia({video: false, audio: true}, function(stream) {
            // Call each peer
            for(var i in Classrooms.people){
                var agent = Classrooms.people[i]
                connectToId(agent.peerID, stream);
            }
          }, function(err) {
            console.log('Failed to get local stream' ,err);
          });
        
    });

    hideButton.addEventListener('click', function() {
        
        userPlaneVisible = !userPlaneVisible; 
        
        if(userPlaneVisible) {
            userplane.layers = 2;
            for(var i in AgentsPlanes){
                AgentsPlanes[i].layers = 2;
            } 
        } else {
            userplane.layers = 0; 
            for(var i in AgentsPlanes){
                AgentsPlanes[i].layers = 0;
            }
        }
        

    });

    if(myAgent.isTeacher){
        sharingButton.addEventListener('click', function() {

        
                navigator.mediaDevices.getDisplayMedia({video: true, audio: true}).then(stream => {
                
                    if(blackboardVideo.videoWidth){
                        if(!blackboard.texture){
                            blackboardText = new GL.Texture.fromImage(blackboardVideo);
                            gl.textures[":sharedScreen"] = blackboardText;
                            blackboard.texture = ":sharedScreen";
            
                        }
                    }
                    myStream = stream;
                    blackboardVideo.srcObject = stream;
                    blackboardVideo.play();

                    blackboardAudio.srcObject = stream;
                    blackboardAudio.play();

                    for(var i in Classrooms.people){
                        if(Classrooms.people[i].id == myAgent.id)
                            continue;
                        if(!connections[Classrooms.people[i].peerID])
                            connectToId(Classrooms.people[i].peerID, stream);
                    }

                    // var audioContext = new (window.AudioContext || window.webkitAudioContext)();

                    // // Create a PannerNode
                    // var panner = audioContext.createPanner();
                    // panner.panningModel = 'HRTF';
                    // panner.distanceModel = 'inverse';
                    // panner.refDistance = 1;
                    // panner.maxDistance = 10;
                    // panner.rolloffFactor = 1;
                    // panner.coneInnerAngle = 360;
                    // panner.coneOuterAngle = 0;
                    // panner.coneOuterGain = 0;

                    // // Set the position of the PannerNode to the position of the blackboard
                    // panner.positionX.value = blackboard.position[0];
                    // panner.positionY.value = blackboard.position[1];
                    // panner.positionZ.value = blackboard.position[2];

                    // // Create a MediaStreamAudioSourceNode
                    // var source = audioContext.createMediaStreamSource(stream);

                    // // Connect the source to the panner
                    // source.connect(panner);

                    // // Connect the panner to the destination
                    // panner.connect(audioContext.destination);
                    
                    //sharing = true;
                    stream.getTracks()[0].onended = function() {
                        console.log('El usuario ha dejado de compartir la pantalla');
                        blackboard.texture =null;
                        streaming = false;
                    };
                
                }).catch(err => {
                    //sharing = true;
                    console.log('Error: ', err);
                });
                
                
            
        });
    } else {
        sharingButton.style.display = "none"
    }

    if(myAgent.isTeacher){
        answersButton.addEventListener('click', function() {
            if(myAgent.isTeacher) {

                if(paperCanvas.style.display != "none"){
                    paperCanvas.style.display = "none";          
                }else{
                    var ycounter = 50;
                    if(AnswersList.length != 0){
                        paperCanvas.style.display = 'block';  
                        ctxPaper.clearRect(0, 0, paperCanvas.width, paperCanvas.height);  
                        for(var i in AnswersList){
                            ctxPaper.fillStyle = 'black';
                            ctxPaper.font = "2em Arial";
                            ctxPaper.fillText(AnswersList[i].username + ': ' + AnswersList[i].correct, 20, ycounter);
                            ycounter += 35;
                        }
                    }
                }

            }

        });
    } else {
        answersButton.style.display = "none"
    }

    if(myAgent.isTeacher){
        questionButton.addEventListener('click', function() {
            if(myAgent.isTeacher) {

                if(paperCanvas.style.display != "none"){
                    paperCanvas.style.display = "none";          
                }else{
                    AnswersList = [];
                    generateYourQuestion();
                }
                
            }

        });
    } else {
        questionButton.style.display = "none"
    }


    
}

function onTick(){

    if(myAgent && scene){

        var state_myAgent = {
            type: "state",
            agent: myAgent.toJSON()
        }
        
        
        if (myAgent.action !== 'idle' || JSON.stringify(state_myAgent) != JSON.stringify(last_state)){
            
            socket.send(JSON.stringify(state_myAgent));
            last_state = state_myAgent;
            //console.log("SENDING STATE");
        } else {
            
            return;
        }
    }
}

setInterval(onTick, 1000/20);


