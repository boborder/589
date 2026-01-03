import { jsxRenderer } from 'hono/jsx-renderer';
import { Link, Script, ViteClient } from 'vite-ssr-components/hono';
import { Footer } from './components/Layout/Footer';
import { Header } from './components/Layout/Header';

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="manifest"
          href="/manifest.json"
          crossorigin="use-credentials"
        />
        {/* <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer /> */}
        <ViteClient />
        <Script src="/src/client/main.tsx" async />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body>
        <Header />
        <main className="container mx-auto text-center px-0.5">
          <div className="min-h-[72vh] flex flex-col items-center justify-center">
            {/* <div className="cf-turnstile" data-sitekey="0x4AAAAAAAei5dXpFGHt6PLt" /> */}
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
});
