import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import Header from "./Header";
import CartBar from "./CartBar";
import Footer from "./Footer";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "GuptaMart — Gupta General & Confectionary Store",
  description: "Order groceries online, or via WhatsApp — delivered fast.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f8f8fb] font-sans">
        <CartProvider>
          <Header />
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-28">{children}</main>
          <CartBar />
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
