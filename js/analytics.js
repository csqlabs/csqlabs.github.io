/* ==========================================================================
   Google Analytics 4

   Loaded by every page, ahead of main.js. Kept in its own file rather than
   pasted into each <head> because the snippet Google gives you carries the
   measurement ID inline — with seven pages that would be seven copies of the
   same ID to keep in step. Here it is declared once.
   ========================================================================== */
(function () {
  "use strict";

  /* The GA4 measurement ID — Admin > Data streams > your web stream, shown
     top right as "MEASUREMENT ID". It is a G- prefix followed by ten
     characters, and it is NOT the "G-" stream ID or the old UA- property.
     Safe to commit: it is public by design and visible in the page source of
     every site using GA. */
  var MEASUREMENT_ID = "G-FJDS330CV9";

  /* Nothing loads unless a real ID is set, so the file is safe to commit
     before the property exists. The placeholder is compared literally rather
     than shape-tested, because a row of X's satisfies any [A-Z0-9] pattern
     you would write for a real ID and would slip through a shape test.

     Keep this string as the literal placeholder. A find-and-replace of the
     placeholder across the file once rewrote this line too, which made the
     guard compare the real ID against itself and return every time — the tag
     silently never loaded. */
  if (MEASUREMENT_ID === "G-" + "XXXXXXXXXX") return;
  if (!/^G-[A-Z0-9]{8,}$/.test(MEASUREMENT_ID)) return;

  /* Production hostnames only. Local development and any branch or preview
     host would otherwise pollute the property with traffic that is not real
     visitors — and unlike the contact form, which records its environment in
     a column and can be filtered afterwards, GA has no equivalent escape
     hatch once the sessions are in. Same host list as currentEnvironment()
     in main.js; if one changes, change both. */
  var host = window.location.hostname;
  if (host !== "serifo.ai" && host !== "www.serifo.ai") return;

  /* Honour a browser-level "do not track" signal. Not legally required, and
     most browsers no longer send it, but it costs one line and it is the
     stated preference of the person visiting. */
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;

  /* The standard gtag bootstrap. dataLayer has to exist and gtag() has to be
     callable BEFORE the remote script arrives — calls made in the meantime
     queue up in the array and are replayed once it loads, which is why this
     is a plain arguments-pushing function rather than anything cleverer. */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID);

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(MEASUREMENT_ID);
  document.head.appendChild(s);
})();
