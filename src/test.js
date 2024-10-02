// test.js
 import {checkout, refund,clearAll,printStoreAccounts, findTeam} from "./databaseFunctions.js"; // Import the functions
 await clearAll();
 await findTeam("0301","Fire"); // Run the sequence
 console.log('\n')
 await checkout('0301','Fire',1001);
 console.log('\n')
 await findTeam("0301","Fire"); // Run the sequence
 console.log('\n')
 await checkout('0301','Fire',1001);
 console.log('\n')
 await findTeam("0301","Fire"); // Run the sequence
 console.log('\n')
await refund('0301','Fire',1001)
console.log('\n')
await findTeam("0301","Fire"); // Run the sequence
console.log('\n')
await refund('0301','Fire',1001)
console.log('\n')
await findTeam("0301","Fire"); // Run the sequence
console.log('\n')
await refund('0301','Fire',1001)
console.log('\n')
await findTeam("0301","Fire"); // Run the sequence

 // console.log("hello");