import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Strakvu · Developer Activity Calendar',
  description: 'Developer activity calendar that connects to GitHub and visualizes daily commits, pushes, pull requests, and repository milestones in a clean timeline view.',
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
                try {
                  var target = window;
                  var desc = Object.getOwnPropertyDescriptor(target, 'fetch');
                  if (!desc) {
                    var proto = Object.getPrototypeOf(window);
                    if (proto) {
                      desc = Object.getOwnPropertyDescriptor(proto, 'fetch');
                      if (desc) target = proto;
                    }
                  }
                  if (desc && desc.get && !desc.set) {
                    var currentFetch = window.fetch;
                    Object.defineProperty(window, 'fetch', {
                      get: function() { return currentFetch; },
                      set: function(fn) { currentFetch = fn; },
                      configurable: true,
                      enumerable: true
                    });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#090d16] text-[#e6edf3] antialiased selection:bg-[#238636] selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
