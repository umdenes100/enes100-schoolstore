import {get, ref, update} from 'firebase/database';
import {database} from '../src/firebaseConfig.js';

// Explicit barcodes prevent matching motor drivers or motor hubs by mistake.
const changes = {
    '1005': {name: 'Motors', price: 5},
    '1036': {name: 'Wheel', price: 4},
    '1037': {name: 'Small Wheel', price: 3},
    '1038': {name: 'Omni Wheel', price: 5},
    '1041': {name: 'Wheels Caster', price: 3},
};

try {
    const menu = (await get(ref(database, 'menu'))).val();
    const updates = {};
    for (const [barcode, target] of Object.entries(changes)) {
        const current = menu?.[barcode];
        if (!current || current.name.trim() !== target.name) {
            throw new Error(`Menu item ${barcode} does not match ${target.name}; no prices were changed.`);
        }
        console.log(`${barcode} ${target.name}: ${current.price} -> ${target.price} Shells`);
        updates[`menu/${barcode}/price`] = target.price;
    }
    if (process.argv.includes('--apply')) {
        await update(ref(database), updates);
        const saved = (await get(ref(database, 'menu'))).val();
        for (const [barcode, target] of Object.entries(changes)) {
            if (saved?.[barcode]?.price !== target.price) throw new Error(`Price verification failed for ${barcode}.`);
        }
        console.log('Updated and verified the selected prices.');
    } else {
        console.log('Preview only. Run with --apply to update the live prices.');
    }
    process.exit(0);
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
