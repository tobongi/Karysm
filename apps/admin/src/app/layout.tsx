import './globals.css';

export const metadata = {
  title: 'Tokoss Admin',
  description: 'Tableau de bord administrateur Tokoss',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
