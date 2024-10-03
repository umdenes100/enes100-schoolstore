import {getMenu, setMenu} from "./menu.js";
import {setPage} from "./main.js";

export async function renderSettings() {
    console.log('rendering settings');
    const menu = await getMenu();
    let menuStr = Object.entries(menu).map(([barcode, item]) =>
        `<tr>
            <td>${barcode}</td>
            <td>${item.name}</td>
            <td>$${item.price}</td>
            <td class="delete" id="${barcode}">🗑️</td>
        </tr>`
    ).join('');
    document.getElementById('settings').innerHTML = `
<h1> Settings ⚙️</h1>
<h2>Edit Menu</h2>
<p>To edit a menu item, type in the barcode and new properties and click add item.</p>
<style>
.delete {
    cursor: pointer;
}
</style>
<table>
    <tr>
        <th>Barcode</th>
        <th>Name</th>
        <th>Price</th>
        <th>delete</th>
    </tr>
    ${menuStr}
</table>
<fieldset>
    <legend>Add / Update Item</legend>
    <label>Barcode:<input type="text" id="addItemBarcode"></label>
    <label>Name:<input type="text" id="addItemName"></label>
    <label>Price:<input type="number" id="addItemPrice" min="0"></label>
    <button id="addItemButton">Add Item</button>
</fieldset>
<button id="done">done</button>
`
    document.querySelectorAll('.delete').forEach(e => e.addEventListener('click', async () => {
        const barcode = e.id;
        delete menu[barcode];
        await setMenu(menu);
        // noinspection ES6MissingAwait
        renderSettings();
    }))

    document.getElementById('addItemButton').onclick = async () => {
        const barcode = document.getElementById('addItemBarcode').value;
        const name = document.getElementById('addItemName').value;
        const price = document.getElementById('addItemPrice').value;
        if (!/^\d+$/.test(barcode)) {
            alert('Barcode should be a 4 digit number with no letters.');
            return;
        }
        if (!name) {
            alert('Name should not be empty.');
            return;
        }
        if (!price || parseInt(price) < 0) {
            alert('Price should not be empty.');
            return;
        }
        menu[barcode] = {name, price: parseInt(price)};
        await setMenu(menu);
        // noinspection ES6MissingAwait
        renderSettings();
    }

    document.getElementById('done').onclick = () => {
        setPage('home');
    }
}