'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { WPlaceCanvas } from './ui/canvas';
import { AppSidebar } from "./ui/sidebar";
import { AppHeader, setTemplateSelectFromQueryParams, TemplateCustom, TemplateSelect } from "./ui/header";

export default function Page() {
    const searchParams = useSearchParams();

    const [templateSelect, setTemplateSelect] = useState<TemplateSelect | undefined>(
        setTemplateSelectFromQueryParams(new URLSearchParams(searchParams.toString()))
    );

    return (
        <main>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                <AppSidebar />
                <SidebarInset>
                    <AppHeader setTemplateSelect={setTemplateSelect} templateSelect={templateSelect} />
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                                { 
                                    templateSelect ? <WPlaceCanvas 
                                        templateName={templateSelect.name} 
                                        templateOffset={templateSelect.offset}
                                        templateUrl={templateSelect.url}
                                    /> : '' 
                                }
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </main>
    )
}