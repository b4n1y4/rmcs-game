import "./globals.css";

export const metadata = {
  title: "Raja Mantri Chor Sipahi | Digital",
  description: "Play the classic Indian game online or locally.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
