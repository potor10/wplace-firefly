import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function HelpDialog({
    open,
    setOpen
}: {
    open: boolean,
    setOpen: (open: boolean) => void
}) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[850px]">
                <DialogHeader>
                    <DialogTitle>Getting Started</DialogTitle>
                </DialogHeader>
                <Separator />
                <ScrollArea className="h-200 w-200 rounded-md">
                    <div className="grid grid-cols-1 gap-4 flex flex-row justify-center items-center">
                        <span>
                            <h4>Step 1: Select A Template From The Dropdown</h4>
                            <p className="text-muted-foreground text-sm">
                                Begin by selecting a template from one of the available options in the template dropdown. <br/>
                                You can choose between any of the predefined templates or use your own custom template.
                            </p>
                        </span>
                        <img src="/help/help_1.png" />
                        <span>
                            <Separator className="mb-6" />
                            <h4>Step 2: Preview The Pixel Artwork</h4>
                            <p className="text-muted-foreground text-sm">
                                You can now preview the pixel artwork and see what pixels are not yet placed. 
                            </p>
                        </span>
                        <img src="/help/help_2.png" />
                        <span>
                            <Separator className="mb-6" />
                            <h4>Step 3: Fill The Unfilled Pixel</h4>
                            <p className="text-muted-foreground text-sm">
                                Use the provided color guide and a select a color to fill in! <br/>
                                Once a color is selected, the visit pixel button should appear. This button will bring you to a random pixel that needs to be filled with your selected color.
                            </p>
                        </span>
                        <img src="/help/help_3.png" />
                        <span>
                            <Separator className="mb-6" />
                            <h4>Step 4: Use Custom Artwork</h4>
                            <p className="text-muted-foreground text-sm">
                                You can use custom templates by clicking the "Custom" option in the template dropdown.
                            </p>
                        </span>
                        <img src="/help/help_4.png" />
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}