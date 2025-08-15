'use server'

export async function getWPlacePng(tx: number, ty: number) {
    const res = await fetch(`https://backend.wplace.live/files/s0/tiles/${tx}/${ty}.png`, {
        method: 'GET',
        headers: {
            'Accept': 'image/webp,*/*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Origin': 'https://wplace.live',
            'Referer': 'https://wplace.live/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        }
    });

    const data = await res.arrayBuffer();
    return data;
}
