# Daniel's Chat - VCE

# Personal Information

- Name: Daniel Lizarte Caceres
- Email: daniel.lizarte01@estudiant.upf.edu
- NIA: 240645 
- U code: u186404

# Project Description

Chat developed using HTML, CSS and JavaScript. Users can join a chat room connected to Sillyserver in order to send messages to all users in the room, or select specific users to send private messages.

# How It Works

The chat application utilizes the SillyClient to manage server connections. When a user joins the chat, they are presented with two options: they can either connect to a predefined room or manually enter their own room. The user then needs to select a username for the room. Additionally, they have the option to choose an avatar from a predefined list. If no avatar is chosen, a default one is assigned. 

Upon entering the room, the user can start chatting by typing into the input field and either pressing the enter key or clicking on the “Send Message” button. Emojis can also be added to the text. 
The top bar displays the number of users currently connected to the particular room and the name of that room. By clicking on the users button, the user can view a list of all connected users in the room. Each user in this list has an associated checkbox. By selecting this checkbox, the user can send a private message to that specific user. 

When a new user joins a room, a new element is created in the list of connected users and on the Database of that particular Room, where it also stores the sent messages to that particular room and the current users and users on it. 
Moreover, on enter the room, this new user will recieve a list of the last 10 messages of the room chat as a log and a list of connected users in that particular room. When a user disconects that element is deleted from the list and from the Database. If the connection is lost, the user will try to reconnect with the same username and selected room.

Messages are sent via the server.sendMessage method, which requires the message and an optional list of user IDs as arguments. If the list of user IDs is provided, the message will be sent only to those users. 
The onServerMessage function is triggered by the server.sendMessage method and it parses the incoming message into a packet. Depending on the type of the packet (text, private, history, profile, ID, all_users), it performs different actions such as displaying the message on the chat, saving it to the database room, updating the current users in the room, etc. 
