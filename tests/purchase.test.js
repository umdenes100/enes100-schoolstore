import vm from 'node:vm';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = new URL('../src/', import.meta.url);

class FakeElement {
  constructor(){this.children=[];this.value='';this.className='';}
  set textContent(text){this._text=text;this.children=[];}
  get textContent(){return this._text;}
  append(...nodes){this.children.push(...nodes);}
}
const elements = {itemSearch:new FakeElement(), itemGrid:new FakeElement(), purchaseError:new FakeElement()};
const context = vm.createContext({URL, console, document:{getElementById:id=>elements[id], createElement:()=>new FakeElement()}});
const mock = exports => new vm.SyntheticModule(Object.keys(exports), function(){for (const [k,v] of Object.entries(exports)) this.setExport(k,v);}, {context});

const menu = {1001:{name:'Motor',price:5}, 1002:{name:'Arduino Uno',price:8}, 1008:{name:'Arduino Uno R4 WiFi',price:14}, 1009:{name:'Big Kit',price:99}};
let team = {wallet:13, items:{}};
let active = 0, maxActive = 0;
const checkout = async (section, mission, barcode) => {
  active++; maxActive = Math.max(maxActive, active);
  await new Promise(resolve => setTimeout(resolve, 1));
  active--;
  assert.deepEqual([section, mission], ['0301', 'Fire']);
  const item = menu[barcode];
  if (!item) return `Item "${barcode}" not found`;
  if (barcode === '1008') return 'purchased with real cash';
  if (team.wallet < item.price) return 'Insufficient Shells';
  team.wallet -= item.price;
  team.items[barcode] = (team.items[barcode] ?? 0) + 1;
};
const currency = new vm.SourceTextModule(await fs.readFile(new URL('currency.js',root),'utf8'), {context, initializeImportMeta:meta=>{meta.url=new URL('currency.js',root).href;}});
await currency.link(()=>{}); await currency.evaluate();
const deps = {
  './currency.js':currency,
  './databaseFunctions.js':mock({checkout, getTeamData:async()=>structuredClone(team)}),
  './menu.js':mock({getMenu:async()=>menu}),
};
const purchase = new vm.SourceTextModule(await fs.readFile(new URL('purchase.js',root),'utf8'), {context});
await purchase.link(spec=>deps[spec]); await purchase.evaluate();
const {renderPurchasePage, buy} = purchase.namespace;

const cards = () => elements.itemGrid.children;
const card = name => cards().find(c => c.innerHTML.includes(`>${name}<`));
const status = () => elements.purchaseError;

await renderPurchasePage('0301','Fire');
assert.deepEqual(cards().map(c=>c.innerHTML.match(/item-name">(.*?)</)[1]), ['Arduino Uno','Arduino Uno R4 WiFi','Big Kit','Motor']);
assert.equal(card('Big Kit').disabled, true);
assert.equal(card('Motor').disabled, false);
assert.equal(card('Arduino Uno R4 WiFi').disabled, false, 'cash items stay clickable so the instructions can be shown');
assert.match(card('Arduino Uno R4 WiFi').innerHTML, /Cash only/);

// A click buys one, locks the grid while in flight, then updates the card.
const motor = card('Motor');
const clicked = motor.onclick();
assert.equal(card('Motor').disabled, true);
await clicked;
assert.equal(team.wallet, 8);
assert.match(status().innerHTML, /Bought 1 × Motor/);
assert.match(card('Motor').innerHTML, /Team has 1/);

// Rapid barcode scans run in order, never overlapping, and each is reported.
maxActive = 0;
await Promise.all([buy('1001'), buy('1001'), buy('1001')]);
assert.equal(maxActive, 1);
assert.equal(team.wallet, 3, 'third scan is refused: 8 - 5 = 3 < 5');
assert.equal(status().className, 'purchase-status error');
assert.match(status().innerHTML, /Insufficient Shells/);

await card('Arduino Uno R4 WiFi').onclick();
assert.match(status().innerHTML, /real cash/);
assert.equal(team.wallet, 3);

// Search filters by name or barcode; item names are escaped into the page.
elements.itemSearch.value = '1002';
elements.itemSearch.oninput();
assert.equal(cards().length, 1);
elements.itemSearch.value = 'nothing';
elements.itemSearch.oninput();
assert.match(elements.itemGrid.textContent, /No items match/);
elements.itemSearch.value = '';
menu[1010] = {name:'<img src=x>', price:1};
elements.itemSearch.oninput();
assert.ok(!cards().some(c => c.innerHTML.includes('<img src=x>')));
console.log('PASS: click-to-buy grid, affordability, cash items, queued scans, and search; no live database used.');
