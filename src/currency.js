const shellIcon = new URL('./assets/umd_shell.png', import.meta.url).href;

// Cash purchases never debit or credit a Shells wallet.
export function isDollarItem(item) {
    return (/\bwood\b/i.test(item.name) && /\bsheets?\b/i.test(item.name))
        || /^Arduino Uno R4 WiFi\*?$/i.test(item.name.trim());
}

export function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

export function shells(amount) {
    return `<span class="shell-amount"><img class="shell-icon" src="${shellIcon}" alt="Shells"> ${escapeHtml(amount ?? 'N/A')}</span>`;
}

export function itemPrice(item) {
    return isDollarItem(item) ? `$${escapeHtml(item.price)}` : shells(item.price);
}
