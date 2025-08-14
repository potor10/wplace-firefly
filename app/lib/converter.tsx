
export const TILE_SIZE = 1000;

const EARTH_RADIUS_IN_METERS = 6378137;
const WORLD_COEFFICENT = Math.PI * EARTH_RADIUS_IN_METERS;

export class LatLonPixelConverter {
    private tileSize: number;
    private initialResolution: number;

    // tileSize is subject to change?
    constructor(tileSize = 1000) {
        this.tileSize = tileSize;
        this.initialResolution = 2 * WORLD_COEFFICENT / this.tileSize;
    }

    latLonToMeters(lat, lon) {
        const T = lon / 180 * WORLD_COEFFICENT;
        const z = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180) * WORLD_COEFFICENT / 180;
        return [T, z]
    }

    metersToLatLon(l, _) {
        const T = l / WORLD_COEFFICENT * 180;
        let z = _ / WORLD_COEFFICENT * 180;
        z = 180 / Math.PI * (2 * Math.atan(Math.exp(z * Math.PI / 180)) - Math.PI / 2);
        return [z, T];
    }

    pixelsToMeters(pX, pY, pixelArtZoom) {
        const z = this.resolution(pixelArtZoom);
        const F = pX * z - WORLD_COEFFICENT;
        const C = WORLD_COEFFICENT - pY * z;
        return [F, C];
    }

    pixelsToLatLon(pX, pY, pixelArtZoom) {
        const [z, F] = this.pixelsToMeters(pX, pY, pixelArtZoom);
        return this.metersToLatLon(z, F);
    }

    latLonToPixels(lat, lon, pixelArtZoom) {
        const [z, F] = this.latLonToMeters(lat, lon);
        return this.metersToPixels(z, F, pixelArtZoom);
    }

    latLonToPixelsFloor(lat, lon, pixelArtZoom) {
        const [z, F] = this.latLonToPixels(lat, lon, pixelArtZoom);
        return [Math.floor(z), Math.floor(F)];
    }

    metersToPixels(l, _, pixelArtZoom) {
        const z = this.resolution(pixelArtZoom);
        const pX = (l + WORLD_COEFFICENT) / z;
        const pY = (WORLD_COEFFICENT - _) / z;
        return [pX, pY];
    }

    latLonToTile(lat, lon, pixelArtZoom) {
        const [z, F] = this.latLonToMeters(lat, lon);
        return this.metersToTile(z, F, pixelArtZoom)
    }

    metersToTile(l, _, pixelArtZoom) {
        const [z, F] = this.metersToPixels(l, _, pixelArtZoom);
        return this.pixelsToTile(z, F)
    }

    pixelsToTile(pX, pY) {
        const tX = Math.ceil(pX / this.tileSize) - 1;
        const tY = Math.ceil(pY / this.tileSize) - 1;
        return [tX, tY];
    }

    pixelsToTileLocal(pX, pY) {
        return {
            tile: this.pixelsToTile(pX, pY),
            pixel: [Math.floor(pX) % this.tileSize, Math.floor(pY) % this.tileSize]
        };
    }

    tileBounds(tX, tY, pixelArtZoom) {
        const [minPX, minPY] = this.pixelsToMeters(tX * this.tileSize, tY * this.tileSize, pixelArtZoom);
        const [maxPX, maxPY] = this.pixelsToMeters((tX + 1) * this.tileSize, (tX + 1) * this.tileSize, pixelArtZoom);
        return {
            min: [minPX, minPY],
            max: [maxPX, maxPY]
        };
    }

    tileBoundsLatLon(tX, tY, pixelArtZoom) {
        const bounds = this.tileBounds(tX, tY, pixelArtZoom);
        return {
            min: this.metersToLatLon(bounds.min[0], bounds.min[1]),
            max: this.metersToLatLon(bounds.max[0], bounds.max[1])
        };
    }

    resolution(pixelArtZoom) {
        return this.initialResolution / 2 ** pixelArtZoom
    }

    latLonToTileAndPixel(lat, lon, pixelArtZoom) {
        const [z, F] = this.latLonToMeters(lat, lon);
        const [tX, tY] = this.metersToTile(z, F, pixelArtZoom);
        const [pX, pY] = this.metersToPixels(z, F, pixelArtZoom);
        return {
            tile: [tX, tY],
            pixel: [Math.floor(pX) % this.tileSize, Math.floor(pY) % this.tileSize]
        };
    }

    pixelBounds(pX, pY, pixelArtZoom) {
        return {
            min: this.pixelsToMeters(pX, pY, pixelArtZoom),
            max: this.pixelsToMeters(pX + 1, pY + 1, pixelArtZoom)
        };
    }

    pixelToBoundsLatLon(pX, pY, pixelArtZoom) {
        const bounds = this.pixelBounds(pX, pY, pixelArtZoom);
        const F = .001885;
        
        const C = (bounds.max[0] - bounds.min[0]) * F;
        const o = (bounds.max[1] - bounds.min[1]) * F;
        bounds.min[0] -= C;
        bounds.max[0] -= C;
        bounds.min[1] -= o;
        bounds.max[1] -= o;

        return {
            min: this.metersToLatLon(bounds.min[0], bounds.min[1]),
            max: this.metersToLatLon(bounds.max[0], bounds.max[1])
        };
    }

    latLonToTileBoundsLatLon(lat, lon, pixelArtZoom) {
        const [z, F] = this.latLonToMeters(lat, lon);
        const [tX, tY] = this.metersToTile(z, F, pixelArtZoom);
        return this.tileBoundsLatLon(tX, tY, pixelArtZoom);
    }

    latLonToPixelBoundsLatLon(lat, lon, pixelArtZoom) {
        const [z, F] = this.latLonToMeters(lat, lon);
        const [pX, pY] = this.metersToPixels(z, F, pixelArtZoom);
        return this.pixelToBoundsLatLon(Math.floor(pX), Math.floor(pY), pixelArtZoom);
    }

    // regionSize is On.regionSize (seems to be some config)
    latLonToRegionAndPixel(lat, lon, pixelArtZoom, regionSize = 4) {
        const [F, C] = this.latLonToPixelsFloor(lat, lon, pixelArtZoom);
        const o = this.tileSize * regionSize;
        return {
            region: [Math.floor(F / o), Math.floor(C / o)],
            pixel: [F % o, C % o]
        }
    }
}
