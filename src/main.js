import {accountUpdates, checkout, getTeamData, refund} from "./databaseFunctions.js";
import {hide, show} from "./showhide.js"; // Import the functions
import './menu.js'
import {getMenu} from "./menu.js";
import {renderSettings} from "./settings.js";

let section;
let missionType;
let barcode;

export function setPage(page) {
    hide('pass')
    hide('home')
    hide('summary')
    hide('purchase')
    hide('return')
    hide('settings')

    show(page)

    if (page !== 'pass') {
        show('protectedButtons');
    } else
        hide('protectedButtons');
}

setPage('pass');


function passwordCheck() {
    const userInput = document.getElementById('passwordInput').value;
    document.getElementById('passwordInput').value = '';
    const password = "1";

    if (userInput === password) {
        setPage("home");
        hide('errorMessage');
    } else {
        show('errorMessage');
    }
}


async function renderTeamSummary(teamData, section, missionType) {
    if (!teamData) {
        document.getElementById('details').innerHTML = `
            <p>No data available for ${missionType} team in section ${section}. Are you sure you entered your section ${section} correctly?</p>
        `;
        return;
    }
    let itemsHTML = '<h3>Items Purchased</h3><ul>';
    const menu = await getMenu();
    let filteredEntries = Object.entries(teamData.items ?? {}).filter(([_, quantity]) => quantity > 0);
    if (filteredEntries.length > 0) {
        for (const [barcode, itemQuantity] of filteredEntries) {
            itemsHTML += `<li>${itemQuantity} x ${menu[barcode]?.name ?? 'unknown item (barcode: ' + barcode + ')'}</li>`;
        }
    } else {
        itemsHTML += '<li>No items purchased.</li>';
    }
    itemsHTML += '</ul>';

    // Render the team data, including items, on the summary page
    document.getElementById('details').innerHTML = `
        <p>Section: ${section}</p>
        <p>Mission Type: ${missionType}</p>
        <p>Account Balance: $${teamData.wallet ?? 'N/A'}</p>
        ${itemsHTML}  
    `;
}

async function loadTeamDataPage() {
    section = document.getElementById("section").value;
    missionType = document.getElementById("missionType").value;
    if (section.length !== 4) {
        document.getElementById('homeErrorMessage').textContent = 'Section must be 4 numbers long.';
        return
    }
    if (!/^\d+$/.test(section) && !section.includes('FC')) {
        document.getElementById('homeErrorMessage').textContent = 'Section must be a number. (Ex: 0110)';
        return
    }

    const teamData = await getTeamData(section, missionType); // Fetch the team data
    if (!teamData) {
        document.getElementById('homeErrorMessage').textContent =
            `No data available for ${missionType} team in section ${section}. Are you sure you entered your section correctly?`;
        return;
    }
    document.getElementById('homeErrorMessage').textContent = ''; // Clear any previous error messages

    await renderTeamSummary(teamData, section, missionType); // Render the fetched data, including the .items list, on the summary page

    setPage("summary"); // Switch to the summary page
}

async function loadPurchasePage() {
    section = document.getElementById("section").value;
    missionType = document.getElementById("missionType").value;
    await accountUpdates(section, missionType, true);
    setPage('purchase')
}

async function loadReturnPage() {
    section = document.getElementById("section").value;
    missionType = document.getElementById("missionType").value;
    await accountUpdates(section, missionType, false);
    setPage('return')
}

async function loadSettingsPage() {
    setPage('settings')
    renderSettings();
}


async function executePurchase() {
    barcode = document.getElementById('barcode1').value;
    const result = await checkout(section, missionType, barcode);
    document.getElementById('barcode1').value = '';
    document.getElementById('purchaseError').innerHTML = result ?? '';
}

async function teamReturn() {
    barcode = document.getElementById('barcode2').value;
    const result = await refund(section, missionType, barcode);
    document.getElementById('barcode2').value = '';
    document.getElementById('returnError').innerHTML = result ?? '';
}

async function executeReturn() {
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


document.getElementById('logoutButton').onclick = () => logout();
document.getElementById('passwordCheck').onclick = passwordCheck;
document.getElementById("passwordInput").addEventListener("keypress", function (event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("passwordCheck").click();
    }
});


document.getElementById('loadTeamDataPage').onclick = loadTeamDataPage;

document.getElementById("summaryGoBack").onclick = () => setPage('home');
document.getElementById('loadReturnPage').onclick = loadReturnPage;
document.getElementById("loadPurchasePage").onclick = loadPurchasePage;

document.getElementById("executePurchase").onclick = executePurchase;
document.getElementById("barcode1").onkeydown = (e) => {e.key === "Enter" && executePurchase()}
document.getElementById("purchaseGoBack").onclick = loadTeamDataPage;

document.getElementById("executeReturn").onclick = executeReturn;
document.getElementById("barcode2").onkeydown = (e) => {e.key === "Enter" && executeReturn()}
document.getElementById("returnGoBack").onclick = loadTeamDataPage;

document.getElementById('loadSettingsPage').onclick = loadSettingsPage;