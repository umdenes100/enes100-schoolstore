import {child, get, onValue, ref, set} from "firebase/database";
import {database} from './firebaseConfig.js';
import {getMenu} from "./menu.js";
import {logHistory} from "./history.js";


//Prints out full school store data
export async function printStoreAccounts() {
    const dbRef = ref(database);

    try {
        const snapshot = await get(child(dbRef, 'store-accounts'));
        if (snapshot.exists()) {
            console.log(snapshot.val());
        } else {
            console.log("No data available");
        }
    } catch (error) {
        console.error("Error fetching store-accounts:", error); // Log any errors
    }
}

//Prints team data for debugging
export async function findTeam(Section, Mission) {
    const dbRef = ref(database); // Reference to the database root

    try {
        const snapshot = await get(child(dbRef, `store-accounts/${Section}${Mission}`)); // Wait for data to be fetched
        if (snapshot.exists()) {
            console.log(snapshot.val()); // Print the 'store-accounts' object
        } else {
            console.log("No data available"); // If 'store-accounts' does not exist
        }
    } catch (error) {
        console.error("Error fetching store-accounts:", error); // Log any errors
    }
}


export async function getTeamData(section, mission) {
    const dbRef = ref(database); // Reference to the database root

    try {
        const snapshot = await get(child(dbRef, `store-accounts/${section}${mission}`)); // Wait for data to be fetched
        if (snapshot.exists()) {
            return snapshot.val(); // Return the team data
        } else {
            console.log("No data available");
            return null; // Return null if no data is available
        }
    } catch (error) {
        console.error("Error fetching store-accounts:", error);
        return null; // Return null in case of an error
    }
}

export async function setTeamData(section, mission, data) {
    await set(ref(database, `store-accounts/${section}${mission}`), data)
}

// Clears all the sections back to base must change the sections each semester
export async function clearAll() {
    for (const sec of ["0502", "FC02", "1002", "0301", "0302", "0701", "FC01", "0402", "0601", "0702", "0401", "0801", "0802", "1201", "0602", "1001"]) {
        for (const mis of ["Fire", "Data", "Crash", "Seed", "Material", "Water"]) {
            await setTeamData(sec, mis, {
                wallet: 50, // Set initial wallet amount
                items: null // Initialize as an empty object for storing items
            });
        }
    }
}

export async function addSections(newSection){
let str = newSection.replaceAll(' ','');    
let array = str.split(',');
    for (const sec of  array) {
        for (const mis of ["Fire", "Data", "Hydrogen", "Seed", "Material", "Water"]) {
            await setTeamData(sec, mis, {
                wallet: 50, // Set initial wallet amount
                items: null // Initialize as an empty object for storing items
            });
        }
    }
}

export async function deleteSections(sectionList){
    let str = sectionList.replaceAll(' ','');    
    let array = str.split(',');
    for (const section of array) {
        for (const mis of ["Fire", "Data", "Hydrogen", "Seed", "Material", "Water"]) {
            await setTeamData(section, mis, null);// removes the object by setting it to null
        }
    }
      
}


export async function updateSectionList(newSections) {
    const sectionRef = ref(database, 'sections');

    try {
        const snapshot = await get(sectionRef);
        let sections = snapshot.exists() ? snapshot.val() : [];

        let sectionArray = newSections.replaceAll(' ', '').split(',');
        let updatedSections = [...new Set([...sections, ...sectionArray])]; // Avoid duplicates

        await set(sectionRef, updatedSections);
        console.log("Sections updated:", updatedSections);
    } catch (error) {
        console.error("Error updating section list:", error);
    }
}
export async function removeSectionList(newSections) {
    const sectionRef = ref(database,"sections");

    try {
        const snapshot = await get(sectionRef);
        let sections = snapshot.exists() ? snapshot.val() : [];
        let sectionArray = newSections.replaceAll(' ', '').split(',');
        let updatedsections = sections.filter(item => !sectionArray.includes(item));
        await set(sectionRef,updatedsections);
        console.log("Sections removed section list",updatedsections)
    } catch (error){
        console.error("Error removing secions from list  ")
    }

}

export async function getSectionList() {
    const sectionRef = ref(database, 'sections');

    try {
        const snapshot = await get(sectionRef);
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log("No sections available");
            return [];
        }
    } catch (error) {
        console.error("Error fetching section list:", error);
        return [];
    }
}
// await clearAll();

//Buys items
export async function checkout(section, mission, barcode) {
    const teamData = await getTeamData(section, mission);
    const menu = await getMenu();
    if (!teamData || !menu) {
        return "Error fetching team data or menu."
    }
    if (!(barcode in menu)) {
        return `Item "${barcode}" not found in the menu. <br><small>Recognized Barcodes: ${Object.keys(menu).join(", ")}</small>`;
    }

    const item = menu[barcode];

    if (teamData.wallet < item.price) {
        return `Insufficient funds. Current Balance: $${teamData.wallet}, Item Price: $${item.price}`;
    }

    teamData.wallet -= item.price;
    teamData.items = teamData.items || {};
    teamData.items[barcode] = (teamData.items[barcode] || 0) + 1;

    await Promise.all([
        logHistory(section, mission, "purchase", barcode),
        setTeamData(section, mission, teamData)
    ]);
}

// Refunds items
export async function refund(section, mission, barcode) {
    const teamData = await getTeamData(section, mission);
    const menu = await getMenu();
    if (!teamData || !menu) {
        return "Error fetching team data or menu."
    }
    if (!(barcode in menu)) {
        return `Item "${barcode}" not found in the menu. <br><small>Recognized Barcodes: ${Object.keys(menu).join(", ")}</small>`;
    }

    const item = menu[barcode];

    if (!teamData.items || !teamData.items[barcode] > 0) {
        return `Team does not have a ${item.name}.`;
    }

    teamData.wallet += item.price;
    teamData.items[barcode] -= 1;

    // await setTeamData(section, mission, teamData);
    await Promise.all([
        logHistory(section, mission, "return", barcode),
        setTeamData(section, mission, teamData)
    ]);
}

//Displays account information while scanning
export async function accountUpdates(Section, Mission, screen) {
    const accountRef = ref(database, `store-accounts/${Section}${Mission}/wallet`);

    // const snapshot = await get(accountRef);
    // const initialBalance = snapshot.val();
    //
    // if (screen) {
    //     document.getElementById('purchaseBalance').innerText = `Account Balance: $${initialBalance}`;
    // } else {
    //     document.getElementById('returnBalance').innerText = `Account Balance: $${initialBalance}`;
    // }

    onValue(accountRef, (snapshot) => {
        const newBalance = snapshot.val();

        if (screen) {
            document.getElementById('purchaseBalance').innerText = `Account Balance: $${newBalance}`;
        } else {
            document.getElementById('returnBalance').innerText = `Account Balance: $${newBalance}`;
        }
    });
}


