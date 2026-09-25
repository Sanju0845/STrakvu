import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://strakvu.vercel.app')
  ),
  title: 'Strakvu · Developer Activity Calendar',
  description: 'Developer activity calendar that connects to GitHub and visualizes daily commits, pushes, pull requests, and repository milestones in a clean timeline view.',
  icons: {
    icon: '/strakvu.png',
    shortcut: '/strakvu.png',
    apple: '/strakvu.png',
  },
  openGraph: {
    title: 'Strakvu · Developer Activity Calendar',
    description: 'Developer activity calendar that connects to GitHub and visualizes daily commits, pushes, pull requests, and repository milestones in a clean timeline view.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Strakvu · Developer Activity Calendar',
    description: 'Developer activity calendar that connects to GitHub and visualizes daily commits, pushes, pull requests, and repository milestones in a clean timeline view.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 1. Suppress uncaught TypeError if external polyfill tries to set getter-only fetch
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

                  // 2. Ensure self.fetch is defined to prevent polyfills.js from evaluating self.fetch = hb
                  try {
                    if (typeof self !== 'undefined' && !self.fetch && window.fetch) {
                      self.fetch = window.fetch;
                    }
                  } catch (e) {}

                  // 3. Proactively attach setter to any getter-only fetch property descriptor
                  function patchFetch(obj) {
                    if (!obj) return;
                    try {
                      var d = Object.getOwnPropertyDescriptor(obj, 'fetch');
                      if (d && d.get && !d.set) {
                        var getter = d.get;
                        Object.defineProperty(obj, 'fetch', {
                          get: function() { return getter.call(this); },
                          set: function(fn) { getter = function() { return fn; }; },
                          configurable: true,
                          enumerable: true
                        });
                      }
                    } catch (err) {}
                  }

                  patchFetch(window);
                  if (typeof Window !== 'undefined' && Window.prototype) {
                    patchFetch(Window.prototype);
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#090d16] text-[#e6edf3] antialiased selection:bg-[#238636] selection:text-white" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
