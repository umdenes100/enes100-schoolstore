import {ref, push, set, get} from "firebase/database";
import {database} from "./firebaseConfig.js";

let name = '';
export function setName(_name) {
    name = _name;
}

const historyRef = ref(database, 'history');

/**
 * Logs a history event
 * @param section {string}
 * @param mission {string}
 * @param action {'purchase' | 'return'}
 * @param what {number} The barcode of the item.
 */
export async function logHistory(section, mission, action, what) {
    const e = {section, mission, action, what, time: Date.now(), who: name};
    const newHistoryRef = push(historyRef);
    await set(newHistoryRef, e);
}

export async function getHistory() {
    const snapshot = await get(historyRef);
    return snapshot.val();
}