const shellIcon = new URL('./assets/umd_shell.png', import.meta.url).href;

// Sheet materials are paid for separately in dollars, never from a Shells wallet.
export function isDollarItem(item) {
    return /\b(?:wood|acrylic)\b/i.test(item.name) && /\bsheets?\b/i.test(item.name);
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
