import { 
    IconBrandDiscordFilled, 
    IconBrandGithub, 
    IconWorld, 
    IconBrandReddit 
} from "@tabler/icons-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";

export function AppSidebar() {
    return (
        <Sidebar collapsible="offcanvas" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <a href="#">
                                <Avatar>
                                    <AvatarImage src="/heart.webp" alt="firefly" />
                                </Avatar>
                                <span className="text-base font-semibold">Wplace.Firefly.Moe</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent className="flex flex-col gap-2">
                        <SidebarMenu>
                            <SidebarMenuItem className="flex items-center gap-2">
                                <SidebarMenuButton asChild tooltip="Discord"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                                >
                                    <a href="https://discord.com/invite/blazerfly" target="_blank">
                                        <IconBrandDiscordFilled />
                                        <span>Join The Discord</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                        <Separator />
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="GitHub">
                                    <a href="https://github.com/potor10/wplace-firefly" target="_blank">
                                        <IconBrandGithub />
                                        <span>GitHub Source</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Wplace">
                                    <a href="https://wplace.live/" target="_blank">
                                        <IconWorld />
                                        <span>Wplace Homepage</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Reddit">
                                    <a href="https://www.reddit.com/r/FireflyMains/" target="_blank">
                                        <IconBrandReddit />
                                        <span>FireflyMains Reddit</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                {/* TODO */}
            </SidebarFooter>
        </Sidebar>
    )
}