import vm from 'node:vm';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const writes=[];
const context=vm.createContext({console});
const mock=exports=>new vm.SyntheticModule(Object.keys(exports),function(){for(const [key,value] of Object.entries(exports))this.setExport(key,value);},{context});
const plan=new vm.SourceTextModule(await fs.readFile(new URL('../src/menuPricing.js',import.meta.url),'utf8'),{context});
await plan.link(()=>{});await plan.evaluate();
let menu=structuredClone(JSON.parse(JSON.stringify(plan.namespace.priceChanges)));
const deps={
 './menuPricing.js':plan,
 './firebaseConfig.js':mock({database:{}}),
 'firebase/database':mock({ref:(_,path)=>path,get:async()=>({exists:()=>true,val:()=>menu}),set:async()=>{throw Error('Whole-menu overwrite');},update:async(path,value)=>writes.push({path,value}),remove:async path=>writes.push({path,remove:true})})
};
const module=new vm.SourceTextModule(await fs.readFile(new URL('../src/menu.js',import.meta.url),'utf8'),{context});
await module.link(name=>deps[name]);await module.evaluate();
await module.namespace.saveMenuItem('1005','Motors','5');
assert.equal(writes[0].path,'menu/1005');assert.equal(writes[0].value.price,5);
await assert.rejects(module.namespace.saveMenuItem('bad','Motors','5'));assert.equal(writes.length,1);
await module.namespace.applyWheelMotorPrices();assert.equal(writes[1].path,'menu');assert.equal(Object.keys(writes[1].value).length,5);
menu['1005'].name='Motor Driver';await assert.rejects(module.namespace.applyWheelMotorPrices());assert.equal(writes.length,2);
await module.namespace.deleteMenuItem('1005');assert.equal(writes[2].path,'menu/1005');
console.log('PASS: item saves and deletes are scoped; batch prices validate before writing.');
