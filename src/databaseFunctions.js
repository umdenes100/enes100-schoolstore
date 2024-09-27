import { ref, child, get, update, set } from "firebase/database";
import { database } from './firebaseConfig.js'; 



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

// Function to write data to 'store-accounts'
export async function writeUserData(Section, type) {
    try {
        // Await the update() call to update the 'store-accounts' object
        await update(ref(database, 'store-accounts/' + Section), {
            type  // Update the data field
        });
        console.log("Data updated successfully!");
    } catch (error) {
        console.error("Error updating data:", error);
    }
}

export async function findTeam (Section, Mission){
    const dbRef = ref(database); // Reference to the database root

    try {
        const snapshot = await get(child(dbRef, `store-accounts/${Section}/${Mission}`)); // Wait for data to be fetched
        if (snapshot.exists()) {
            console.log(snapshot.val()); // Print the 'store-accounts' object
        } else {
            console.log("No data available"); // If 'store-accounts' does not exist
        }
    } catch (error) {
        console.error("Error fetching store-accounts:", error); // Log any errors
    }
}


export async function giveMenu (item){
    const dbRef = ref(database); // Reference to the database root

    try {
        const snapshot = await get(child(dbRef, `store-accounts/Menu`)); // Wait for data to be fetched
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
export async function editWallet(Section, Mission, charge) {
    const dbRef = ref(database); // Reference to the database root

    try {
        // Retrieve the current data from Firebase for the specified section and mission
        const snapshot = await get(child(dbRef, `store-accounts/${Section}/${Mission}`));

        if (snapshot.exists()) {
            const data = snapshot.val(); // Extract the data from the snapshot

            // Ensure that 'Wallet' exists and is a number
            const currentWallet = data.Wallet || 0; // Default to 0 if Wallet is undefined

            // Check if there's enough balance in the wallet to deduct the charge
            if (currentWallet - charge >= 0) {
                // Update the Wallet value by deducting the charge
                await update(ref(database, `store-accounts/${Section}/${Mission}`), {
                    Wallet: currentWallet - charge
                });
                console.log(`Wallet updated. New balance: ${currentWallet - charge}`);
            } else {
                console.log("Insufficient balance to perform the transaction.");
            }
        } else {
            console.log("No account data available for this section and mission.");
        }

    } catch (error) {
        console.error("Error adding account:", error);
    }
}

export async function editList(Section, Mission, item) {
    const dbRef = ref(database); // Reference to the database root
    try {
        const snapshot = await get(child(dbRef, `store-accounts/${Section}/${Mission}`)); // Fetch account data

        if (snapshot.exists()) {
            const data = snapshot.val(); // Extract the data from the snapshot

            // Check if the item exists in the Items field
            const currentAmount = data.Items?.[item] || 0;

            if (currentAmount == 0) {
                // Update the item quantity (setting it to 1)
                await update(ref(database, `store-accounts/${Section}/${Mission}/Items`), {
                    [item]: 1  // Dynamic key for the specific item
                });
                console.log(`Item '${item}' added with a quantity of 1.`);
            } else {
                await update(ref(database, `store-accounts/${Section}/${Mission}/Items`), {
                    [item]: currentAmount +1   // Dynamic key for the specific item
                });                
            }
        } else {
            console.log("No account data available for this section and mission.");
        }

    } catch (error) {
        console.error("Error editing list:", error);
    }
}

/* Checkout function: Display team info, prompt for barcode, update account
export async function checkout(Section, Mission) {
    const dbRef = ref(database);
  
    // Create an interface for capturing user input
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        
        const snapshot = await get(child(dbRef, `store-accounts/${Section}/${Mission}`));
        
        if (snapshot.exists()) {
            const data = snapshot.val(); 
            const currentItems = data.Items || {}; 
            const currentWallet = data.Wallet || 0; 

            // Display the current list and wallet balance
            console.log(`Current Items: ${JSON.stringify(currentItems)}`);
            console.log(`Current Wallet Balance: $${currentWallet}`);
        } else {
            console.log("No account data available for this section and mission.");
            rl.close();
            return; 
        }

        // Prompt user for the barcode
        rl.question("Please scan the barcode (number): ", async (barcodeInput) => {
            const item = await barcodeToItem(parseInt(barcodeInput)); // Convert barcode to item name

            if (item === "error") {
                console.log("Invalid barcode. Please try again.");
                rl.close();
                return;
            }

            // Fetch the item price from the menu
            const menuSnapshot = await get(child(dbRef, `store-accounts/Menu`));
            if (menuSnapshot.exists()) {
                const menuData = menuSnapshot.val();
                const price = menuData[item];

                if (!price) {
                    console.log("Item not found in the menu.");
                    rl.close();
                    return;
                }

                // Fetch the team's data again to get the updated balance and items
                const teamSnapshot = await get(child(dbRef, `store-accounts/${Section}/${Mission}`));
                if (teamSnapshot.exists()) {
                    const teamData = teamSnapshot.val();
                    const updatedWallet = teamData.Wallet || 0;
                    const updatedItems = teamData.Items || {};

                    // Check if the wallet has enough balance for the item
                    if (updatedWallet >= price) {
                        // Update the wallet balance and add the item to the list
                        await update(ref(database, `store-accounts/${Section}/${Mission}`), {
                            Wallet: updatedWallet - price, // Deduct the price from the wallet
                            Items: {
                                ...updatedItems, // Keep existing items
                                [item]: (updatedItems[item] || 0) + 1 // Add or increment the item
                            }
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
            rl.close(); // Close the readline interface
        });
    } catch (error) {
        console.error("Error during checkout:", error);
        rl.close(); // Ensure readline is closed in case of an error
    }
}
*/
export async function refund(section, mission, barcode) {
    const dbRef = ref(database);

    try {
        // Convert the barcode to the item name
        const item = barcodeToItem(barcode);

        // Check if the barcode conversion was successful
        if (item === "error") {
            console.log("Invalid barcode. Unable to find corresponding item.");
            return;
        } 
        console.log(`Refunding item:`, item);

        // Retrieve the current data from Firebase for the specified section and mission
        const snapshot = await get(child(dbRef, `store-accounts/${section}/${mission}`));

        if (!snapshot.exists()) {
            console.log("No account data available for this section and mission.");
            return;
        }

        const data = snapshot.val();
        const currentItems = data.Items || {};
        const currentWallet = data.Wallet || 0;

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
        await update(ref(database, `store-accounts/${section}/${mission}`), {
            Wallet: currentWallet + price,
            Items: updatedItems
        });

        console.log(`Refund processed. Item '${item}' removed. New Wallet Balance: $${currentWallet + price}`);
    } catch (error) {
        console.error(`Error processing refund: ${error.message}`);
    }
}
export  function barcodeToItem(number) {
    switch(number) {
        case 1001:
          return "Ardunio Uno";
          break;
        case 1002:
          return "Motor Driver";
          break;
        default:
          return "error";
      } 
}    


