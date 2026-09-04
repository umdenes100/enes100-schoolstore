import {accountUpdates, addSections, checkout, deleteSections, getTeamData, refund,removeSectionList,updateSectionList,getSectionList,syncSectionsFromUmd,removeAllSections} from "./databaseFunctions.js";
import {hide, show} from "./showhide.js"; // Import the functions
import './menu.js'
import {getMenu} from "./menu.js";
import {renderSettings} from "./settings.js";
import {setName} from "./history.js";

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
    hide('admin')

    show(page)

    if (page !== 'pass') {
        show('protectedButtons');
    } else
        hide('protectedButtons');
    if (page === 'admin') {
        renderSectionList();
    }
}

setPage('pass');


function passwordCheck() {
    const userInput = document.getElementById('passwordInput').value;
    document.getElementById('passwordInput').value = '';

    if (["Key$tone", "anuraagrules", 'forst'].includes(userInput)) {
        setName(document.getElementById('tfName').value)
        document.getElementById('tfName').value = '';
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
    await renderSettings();
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

async function sectionAdd(){
    let sectionList = document.getElementById("sectionNum").value;    
    await addSections(sectionList);
    await updateSectionList(sectionList);
    document.getElementById('sectionNum').value = '';
}
async function executeSectionAdd() {
    await sectionAdd();   
    await renderSectionList();
    setPage("admin")
}


async function sectionRemove(){
    let sectionList = document.getElementById("sectionNum").value;    
    await deleteSections(sectionList);
    await removeSectionList(sectionList);
    document.getElementById('sectionNum').value = '';

}
async function executeSectionRemove() {
    await sectionRemove();
    await renderSectionList();
    setPage("admin")
}

async function executeSectionSync() {
    const statusEl = document.getElementById('sectionSyncStatus');
    if (statusEl) statusEl.textContent = 'Syncing with umd.io...';

    try {
        const {added, removed} = await syncSectionsFromUmd();
        await renderSectionList();

        if (statusEl) {
            const parts = [];
            if (added.length > 0) parts.push(`Added: ${added.join(', ')}`);
            if (removed.length > 0) parts.push(`Removed: ${removed.join(', ')}`);
            statusEl.textContent = parts.length > 0 ? parts.join(' | ') : 'Already up to date.';
        }
    } catch (error) {
        console.error('Error syncing sections from umd.io:', error);
        if (statusEl) statusEl.textContent = 'Sync failed — see console for details.';
    }

    setPage("admin")
}

let removeAllArmed = false;
let removeAllArmTimeout = null;

async function executeRemoveAllSections() {
    const statusEl = document.getElementById('sectionSyncStatus');
    const removeAllBtn = document.getElementById('RemoveAllSectionsBtn');

    // Native confirm() dialogs are suppressed in some embedded browser
    // environments (e.g. this app's preview pane), so this uses a two-click
    // arm/confirm pattern instead of relying on window.confirm().
    if (!removeAllArmed) {
        removeAllArmed = true;
        if (removeAllBtn) removeAllBtn.textContent = 'Click again to permanently delete ALL sections';
        if (statusEl) statusEl.textContent = 'This will delete all sections and their account data. Click the button again within 5 seconds to confirm.';

        clearTimeout(removeAllArmTimeout);
        removeAllArmTimeout = setTimeout(() => {
            removeAllArmed = false;
            if (removeAllBtn) removeAllBtn.textContent = 'Remove All Sections';
            if (statusEl) statusEl.textContent = '';
        }, 5000);
        return;
    }

    clearTimeout(removeAllArmTimeout);
    removeAllArmed = false;
    if (removeAllBtn) removeAllBtn.textContent = 'Remove All Sections';

    try {
        const removed = await removeAllSections();
        await renderSectionList();
        if (statusEl) {
            statusEl.textContent = removed.length > 0
                ? `Removed all sections: ${removed.join(', ')}`
                : 'No sections to remove.';
        }
    } catch (error) {
        console.error('Error removing all sections:', error);
        if (statusEl) statusEl.textContent = 'Remove all failed — see console for details.';
    }

    setPage("admin")
}

function sortSections(str1,str2) {
    for (let i = 0; i < 4; i++) {
        if(str1.charAt(i) > str2.charAt(i)) {
            return 1;
        }else if(str1.charAt(i) < str2.charAt(i)) {
            return -1;
        }
    }
    return 0;
}
async function renderSectionList() {
    const sectionList = await getSectionList();
    const sectionListContainer = document.getElementById('sectionListContainer');

    if (sectionListContainer) {
        
        const sortedSectionList = sectionList.sort(sortSections);

        if (sortedSectionList.length > 0) {
            sectionListContainer.innerHTML = '<h3>Section List</h3><ul>' + sortedSectionList.map(section => `<li>${section}</li>`).join('') + '</ul>';
        } else {
            sectionListContainer.innerHTML = '<p>No sections available.</p>';
        }
    }
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
document.getElementById("passwordInput").onkeydown = (e) => {
    e.key === "Enter" && passwordCheck()
}


document.getElementById('loadTeamDataPage').onclick = loadTeamDataPage;

document.getElementById("summaryGoBack").onclick = () => setPage('home');
document.getElementById('loadReturnPage').onclick = loadReturnPage;
document.getElementById("loadPurchasePage").onclick = loadPurchasePage;

document.getElementById("executePurchase").onclick = executePurchase;
document.getElementById("barcode1").onkeydown = (e) => {
    e.key === "Enter" && executePurchase()
}
document.getElementById("purchaseGoBack").onclick = loadTeamDataPage;

document.getElementById("executeReturn").onclick = executeReturn;
document.getElementById("barcode2").onkeydown = (e) => {
    e.key === "Enter" && executeReturn()
}
document.getElementById("returnGoBack").onclick = loadTeamDataPage;

document.getElementById('loadSettingsPage').onclick = loadSettingsPage;


document.addEventListener('keydown', function (event) {
    if (!event.ctrlKey) return;
    if (event.keyCode === 13 || event.keyCode === 17 || event.keyCode === 74)
        event.preventDefault();
});

document.getElementById("loadAdminPage").onclick = () => setPage('admin');
document.getElementById("adminGoBack").onclick = () => setPage('home');
document.getElementById("AddSectionBtn").onclick = () => executeSectionAdd();
document.getElementById("RemoveSectionBtn").onclick = () => executeSectionRemove();
document.getElementById("SyncSectionsBtn").onclick = () => executeSectionSync();
document.getElementById("RemoveAllSectionsBtn").onclick = () => executeRemoveAllSections();



