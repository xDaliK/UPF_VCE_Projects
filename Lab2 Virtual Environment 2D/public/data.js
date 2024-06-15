var user_state = null;
var current_room = null;

var actions = {
    init : [0],
    walking : [2,3,4,5,6,7,8,9],
    talk : [0,1],
    sit: [13],
}

var avatar = { 
    boy : "imgs/boy_1.png",
    girl : "imgs/girl_1.png",
    boy2 : "imgs/boy_2.png",
    girl2 : "imgs/girl_2.png"
}

var avatarChat = { 
    boy : "imgs/boy_1_chat.png",
    girl : "imgs/girl_1_chat.png",
    boy2 : "imgs/boy_2_chat.png",
    girl2 : "imgs/girl_2_chat.png"
}

var images = {


}

var facing = {
    right: 0,
    front: 1,
    left: 2,
    back : 3,
}

// function registerAgent(agent){
//     if(agent.id === -1){
//         throw("Agent must have an id");
//     }
//     if(peopleID[agent.id]){
//         return;
//     }
//     people.push(agent);
// }

// function removeAgent(id){
//     var index = people.findIndex( (agent) => agent.id === id);
//     if(index !== -1){
//         people.splice(index,1);
//     }
//     delete peopleID[id];
// }

// function updateAgent(agentJSON){
//     var index = people.findIndex( (agent) => agent.id === agentJSON.id);
//     if(index === -1){
//         createAgent(agentJSON);
//     }else{
//         people[index] = agentJSON;
//     }

// }

class Agent{
    constructor(){
        this.id = -1;
        this.position = [0,0];
        this.avatar = avatar.boy;
        this.avatarChat = avatarChat.boy;
        this.action = "init";
        this.facing = facing.front;
        this.room_name = "hall";
        this.username = null;
        this.ws = null;
        this.connected = false;

        this._internal_data = 0;
    }

    toJSON(){
        return {
            id: this.id,
            position: this.position,
            avatar: this.avatar,
            avatarChat: this.avatarChat,
            action: this.action,
            facing: this.facing,
            room_name: this.room_name,
            username: this.username,
            connected: this.connected,
            //ws: this.ws
        }
    }

    fromJSON(data){
        this.position = data.position;
        this.avatar = data.avatar;
        this.avatarChat = data.avatarChat;
        this.action = data.action;
        this.facing = data.facing;
        this.room_name = data.room_name;
        this.username = data.username;
        this.connected = data.connected;
        //this.ws = data.ws || this.ws;
    }

    setWebSocket(ws) {
        this.ws = ws;
    }

}

class Room{
    constructor(){
        this.id = -1;
        this.position = [0,0];
        this.background = null ;
        this.people = [];
        this.people_left = [];
        
        this._internal_data = 0;
    }
    
    enterAgent(agent){
        
        if(agent instanceof Agent){
            this.people.push(agent);
            agent.room_name = this.id;
            console.log("ID ROOM: ", this.id)
        }
        
        
    }
    
    leaveAgent(agent){
        var index = this.people.findIndex( (a) => a.id === agent.id);
        if(index !== -1){
            this.people.splice(index,1);
        }
        agent.room_name = '';
        //this.people_left = [agent.id]
    }

    toJSON(){
        return {
            id: this.id,
            position: this.position,
            background: this.background,
            people: this.people
        }
    }
    
    fromJSON(data){
        this.id = data.id;
        this.position = data.position;
        this.background = data.background;
        this.people = data.people;
    }

    changeRoom(agent, newRoom){
        var index = this.people.findIndex( (a) => a.id === agent.id);
        if(index !== -1){
            this.people.splice(index,1);
        }
        newRoom.people.push(agent);
        agent.room_name = newRoom.id;
    }

}

