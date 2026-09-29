import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://strakvu.vercel.app');

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#090d14',
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Strakvu · Developer Activity Calendar & WakaTime Pulse',
    template: '%s | Strakvu',
  },
  description:
    'Strakvu is the premier developer activity calendar that automatically connects to GitHub and WakaTime to track multi-branch commits, coding hours across Cursor, Qoder & VS Code, and AI prompt context.',
  keywords: [
    'Strakvu',
    'strakvu',
    'strakvu app',
    'strakvu calendar',
    'strakvu developer activity',
    'strakvu github',
    'strakvu wakatime',
    'developer activity calendar',
    'github commit calendar',
    'wakatime ide pulse',
    'developer productivity dashboard',
    'qoder ai tracking',
    'cursor ai tracking',
  ],
  authors: [{ name: 'Strakvu Team', url: APP_URL }],
  creator: 'Strakvu',
  publisher: 'Strakvu',
  applicationName: 'Strakvu',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/strakvu.png',
    shortcut: '/strakvu.png',
    apple: '/strakvu.png',
  },
  openGraph: {
    title: 'Strakvu · Developer Activity Calendar',
    description:
      'Explore your complete GitHub commits, exact coding hours across Cursor, Qoder & VS Code, and daily engineering milestones in Strakvu.',
    url: APP_URL,
    siteName: 'Strakvu',
    type: 'website',
    images: [
      {
        url: '/strakvu.png',
        width: 512,
        height: 512,
        alt: 'Strakvu Developer Activity Calendar Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Strakvu · Developer Activity Calendar',
    description:
      'Unify your GitHub commits, WakaTime IDE hours, and daily developer journey with Strakvu.',
    images: ['/strakvu.png'],
    creator: '@strakvu',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Strakvu',
    alternateName: ['Strakvu App', 'Strakvu Developer Calendar'],
    url: APP_URL,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'All',
    description:
      'Strakvu is a developer activity calendar unifying GitHub commits, WakaTime IDE pulse, and AI context into an interactive daily engineering timeline.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    softwareVersion: '2.0.0',
  };

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  window.addEventListener('error', function(event) {
                    if (event && event.message && event.message.indexOf('fetch') !== -1 && event.message.indexOf('getter') !== -1) {
                      event.preventDefault();
                      event.stopImmediatePropagation();
                      return true;
                    }
                  }, true);

                  var prevOnError = window.onerror;
                  window.onerror = function(msg) {
                    if (typeof msg === 'string' && msg.indexOf('fetch') !== -1 && msg.indexOf('getter') !== -1) {
                      return true;
                    }
                    if (prevOnError) return prevOnError.apply(this, arguments);
                  };

                  try {
                    if (typeof self !== 'undefined' && !self.fetch && window.fetch) {
                      self.fetch = window.fetch;
                    }
                  } catch (e) {}
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#090d14] text-[#c9d1d9] antialiased overflow-x-hidden font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
