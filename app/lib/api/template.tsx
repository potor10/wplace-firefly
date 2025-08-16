'use server';

import sharp from 'sharp';

import { TILE_SIZE, converter } from '../converter';
import { getWPlacePng } from './wplace';
import { WPLACE_FREE_COLOR_PALETTE } from '../colors';

const PADDING = 10;

type ImageData = {
    data: Buffer<ArrayBufferLike>,
    width: number,
    height: number,
    channels: number
}

async function decodeImage(buffer: ArrayBuffer): Promise<ImageData> {
    const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return {
        data,
        width: info.width,
        height: info.height,
        channels: info.channels
    }
}

async function createEmptyTileBuffer(): Promise<ImageData> {
    return {
        data: await sharp({ 
            create: { width: TILE_SIZE, height: TILE_SIZE, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } }
        }).raw().toBuffer(),
        width: TILE_SIZE,
        height: TILE_SIZE,
        channels: 4
    }
}

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

export type TemplateOffset = {
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

export async function getTemplate(url: string, config: TemplateOffset): Promise<Template> {
    const templateRes = await fetch(url);
    const templateImage = await decodeImage(await templateRes.arrayBuffer());

    const minPx = config.tx * TILE_SIZE + config.px - PADDING;
    const minPy = config.ty * TILE_SIZE + config.py - PADDING;
    const maxPx = config.tx * TILE_SIZE + config.px + templateImage.width + PADDING;
    const maxPy = config.ty * TILE_SIZE + config.py + templateImage.height + PADDING;

    const width = maxPx - minPx;
    const height = maxPy - minPy;

    const templateData = new Uint8Array(width * height * 4);

    for (let y = 0; y < templateImage.height; y++) {
        for (let x = 0; x < templateImage.width; x++) {
            // Idx of the pixel from the template
            let templateIdx = (templateImage.width * y + x) << 2;

            // Idx to store on the templateBackground data (PADDING add)
            let pixelsIdx = (width * (y + PADDING) + (x + PADDING)) << 2;
            
            const freeColor = clampToFreeColorPalette(
                templateImage.data[templateIdx], 
                templateImage.data[templateIdx + 1], 
                templateImage.data[templateIdx + 2]
            );

            // Clamp original PNG Data
            templateImage.data[templateIdx] = freeColor[0];
            templateImage.data[templateIdx + 1] = freeColor[1];
            templateImage.data[templateIdx + 2] = freeColor[2];
            
            // Either 0 opacity or 255
            templateImage.data[templateIdx + 3] = templateImage.data[templateIdx + 3] && 255;

            // Update the data (padded)
            templateData[pixelsIdx] = templateImage.data[templateIdx];
            templateData[pixelsIdx + 1] = templateImage.data[templateIdx + 1];
            templateData[pixelsIdx + 2] = templateImage.data[templateIdx + 2];
            templateData[pixelsIdx + 3] = templateImage.data[templateIdx + 3]; 
        }
    }

    const wplaceData = new Uint8Array(width * height * 4);

    const [minTx, minTy] = converter.pixelsToTile(minPx, minPy);
    const [maxTx, maxTy] = converter.pixelsToTile(maxPx, maxPy);

    // Check each tile that could be part of the illustration
    for (let y = minTy; y <= maxTy; y++) {
        for (let x = minTx; x <= maxTx; x++) {
            const wPlaceRes = await getWPlacePng(x, y);
            const wplaceTile = wPlaceRes ? await decodeImage(wPlaceRes) : await createEmptyTileBuffer();
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

export async function computePixelDiff(template: Template) {
    let totalPixels = 0;
    const pixelDiff = [];
    // Calculate pixel diff (remove padded pixels)
    for (let y = PADDING; y < template.height - PADDING; y++) {
        for (let x = PADDING; x < template.width - PADDING; x++) {
            let templateIdx = (template.width * y + x) << 2;

            const unfilled = template.wplaceData[templateIdx + 3] === 0;

            // Don't compare alpha channel because of opacity inconsistencies
            const equal = template.templateData[templateIdx] === template.wplaceData[templateIdx] &&
                template.templateData[templateIdx + 1] === template.wplaceData[templateIdx + 1] &&
                template.templateData[templateIdx + 2] === template.wplaceData[templateIdx + 2];

            const empty = template.templateData[templateIdx + 3] === 0;

            if (!empty) {
                totalPixels++;
                if (!equal || unfilled) {
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

export async function createOverlayImage(template: Template): Promise<Buffer> {
    const overlayWidth = template.width * BIG_PIXEL_SIZE;
    const overlayHeight = template.height * BIG_PIXEL_SIZE
    const overlayImage = await sharp({
        create: {
            width: overlayWidth,
            height: overlayHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 0 }
        }
    }).raw().toBuffer();

    for (let y = 0; y <= template.height; y++) {
        for (let x = 0; x <= template.width; x++) {
            let templateIdx = (template.width * y + x) << 2;

            const empty = template.templateData[templateIdx + 3] === 0;

            for (let sizeY = 0; sizeY < BIG_PIXEL_SIZE; sizeY++) {
                for (let sizeX = 0; sizeX < BIG_PIXEL_SIZE; sizeX++) {
                    let overlayImageIdx = (overlayWidth * (y * BIG_PIXEL_SIZE + sizeY) + (x * BIG_PIXEL_SIZE + sizeX)) << 2;

                    if (!empty && sizeX >= PIXEL_SPACING && sizeY >= PIXEL_SPACING) {
                        overlayImage[overlayImageIdx] = template.templateData[templateIdx];
                        overlayImage[overlayImageIdx + 1] = template.templateData[templateIdx + 1];
                        overlayImage[overlayImageIdx + 2] = template.templateData[templateIdx + 2];
                        overlayImage[overlayImageIdx + 3] = template.templateData[templateIdx + 3];
                        continue;
                    }

                    overlayImage[overlayImageIdx] = template.wplaceData[templateIdx];
                    overlayImage[overlayImageIdx + 1] = template.wplaceData[templateIdx + 1];
                    overlayImage[overlayImageIdx + 2] = template.wplaceData[templateIdx + 2];
                    overlayImage[overlayImageIdx + 3] = template.wplaceData[templateIdx + 3];
                }
            }
        }
    }

    return await sharp(overlayImage, { 
        raw: { width: overlayWidth, height: overlayHeight, channels: 4 }
    }).webp().toBuffer();
}
