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

export function AppHeader() {
    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <Select>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select A Template" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                        <SelectLabel>Select A Template</SelectLabel>
                        <SelectItem value="apple">Boxfly</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                        <IconHelpCircle />
                    </Button>
                </div>
            </div>
        </header>
    )
}
