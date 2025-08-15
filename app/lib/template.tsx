'use client';

import { PNG } from 'pngjs/browser';

import { TILE_SIZE, LatLonPixelConverter } from './converter';
import { getWPlacePng } from './api/wplace';

const PADDING = 10;

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

const WPLACE_FREE_COLOR_PALETTE_HEX = [
    '#000000',
    '#3c3c3c',
    '#787878',
    '#d2d2d2',
    '#ffffff',
    '#600018',
    '#ed1c24',
    '#ff7f27',
    '#f6aa09',
    '#f9dd3b',
    '#fffabc',
    '#0eb968',
    '#13e67b',
    '#87ff5e',
    '#0c816e',
    '#10aea6',
    '#13e1be',
    '#28509e',
    '#4093e4',
    '#60f7f2',
    '#6b50f6',
    '#99b1fb',
    '#780c99',
    '#aa38b9',
    '#e09ff9',
    '#cb007a',
    '#ec1f80',
    '#f38da9',
    '#684634',
    '#95682a',
    '#f8b277'
];

export const WPLACE_FREE_COLOR_PALETTE = WPLACE_FREE_COLOR_PALETTE_HEX.map(hex => {
    let hexVal = hex.slice(1);
    return [
        parseInt(hexVal.substring(0, 2), 16),
        parseInt(hexVal.substring(2, 4), 16),
        parseInt(hexVal.substring(4, 6), 16)
    ]
});

function clampToFreeColorPalette(r: number, g: number, b: number) {
    let closest: number;
    let bestMatch: number[];

    WPLACE_FREE_COLOR_PALETTE.forEach(color => {
        const currentDistance = Math.sqrt(Math.pow(color[0] - r, 2) + Math.pow(color[1] - g, 2) + Math.pow(color[2] - b, 2));
        if (closest === undefined || currentDistance < closest) {
            bestMatch = color;
            closest = currentDistance;
        }
    });

    return bestMatch;
}

export type Config = {
    px: number,
    py: number,
    tx: number,
    ty: number
}

export type Template = {
    templateData: Uint8Array,
    wplaceData: Uint8Array,
    width: number,
    height: number,
    offsetPx: number,
    offsetPy: number
}

export async function getTemplate(): Promise<Template> {
    const templateRes = await fetch('/templates/box/template.png');
    const templatePng = await decodeToPng(await templateRes.arrayBuffer());

    const configRes = await fetch('/templates/box/config.json');
    const config = await configRes.json();

    const minPx = config.tx * TILE_SIZE + config.px - PADDING;
    const minPy = config.ty * TILE_SIZE + config.py - PADDING;
    const maxPx = config.tx * TILE_SIZE + config.px + templatePng.width + PADDING;
    const maxPy = config.ty * TILE_SIZE + config.py + templatePng.height + PADDING;

    const width = maxPx - minPx;
    const height = maxPy - minPy;

    const templateData = new Uint8Array(width * height * 4);

    for (let y = 0; y < templatePng.height; y++) {
        for (let x = 0; x < templatePng.width; x++) {
            // Idx of the pixel from the template
            let templateIdx = (templatePng.width * y + x) << 2;

            // Idx to store on the templateBackground data (PADDING add)
            let pixelsIdx = (width * (y + PADDING) + (x + PADDING)) << 2;
            
            const freeColor = clampToFreeColorPalette(
                templatePng.data[templateIdx], 
                templatePng.data[templateIdx + 1], 
                templatePng.data[templateIdx + 2]
            );

            templateData[pixelsIdx] = freeColor[0];
            templateData[pixelsIdx + 1] = freeColor[1];
            templateData[pixelsIdx + 2] = freeColor[2];
            // 0 or 255
            templateData[pixelsIdx + 3] = templatePng.data[templateIdx + 3] && 255; 
        }
    }

    const wplaceData = new Uint8Array(width * height * 4);

    const [minTx, minTy] = converter.pixelsToTile(minPx, minPy);
    const [maxTx, maxTy] = converter.pixelsToTile(maxPx, maxPy);

    // Check each tile that could be part of the illustration
    for (let y = minTy; y <= maxTy; y++) {
        for (let x = minTx; x <= maxTx; x++) {
            const wplaceTile = await decodeToPng(await getWPlacePng(x, y));
            const tileMinPx = (x * TILE_SIZE < minPx) ? minPx : x * TILE_SIZE;
            const tileMinPy = (y * TILE_SIZE < minPy) ? minPy : y * TILE_SIZE;
            const tileMaxPx = ((x + 1) * TILE_SIZE > maxPx) ? maxPx : (x + 1) * TILE_SIZE;
            const tileMaxPy = ((y + 1) * TILE_SIZE > maxPy) ? maxPy : (y + 1) * TILE_SIZE;

            for (let yTile = tileMinPy; yTile < tileMaxPy; yTile++) {
                for (let xTile = tileMinPx; xTile < tileMaxPx; xTile++) {
                    // Idx of the pixel from the tile from WPlace
                    let tileIdx = (wplaceTile.width * (yTile - (y * TILE_SIZE)) + (xTile - (x * TILE_SIZE))) << 2;

                    // Idx to store on the wplaceImage data (PADDING add)
                    let pixelsIdx = (width * (yTile - minPy) + (xTile - minPx)) << 2;
                    wplaceData[pixelsIdx] = wplaceTile.data[tileIdx];
                    wplaceData[pixelsIdx + 1] = wplaceTile.data[tileIdx + 1];
                    wplaceData[pixelsIdx + 2] = wplaceTile.data[tileIdx + 2];
                    wplaceData[pixelsIdx + 3] = wplaceTile.data[tileIdx + 3];
                }
            }
        }
    }

    return {
        templateData,
        wplaceData,
        width,
        height,
        offsetPx: minPx,
        offsetPy: minPy
    };
}

