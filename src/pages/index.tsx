import { useEffect } from "react";

import Footer from "@/components/footer";
import PageIntro from "@/components/page-intro";
import ProductsFeatured from "@/components/products-featured";
import Subscribe from "@/components/subscribe";

import Layout from "../layouts/Main";

const IndexPage = () => {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).twttr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).twttr.widgets.load(); // Memuat widget Twitter setelah komponen dirender
    }
  }, []);

  const sendEvent = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).fbq("track", "PageView");
  };

  const gtmPush = () => {
    const data = { event: "button-click", some: { data: true } };
    console.log("dataLayer.push()");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).dataLayer.push(data);
  };

  return (
    <Layout>
      <PageIntro />

      <section className="featured">
        <div className="container">
          <article
            style={{ backgroundImage: "url(/images/featured-1.jpg)" }}
            className="featured-item featured-item-large"
          >
            <div className="featured-item__content">
              <h3>New arrivals are now in!</h3>
              <a href="#" className="btn btn--rounded">
                Show Collection
              </a>
            </div>
          </article>

          <section
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20
            }}
          >
            {/* Google Tag Manager */}
            <div>
              <button type="button" className="btn btn--rounded btn--yellow" onClick={gtmPush}>dataLayer.push()</button>
            </div>
            {/* Facebook Pixel */}
            <div>
              <button type="button" className="btn btn--rounded btn--yellow" onClick={sendEvent}>fbq track & PageView</button>
            </div>
            {/* Embed Tweet */}
            <div>
              {/* <Image src="/heroImage.jpg" alt="teamwork on web services" width="1332px" height="354px"/> */}
              <blockquote className="twitter-tweet">
                <p lang="en" dir="ltr">
                  Just setting up my Twitter. #myfirstTweet
                </p>
                &mdash; Twitter Dev (@TwitterDev){" "}
                <a href="https://twitter.com/ryfazrin/status/1504760897176174595">
                  February 8, 2025
                </a>
              </blockquote>

              {/* Embed Timeline */}
              <a
                className="twitter-timeline"
                data-width="550"
                data-height="400"
                href="https://twitter.com/ryfazrin/status/1504760897176174595"
              >
                Tweets by TwitterDev
              </a>
            </div>
          </section>

          <article
            style={{ backgroundImage: "url(/images/featured-2.jpg)" }}
            className="featured-item featured-item-small-first"
          >
            <div className="featured-item__content">
              <h3>Basic t-shirts $29,99</h3>
              <a href="#" className="btn btn--rounded">
                More details
              </a>
            </div>
          </article>

          <article
            style={{ backgroundImage: "url(/images/featured-3.jpg)" }}
            className="featured-item featured-item-small"
          >
            <div className="featured-item__content">
              <h3>Sale this summer</h3>
              <a href="#" className="btn btn--rounded">
                VIEW ALL
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="section__intro">
            <h4>Why should you choose us?</h4>
          </header>

          <ul className="shop-data-items">
            <li>
              <i className="icon-shipping" />
              <div className="data-item__content">
                <h4>Free Shipping</h4>
                <p>
                  All purchases over $199 are eligible for free shipping via
                  USPS First Class Mail.
                </p>
              </div>
            </li>

            <li>
              <i className="icon-payment" />
              <div className="data-item__content">
                <h4>Easy Payments</h4>
                <p>
                  All payments are processed instantly over a secure payment
                  protocol.
                </p>
              </div>
            </li>

            <li>
              <i className="icon-cash" />
              <div className="data-item__content">
                <h4>Money-Back Guarantee</h4>
                <p>
                  If an item arrived damaged or you've changed your mind, you
                  can send it back for a full refund.
                </p>
              </div>
            </li>

            <li>
              <i className="icon-materials" />
              <div className="data-item__content">
                <h4>Finest Quality</h4>
                <p>
                  Designed to last, each of our products has been crafted with
                  the finest materials.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <ProductsFeatured />
      <Subscribe />
      <Footer />
    </Layout>
  );
};

export default IndexPage;
