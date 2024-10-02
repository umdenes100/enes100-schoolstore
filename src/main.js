import '/style.css'
import {checkout,refund,getTeamData,accountUpdates} from "./databaseFunctions.js"; // Import the functions

let section;
let missionType;
let barcode;

console.log("Running");

const passScreen = document.getElementById("pass");
const homeScreen = document.getElementById("home");
const summaryScreen = document.getElementById("summary");
const purchaseScreen = document.getElementById("purchase");
const returnScreen = document.getElementById("return")



function setPage(page) {
    passScreen.style.display = "none";
    homeScreen.style.display = "none";
    summaryScreen.style.display = "none";
    purchaseScreen.style.display = "none";
    returnScreen.style.display = "none";

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



function displayTeamData(teamData,section,missionType) {
    if (teamData) {
        let itemsHTML = '<h3>Items List:</h3><ul>';
        if (teamData.items) {
            for (const [itemName, itemQuantity] of Object.entries(teamData.items)) {
                itemsHTML += `<li>${itemName}: ${itemQuantity}</li>`;
            }
        } else {
            itemsHTML += '<li>No items available.</li>';
        }
        itemsHTML += '</ul>';
        
        // Render the team data, including items, on the summary page
        document.getElementById('details').innerHTML = `
            <p>Section: ${section}</p>
            <p>Mission Type: ${missionType}</p>
            <p>Account Balance: ${teamData.wallet || 'N/A'}</p>
            ${itemsHTML}  
        `;
    } else {
        document.getElementById('details').innerHTML = `
            <p>No data available for this team.</p>
        `;
    }
}



async function loadTeamData() {
    section = document.getElementById("section").value;
    missionType = document.getElementById("missionType").value;
    
    const teamData = await getTeamData(section, missionType); // Fetch the team data
    
    displayTeamData(teamData,section,missionType); // Render the fetched data, including the .items list, on the summary page
    
    setPage("summary"); // Switch to the summary page
}

async function loadPurchase(){
    section = document.getElementById("section").value;
    missionType = document.getElementById("missionType").value;
    await accountUpdates(section, missionType,true);
    setPage('purchase')
}  
async function loadReturn(){
    section = document.getElementById("section").value;
    missionType = document.getElementById("missionType").value;
    await accountUpdates(section, missionType,false);
    setPage('return')
}  


async function teamPurchase(){
    section = document.getElementById("section").value;
    missionType = document.getElementById("missionType").value;
    barcode = document.getElementById('barcode1').value;
    await accountUpdates(section, missionType,true);
    await checkout(section,missionType,barcode);
    
}

async function livePurchase(){  
    await teamPurchase();  
    setPage("purchase") 
}




async function teamReturn(){
    section = document.getElementById("section").value;
    missionType = document.getElementById("missionType").value;
    barcode = document.getElementById('barcode2').value;
    await accountUpdates(section, missionType,false);
    await refund(section,missionType,barcode);
}
async function liveReturn(){
    teamReturn();  
    setPage("return") 
} 



function logout() {    
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="number"]'); 
    inputs.forEach(input => {
        input.value = '';
    });

    setPage('pass');
}


document.getElementById('logout').onclick = () => logout();
document.getElementById('passwordCheck').onclick = passwordCheck;
document.getElementById("passwordInput").addEventListener("keypress", function(event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("passwordCheck").click();
    }
});


document.getElementById('loadTeamData').onclick = () => loadTeamData();

document.getElementById("summaryGoBack").onclick = () => setPage('home');
document.getElementById('returnbtn').onclick = () => loadReturn();
document.getElementById("purchasebtn").onclick = () => loadPurchase();

document.getElementById("buy").onclick = () => livePurchase();
document.getElementById("purchaseGoBack").onclick = () => loadTeamData();

document.getElementById("giveback").onclick = () => liveReturn();
document.getElementById("returnGoBack").onclick = () => loadTeamData();

