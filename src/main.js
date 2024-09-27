import '/style.css'
import {printStoreAccounts} from "./databaseFunctions.js"; // Import the functions

let section;
let teamType;

console.log("Running");

const passScreen = document.getElementById("pass");
const homeScreen = document.getElementById("home");
const summaryScreen = document.getElementById("summary");
const scanScreen = document.getElementById("scan");



function setPage(page) {
    passScreen.style.display = "none";
    homeScreen.style.display = "none";
    summaryScreen.style.display = "none";
    scanScreen.style.display = "none";

    document.getElementById(page).style.display = "block";
}


function passwordCheck() {
    const userInput = document.getElementById('passwordInput').value;
    document.getElementById('passwordInput').value = '';
    const password = "1";

    if (userInput === password) {
        setPage("home");
        document.getElementById('errorMessage').style.display = 'none';
    } else {
        document.getElementById('errorMessage').style.display = 'block';
    }
}
document.getElementById('passwordCheck').onclick = passwordCheck;
// Get the input field
// Execute a function when the user presses a key on the keyboard
document.getElementById("passwordInput").addEventListener("keypress", function(event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("passwordCheck").click();
    }
});

function loadTeamData() {
    section = document.getElementById("section").value;
    teamType = document.getElementById("teamType").value;
    console.log(section, teamType);
    renderSummary();
    //printStoreAccounts();
    setPage("summary");
}
window.passwordCheck = passwordCheck;


function renderSummary() {
    document.getElementById('details').innerHTML = `Section: ${section} - Type: ${teamType}`;
}
printStoreAccounts();

document.getElementById('logout').onclick = () => setPage('pass')

console.log("Checking");
console.log(homeScreen);
setTimeout(() => {
    section = "3128463986129864986";
    renderSummary();
}, 10000);
