import {itemPrice, isDollarItem, escapeHtml} from "./currency.js";
import {getMenu, saveMenuItem, deleteMenuItem} from "./menu.js";
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
            <td class="delete" data-barcode="${escapeHtml(barcode)}">🗑️</td>
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
<p>To edit a menu item, type in the barcode and new properties and click add item.</p>
<p id="menuStatus" role="status">${escapeHtml(message)}</p>
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
    <p>Prices are in Shells, except Wood Sheet and Acrylic Sheet prices, which are in dollars and paid separately.</p>
    <label><span id="priceUnit">Price (Shells)</span>:<input type="number" id="addItemPrice" min="0" step="0.01"></label>
    <button id="addItemButton">Add Item</button>
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
    document.querySelectorAll('.delete').forEach(button => button.onclick = () => {
        const barcode = button.dataset.barcode;
        runSave(button, () => deleteMenuItem(barcode), 'Item deleted.');
    });
    document.getElementById('addItemButton').onclick = (event) => runSave(event.currentTarget,
        () => saveMenuItem(barcodeInput.value.trim(), nameInput.value, priceInput.value), 'Item saved.');
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