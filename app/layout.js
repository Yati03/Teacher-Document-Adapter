import "./globals.css";

export const metadata = {
  title: "Teacher-Document-Adapter",
  description: "Accessible lesson adaptation for every classroom."
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
