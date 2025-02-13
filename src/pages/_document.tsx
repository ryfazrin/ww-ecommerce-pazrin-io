import type { DocumentContext, DocumentInitialProps } from "next/document";
import Document, { Head, Html, Main, NextScript } from "next/document";

import { GA_TRACKING_ID } from "@/utils/gtag";

interface DocumentProps extends DocumentInitialProps {
  isProduction: boolean;
}

export default class CustomDocument extends Document<DocumentProps> {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentProps> {
    const initialProps = await Document.getInitialProps(ctx);

    // Check if in production
    const isProduction = process.env.NODE_ENV === "production";

    return {
      ...initialProps,
      isProduction,
    };
  }

  render() {
    const { isProduction } = this.props;

    return (
      <Html lang="en">
        <Head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
              fernflow = {
                resolveUrl(url, location) {
                  if (
                    url.hostname.includes('syndication.twitter.com') ||
                    url.hostname.includes('cdn.syndication.twimg.com') ||
                    url.hostname.includes('connect.facebook.net')
                  ) {
                    const proxyUrl = new URL('https://pazrin-proxy-api.deno.dev/proxy-api');
                    proxyUrl.searchParams.append('url', url);
                    return proxyUrl;
                  }
                },
                forward: ["fbq", "dataLayer.push"],
                logCalls: true,
                logGetters: true,
                logSetters: true,
                logImageRequests: true,
                logMainAccess: true,
                logSendBeaconRequests: true,
                logStackTraces: false,
                logScriptExecution: true,
              };  
            `
            }}
          />
          <script async src="/~fernflow/debug/tool-web-worker.js" />

          {/* Menambahkan script Twitter untuk embed widget */}
          <script
            async
            type="text/fernflow"
            src="https://platform.twitter.com/widgets.js"
            charSet="utf-8"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
