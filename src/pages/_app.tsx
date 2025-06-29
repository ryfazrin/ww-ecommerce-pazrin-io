// global styles
import "../assets/css/styles.scss";
import "swiper/swiper.scss";
import "rc-slider/assets/index.css";
import "react-rater/lib/react-rater.css";

// types
import type { AppProps } from "next/app";
import { Poppins } from "next/font/google";
import Router from "next/router";
import Script from "next/script";
import React, { Fragment } from "react";

import { wrapper } from "../store";
import * as gtag from "../utils/gtag";

const isProduction = process.env.NODE_ENV === "production";

// only events on production
if (isProduction) {
  // Notice how we track pageview when route is changed
  Router.events.on("routeChangeComplete", (url: string) => gtag.pageview(url));
}

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--main-font",
});

declare global {
  interface Window {
    _callStackDepths?: number[];
  }
}

// Fungsi untuk log call stack dan kedalamannya
const logCallStack = (context: string) => {
  try {
    const stack = new Error().stack?.split("\n").slice(1) || [];
    window._callStackDepths = window._callStackDepths || [];
    window._callStackDepths.push(stack.length);
    console.log(`[CallStack][Main][${context}] Kedalaman: ${stack.length}`);
    // console.trace(); // Uncomment jika ingin melihat trace detail
  } catch (e) {
    console.error(
      `[CallStack][Main thread][${context}] Error logging call stack:`,
      e,
    );
  }
};

const MyApp = ({ Component, pageProps }: AppProps) => {
  // Log the call stack to measure main thread stack
  logCallStack("Main thread");

  return (
    <Fragment>
      <style jsx global>{`
        :root {
          --main-font: ${poppins.style.fontFamily};
        }
      `}</style>
      {/* Google Tag Manager */}
      <Script id="gtm" type="text/toolwebworker" strategy="afterInteractive">
        {`
          (function (w, d, s, l, i) {
            w[l] = w[l] || [];
            w[l].push({ 'gtm.start': new Date().getTime(), 'event': 'gtm.js' });
            var f = d.getElementsByTagName(s)[0],
              j = d.createElement(s),
              dl = l != 'dataLayer' ? '&l=' + l : '';
            j.async = true;

            // ORIGINAL
            j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;

            // HACK
            // j.src = './gtm.js?id=' + i + dl;

            f.parentNode.insertBefore(j, f);
          })(window, document, 'script', 'dataLayer', 'GTM-WRNP3NZ');
        `}
      </Script>
      {/* Facebook Pixel */}
      <Script
        id="facebook-pixel"
        type="text/toolwebworker"
        strategy="afterInteractive"
      >
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '987747585216906');
          fbq('track', 'PageView');
        `}
      </Script>
      <Component {...pageProps} />
    </Fragment>
  );
};

export default wrapper.withRedux(MyApp);
