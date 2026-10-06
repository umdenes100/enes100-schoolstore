export const priceChanges = {
    '1005': {name: 'Motors', price: 5},
    '1036': {name: 'Wheel', price: 4},
    '1037': {name: 'Small Wheel', price: 3},
    '1038': {name: 'Omni Wheel', price: 5},
    '1041': {name: 'Wheels Caster', price: 3},
};

export function priceUpdates(menu) {
    const updates = {};
    for (const [barcode, target] of Object.entries(priceChanges)) {
        if (menu?.[barcode]?.name.trim() !== target.name) {
            throw new Error(`Item ${barcode} must be ${target.name}. No prices were changed.`);
        }
        updates[`${barcode}/price`] = target.price;
    }
    return updates;
}

export function validateMenuItem(barcode, name, value) {
    if (!/^\d+$/.test(barcode)) throw new Error('Enter a barcode containing only digits.');
    if (!name.trim()) throw new Error('Enter an item name.');
    const price = Number(value);
    if (String(value).trim() === '' || !Number.isFinite(price) || price < 0 || Math.abs(price * 100 - Math.round(price * 100)) > 1e-8) {
        throw new Error('Enter a non-negative price with at most two decimal places.');
    }
    return {name: name.trim(), price};
}
