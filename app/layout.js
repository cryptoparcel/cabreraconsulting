export const metadata = {
  title: 'Cabrera Consulting Portal',
  description: 'Client portal for Cabrera Consulting',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
