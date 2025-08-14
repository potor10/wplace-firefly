'use client'

import { useState, useMemo, useRef, useCallback } from 'react';

import { TILE_SIZE } from '../lib/converter';
import { getTemplate, converter } from '../lib/template';

type PaintTarget = {
    lat: number,
    lon: number,
    color: number[],
    x: number,
    y: number
}

export function DownloadPictureButton() {
    const [pngData, setPngData] = useState(Buffer.from(''));
    const [pixelCount, setPixelCount] = useState(0);
    const [totalPixelCount, setTotalPixelCount] = useState(0);
    const [unpaintedPixels, setUnpaintedPixels] = useState([]);
    const [target, setTarget] = useState<PaintTarget | undefined>(undefined);

    const setTemplateState = () => {
        getTemplate().then(res => {
            setPngData(res.overlay);
            setTotalPixelCount(res.tracking.length);
            let correctPixel = 0;
            let unpaintedPixels = [];
            for (let i = 0; i < res.tracking.length; i++) {
                if (res.tracking[i] === 1) {
                    correctPixel++;
                    continue;
                }
                const templateIdx = i << 2;
                unpaintedPixels.push([
                    res.config.tx * TILE_SIZE + res.config.px + (i % res.template.width),
                    res.config.ty * TILE_SIZE + res.config.py + Math.floor(i / res.template.width),
                    [
                        res.template.data[templateIdx],
                        res.template.data[templateIdx + 1],
                        res.template.data[templateIdx + 2],
                        res.template.data[templateIdx + 3]
                    ]
                ]);
            }
            console.log(unpaintedPixels);
            setPixelCount(correctPixel);
            setUnpaintedPixels(unpaintedPixels);
        });
    }

    useMemo(() => setTemplateState(), []);

    const getRandomUnpainted = () => {
        const unpaintedPixel = unpaintedPixels[Math.floor(Math.random() * unpaintedPixels.length)];
        let [lat, lon] = converter.pixelsToLatLon(unpaintedPixel[0], unpaintedPixel[1], 11);

        // Small padding to center the pixel
        lat -= 0.000028;
        lon += 0.000089;
        const regionPixel = converter.latLonToRegionAndPixel(lat, lon, 11);
        setTarget({ lat, lon, color: unpaintedPixel[2], x: regionPixel.pixel[0], y: regionPixel.pixel[1] })
    }

    const paintDetails = () => {
        if (target) {
            return (
                <div>
                    <p>Pixel Coordinate: [{target.x}, {target.y}]</p>
                    <button 
                        style={{ backgroundColor: `rgba(${target.color[0]}, ${target.color[1]}, ${target.color[2]}, ${target.color[3]})` }}
                        onClick={() => window.open(`https://wplace.live/?lat=${target.lat}&lng=${target.lon}&zoom=22`, '_blank').focus()}
                    >Go To Pixel!</button>
                </div>
            )   
        }
    }

    return (
        <div>
            <img src={`data:image/jpg;base64,${btoa(pngData.reduce((str, i) => str += String.fromCharCode.apply(null, [i]), ''))}`} />
            <p>{pixelCount}/{totalPixelCount} Pixels Painted</p>
            <button onClick={() => setTemplateState()}>Refresh</button>
            <button onClick={() => getRandomUnpainted()}>Paint!</button>
            {paintDetails()}
        </div>
    )
}


