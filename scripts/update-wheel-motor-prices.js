import {get, ref, update} from 'firebase/database';
import {database} from '../src/firebaseConfig.js';

import {priceChanges as changes} from '../src/menuPricing.js';

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
