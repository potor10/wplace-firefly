import { IconHelpCircle } from "@tabler/icons-react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import Config from 'config.json';

import { TemplateOffset } from "../lib/api/template";
import { useState } from "react";
import { 
    TEMPLATE_QUERY_CUSTOM_URL,
    TEMPLATE_QUERY_CUSTOM_TX,
    TEMPLATE_QUERY_CUSTOM_TY,
    TEMPLATE_QUERY_CUSTOM_PX,
    TEMPLATE_QUERY_CUSTOM_PY,
    CustomDialog 
} from "./dialog/custom";
import { HelpDialog } from "./dialog/help";

export const CUSTOM_STR = 'Custom';
export const TEMPLATE_QUERY_NAME = 'templateName';

export type TemplateConfig = {
    name: string
    url: string,
    offset: TemplateOffset
}

export type TemplateSaved = TemplateConfig & {
    isCustom: false
}

export type TemplateCustom = TemplateConfig & {
    isCustom: true
}

export type TemplateSelect = TemplateSaved | TemplateCustom;

export function setTemplateSelectFromQueryParams(params: URLSearchParams): TemplateSelect | undefined {
    const templateName = params.get(TEMPLATE_QUERY_NAME);
    const customTemplateUrl = params.get(TEMPLATE_QUERY_CUSTOM_URL);
    const tx = parseInt(params.get(TEMPLATE_QUERY_CUSTOM_TX));
    const ty = parseInt(params.get(TEMPLATE_QUERY_CUSTOM_TY));
    const px = parseInt(params.get(TEMPLATE_QUERY_CUSTOM_PX));
    const py = parseInt(params.get(TEMPLATE_QUERY_CUSTOM_PY));

    if (customTemplateUrl && !isNaN(tx) && !isNaN(ty) && !isNaN(px) && !isNaN(py)) {
        return {
            name: CUSTOM_STR,
            isCustom: true,
            url: customTemplateUrl,
            offset: { tx, ty, px, py }
        }
    }

    if (templateName in Config.TEMPLATES) {
        return {
            name: templateName,
            isCustom: false,
            url: Config.TEMPLATES[templateName].url,
            offset: Config.TEMPLATES[templateName].offset
        }
    }

    return undefined;
}

export function AppHeader({
    setTemplateSelect,
    templateSelect,
}: {
    setTemplateSelect: (value: TemplateSelect | undefined) => void,
    templateSelect: TemplateSelect | undefined
}) {
    const [showCustomDialog, setShowCustomDialog] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const selectTemplates = [];
    Object.keys(Config.TEMPLATES).forEach((name) => {
        selectTemplates.push(
            <SelectItem key={name} value={name}>{name}</SelectItem>
        )
    });

    const updateTemplate = (value: string) => {
        if (value === CUSTOM_STR) {
            setShowCustomDialog(true);
            return;
        }

        const params = new URLSearchParams();
        params.set(TEMPLATE_QUERY_NAME, value);
        window.history.pushState(null, '', `?${params.toString()}`);
        setTemplateSelect({
            name: value,
            isCustom: false,
            url: Config.TEMPLATES[value].url,
            offset: Config.TEMPLATES[value].offset
        });
    }

    return (
        <>
            <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
                <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mx-2 data-[orientation=vertical]:h-4"
                    />
                    <Select onValueChange={(value) => updateTemplate(value)} value={templateSelect?.name || ''}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select A Template" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Select A Template</SelectLabel>
                                {selectTemplates}
                            </SelectGroup>
                            <SelectGroup>
                                <SelectLabel><Separator /></SelectLabel>
                                <SelectItem value={CUSTOM_STR}>{CUSTOM_STR}</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="flex" onClick={() => setShowHelp(true)}>
                            <IconHelpCircle />
                        </Button>
                    </div>
                </div>
            </header>
            <CustomDialog open={showCustomDialog} setOpen={setShowCustomDialog} setTemplateSelect={setTemplateSelect} />
            <HelpDialog  open={showHelp} setOpen={setShowHelp} />
        </>
    )
}
