var canvas = document.querySelector("canvas");

var myAgent = null;
var current_room = null;
var people = []
var peopleID = {}
var last_state = null;
var target_pos = [0,0];
var GoTodistance = 0;
var drawnAgents = {};
var arrowUpPressed = false;
var entered = true;
var lastroom = null;

var keys = {};

function onKeyDown( event ) { 
   //process key down event
   //mark it as being pressed
   keys[ event.key ] = true;
};

function onKeyUp( event ) { 
    //process key up event
    //mark it as being released
    keys[ event.key ] = false;
};


document.body.addEventListener("keydown", onKeyDown );
document.body.addEventListener("keyup", onKeyUp );
canvas.addEventListener("click", function(event){
    //pass the event position into coordinates of the canvas
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width; 
    var x = (event.clientX - rect.left) * scaleX;  
    var adjustedX = (x - canvas.width/2) / 2 / 1.75;

    target_pos[0] = adjustedX;
    GoTodistance = Math.abs(myAgent.position[0] - target_pos[0]);
})


worldrooms.init();


function getImage(url){

    if(images[url]){
        return images[url];
    }
    var img = new Image();
    img.src = url;
    images[url] = img;
    return img;
}

function drawCharacter(ctx, person ){
    if(!person) return;
    var image = getImage(person.avatar);
    ctx.imageSmoothingEnabled = false;

    var frame_number = Math.floor(10 * (performance.now() /1000)) % 16; 
    var action = actions[person.action];
    var frame = action[frame_number % action.length];

    var scaleFactor = 1.75;
    ctx.drawImage( image, 32*frame,64*person.facing,32,64, (person.position[0] - 16)*scaleFactor, (person.position[1] -64)*scaleFactor, 32*scaleFactor,64*scaleFactor ); //4 numbers for area of the image + 2 for positon of the image + 2 for size of the image
    drawnAgents[person.id] = person;
}

function drawRoom(ctx, room){

    switch(room){
        case "hall":
            //draw hall
            drawHall(ctx);
            break;
        case "apartment":
            //draw apartment
            drawApartment(ctx);
            break;
        case "gamingroom":
            //draw kitchen
            drawGamingRoom(ctx);
            break;
        case "bedroom":
            //draw bedroom
            drawBedroom(ctx);
            break;
        default:
            //draw hall
            drawHall(ctx);
            break;
    }
}

function drawHall(ctx){
    var hall = worldrooms.rooms.hall;
    if(!hall) return;
    ctx.drawImage(getImage(hall.background), 0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width/2, canvas.height * (0.95));
    ctx.scale(2,2)

    ctx.imageSmoothingEnabled = false;
    
    for (var person = 0; person < worldrooms.rooms.hall.people.length; ++person ){

        drawCharacter(ctx, worldrooms.rooms.hall.people[person]);
    }
}

function drawApartment(ctx){
    var apartment = worldrooms.rooms.apartment;
    if(!apartment) return;
    ctx.drawImage(getImage(apartment.background), 0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width/2, canvas.height * (0.95))
    ctx.scale(2,2)

    ctx.imageSmoothingEnabled = false;    
    
    for (var person = 0; person < worldrooms.rooms.apartment.people.length; ++person ){
        drawCharacter(ctx, worldrooms.rooms.apartment.people[person]);
    }
}

function drawBedroom(ctx){
    var bedroom = worldrooms.rooms.bedroom;
    if(!bedroom) return;
    ctx.drawImage(getImage(bedroom.background), 0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width/2, canvas.height * (0.95));
    ctx.scale(2,2)

    ctx.imageSmoothingEnabled = false;
    
    for (var person = 0; person < worldrooms.rooms.bedroom.people.length; ++person ){
        drawCharacter(ctx, worldrooms.rooms.bedroom.people[person]);
    }

}

function drawGamingRoom(ctx){
    var gamingroom = worldrooms.rooms.gamingroom;
    if(!gamingroom) return;
    ctx.drawImage(getImage(gamingroom.background), 0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width/2, canvas.height * (0.95));
    ctx.scale(2,2)

    ctx.imageSmoothingEnabled = false;
    
    for (var person = 0; person < worldrooms.rooms.gamingroom.people.length; ++person ){

        drawCharacter(ctx, worldrooms.rooms.gamingroom.people[person]);
        
    }

}

function draw() {

    var rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);

    var ctx = canvas.getContext('2d');
    
    //clear rect
    ctx.clearRect(0,0,canvas.width, canvas.height);

    //change color
    ctx.fillStyle = "#8B8BFF";

    //fill a rectangle
    ctx.fillRect(0,0, canvas.width, canvas.height);

    ctx.resetTransform();

    if(current_room) drawRoom(ctx, current_room);

    //draw the door image

    
}




// function deleteCharacter (id){

//     var person = peopleID[id];
//     if(!person){
//         return;
//     } else{
//        var index =  people.indexOf(person);
//        people.splice(index,1);
//        delete peopleID[id];
//     }
// }

