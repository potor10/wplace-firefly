import { useState } from "react";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { CUSTOM_STR, TemplateConfig, TemplateCustom } from "../header";

export const TEMPLATE_QUERY_CUSTOM_URL = 'customTemplateUrl';
export const TEMPLATE_QUERY_CUSTOM_TX = 'tileX';
export const TEMPLATE_QUERY_CUSTOM_TY = 'tileY';
export const TEMPLATE_QUERY_CUSTOM_PX = 'pixelX';
export const TEMPLATE_QUERY_CUSTOM_PY = 'pixelY';

export function CustomDialog({ 
    open, 
    setOpen,
    setTemplateSelect
}: { 
    open: boolean, 
    setOpen: (open: boolean) => void,
    setTemplateSelect: (select: TemplateCustom) => void
}) {
    const [customConfig, setCustomConfig] = useState<Omit<TemplateConfig, 'name'>>({
        url: '',
        offset: {
            px: 0,
            py: 0,
            tx: 0,
            ty: 0
        }
    });

    const handleCustomTemplate = () => {
        const params = new URLSearchParams();
        params.set(TEMPLATE_QUERY_CUSTOM_URL, customConfig.url);
        params.set(TEMPLATE_QUERY_CUSTOM_TX, `${customConfig.offset.tx}`);
        params.set(TEMPLATE_QUERY_CUSTOM_TY, `${customConfig.offset.ty}`);
        params.set(TEMPLATE_QUERY_CUSTOM_PX, `${customConfig.offset.px}`);
        params.set(TEMPLATE_QUERY_CUSTOM_PY, `${customConfig.offset.py}`);
        window.history.pushState(null, '', `?${params.toString()}`);
        setTemplateSelect({
            name: CUSTOM_STR,
            isCustom: true,
            ...customConfig
        })
        setOpen(false);
    }

    const updateOffset = (key: string, value: string) => {
        let valInt = parseInt(value);
        if (!valInt) {
            valInt = 0;
        }
        setCustomConfig({
            ...customConfig,
            offset: {
                ...customConfig.offset,
                [key]: valInt
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Custom Template</DialogTitle>
                    <DialogDescription>
                        Use a custom template source.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="template-url">Url (Supports PNG, WebP, JPEG)</Label>
                        <Input id="template-url" name="template-url" value={customConfig.url} onChange={(event) => setCustomConfig({
                            ...customConfig,
                            url: event.target.value
                        })}/>
                    </div>
                    <div className="grid gap-3 grid-cols-2">
                        <div className="grid gap-3 grid-cols-1">
                            <Label htmlFor="tile-x">Tile X</Label>
                            <Input id="tile-x" name="tile-x" value={customConfig.offset.tx} onChange={(event) => updateOffset('tx', event.target.value)}/>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="tile-y">Tile Y</Label>
                            <Input id="tile-y" name="tile-y" value={customConfig.offset.ty} onChange={(event) => updateOffset('ty', event.target.value)}/>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="pixel-x">Pixel X</Label>
                            <Input id="pixel-x" name="pixel-x" value={customConfig.offset.px} onChange={(event) => updateOffset('px', event.target.value)}/>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="pixel-y">Pixel Y</Label>
                            <Input id="pixel-y" name="pixel-y" value={customConfig.offset.py} onChange={(event) => updateOffset('py', event.target.value)}/>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleCustomTemplate}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}