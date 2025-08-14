'use client';

import { PNG } from 'pngjs/browser';

import { TILE_SIZE, LatLonPixelConverter } from './converter';
import { getWPlacePng } from './api/wplace';

const PADDING = 10;
const BIG_PIXEL_SIZE = 6;
const SMALL_PIXEL_SIZE = 4;
// BIG_PIXEL_SIZE - SMALL_PIXEL_SIZE / 2 MUST NOT BE DECIMAL

export const converter = new LatLonPixelConverter(TILE_SIZE);

async function decodeToPng(buffer: ArrayBuffer): PNG {
    return await new Promise(async (resolve, reject) =>
        new PNG({
            colortype: 6
        }).parse(buffer, (err, data) =>
            err ? reject(err) : resolve(data)
        )
    );
}

export type Config = {
    px: number,
    py: number,
    tx: number,
    ty: number
}

export type Template = {
    template: PNG,
    overlay: Buffer<ArrayBuffer>,
    tracking: Uint8Array,
    config: Config
}

export async function getTemplate(): Promise<Template> {
    const templateRes = await fetch('/templates/box/template.png');
    const template = await decodeToPng(await templateRes.arrayBuffer());
    const templateTracking = new Uint8Array(template.height * template.width);

    const configRes = await fetch('/templates/box/config.json');
    const config = await configRes.json();

    const minPX = config.tx * TILE_SIZE + config.px - PADDING;
    const minPY = config.ty * TILE_SIZE + config.py - PADDING;
    const maxPX = config.tx * TILE_SIZE + config.px + template.width + PADDING;
    const maxPY = config.ty * TILE_SIZE + config.py + template.height + PADDING;

    const pixels = new PNG({
        width: (maxPX - minPX) * BIG_PIXEL_SIZE,
        height: (maxPY - minPY) * BIG_PIXEL_SIZE,
        colortype: 6
    });

    const [minTX, minTY] = converter.pixelsToTile(minPX, minPY);
    const [maxTX, maxTY] = converter.pixelsToTile(maxPX, maxPY);

    for (let y = minTY; y <= maxTY; y++) {
        for (let x = minTX; x <= maxTX; x++) {
            const wplaceTile = await decodeToPng(await getWPlacePng(x, y));
            const tileMinPX = (x * TILE_SIZE < minPX) ? minPX : x * TILE_SIZE;
            const tileMinPY = (y * TILE_SIZE < minPY) ? minPY : y * TILE_SIZE;
            const tileMaxPX = ((x + 1) * TILE_SIZE > maxPX) ? maxPX :(x + 1) * TILE_SIZE;
            const tileMaxPY = ((y + 1) * TILE_SIZE > maxPY) ? maxPY : (y + 1) * TILE_SIZE;

            for (let yTile = tileMinPY; yTile < tileMaxPY; yTile++) {
                for (let xTile = tileMinPX; xTile < tileMaxPX; xTile++) {
                    let tileIdx = (wplaceTile.width * (yTile - (y * TILE_SIZE)) + (xTile - (x * TILE_SIZE))) << 2;
                    for (let sizeY = 0; sizeY < BIG_PIXEL_SIZE; sizeY++) {
                        for (let sizeX = 0; sizeX < BIG_PIXEL_SIZE; sizeX++) {
                            let pixelsIdx = (pixels.width * ((yTile - minPY) * BIG_PIXEL_SIZE + sizeY) + ((xTile - minPX) * BIG_PIXEL_SIZE + sizeX)) << 2;

                            pixels.data[pixelsIdx] = wplaceTile.data[tileIdx];
                            pixels.data[pixelsIdx + 1] = wplaceTile.data[tileIdx + 1];
                            pixels.data[pixelsIdx + 2] = wplaceTile.data[tileIdx + 2];
                            pixels.data[pixelsIdx + 3] = wplaceTile.data[tileIdx + 3];

                            // TODO: catch discrepancies here and push to array
                        }
                    }
                }
            }
        }
    }


    for (let y = 0; y < template.height; y++) {
        for (let x = 0; x < template.width; x++) {
            let templateIdx = (template.width * y + x) << 2;

            let samplePixelsIdx = (pixels.width * ((y + PADDING) * BIG_PIXEL_SIZE) + ((x + PADDING) * BIG_PIXEL_SIZE)) << 2;
            const correctColor = pixels.data[samplePixelsIdx] === template.data[templateIdx] &&
                pixels.data[samplePixelsIdx + 1] === template.data[templateIdx + 1] && 
                pixels.data[samplePixelsIdx + 2] === template.data[templateIdx + 2] &&
                pixels.data[samplePixelsIdx + 3] === template.data[templateIdx + 3];
            if (correctColor) {
                templateTracking[template.width * y + x] = 1;
            }

            let skipY = (BIG_PIXEL_SIZE - SMALL_PIXEL_SIZE) / 2;
            for (let sizeY = 0; sizeY < BIG_PIXEL_SIZE; sizeY++) {
                skipY++;
                skipY %= BIG_PIXEL_SIZE;
                if (skipY <= (BIG_PIXEL_SIZE - SMALL_PIXEL_SIZE)) {
                    continue;
                }
                let skipX = (BIG_PIXEL_SIZE - SMALL_PIXEL_SIZE) / 2;
                for (let sizeX = 0; sizeX < BIG_PIXEL_SIZE; sizeX++) {
                    skipX++;
                    skipX %= BIG_PIXEL_SIZE;
                    if (skipX <= (BIG_PIXEL_SIZE - SMALL_PIXEL_SIZE)) {
                        continue;
                    }
                    let pixelsIdx = (pixels.width * ((y + PADDING) * BIG_PIXEL_SIZE + sizeY) + ((x + PADDING) * BIG_PIXEL_SIZE + sizeX)) << 2;
                    pixels.data[pixelsIdx] = template.data[templateIdx];
                    pixels.data[pixelsIdx + 1] = template.data[templateIdx + 1];
                    pixels.data[pixelsIdx + 2] = template.data[templateIdx + 2];
                    pixels.data[pixelsIdx + 3] = template.data[templateIdx + 3];
                }
            }
        }
    }

    return {
        template: template,
        overlay: PNG.sync.write(pixels),
        tracking: templateTracking,
        config: config
    };
}