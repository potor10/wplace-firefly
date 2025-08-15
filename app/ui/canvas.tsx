'use client'

import { useState, useMemo, useRef, useCallback } from 'react';
import { Loader2Icon } from "lucide-react";
import { 
    IconRefresh,
    IconClick,
    IconSend
} from "@tabler/icons-react";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { Template, getTemplate, computePixelDiff, createOverlayImage, converter } from '../lib/template';

type PaintTarget = {
    lat: number,
    lon: number,
    color: number[],
    x: number,
    y: number
}

export function WPlaceCanvas() {
    const [loadingTemplate, setLoadingTemplate] = useState(true);
    const [template, setTemplate] = useState<Template | undefined>();
    const [overlayImage, setOverlayImage] = useState<Buffer | undefined>();
    const [pixelCount, setPixelCount] = useState([0, 0]);
    const [unpaintedPixels, setUnpaintedPixels] = useState([]);
    const [target, setTarget] = useState<PaintTarget | undefined>(undefined);

    const setTemplateState = () => {
        setLoadingTemplate(true);
        getTemplate().then(res => {
            setTemplate(res);
            const { pixelDiff, totalPixels } = computePixelDiff(res);
            setPixelCount([totalPixels - pixelDiff.length, totalPixels]);
            setUnpaintedPixels(pixelDiff);
            setOverlayImage(createOverlayImage(res));
        }).then(() => setLoadingTemplate(false));
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

    return (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-1 @5xl/main:grid-cols-2">
            <Card className="shadow-xs">
                <CardHeader>
                    <CardTitle>Boxfly Template</CardTitle>
                    <CardDescription>
                        <Progress value={(pixelCount[0] / pixelCount[1]) * 100} />
                        {pixelCount[0]}/{pixelCount[1]} Pixels Painted
                    </CardDescription>
                    <CardAction>
                        <span className="px-1">
                            { 
                                loadingTemplate ? 
                                    <Button variant="ghost" disabled><Loader2Icon className="animate-spin" /></Button> : 
                                    <Button variant="ghost" onClick={() => setTemplateState()}><IconRefresh /></Button>
                            }
                        </span>
                        <span className="px-1">
                            <Button onClick={() => getRandomUnpainted()}><IconClick />Get Pixel</Button>
                        </span>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    { 
                        overlayImage ? 
                            <img src={`data:image/jpg;base64,${btoa(overlayImage.reduce((str, i) => str += String.fromCharCode.apply(null, [i]), ''))}`} /> :
                            <Loader2Icon className="animate-spin" /> 
                    }
                </CardContent>
            </Card>
            <span>
                <Card className="from-primary/5 to-card bg-card bg-gradient-to-t shadow-xs">
                    <CardHeader>
                        <CardTitle>{ target ? `Pixel (${target.x}, ${target.y})` : "Pixel Details" }</CardTitle>
                        <CardDescription>Click "Get Pixel" to get a random unpainted pixel!</CardDescription>
                        {
                            target ? <CardAction>
                                <Button
                                    onClick={() => window.open(`https://wplace.live/?lat=${target.lat}&lng=${target.lon}&zoom=22`, '_blank').focus()}
                                ><IconSend />Visit Pixel</Button>
                            </CardAction> : ''
                        }
                    </CardHeader>
                </Card>
                {
                    target ? <Card className="shadow-xs mt-4">
                        <CardHeader>
                            <CardTitle>Pixel Color</CardTitle>
                            <CardDescription>rgba({target.color[0]}, {target.color[1]}, {target.color[2]}, {target.color[3]})</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div style={{ height: '50px', backgroundColor: `rgba(${target.color[0]}, ${target.color[1]}, ${target.color[2]}, ${target.color[3]})`}}/>
                        </CardContent>
                    </Card> : ''
                }
            </span>
        </div>
    )
}


