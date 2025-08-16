
export const TILE_SIZE = 1000;

const EARTH_RADIUS_IN_METERS = 6378137;
const WORLD_COEFFICENT = Math.PI * EARTH_RADIUS_IN_METERS;
const PIXEL_CENTER_COEFFICIENT = 0.5;

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

    pixelsToMeters(px, py, pixelArtZoom) {
        const z = this.resolution(pixelArtZoom);
        const F = px * z - WORLD_COEFFICENT;
        const C = WORLD_COEFFICENT - py * z;
        return [F, C];
    }

    pixelsToLatLon(px, py, pixelArtZoom) {
        const [z, F] = this.pixelsToMeters(px + PIXEL_CENTER_COEFFICIENT, py + PIXEL_CENTER_COEFFICIENT, pixelArtZoom);
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
        const px = (l + WORLD_COEFFICENT) / z;
        const py = (WORLD_COEFFICENT - _) / z;
        return [px, py];
    }

    latLonToTile(lat, lon, pixelArtZoom) {
        const [z, F] = this.latLonToMeters(lat, lon);
        return this.metersToTile(z, F, pixelArtZoom)
    }

    metersToTile(l, _, pixelArtZoom) {
        const [z, F] = this.metersToPixels(l, _, pixelArtZoom);
        return this.pixelsToTile(z, F)
    }

    pixelsToTile(px, py) {
        const tx = Math.ceil(px / this.tileSize) - 1;
        const ty = Math.ceil(py / this.tileSize) - 1;
        return [tx, ty];
    }

    pixelsToTileLocal(px, py) {
        return {
            tile: this.pixelsToTile(px, py),
            pixel: [Math.floor(px) % this.tileSize, Math.floor(py) % this.tileSize]
        };
    }

    tileBounds(tx, ty, pixelArtZoom) {
        const [minPx, minPy] = this.pixelsToMeters(tx * this.tileSize, ty * this.tileSize, pixelArtZoom);
        const [maxPx, maxPy] = this.pixelsToMeters((tx + 1) * this.tileSize, (tx + 1) * this.tileSize, pixelArtZoom);
        return {
            min: [minPx, minPy],
            max: [maxPx, maxPy]
        };
    }

    tileBoundsLatLon(tx, ty, pixelArtZoom) {
        const bounds = this.tileBounds(tx, ty, pixelArtZoom);
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
        const [tx, ty] = this.metersToTile(z, F, pixelArtZoom);
        const [px, py] = this.metersToPixels(z, F, pixelArtZoom);
        return {
            tile: [tx, ty],
            pixel: [Math.floor(px) % this.tileSize, Math.floor(py) % this.tileSize]
        };
    }

    pixelBounds(px, py, pixelArtZoom) {
        return {
            min: this.pixelsToMeters(px, py, pixelArtZoom),
            max: this.pixelsToMeters(px + 1, py + 1, pixelArtZoom)
        };
    }

    pixelToBoundsLatLon(px, py, pixelArtZoom) {
        const bounds = this.pixelBounds(px, py, pixelArtZoom);
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
        const [tx, ty] = this.metersToTile(z, F, pixelArtZoom);
        return this.tileBoundsLatLon(tx, ty, pixelArtZoom);
    }

    latLonToPixelBoundsLatLon(lat, lon, pixelArtZoom) {
        const [z, F] = this.latLonToMeters(lat, lon);
        const [px, py] = this.metersToPixels(z, F, pixelArtZoom);
        return this.pixelToBoundsLatLon(Math.floor(px), Math.floor(py), pixelArtZoom);
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

export const converter = new LatLonPixelConverter(TILE_SIZE);

