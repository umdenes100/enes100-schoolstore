import { ref, child, get, update, set, onValue } from "firebase/database";
import { database } from './firebaseConfig.js'; 


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
export async function findTeam (Section, Mission){
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

export async function setTeamData(section,mission,data){
    await set(ref(database, `store-accounts/${section}${mission}`), data)
} 
//returns the menu
export async function giveMenu (item){
    const dbRef = ref(database); // Reference to the database root

    try {
        const snapshot = await get(child(dbRef, `Menu`)); // Wait for data to be fetched
        if (snapshot.exists()) {
            console.log(snapshot.val()); // Print the 'store-accounts' object
            const data = await get(child(dbRef, `store-accounts/Menu/${item}`));
            console.log(data.val());
        } else {
            console.log("No data available"); // If 'store-accounts' does not exist
        }
    } catch (error) {
        console.error("Error fetching store-accounts:", error); // Log any errors
    }
}

// Clears all the sections back to base must change the sections each semester
export async function clearAll() {
    for (const sec of ["0502", "0501", "FC02", "1002", "0301", "0302", "0701", "FC01", "0402", "0601", "0702", "0401", "0801", "0802", "1201", "0602", "1001"]) {
        for (const mis of ["Fire", "Data", "Crash", "Seed", "Material", "Water"]) {
            const key = sec + mis;
            await setTeamData(sec, mis, {
                wallet: 100, // Set initial wallet amount
                items: null // Initialize as an empty object for storing items
            });
        }
    }
}
//Buys items
export async function checkout(Section, Mission, barcodeInput) {
    const dbRef = ref(database);

    try {
        // Fetch the team's data
        const snapshot = await get(child(dbRef, `store-accounts/${Section}${Mission}`));

        if (snapshot.exists()) {
            const data = snapshot.val();
            const currentItems = data.items || {}; // Correct casing here: 'items' with lowercase 'i'
            const currentWallet = data.wallet || 0;

            // Display the current list and wallet balance
            console.log(`Current Items: ${JSON.stringify(currentItems)}`);
            console.log(`Current Wallet Balance: $${currentWallet}`);
        } else {
            console.log("No account data available for this section and mission.");
            return; 
        }

        // Convert the barcode input to an item name
        const item = await barcodeToItem(parseInt(barcodeInput));

        if (item === "error") {
            console.log("Invalid barcode. Please try again.");
            return;
        }

        // Fetch the item price from the menu
        const menuSnapshot = await get(child(dbRef, `store-accounts/Menu`));
        if (menuSnapshot.exists()) {
            const menuData = menuSnapshot.val();
            const price = menuData[item];

            if (!price) {
                console.log("Item not found in the menu.");
                return;
            }

            // Fetch the team's data again to get the updated balance and items
            const teamSnapshot = await get(child(dbRef, `store-accounts/${Section}${Mission}`));
            if (teamSnapshot.exists()) {
                const teamData = teamSnapshot.val();
                const updatedWallet = teamData.wallet || 0;
                const updatedItems = teamData.items || {}; // Correct casing here

                // Check if the wallet has enough balance for the item
                if (updatedWallet >= price) {
                    // Update the wallet balance and add or increment the item
                    updatedItems[item] = (updatedItems[item] || 0) + 1; // Increment item quantity

                    // Update the team's data in Firebase
                    await update(ref(database, `store-accounts/${Section}${Mission}`), {
                        wallet: updatedWallet - price, // Deduct the price from the wallet
                        items: updatedItems // Correct casing: 'items' with lowercase 'i'
                    });

                    console.log(`Item '${item}' added to the account.`);
                    console.log(`New Wallet Balance: $${updatedWallet - price}`);
                } else {
                    console.log("Insufficient balance to perform the transaction.");
                }
            } else {
                console.log("No account data available for this section and mission.");
            }
        } else {
            console.log("Menu data is not available.");
        }
    } catch (error) {
        console.error("Error during checkout:", error);
    }
}

// Refunds items
export async function refund(section, mission, barcode) {
    const dbRef = ref(database);

    try {
        // Convert the barcode to the item name
        const item = barcodeToItem(parseInt(barcode));

        // Check if the barcode conversion was successful
        if (item === "error") {
            console.log("Invalid barcode. Unable to find corresponding item.");
            return;
        } 
        console.log(`Refunding item:`, item);

        // Retrieve the current data from Firebase for the specified section and mission
        const snapshot = await get(child(dbRef, `store-accounts/${section}${mission}`));

        if (!snapshot.exists()) {
            console.log("No account data available for this section and mission.");
            return;
        }

        const data = snapshot.val();
        const currentItems = data.items || {};
        const currentWallet = data.wallet || 0;

        // Check if the item exists and has a quantity greater than 0
        if (!currentItems[item] || currentItems[item] <= 0) {
            console.log(`Item '${item}' not found or quantity is zero. Cannot process refund.`);
            return;
        }

        // Retrieve item price from the menu
        const menuSnapshot = await get(child(dbRef, `store-accounts/Menu`));
        if (!menuSnapshot.exists()) {
            console.log("Menu data is not available.");
            return;
        }

        const menuData = menuSnapshot.val();
        const price = menuData[item];
        if (!price) {
            console.log("Item not found in the menu.");
            return;
        }

        // Update the wallet and items list
        const updatedItems = { ...currentItems };
        updatedItems[item] -= 1;

        // Remove the item if the quantity becomes zero
        if (updatedItems[item] === 0) {
            delete updatedItems[item];
        }

        // Update Firebase with the new wallet balance and items
        await update(ref(database, `store-accounts/${section}${mission}`), {
            wallet: currentWallet + price,
            items: updatedItems
        });

        console.log(`Refund processed. Item '${item}' removed. New Wallet Balance: $${currentWallet + price}`);
    } catch (error) {
        console.error(`Error processing refund: ${error.message}`);
    }
}
//Barcode to item function this must be updated  
export  function barcodeToItem(number) {
    switch(number) {
        case 1001:
          return "Arduino Uno";
          break;
        case 1002:
          return "Motor Driver";
          break;
        default:
          return "error";
      } 
}    
//Displays account information while scanning
export async function accountUpdates(Section, Mission, screen) {
    const accountRef = ref(database, `store-accounts/${Section}${Mission}/wallet`);

    const snapshot = await get(accountRef);
    const initialBalance = snapshot.val();

    if (screen) {
        document.getElementById('purchaseBalance').innerText = `Account Balance: $${initialBalance}`;
    } else {
        document.getElementById('returnBalance').innerText = `Account Balance: $${initialBalance}`;
    }

    onValue(accountRef, (snapshot) => {
        const newBalance = snapshot.val();

            if (screen) {
            document.getElementById('purchaseBalance').innerText = `Account Balance: $${newBalance}`;
        } else {
            document.getElementById('returnBalance').innerText = `Account Balance: $${newBalance}`;
        }
    });
}


