import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { WPlaceCanvas } from './ui/canvas';
import { AppSidebar } from "./ui/sidebar";
import { AppHeader } from "./ui/header";

export default function Page() {
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
                    <AppHeader />
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                                <WPlaceCanvas />
                                {/* <SectionCards /> */}
                                <div className="px-4 lg:px-6">
                                    {/* <ChartAreaInteractive /> */}
                                </div>
                                {/* <DataTable data={data} /> */}
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </main>
    )
}