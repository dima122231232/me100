import "lenis/dist/lenis.css";
import "./globals.css";

import LenisProvider from "@/components/Providers/LenisProvider";

export const metadata = {
    title: "ImagineCo",
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <LenisProvider>
                    {children}
                </LenisProvider>
            </body>
        </html>
    );
}