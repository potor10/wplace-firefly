
const res = await fetch('https://backend.wplace.live/files/s0/tiles/366/441.png', {
    method: 'GET',
    headers: {
        'Accept': 'image/webp,*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Origin': 'https://wplace.live',
        'Referer': 'https://wplace.live/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    }
});

console.log(await res.text());

//https://backend.wplace.live/files/s0/tiles/366/441.png