function onTick(){

    if(myAgent && canvas.style.visibility == "visible"){

        var state_myAgent = {
            type: "state",
            state: myAgent.toJSON()
        }
        
        
        if (myAgent.isMoving || JSON.stringify(state_myAgent) != JSON.stringify(last_state)){
            
            socket.send(JSON.stringify(state_myAgent));
            last_state = state_myAgent;
            console.log("SENDING STATE");
        } else {
            
            return;
        }
    }
}

setInterval(onTick, 1000/60);


function update(dt){

    if(myAgent){
        
        switch(current_room){
            case "hall":
                //If ArrowUp is pressed and the character is in the box of the door, send a message to the server to change the page of the new room to chat
                if(keys["ArrowUp"] && ((myAgent.position[0] > -95 && myAgent.position[0] < -60)) && entered){
                    socket.send(JSON.stringify({type: "changeRoom", currentroom: current_room, newroom: "gamingroom"}));
                    entered = false;
                    lastroom = 'gamingroom';
                    keys["ArrowUp"] = false;
                }
                if(keys["ArrowUp"] && ((myAgent.position[0] > -20 && myAgent.position[0] < 20)) && entered){
                    socket.send(JSON.stringify({type: "changeRoom", currentroom: current_room, newroom: "apartment"}));
                    entered = false;
                    lastroom = 'apartment';
                    keys["ArrowUp"] = false;
                }
                if(keys["ArrowUp"] && ((myAgent.position[0] > 60 && myAgent.position[0] < 95)) && entered){
                    socket.send(JSON.stringify({type: "changeRoom", currentroom: current_room, newroom: "bedroom"}));
                    entered = false;
                    lastroom = 'bedroom';
                    keys["ArrowUp"] = false;
                }
                break;
            case "apartment":
                //If the position of the agent is on the left side of the canvas, send a message to the server to change the room to the hall
                if(myAgent.position[0] < -90 && entered){
                    socket.send(JSON.stringify({type: "changeRoom", currentroom: current_room, newroom: "hall"}));
                    entered = false;
                    lastroom = 'hall';
                }
                if(myAgent.position[0] > 90 && entered){
                    socket.send(JSON.stringify({type: "changeRoom", currentroom: current_room, newroom: "bedroom"}));
                    entered = false;
                    lastroom = 'bedroom';
                }
                break;
            case "bedroom":
                //If the position of the agent is on the left side of the canvas, send a message to the server to change the room to the hall
                if(myAgent.position[0] < -90 && entered){
                    socket.send(JSON.stringify({type: "changeRoom", currentroom: current_room, newroom: "hall"}));
                    entered = false;
                    lastroom = 'hall';
                }
                if(myAgent.position[0] > 90 && entered ){
                    socket.send(JSON.stringify({type: "changeRoom", currentroom: current_room, newroom: "gamingroom"}));
                    entered = false;
                    lastroom = 'gamingroom';
                }
                break;
            case "gamingroom":
                //If the position of the agent is on the left side of the canvas, send a message to the server to change the room to the hall
                if(myAgent.position[0] < -90 && entered){
                    socket.send(JSON.stringify({type: "changeRoom", currentroom: current_room, newroom: "hall"}));
                    entered = false;
                    lastroom = 'hall';
                }
                if(myAgent.position[0] > 90 && entered){
                    socket.send(JSON.stringify({type: "changeRoom", currentroom: current_room, newroom: "apartment"}));
                    entered = false;
                    lastroom = 'apartment';
                }
                break;
        }
        
        if(GoTodistance != 0){
            console.log("target_pos", target_pos);
            //set direction
            myAgent.facing = target_pos[0] > myAgent.position[0] ? facing.right : facing.left;
            myAgent.action = "walking";
            var direction = target_pos[0] > myAgent.position[0] ? 1 : -1;
            
            
            // If the character is close enough to the target position, stop moving
            if (GoTodistance <= 0) {
                myAgent.position[0] = target_pos[0];
                GoTodistance = 0;
                myAgent.isMoving = false;
            } else {
                // Otherwise, move the character towards the target position
                if(direction > 0){
                    myAgent.position[0] += dt * 32;
                }else{
                    myAgent.position[0] -= dt * 32;
                }
                GoTodistance -= dt * 32;
                myAgent.isMoving = true;
            }
        }else{
            myAgent.isMoving = false;
            myAgent.action = "init";
        } 
        
        // myAgent.pos[0] = lerp( myAgent.pos[0],
        //     myAgent.target_pos[0], 
        //     0.01 );
    }

    
        

    

}

var last_time = performance.now();


function mainLoop(){

    requestAnimationFrame( mainLoop );
    var now = performance.now();
    var dt =( now - last_time ) /1000;
    last_time = now;
    draw();

    update(dt);
}

mainLoop();
