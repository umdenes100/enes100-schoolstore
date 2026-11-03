import {escapeHtml, isDollarItem, itemPrice} from "./currency.js";
import {checkout, getTeamData} from "./databaseFunctions.js";
import {getMenu} from "./menu.js";

let menu = {};
let teamData = null;
let section;
let missionType;
let pending = 0;
// checkout() reads then writes the wallet, so purchases run one at a time.
let queue = Promise.resolve();

export async function renderPurchasePage(_section, _missionType) {
    section = _section;
    missionType = _missionType;
    document.getElementById('itemSearch').value = '';
    setStatus('');
    const grid = document.getElementById('itemGrid');
    grid.textContent = 'Loading items...';

    try {
        [menu, teamData] = await Promise.all([getMenu(), getTeamData(section, missionType)]);
        renderGrid();
    } catch (error) {
        console.error('Error loading purchase page:', error);
        grid.textContent = 'Could not load the menu. Check your connection and try again.';
    }
}

function renderGrid() {
    const grid = document.getElementById('itemGrid');
    const query = document.getElementById('itemSearch').value.trim().toLowerCase();

    const items = Object.entries(menu)
        .filter(([barcode, item]) => item.name.toLowerCase().includes(query) || barcode.includes(query))
        .sort(([, a], [, b]) => a.name.localeCompare(b.name));

    grid.textContent = items.length === 0 ? 'No items match your search.' : '';
    grid.append(...items.map(([barcode, item]) => renderCard(barcode, item)));
}

function renderCard(barcode, item) {
    const isCash = isDollarItem(item);
    const canAfford = isCash || (teamData?.wallet ?? 0) >= item.price;
    const owned = teamData?.items?.[barcode] ?? 0;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = canAfford ? 'item-card' : 'item-card unaffordable';
    card.disabled = pending > 0 || !canAfford;
    card.title = canAfford ? '' : 'Not enough Shells';
    card.onclick = () => buy(barcode);
    card.innerHTML = `
        <span class="item-name">${escapeHtml(item.name)}</span>
        <span class="item-price">${itemPrice(item)}</span>
        <span class="item-meta">#${escapeHtml(barcode)}${owned > 0 ? ` · Team has ${owned}` : ''}</span>
        <span class="item-action${isCash ? ' cash' : ''}">${isCash ? 'Cash only' : '+ Buy'}</span>
    `;
    return card;
}

export function buy(barcode) {
    pending++;
    renderGrid();
    queue = queue.then(() => purchase(section, missionType, barcode));
    return queue;
}

async function purchase(section, missionType, barcode) {
    try {
        const error = await checkout(section, missionType, barcode);
        setStatus(error ?? `Bought 1 × ${escapeHtml(menu[barcode]?.name ?? barcode)}`, Boolean(error));
        teamData = await getTeamData(section, missionType) ?? teamData;
    } catch (error) {
        console.error('Error purchasing item:', error);
        setStatus('Purchase failed. Check the team balance before trying again.', true);
    } finally {
        pending--;
        renderGrid();
    }
}

function setStatus(html, isError = false) {
    const status = document.getElementById('purchaseError');
    status.innerHTML = html;
    status.className = isError ? 'purchase-status error' : 'purchase-status';
}

document.getElementById('itemSearch').oninput = renderGrid;
