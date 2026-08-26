import './globals.css';

export const metadata = {
  title: 'Daily task tracker',
  description: 'Team task tracker for Tahmina, Hasnat, Nitol, and Hridoy',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
