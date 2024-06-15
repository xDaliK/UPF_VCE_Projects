var user_state = null;
var current_room = null;

var characterMesh = "../../../data/students/charactersAssets/avatar.wbin";


var characterMaterial = { 
    boy1: "../../../data/students/charactersAssets/textures/boy1.png", //change texture to boy 
    boy2: "../../../data/students/charactersAssets/textures/boy2.png",
    boy3: "../../../data/students/charactersAssets/textures/boy3.png",
    teacher_boy1: "../../../data/students/charactersAssets/textures/teacher_boy1.png",
    teacher_boy2: "../../../data/students/charactersAssets/textures/teacher_boy2.png",

    girl1: "../../../data/students/charactersAssets/textures/girl1.png", //change texture to girl
    girl2: "../../../data/students/charactersAssets/textures/girl2.png",
    girl3: "../../../data/students/charactersAssets/textures/girl3.png",
    teacher_girl1: "../../../data/students/charactersAssets/textures/teacher_girl1.png",
    teacher_girl2: "../../../data/students/charactersAssets/textures/teacher_girl2.png",

}

var characterActions = {
    
    idle: "/data/students/charactersAssets/actions/idle.skanim",
    walking: "/data/students/charactersAssets/actions/walking.skanim",
    walking_back: "/data/students/charactersAssets/actions/walking_back.skanim",
    sit: "/data/students/charactersAssets/actions/sit.skanim",
    raiseHand: "/data/students/charactersAssets/actions/raiseHand.skanim",
}
/*
var characterActions = {
    
    idle_boy1: "walking_boy1",
    walking_boy1: "walking_boy1",
    walking_back_boy1: "walking_back_boy1",
    raiseHand_boy1: "raiseHand_boy1",
    sit_boy1: "sit_boy1",

    idle_boy2: "walking_boy2",
    walking_boy2: "walking_boy2",
    walking_back_boy2: "walking_back_boy2",
    raiseHand_boy2: "raiseHand_boy2",
    sit_boy2: "sit_boy2",

    idle_girl1: "walking_girl1",
    walking_girl1: "walking_girl1",
    walking_back_girl1: "walking_back_girl1",
    raiseHand_girl1: "raiseHand_girl1",
    sit_girl1: "sit_girl1",

    idle_girl2: "walking_girl2",
    walking_girl2: "walking_girl2",
    walking_back_girl2: "walking_back_girl2",
    raiseHand_girl2: "raiseHand_girl2",
    sit_girl2: "sit_girl2",

    idle_teacher_girl: "walking_teacher_girl",
    walking_teacher_girl: "walking_teacher_girl",
    walking_back_teacher_girl: "walking_back_teacher_girl",
    raiseHand_teacher_girl: "raiseHand_teacher_girl",
    sit_teacher_girl: "sit_teacher_girl",

    idle_teacher_boy: "walking_teacher_boy",
    walking_teacher_boy: "walking_teacher_boy",
    walking_back_teacher_boy: "walking_back_teacher_boy",
    raiseHand_teacher_boy: "raiseHand_teacher_boy",
    sit_teacher_boy: "sit_teacher_boy",

}
*/

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
        this.peerID = '';
        // this.rootNode = null;
        // this.characterNode = null;
        this.position = null;
        this.rotation = null;
        this.username = null;
        this.action = "idle";
        this.room_name = '';
        this.avatarChat= '';
        this.avatarTexture = '';
        this.isTeacher = false;
        this.ws = null;

        this._internal_data = 0;
    }

    toJSON(){
        return {
            id: this.id,
            peerID: this.peerID,
            position: this.position,
            rotation: this.rotation,
            action: this.action,
            room_name: this.room_name,
            avatarChat: this.avatarChat,
            avatarTexture: this.avatarTexture,
            username: this.username,
            isTeacher: this.isTeacher,
            //ws: this.ws
        }
    }

    fromJSON(data){
        this.peerID = data.peerID;
        this.position = data.position;
        this.rotation = data.rotation;
        this.action = data.action;
        this.room_name = data.room_name;
        this.avatarChat = data.avatarChat;
        this.avatarTexture = data.avatarTexture;
        this.username = data.username
        this.isTeacher = data.isTeacher;
        //this.ws = data.ws || this.ws;
    }

    setWebSocket(ws) {
        this.ws = ws;
    }

}

class Room{
    constructor(){
        this.id = -1;
        this.node = null;
        this.chairs = [];
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
            node: this.node,
            people: this.people
        }
    }
    
    fromJSON(data){
        this.id = data.id;
        this.node = data.node;
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

var Classrooms = {
    
	last_agent_id: 0,
    rooms: {},
    people: [],
    peopleID: {},

    init: function() {
        //DEFAULT ROOM
        var default_room = new Room();
        default_room.fromJSON({
            id: "generalclassroom",
            node: null,
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
            //room.background = getBackground(room.id);
            room.node = roomJSON.node;
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

        console.log("PEOPLE IN ROOM: ",room.people.length)
    },

    updateAgent: function(agentJSON, ws){
        var person = null;
        //console.log("AGENT ID: ", agentJSON.id)
        var personIndex = this.people.findIndex( (agent) => agent.id === agentJSON.id);
        if (personIndex !== -1){
            person = this.people[personIndex]
        }
        if(!person){
            person = createAgent(agentJSON, ws);

            if (person.room_name){

                var room = this.rooms[person.room_name]
                if(room){
                    room.enterAgent(person)
                }
            }
        
        }      
        else{
            //GENERAL UPDATE 
            person.fromJSON(agentJSON);
            person.setWebSocket(ws);
            person.id = agentJSON.id;
            // ROOM UPDATE
            var idx = this.rooms[person.room_name].people.findIndex( (agent) => agent.id === person.id);
            this.rooms[person.room_name].people[idx].fromJSON(agentJSON);
            this.rooms[person.room_name].people[idx].setWebSocket(ws);
            this.rooms[person.room_name].people[idx].id = person.id;
        }
        return person;
    }
};

function createAgent (agentJSON, ws){
    var agent = new Agent();
    if(agentJSON.id != -1){
        agent.id = agentJSON.id;
    }else{
        throw("THIS AGENT HAS NOT ID");
    }
    agent.fromJSON(agentJSON);
    agent.setWebSocket(ws);
    Classrooms.registerAgent(agent)

    console.log(agent);
    
    return agent;
}

if(typeof module !== 'undefined'){
    
    module.exports = {Agent, Room, Classrooms, createAgent};
}
