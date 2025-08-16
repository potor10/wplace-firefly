import React from 'react';
import type { Metadata } from "next";

import '../styles/globals.css';

export const metadata: Metadata = {
  title: "Wplace.Firefly.Moe",
  description: "Mindlessly place pixels for Firefly",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <React.Suspense>
                <body>{children}</body>
            </React.Suspense>
        </html>
    )
}