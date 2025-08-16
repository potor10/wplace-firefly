'use client';

import { useState, useEffect } from 'react';
import { Loader2Icon } from "lucide-react";
import { 
    IconRefresh,
    IconClick,
    IconSend,
    IconCheck
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

import { converter } from '../lib/converter';
import { WPLACE_FREE_COLOR_PALETTE } from '../lib/colors';
import { 
    TemplateOffset,
    PixelDiff,
    getTemplate, 
    computePixelDiff, 
    createOverlayImage
} from '../lib/api/template';

type PaintTarget = {
    lat: number,
    lon: number,
    color: number[],
    x: number,
    y: number
}

function CardColor({ 
    unpaintedPixels, 
    color, 
    setColor 
}: { 
    unpaintedPixels: PixelDiff,
    color: number[],
    setColor: (color: number[]) => void
}) {
    const colorCards = [];
    WPLACE_FREE_COLOR_PALETTE.forEach(paletteColor => {
        const colorKey = paletteColor.join('_');
        if (!(colorKey in unpaintedPixels)) {
            return;
        }
        const match = (color) ? color[0] == paletteColor[0] && color[1] == paletteColor[1] && color[2] == paletteColor[2] : false;
        let light = false;
        if (match && paletteColor[0] < 127.5 && paletteColor[1] < 127.5 && paletteColor[2] < 127.5) {
            light = true;
        }
        colorCards.push(<Card 
            onClick={() => setColor(paletteColor)}
            className="m-2"
            key={colorKey} 
            style={{ 
                position: "relative",
                backgroundColor: `rgba(${paletteColor[0]}, ${paletteColor[1]}, ${paletteColor[2]}, ${match ? 1 : 0.5})`,
            }}
        ><CardContent>
            {(match) ? <IconCheck color={(light) ? "white" : "black"} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /> : ''}
        </CardContent></Card>)
    })

    return (
        <div className="grid grid-cols-4 px-4 @xl/main:grid-cols-8">
            {colorCards}
        </div>
    )
}

export function WPlaceCanvas({ 
    templateOffset, 
    templateName,
    templateUrl 
}: { 
    templateOffset: TemplateOffset, 
    templateName: string,
    templateUrl: string
} ) {
    const [loadingTemplate, setLoadingTemplate] = useState(true);
    const [overlayImage, setOverlayImage] = useState<Buffer | undefined>();
    const [pixelCount, setPixelCount] = useState([0, 0]);
    const [unpaintedPixels, setUnpaintedPixels] = useState<PixelDiff>({});
    const [color, setColor] = useState<number[] | undefined>();
    const [target, setTarget] = useState<PaintTarget | undefined>(undefined);

    const setTemplateState = () => {
        setLoadingTemplate(true);
        getTemplate((new URL(templateUrl, window.location.origin)).toString(), templateOffset).then(async template => {
            Promise.all([
                new Promise((resolve, _) => {
                    computePixelDiff(template).then(pixelData => {
                        Promise.all([
                            setPixelCount([pixelData.totalPixels - pixelData.diffPixels, pixelData.totalPixels]),
                            setUnpaintedPixels(pixelData.pixelDiff),
                        ]).then(resolve);
                    });
                }),
                new Promise((resolve, _) => (createOverlayImage(template).then(overlay => setOverlayImage(overlay)).then(resolve)))
            ]).then(() => setLoadingTemplate(false));
        });
    }

    useEffect(() => {
        setOverlayImage(undefined);
        setPixelCount([0, 0]);
        setUnpaintedPixels({});
        setColor(undefined);
        setTarget(undefined);
        setTemplateState();
    }, [templateOffset, templateName, templateUrl]);

    const getRandomUnpainted = () => {
        const colorKey = color.join('_');
        const unpaintedPixel = unpaintedPixels[colorKey].pop();
        let [lat, lon] = converter.pixelsToLatLon(unpaintedPixel.px, unpaintedPixel.py, 11);
        const regionPixel = converter.latLonToRegionAndPixel(lat, lon, 11);
        window.open(`https://wplace.live/?lat=${lat}&lng=${lon}&zoom=22`, '_blank').focus();
        setTarget({ lat, lon, color: unpaintedPixel[2], x: regionPixel.pixel[0], y: regionPixel.pixel[1] });

        // Remove this pixel from the unpainted pixels so it doesn't show up again
        if (!unpaintedPixels[colorKey].length) {
            delete unpaintedPixels[colorKey];
            setColor(undefined);
        }
        setUnpaintedPixels(unpaintedPixels);
    }

    return (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-1 @5xl/main:grid-cols-2">
            <Card className="shadow-xs">
                <CardHeader>
                    <CardTitle>{templateName} Template</CardTitle>
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
                        <CardDescription>Visit a random unpainted pixel!</CardDescription>
                        {
                            color ? <CardAction>
                                <Button
                                    onClick={getRandomUnpainted}
                                ><IconSend />Visit Pixel</Button>
                            </CardAction> : ''
                        }
                    </CardHeader>
                </Card>
                <Card className="shadow-xs mt-4">
                    <CardHeader>
                        <CardTitle>Color Picker</CardTitle>
                        <CardDescription>{ color ? `rgb(${color[0]}, ${color[1]}, ${color[2]})` : 'Select a color!' }</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CardColor unpaintedPixels={unpaintedPixels} color={color} setColor={setColor} />
                    </CardContent>
                </Card>
            </span>
        </div>
    )
}


