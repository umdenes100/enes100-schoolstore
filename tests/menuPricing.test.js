import {test} from 'node:test';
import assert from 'node:assert/strict';
import {priceUpdates, priceChanges, validateMenuItem} from '../src/menuPricing.js';

test('planned updates only touch the five selected price fields', () => {
    const menu = structuredClone(priceChanges);
    menu['1036'].name += ' ';
    menu['1007'] = {name:'Big Wheel', price:6};
    const updates = priceUpdates(menu);
    assert.deepEqual(updates, {'1005/price':5,'1036/price':4,'1037/price':3,'1038/price':5,'1041/price':3});
    menu['1005'].name = 'Motor Driver';
    assert.throws(() => priceUpdates(menu), /No prices were changed/);
    assert.throws(() => priceUpdates({}), /No prices were changed/);
});

test('item validation accepts zero and decimals without truncation', () => {
    assert.deepEqual(validateMenuItem('1001',' Arduino ','0'), {name:'Arduino',price:0});
    assert.equal(validateMenuItem('10002','Wood Sheet','3.29').price,3.29);
    for (const value of ['', ' ', '-1', 'NaN', 'Infinity', '1.235']) {
        assert.throws(() => validateMenuItem('1001','Item',value));
    }
    for (const barcode of ['','12ab']) assert.throws(() => validateMenuItem(barcode,'Item','3'));
    assert.throws(() => validateMenuItem('1001','  ','3'));
});
