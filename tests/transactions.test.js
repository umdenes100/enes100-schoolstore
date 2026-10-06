import vm from 'node:vm';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = new URL('../src/', import.meta.url);
let team = {wallet:50, items:{}};
let writes = 0;
let logs = 0;
const menu = {1001:{name:'Arduino Uno',price:8}, 1002:{name:'Wood Sheet',price:3},1003:{name:'Acrylic Sheet',price:5},1004:{name:'PLA Sheet',price:2}};
const elements = {purchaseBalance:{},returnBalance:{}};
const context = vm.createContext({URL, console, document:{getElementById:id=>elements[id]}});
function mock(exports) {
  return new vm.SyntheticModule(Object.keys(exports), function(){for (const [k,v] of Object.entries(exports)) this.setExport(k,v);}, {context});
}
const deps = {
 'firebase/database': mock({child:(_,path)=>path,ref:(_,path)=>path,get:async()=>({exists:()=>true,val:()=>structuredClone(team)}),set:async(_,data)=>{team=structuredClone(data);writes++;},onValue:(_,cb)=>cb({val:()=>team.wallet})}),
 './firebaseConfig.js':mock({database:{}}),
 './menu.js':mock({getMenu:async()=>menu}),
 './history.js':mock({logHistory:async()=>{logs++;}}),
 './umdApi.js':mock({fetchCurrentEnes100Sections:async()=>[]})
};
const currency = new vm.SourceTextModule(await fs.readFile(new URL('currency.js',root),'utf8'), {context, initializeImportMeta:meta=>{meta.url=new URL('currency.js',root).href;}});
await currency.link(()=>{}); await currency.evaluate();deps['./currency.js']=currency;
const db = new vm.SourceTextModule(await fs.readFile(new URL('databaseFunctions.js',root),'utf8'), {context});
await db.link(spec=>deps[spec]);await db.evaluate();
const {checkout,refund,accountUpdates}=db.namespace;
await checkout('0000','Test','1001');assert.equal(team.wallet,42);assert.equal(team.items['1001'],1);
await refund('0000','Test','1001');assert.equal(team.wallet,50);assert.equal(team.items['1001'],0);
await checkout('0000','Test','1004');assert.equal(team.wallet,48);
const oldWrites=writes, oldLogs=logs;
for(const code of ['1002','1003']) {assert.match(await checkout('0000','Test',code),/paid for separately/);assert.match(await refund('0000','Test',code),/paid for separately/);}
assert.equal(team.wallet,48);assert.equal(writes,oldWrites);assert.equal(logs,oldLogs);
team.wallet=0;assert.match(await checkout('0000','Test','1001'),/Insufficient Shells/);assert.equal(writes,oldWrites);
await accountUpdates('0000','Test',true);await accountUpdates('0000','Test',false);
assert.match(elements.purchaseBalance.innerHTML,/alt="Shells"/);assert.match(elements.returnBalance.innerHTML,/alt="Shells"/);
console.log('PASS: Shell purchases, refunds, insufficient balance, live balances, PLA pricing, and cash-sheet isolation; no live database used.');
