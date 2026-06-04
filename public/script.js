const socket = io();

const username = prompt("Enter your name");

function sendMessage() {

    const input = document.getElementById("input");

    if(input.value.trim() === ""){
        return;
    }

    const time = new Date().toLocaleTimeString();

    socket.emit(
        "chat message",
        "[" + time + "] " + username + ": " + input.value
    );

    input.value = "";
}

document
.getElementById("input")
.addEventListener("keypress", function(event){

    if(event.key === "Enter"){
        sendMessage();
    }

});

socket.on("chat message", (msg)=>{

    const li = document.createElement("li");

    li.textContent = msg;

    document
    .getElementById("messages")
    .appendChild(li);

    li.scrollIntoView();

});