var worldrooms = {
    
	last_agent_id: 0,
    rooms: {},
    people: [],
    peopleID: {},

    init: function() {
        //DEFAULT ROOM
        var default_room = new Room();
        default_room.fromJSON({
            id: "hall",
            position: [0,0],
            background: "imgs/background_hall.png",
            people: []
        });
        this.registerRoom(default_room);
    }, 

    load: function(worldJSON){
        //this.last_agent_id = worldJSON.last_agent_id;
        this.rooms = {};
        for(var idx in worldJSON.rooms){
            var roomJSON = worldJSON.rooms[idx];
            var room = new Room();
            room.fromJSON(roomJSON);
            console.log("ROOM: ", room.toJSON());
            room.id = roomJSON.id;
            room.background = getBackground(room.id);
            room.people = [];
            this.registerRoom(room);
        } 
        
        for(var idx in worldJSON.people){
            
            var agentJSON = worldJSON.people[idx];
            console.log(agentJSON);
            var agent = new Agent();
            agent.fromJSON(agentJSON);
            agent.setWebSocket(agentJSON.ws);
            agent.id = agentJSON.id;
            console.log("AGENT: ", agent.toJSON());
            this.registerAgent(agent);
            
            var people = this.rooms[agent.room_name].people;
            var idx = people.findIndex( (a) => a.id === agent.id);
            this.rooms[agent.room_name].enterAgent(agent);
        }   

    },

    registerRoom: function(room){
        if(room.id === -1){
            throw("Room must have an id");
        }
        if(this.rooms[room.id]){
            return;
        }
        console.log("NEW ROOM: ", room)
        this.rooms[room.id] = room;
    },

    toJSON: function(){
        return {
            last_agent_id: this.last_agent_id,
            rooms: this.rooms,
            people: this.people,
        }
    },
  
    
    registerAgent: function( agent ){
        if(agent.id === -1){
            throw("Agent must have an id");
        }
        if(this.peopleID[agent.id]){
            return;
        }
        
        this.peopleID[agent.id] = agent;
        this.people.push(agent);
    },
    
    removeAgent: function(id){
        var index = this.people.findIndex( (agent) => agent.id === id);
        var agent = this.people[index]
        if(index !== -1){
            this.people.splice(index,1);
        }
        delete this.peopleID[id];
        
        for(var idroom in this.rooms){
            //search for the agent in the room and remove it
            var room = this.rooms[idroom];
            if(room)
            room.leaveAgent(agent);
            
        } 

        console.log("PEOPLE IN ROOM: ",room.people.length) //problem
    },

    updateAgent: function(agentJSON){
        var person = null;
        var personIndex = this.people.findIndex( (agent) => agent.id === agentJSON.id);
        if (personIndex !== -1){
            person = this.people[personIndex]
        }
        
        if(!person){
            person = createAgent(agentJSON);

            if (person.room_name){

                var room = this.rooms[person.room_name]
                if(room){
                    room.enterAgent(person)
                }
            }
        
        }      
        else{ 
            person.fromJSON(agentJSON);
            person.setWebSocket(agentJSON.ws);
            person.id = agentJSON.id;
            // this.rooms[person.room_name].fromJSON(person.toJSON());
            // this.rooms[person.room_name].setWebSocket(person.ws)
            // this.rooms[person.room_name].id = person.id;
            // var idx = this.rooms[person.room_name].people.findIndex( (agent) => agent.id === person.id);
            // this.rooms[person.room_name].people[idx] = person;
        }
        return person;
    }
};

function createAgent (agentJSON){
    var agent = new Agent();
    if(agentJSON.id){
        agent.id = agentJSON.id;
    }else{
        throw("THIS AGENT HAS NOT ID");
    }
    agent.fromJSON(agentJSON);
    agent.setWebSocket(agentJSON.ws);
    worldrooms.registerAgent(agent)

    console.log(agent);
    
    return agent;
}


function updateCharacter (state){

    //Get the playerID in the position 
    //If the state.room is the same as the world room, update the state of the character
    //If the state.id is not in the list of World.peopleID, add it to the list, if not, update the state of the character
    var characterID = peopleID[state.id];
    //var room = rooms[state.room];
    if(canvas.style.visibility == "visible"){
        if(!characterID){
            characterID = state;
            worldrooms.people.push(state);
            worldrooms.peopleID[state.id] = state;
        } else{
            for (var i in state){
                characterID[i] = state[i];
            }
        }
    }

    return characterID;
}



function getBackground(roomID){
    var urlbckround = null;
    switch (roomID) {
        case "hall":
            urlbckround = "imgs/background_hall.png";
            break;
        case "apartment":
            urlbckround = "imgs/background_livingroom.png";
            break;
        case "gamingroom":
            urlbckround = "imgs/background_gaming.png";
            break;
        case "bedroom":
            urlbckround = "imgs/background_bedroom.png";
            break;
        default:
            urlbckround = null;
            break;
    }
    return urlbckround;
}

if(typeof module !== 'undefined'){
    //module.exports = {Agent, Room, worldrooms, updateCharacter, user_state, current_room, actions, facing, avatar, images};
    module.exports = {Agent, Room, worldrooms, facing, createAgent, getBackground};
}
//export {Agent, Room, worldrooms, facing};