export type PixelData = {
    pixelDiff: number[][]
    totalPixels: number
}

export function computePixelDiff(template: Template) {
    let totalPixels = 0;
    const pixelDiff = [];
    // Calculate pixel diff (remove padded pixels)
    for (let y = PADDING; y < template.height - PADDING; y++) {
        for (let x = PADDING; x < template.width - PADDING; x++) {
            let templateIdx = (template.width * y + x) << 2;

            // Don't compare alpha channel because of opacity inconsistencies
            const equal = template.templateData[templateIdx] === template.wplaceData[templateIdx] &&
                template.templateData[templateIdx + 1] === template.wplaceData[templateIdx + 1] &&
                template.templateData[templateIdx + 2] === template.wplaceData[templateIdx + 2];

            const empty = template.templateData[templateIdx + 3] === 0;

            if (!empty) {
                totalPixels++;
                if (!equal) {
                    // Store true X, Y and RGBA data
                    pixelDiff.push([template.offsetPx + x, template.offsetPy + y, [
                        template.templateData[templateIdx],
                        template.templateData[templateIdx + 1],
                        template.templateData[templateIdx + 2],
                        template.templateData[templateIdx + 3]
                    ]]);
                }
            }
        }
    }
    return { pixelDiff, totalPixels };
}

const BIG_PIXEL_SIZE = 6;
const SMALL_PIXEL_SIZE = 3;
const PIXEL_SPACING = BIG_PIXEL_SIZE - SMALL_PIXEL_SIZE

export function createOverlayImage(template: Template): Buffer {
    const overlayImage = new PNG({
        width: template.width * BIG_PIXEL_SIZE,
        height: template.height * BIG_PIXEL_SIZE,
        colortype: 6
    });

    for (let y = 0; y <= template.height; y++) {
        for (let x = 0; x <= template.width; x++) {
            let templateIdx = (template.width * y + x) << 2;

            const empty = template.templateData[templateIdx + 3] === 0;

            for (let sizeY = 0; sizeY < BIG_PIXEL_SIZE; sizeY++) {
                for (let sizeX = 0; sizeX < BIG_PIXEL_SIZE; sizeX++) {
                    let overlayImageIdx = (overlayImage.width * (y * BIG_PIXEL_SIZE + sizeY) + (x * BIG_PIXEL_SIZE + sizeX)) << 2;

                    if (!empty && sizeX >= PIXEL_SPACING && sizeY >= PIXEL_SPACING) {
                        overlayImage.data[overlayImageIdx] = template.templateData[templateIdx];
                        overlayImage.data[overlayImageIdx + 1] = template.templateData[templateIdx + 1];
                        overlayImage.data[overlayImageIdx + 2] = template.templateData[templateIdx + 2];
                        overlayImage.data[overlayImageIdx + 3] = template.templateData[templateIdx + 3];
                        continue;
                    }

                    overlayImage.data[overlayImageIdx] = template.wplaceData[templateIdx];
                    overlayImage.data[overlayImageIdx + 1] = template.wplaceData[templateIdx + 1];
                    overlayImage.data[overlayImageIdx + 2] = template.wplaceData[templateIdx + 2];
                    overlayImage.data[overlayImageIdx + 3] = template.wplaceData[templateIdx + 3];
                }
            }
        }
    }

    return PNG.sync.write(overlayImage);
}