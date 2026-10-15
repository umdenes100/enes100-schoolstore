import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shells, itemPrice, isDollarItem} from './currency.js';

test('wood sheets and R4 WiFi boards use dollar pricing', () => {
    for (const name of ['Arduino Uno R4 WiFi', 'Wood Sheet', '12 x 24 WOOD SHEETS']) {
        assert.equal(isDollarItem({name}), true);
        assert.equal(itemPrice({name, price: 3}), '$3');
    }
    for (const name of ['PLA Sheet', 'Arduino Uno', 'Wood screws', 'Plastic wheel']) {
        assert.equal(isDollarItem({name}), false);
        assert.match(itemPrice({name, price: 3}), /alt="Shells"/);
    }
});

test('Shells preserve amounts, have accessible text, and escape dynamic values', () => {
    for (const value of [0, 1, 2.5, 50]) {
        assert.ok(shells(value).endsWith(` ${value}</span>`));
    }
    assert.match(shells(null), /N\/A/);
    assert.match(shells(50), /alt="Shells"/);
    assert.ok(!shells('<script>').includes('<script>'));
});
