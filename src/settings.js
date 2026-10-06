import {priceChanges} from "./menuPricing.js";
import {itemPrice, isDollarItem, escapeHtml} from "./currency.js";
import {getMenu, saveMenuItem, deleteMenuItem, applyWheelMotorPrices} from "./menu.js";
import {setPage} from "./main.js";
import {getHistory} from "./history.js";

export async function renderSettings(message = "") {
    console.log('rendering settings');
    const menu = await getMenu();
    let menuStr = Object.entries(menu).map(([barcode, item]) =>
        `<tr>
            <td>${escapeHtml(barcode)}</td>
            <td>${escapeHtml(item.name)}</td>
            <td>${itemPrice(item)}</td>
            <td><button class="edit-item" data-barcode="${escapeHtml(barcode)}">Edit</button> <button class="delete" data-barcode="${escapeHtml(barcode)}">Delete</button></td>
        </tr>`
    ).join('');
    const history = await getHistory();
    let tableStr = Object.values(history ?? {}).toReversed().map(({section, mission, action, what, time, who}) =>
        `<tr>
            <td>${section}</td>
            <td>${mission}</td>
            <td>${action}</td>
            <td>${what}</td>
            <td>${new Date(time).toLocaleString()}</td>
            <td>${who}</td>
        </tr>`
    ).join('');
    document.getElementById('settings').innerHTML = `
<h1> Settings ⚙️</h1>
<h2>Edit Menu</h2>
<p>Choose Edit next to an item, change its price, and select Save Item. Prices are per item.</p>
<p id="menuStatus" role="status">${escapeHtml(message)}</p>
<fieldset>
    <legend>Wheel and motor prices</legend>
    <p>Review and apply these prices to the checkout menu:</p>
    <ul>${Object.entries(priceChanges).map(([barcode, target]) => `<li>${escapeHtml(target.name)} (${barcode}): ${menu[barcode] ? itemPrice(menu[barcode]) : 'Missing'} → ${itemPrice(target)} each</li>`).join('')}</ul>
    <p>The separate Big Wheel entry stays unchanged.</p>
    <button id="applyPrices">Apply these prices</button>
</fieldset>
<style>
.delete {
    cursor: pointer;
}
</style>
<table>
    <tr>
        <th>Barcode</th>
        <th>Name</th>
        <th>Price (Shells or dollars)</th>
        <th>Actions</th>
    </tr>
    ${menuStr}
</table>
<fieldset>
    <legend>Add / Update Item</legend>
    <label>Barcode:<input type="text" id="addItemBarcode"></label>
    <label>Name:<input type="text" id="addItemName"></label>
    <p>Prices are in Shells, except Wood Sheet and Acrylic Sheet prices, which are in dollars and paid separately.</p>
    <label><span id="priceUnit">Price (Shells)</span>:<input type="number" id="addItemPrice" min="0" step="0.01"></label>
    <button id="addItemButton">Save Item</button>
</fieldset>
<fieldset style="height: 100px; overflow-y: scroll">
    <legend>Purchase / Refund History
    <button id="downloadHistoryAsCSV">download</button>
    </legend>
    <table>
        <tr>
            <th>Section</th>
            <th>Mission</th>
            <th>Action</th>
            <th>What</th>
            <th>When</th>
            <th>TF</th>
        </tr>
        ${tableStr}
    </table>
</fieldset>
<button id="done">done</button>
`
    const status = document.getElementById('menuStatus');
    const barcodeInput = document.getElementById('addItemBarcode');
    const nameInput = document.getElementById('addItemName');
    const priceInput = document.getElementById('addItemPrice');
    const updateUnit = () => {
        document.getElementById('priceUnit').textContent = isDollarItem({name: nameInput.value})
            ? 'Price (US dollars, paid separately)' : 'Price (Shells per item)';
    };
    nameInput.oninput = updateUnit;
    const runSave = async (button, action, success) => {
        button.disabled = true;
        status.textContent = 'Saving…';
        try {
            await action();
            await renderSettings(success);
        } catch (error) {
            status.textContent = `Could not save: ${error.message}`;
            button.disabled = false;
        }
    };
    document.querySelectorAll('.edit-item').forEach(button => button.onclick = () => {
        const barcode = button.dataset.barcode;
        barcodeInput.value = barcode;
        nameInput.value = menu[barcode].name;
        priceInput.value = menu[barcode].price;
        updateUnit();
        priceInput.focus();
    });
    document.querySelectorAll('.delete').forEach(button => button.onclick = () => {
        const barcode = button.dataset.barcode;
        runSave(button, () => deleteMenuItem(barcode), 'Item deleted.');
    });
    document.getElementById('addItemButton').onclick = (event) => runSave(event.currentTarget,
        () => saveMenuItem(barcodeInput.value.trim(), nameInput.value, priceInput.value), 'Item saved.');
    document.getElementById('applyPrices').onclick = (event) => runSave(event.currentTarget,
        applyWheelMotorPrices, 'Wheel and motor prices saved.');

    document.getElementById('downloadHistoryAsCSV').onclick = () => {
        // Takes the entire history, writes it to a CSV file, and downloads it.
        // First row should be labels. Same format as table.
        // Note: The locale time string has a comma, so I just added the date AND time in separate columns.
        const csv = Object.values(history ?? {}).toReversed().map(({section, mission, action, what, time, who}) =>
            `${section},${mission},${action},${what},${new Date(time).toLocaleString()},${who}`
        ).join('\n');
        const header = 'Section,Mission,Action,What,Date,Time,TF\n';
        const blob = new Blob([header + csv], {type: 'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'history.csv';
        a.click();
    }

    document.getElementById('done').onclick = () => {
        setPage('home');
    }
}