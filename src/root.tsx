import { component$, isDev } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";

export default component$(() => {
  /**
   * The root of a QwikCity site always start with the <QwikCityProvider> component,
   * immediately followed by the document's <head> and <body>.
   *
   * Don't remove the `<head>` and `<body>` elements.
   */

  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="google" content="notranslate" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

        {!isDev && (
          <link
            rel="manifest"
            href={`${import.meta.env.BASE_URL}manifest.json`}
          />
        )}
        <RouterHead />
        <style dangerouslySetInnerHTML={`
          html{overflow-y:scroll}
          body.loading{opacity:0}
          body.ready{opacity:1;transition:opacity 0.1s ease}
        `} />
        {/* Pre-paint: if the hero intro has already played this session,
            mark <html> so all intro animations render skipped from the first frame. */}
        <script dangerouslySetInnerHTML="try{if(sessionStorage.getItem('mn_hero_animated')==='1')document.documentElement.classList.add('mn-hero-no-anim');}catch(_){}" />
      </head>
      <body lang="en" translate="no" class="notranslate loading">
        <RouterOutlet />
        <script dangerouslySetInnerHTML="window.addEventListener('load',function(){document.body.classList.remove('loading');document.body.classList.add('ready')})" />
      </body>
    </QwikCityProvider>
  );
});
