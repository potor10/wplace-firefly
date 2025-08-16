
export const WPLACE_PAID_COLOR_PALETTE_HEX_NAMES = [
    // TODO
];

export const WPLACE_FREE_COLOR_PALETTE_HEX_NAMES = [
    ['#000000', 'Black'],
    ['#3c3c3c', 'Dark Gray'],
    ['#787878', 'Gray'],
    ['#d2d2d2', 'Light Gray'],
    ['#ffffff', 'White'],
    ['#600018', 'Deep Red'],
    ['#ed1c24', 'Red'],
    ['#ff7f27', 'Orange'],
    ['#f6aa09', 'Gold'],
    ['#f9dd3b', 'Yellow'],
    ['#fffabc', 'Light Yellow'],
    ['#0eb968', 'Dark Green'],
    ['#13e67b', 'Green'],
    ['#87ff5e', 'Light Green'],
    ['#0c816e', 'Dark Teal'],
    ['#10aea6', 'Teal'],
    ['#13e1be', 'Light Teal'],
    ['#28509e', 'Dark Blue'],
    ['#4093e4', 'Blue'],
    ['#60f7f2', 'Cyan'],
    ['#6b50f6', 'Indigo'],
    ['#99b1fb', 'Light Indigo'],
    ['#780c99', 'Dark Purple'],
    ['#aa38b9', 'Purple'],
    ['#e09ff9', 'Light Purple'],
    ['#cb007a', 'Dark Pink'],
    ['#ec1f80', 'Pink'],
    ['#f38da9', 'Light Pink'],
    ['#684634', 'Dark Brown'],
    ['#95682a', 'Brown'],
    ['#f8b277', 'Beige']
];

export const WPLACE_FREE_COLOR_PALETTE = WPLACE_FREE_COLOR_PALETTE_HEX_NAMES.map(val => {
    let hexVal = val[0].slice(1);
    return [
        parseInt(hexVal.substring(0, 2), 16),
        parseInt(hexVal.substring(2, 4), 16),
        parseInt(hexVal.substring(4, 6), 16)
    ]
});
