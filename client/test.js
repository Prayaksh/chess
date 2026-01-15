import { io } from "socket.io-client";
const socket = io("http://localhost:3001");

const contentDiv = document.getElementById("content");
contentDiv.innerText = "starts here - ";

const addMessage = (message) => {
  const newItem = document.createElement("div");

  if (typeof message === "string") {
    newItem.className = "log";
    newItem.textContent = message;
  } else {
    newItem.className = "json";
    newItem.textContent = JSON.stringify(message, null, 2);
  }

  contentDiv.appendChild(newItem);
};

socket.on("connect", () => {
  addMessage("connected");
  socket.on("message", (message) => addMessage(message));
  socket.emit("message", { type: "init_game", payload: {} });
});

const inputJSON = document.getElementById("reply");
const replyButton = document.getElementById("reply-button");
let text = inputJSON.textContent;

replyButton.addEventListener("click", () => {
  const reply = inputJSON.value;
  addMessage("Reply - ");
  addMessage(reply);
  addMessage(typeof reply);
  socket.emit("message", JSON.parse(reply));

  inputJSON.value = "";
});
