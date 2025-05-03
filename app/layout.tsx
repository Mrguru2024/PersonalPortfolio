import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../client/src/index.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MrGuru.dev - Full Stack Developer',
  description: 'Anthony "MrGuru" Feaster\'s portfolio showcasing projects, skills and services as a full stack developer in Atlanta, GA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <CustomCursor />
          <FloatingNavigation />
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}