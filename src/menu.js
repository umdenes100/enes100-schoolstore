import {priceUpdates, validateMenuItem} from "./menuPricing.js";
import {get, ref, set, update, remove} from "firebase/database";
import {database} from "./firebaseConfig.js";

const menuRef = ref(database, 'menu');

export async function getMenu() {
    const snapshot = await get(menuRef); // Wait for data to be fetched
    if (!snapshot.exists()) throw new Error('No menu available');
    return snapshot.val();
}


export async function setMenu(menu) {
    return await set(menuRef, menu);
}

async function resetMenu() {
    console.log('reseting menu')
    await setMenu({
        '1001': {
            name: 'Arduino Uno',
            price: 8,
        },
        '1002': {
            name: 'Motor Driver',
            price: 3,
        },
    })
}

// resetMenu()
export async function saveMenuItem(barcode, name, price) {
    const item = validateMenuItem(barcode, name, price);
    await update(ref(database, `menu/${barcode}`), item);
}

export async function deleteMenuItem(barcode) {
    if (!/^\d+$/.test(barcode)) throw new Error('Invalid barcode.');
    await remove(ref(database, `menu/${barcode}`));
}

export async function applyWheelMotorPrices() {
    const updates = priceUpdates(await getMenu());
    await update(menuRef, updates);
}
