(function () {
  "use strict";

  /* Sticky header: transparent over the hero, solid white once scrolled
     past it. Toggled directly on scroll — no rAF debounce gate, since a
     stuck boolean flag (e.g. a dropped frame while the tab is backgrounded)
     would permanently block every future update. A classList.toggle plus
     two offsetHeight reads is cheap enough to run on every scroll tick. */
  var header = document.querySelector(".site-header");
  var hero = document.querySelector(".hero");
  if (header && hero) {
    var applyHeaderState = function () {
      var threshold = hero.offsetHeight - header.offsetHeight;
      header.classList.toggle("site-header--solid", window.scrollY > threshold);
    };
    window.addEventListener("scroll", applyHeaderState, { passive: true });
    /* Defer the initial check past first paint — reading window.scrollY
       synchronously here can race the browser's own scroll-restoration on
       reload (it can momentarily report a stale non-zero value before
       snapping back to 0, with no scroll event to re-trigger this check
       and correct it), which would wrongly latch the header solid. */
    window.addEventListener("pageshow", applyHeaderState);
    requestAnimationFrame(function () { requestAnimationFrame(applyHeaderState); });
  }

  /* Hide the fixed header once the footer scrolls into view — otherwise
     it keeps floating over the footer's own nav links for the rest of
     the scroll. */
  var footer = document.querySelector(".site-footer");
  if (header && footer && "IntersectionObserver" in window) {
    var footerIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          header.classList.toggle("site-header--hidden", entry.isIntersecting);
        });
      },
      { threshold: 0 }
    );
    footerIo.observe(footer);
  }

  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".site-nav__links");
  if (toggle && links) {
    var setNavOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      links.classList.toggle("is-open", open);
      /* The panel covers the whole viewport below the bar, so lock page
         scroll behind it. Its own class rather than the contact modal's
         .has-modal-open: the nav's CTA opens that modal, and sharing one
         class would let whichever closed first unlock scroll for both. */
      document.body.classList.toggle("has-nav-open", open);
    };

    toggle.addEventListener("click", function () {
      setNavOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    /* Close on any link tap. Matters most for the same-page fragment
       links (#offerings, #engineered-by-veterans …): those scroll without
       a navigation, so a full-height panel would otherwise stay parked
       over the section it just jumped to. */
    links.addEventListener("click", function (event) {
      if (event.target.closest("a")) setNavOpen(false);
    });
  }

  /* Contact modal: every .js-open-contact button (nav, hero, offerings,
     closing CTA) keeps a real href — #contact or mailto: — as a no-JS
     fallback; here we intercept the click and open this instead. While
     open: focus moves into the dialog and is trapped there (Tab/Shift+Tab
     wrap at its first/last focusable element rather than escaping to the
     page behind it), Escape or clicking the backdrop/close button
     dismiss it, and focus returns to whichever button opened it. Body
     scroll is locked for the duration via .has-modal-open (see main.css)
     so the page behind the dialog can't be scrolled inadvertently. */
  var contactModal = document.getElementById("contact-modal");
  var contactForm = document.getElementById("contact-form");
  if (contactModal && contactForm) {
    var contactDialog = contactModal.querySelector(".contact-modal__dialog");
    var contactFields = contactForm.querySelector(".contact-form__fields");
    var contactSuccess = contactForm.querySelector(".contact-form__success");
    var contactError = contactForm.querySelector(".contact-form__error");
    var contactSubmit = contactForm.querySelector(".contact-form__submit");
    /* Read once at init, not per submit: the label is overwritten with
       "Sending…" while a submit is in flight, so re-reading it later would
       latch that placeholder in as the "original" and never recover. */
    var contactSubmitLabel = contactSubmit ? contactSubmit.textContent : "";
    var resetContactSubmit = function () {
      if (!contactSubmit) return;
      contactSubmit.disabled = false;
      contactSubmit.textContent = contactSubmitLabel;
    };
    var reduceMotionModal = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var lastFocusedBeforeModal = null;

    var getFocusableInDialog = function () {
      var nodes = contactDialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      return Array.prototype.filter.call(nodes, function (el) { return el.offsetParent !== null; });
    };

    var onContactModalKeydown = function (e) {
      if (e.key === "Escape") {
        closeContactModal();
        return;
      }
      if (e.key !== "Tab") return;
      var focusables = getFocusableInDialog();
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    var openContactModal = function (trigger) {
      lastFocusedBeforeModal = trigger || document.activeElement;
      contactModal.hidden = false;
      document.body.classList.add("has-modal-open");
      document.addEventListener("keydown", onContactModalKeydown);
      var focusFirst = function () {
        var focusables = getFocusableInDialog();
        (focusables[0] || contactDialog).focus();
      };
      if (reduceMotionModal) {
        contactModal.classList.add("is-open");
        focusFirst();
      } else {
        /* Same reasoning as the Card 6 draw-in fix elsewhere in this file:
           clearing [hidden] and adding the class that drives the
           opacity/transform transition in the same tick can skip the
           animation entirely, so the class add is deferred a frame. */
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            contactModal.classList.add("is-open");
          });
        });
        focusFirst();
      }
    };

    var closeContactModal = function () {
      contactModal.classList.remove("is-open");
      document.body.classList.remove("has-modal-open");
      document.removeEventListener("keydown", onContactModalKeydown);
      var finish = function () {
        contactModal.hidden = true;
        contactForm.reset();
        /* The button and the error note live outside .contact-form__fields, so
           form.reset() doesn't touch them — without this a modal reopened after
           a submit shows a blank form with a dead "Sending…" button. */
        resetContactSubmit();
        contactFields.hidden = false;
        contactSuccess.hidden = true;
        if (contactError) contactError.hidden = true;
        if (lastFocusedBeforeModal) lastFocusedBeforeModal.focus();
      };
      if (reduceMotionModal) {
        finish();
      } else {
        contactDialog.addEventListener("transitionend", finish, { once: true });
      }
    };

    document.querySelectorAll(".js-open-contact").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        openContactModal(btn);
      });
    });

    contactModal.querySelectorAll("[data-modal-dismiss]").forEach(function (el) {
      el.addEventListener("click", closeContactModal);
    });

    /* GitHub Pages can't run server-side code, so the form posts to
       Web3Forms (https://web3forms.com) and they relay it to the address the
       access_key is registered to. The key lives in a hidden input in the
       markup — it is a public, submit-only token by design, so shipping it in
       the page is expected and can't be used to read past submissions.
       Posting via fetch rather than a plain form submit keeps the visitor in
       the modal instead of bouncing them to a Web3Forms thank-you page. */
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      if (contactError) contactError.hidden = true;
      if (contactSubmit) {
        contactSubmit.disabled = true;
        contactSubmit.textContent = "Sending…";
      }

      var payload = {};
      new FormData(contactForm).forEach(function (value, key) {
        payload[key] = value;
      });

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          /* Web3Forms reports failures in the JSON body as well as the status
             code, so both have to be checked before claiming success. */
          return res.json().then(function (data) {
            if (!res.ok || !data.success) {
              throw new Error(data && data.message ? data.message : "Submission failed");
            }
          });
        })
        .then(function () {
          /* Restored even though the fields (and the button with them) are
             about to be hidden — closing the modal un-hides them again. */
          resetContactSubmit();
          contactFields.hidden = true;
          contactSuccess.hidden = false;
        })
        .catch(function () {
          resetContactSubmit();
          if (!contactError) return;
          contactError.textContent =
            "Sorry — that didn't send. Please try again, or email us at hello@serifo.ai.";
          contactError.hidden = false;
        });
    });
  }

  /* "Copy link" (article page): copies the current page URL and shows a
     brief "Link Copied" tooltip (see .copy-tooltip in pages.css) next to
     the button rather than navigating the "#" href. navigator.clipboard
     is unavailable in some contexts (e.g. non-HTTPS), so it falls back
     to a temporary offscreen <textarea> + execCommand("copy"). */
  document.querySelectorAll(".js-copy-link").forEach(function (link) {
    var tooltip = link.querySelector(".copy-tooltip");
    var hideTimer = null;
    var showTooltip = function () {
      if (!tooltip) return;
      tooltip.classList.add("is-visible");
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { tooltip.classList.remove("is-visible"); }, 1600);
    };
    var copyText = function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      var temp = document.createElement("textarea");
      temp.value = text;
      temp.style.position = "fixed";
      temp.style.opacity = "0";
      document.body.appendChild(temp);
      temp.select();
      try { document.execCommand("copy"); } catch (e) { /* best-effort fallback */ }
      document.body.removeChild(temp);
      return Promise.resolve();
    };
    link.addEventListener("click", function (e) {
      e.preventDefault();
      copyText(window.location.href).then(showTooltip);
    });
  });

  /* Quality-checks ticker (Figma node 65:6641): 8 rows of horizontally
     scrolling checklist terms, alternating scroll direction per row.
     Each row's track is duplicated once for a seamless 50% loop.

     Highlight logic: on every cycle, gather every .qc-check across all
     rows whose bounding box is currently fully inside the ticker
     container (getBoundingClientRect against the container's rect —
     the ticker loops endlessly, so there's no static "frame" to hand-
     author this against; it has to be measured live), grouped by row.
     Pick exactly 3 rows at random, with a minimum gap of 1 empty row
     between any two chosen rows (e.g. rows 1/3/5, never 1/2/anything),
     then pick one visible check within each chosen row. Exactly 3 are
     lit at a time — the previous set is cleared before the new one is
     chosen. A pause button freezes both the scroll and the highlight
     cycling. */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  (function setupQualityTicker() {
    var wrap = document.getElementById("quality-ticker");
    if (!wrap) return;
    var rows = Array.prototype.slice.call(wrap.querySelectorAll(".qc-row"));
    rows.forEach(function (row) {
      var track = row.querySelector(".qc-track");
      if (track) track.innerHTML += track.innerHTML;
    });

    var pauseBtn = wrap.querySelector("[data-quality-pause]");
    var paused = reduceMotion;
    var intervalId = null;
    var highlightCount = 3;
    var minRowGap = 2; // difference between row indices; 2 = at least 1 empty row between
    var cycleMs = 2200;

    if (paused) wrap.setAttribute("data-paused", "true");

    // Map of rowIndex -> array of fully-visible .qc-check elements in
    // that row right now.
    function visibleChecksByRow() {
      var containerRect = wrap.getBoundingClientRect();
      var byRow = {};
      rows.forEach(function (row, rowIndex) {
        var track = row.querySelector(".qc-track");
        if (!track) return;
        var checks = track.querySelectorAll(".qc-check");
        checks.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.left >= containerRect.left && r.right <= containerRect.right) {
            if (!byRow[rowIndex]) byRow[rowIndex] = [];
            byRow[rowIndex].push(el);
          }
        });
      });
      return byRow;
    }

    function shuffle(arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      return arr;
    }

    function pickRowSpread(byRow, count) {
      var candidateRows = shuffle(Object.keys(byRow).map(Number));
      var chosenRows = [];
      candidateRows.forEach(function (rowIndex) {
        if (chosenRows.length >= count) return;
        var ok = chosenRows.every(function (r) { return Math.abs(r - rowIndex) >= minRowGap; });
        if (ok) chosenRows.push(rowIndex);
      });
      return chosenRows.map(function (rowIndex) {
        var options = byRow[rowIndex];
        return options[Math.floor(Math.random() * options.length)];
      });
    }

    function tick() {
      wrap.querySelectorAll(".qc-check.is-active").forEach(function (el) {
        el.classList.remove("is-active");
      });
      var byRow = visibleChecksByRow();
      var chosen = pickRowSpread(byRow, highlightCount);
      chosen.forEach(function (el) { el.classList.add("is-active"); });
    }

    function start() {
      if (intervalId) return;
      tick();
      intervalId = setInterval(tick, cycleMs);
    }
    function stop() {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      wrap.querySelectorAll(".qc-check.is-active").forEach(function (el) {
        el.classList.remove("is-active");
      });
    }

    if (!paused) start();

    if (pauseBtn) {
      pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
      pauseBtn.innerHTML = paused ? "&#9654;" : "&#10074;&#10074;";
      pauseBtn.addEventListener("click", function () {
        paused = !paused;
        wrap.setAttribute("data-paused", String(paused));
        pauseBtn.setAttribute("aria-pressed", String(paused));
        pauseBtn.setAttribute("aria-label", paused ? "Play ticker" : "Pause ticker");
        pauseBtn.innerHTML = paused ? "&#9654;" : "&#10074;&#10074;";
        if (paused) stop(); else start();
      });
    }
  })();

  /* Parallax drift for the stats section's decorative illustration: as
     the .stats section scrolls through the viewport, .stats__deco drifts
     from +40px to -40px — tied directly to scroll progress (not a
     one-shot transition), so it's moving for as long as the section is
     being scrolled past, not just on the way in. progress 0 = section
     top just entering at the viewport's bottom edge; progress 1 =
     section bottom just leaving at the viewport's top edge. */
  var statsSection = document.querySelector(".stats");
  var statsDeco = document.querySelector(".stats__deco");
  if (statsSection && statsDeco && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var DRIFT_PX = 40;
    var tickScheduled = false;
    var applyParallax = function () {
      tickScheduled = false;
      var rect = statsSection.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh - rect.top) / (rect.height + vh);
      progress = Math.min(1, Math.max(0, progress));
      var offset = DRIFT_PX - progress * (DRIFT_PX * 2);
      statsDeco.style.transform = "translateY(" + offset.toFixed(1) + "px)";
    };
    var onScroll = function () {
      if (!tickScheduled) {
        tickScheduled = true;
        requestAnimationFrame(applyParallax);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    applyParallax();
  }

  /* Metric count-up for the stats section (99.9% / 80+ / 100%): fires
     every time .stats__row scrolls into view, not just once. Each number
     counts from 50% of its own target up to the target (not from 0),
     over a flat 1500ms with an ease-out curve, and reformats itself with
     its original prefix/suffix and decimal precision every frame so the
     "%"/"+" and e.g. "99.9"'s one decimal place never drop out mid-count.

     Each element's target/prefix/suffix/decimals is parsed ONCE up front
     into statInfos and reused on every later trigger — re-parsing from
     the live textContent on a repeat trigger would instead read back
     whatever number a run left behind if the user scrolled away before
     it finished, permanently corrupting the "target" to that
     interrupted mid-count value. runToken guards against that same
     interrupt-and-retrigger case a different way: if a new count-up
     starts for an element while an old one's rAF loop is still ticking,
     the old loop's stale closure would otherwise keep overwriting
     textContent alongside the new one. */
  var statsRow = document.querySelector(".stats__row");
  var statValues = document.querySelectorAll(".stat__value");
  if (statsRow && statValues.length && "IntersectionObserver" in window) {
    var parseStatValue = function (text) {
      var match = text.trim().match(/^([^\d]*)([\d.]+)([^\d]*)$/);
      if (!match) return null;
      var decimals = (match[2].split(".")[1] || "").length;
      return { prefix: match[1], target: parseFloat(match[2]), suffix: match[3], decimals: decimals };
    };
    var statInfos = Array.prototype.map
      .call(statValues, function (el) { return { el: el, info: parseStatValue(el.textContent) }; })
      .filter(function (item) { return item.info; });
    var easeOutCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
    var animateCountUp = function (el, info) {
      var COUNT_DURATION_MS = 1500;
      var startValue = info.target * 0.5;
      var startTime = null;
      var runToken = {};
      el.__countUpToken = runToken;
      var tick = function (now) {
        if (el.__countUpToken !== runToken) return;
        if (startTime === null) startTime = now;
        var t = Math.min(1, (now - startTime) / COUNT_DURATION_MS);
        var value = startValue + (info.target - startValue) * easeOutCubic(t);
        el.textContent = info.prefix + value.toFixed(info.decimals) + info.suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var countUpIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              statInfos.forEach(function (item) { animateCountUp(item.el, item.info); });
            }
          });
        },
        { threshold: 0.2 }
      );
      countUpIo.observe(statsRow);
    }
  }

  /* Card 6 "cube line-by-line draw-in": each isometric cube is 9
     separate one-segment <path>s (6 outline edges + 3 spokes to center —
     see .hex-draw-path in index.html) rather than one compound path, so
     each individual line can draw in on its own instead of the whole
     cube revealing as a single continuous stroke. The dashoffset
     animation needs each path's own real length, which only the browser
     can measure (getTotalLength()), so this has to be JS-driven rather
     than a pure CSS transition. Setup runs immediately: dasharray is set
     to that length and dashoffset is set to the SAME length, which hides
     the whole stroke (nothing to show — the dash is exactly as long as
     the gap needed to hide it). revealHexDrawIn() — called from the
     row-trigger below once tile--cx's row centers — plays the actual
     draw-in via Element.animate() (the Web Animations API), not a CSS
     transition: a transition needs the property+value change to land in
     a later frame than the one that first enables it, which is easy to
     get wrong (an earlier version here set .style.transition and
     .style.strokeDashoffset in the same tick, so the browser had no
     "before" frame to animate from and just jumped straight to the end
     state with no visible draw-in). animate() has no such gotcha — it
     always plays the keyframes you give it regardless of prior state.

     Paths are in DOM order 9-per-cube, so index i maps to
     cubeIndex = floor(i/9), lineIndex = i%9 — each cube starts
     CUBE_DELAY_STEP after the previous one, and within a cube each line
     starts LINE_DELAY_STEP after the last, tracing the hexagon outline
     first and then the 3 internal spokes. 800ms base delay matches
     tile--cx's own transition-delay (.tile:nth-child(6) in main.css) —
     without it, most of the draw-in finishes while the card is still
     nearly opacity:0, so by the time it's visible the cube already reads
     as fully drawn instead of animating in (same fix already applied to
     Card 1's arcs and Card 3's diamonds, whose stagger delays likewise
     start from their own tile's delay). The per-line stagger + duration
     is sized so the LAST line of the LAST cube still finishes at
     2*CUBE_DELAY_STEP + 8*LINE_DELAY_STEP + LINE_DURATION = 3000ms after
     that base delay — the same ~3s draw budget every other card in this
     row uses for its own reveal, just spent one line at a time instead
     of all at once. cubic-bezier(0.16,1,0.3,1) (the same ease-out curve
     as Card 5's atom-spin) so each line decelerates into its stop rather
     than cutting off abruptly. */
  var hexDrawPaths = document.querySelectorAll(".hex-draw-path");
  var revealHexDrawIn = function () {};
  var resetHexDrawIn = function () {};
  if (hexDrawPaths.length && hexDrawPaths[0].getTotalLength) {
    var reduceMotionHexDraw = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hexPathLengths = [];
    hexDrawPaths.forEach(function (path, i) {
      var length = path.getTotalLength();
      hexPathLengths[i] = length;
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
    });
    var HEX_LINES_PER_CUBE = 9;
    var HEX_CUBE_DELAY_STEP = 750;
    var HEX_LINE_DELAY_STEP = 100;
    var HEX_LINE_DURATION = 700;
    var HEX_BASE_DELAY = 800;
    var HEX_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
    if (reduceMotionHexDraw) {
      revealHexDrawIn = function () {
        hexDrawPaths.forEach(function (path) { path.style.strokeDashoffset = "0"; });
      };
    } else {
      revealHexDrawIn = function () {
        hexDrawPaths.forEach(function (path, i) {
          var cubeIndex = Math.floor(i / HEX_LINES_PER_CUBE);
          var lineIndex = i % HEX_LINES_PER_CUBE;
          var delay = HEX_BASE_DELAY + cubeIndex * HEX_CUBE_DELAY_STEP + lineIndex * HEX_LINE_DELAY_STEP;
          path.animate(
            [{ strokeDashoffset: hexPathLengths[i] }, { strokeDashoffset: 0 }],
            { duration: HEX_LINE_DURATION, delay: delay, easing: HEX_EASING, fill: "forwards" }
          );
        });
      };
    }
    /* Called from the row-trigger below when tile--cx's row leaves the
       centered band, so a later re-entry starts from fully hidden again
       instead of the finished (fully drawn) state Element.animate()'s
       fill:forwards left behind. Cancelling first is required — a
       finished animation's fill:forwards keeps overriding the element's
       own style.strokeDashoffset until the animation is actually
       cancelled, not just superseded by a later assignment. */
    resetHexDrawIn = function () {
      hexDrawPaths.forEach(function (path, i) {
        if (path.getAnimations) path.getAnimations().forEach(function (anim) { anim.cancel(); });
        path.style.strokeDashoffset = hexPathLengths[i];
      });
    };
  }

  /* Card 4 "ellipse draw-in": 12 real SVG <ellipse> elements sharing a
     center (see .orb-ellipse in index.html for the cx/cy/rx/ry values).
     Same getTotalLength()/Element.animate() technique as Card 6's cube
     lines just above — each ellipse's own measured perimeter becomes its
     stroke-dasharray, and dashoffset animates from that length to 0.

     Draw order is outer→inner rather than DOM order: ORB_TIER_BY_INDEX
     maps each ellipse's DOM index to a tier 0 (the two largest, ry=273.6
     & the biggest rx among that tied group) through 5 (the two
     smallest), so the four ellipses tied on ry=273.6 still resolve to a
     single consistent order (by rx, widest first) instead of an
     arbitrary DOM-order tiebreak. Starting the biggest arcs first and
     working inward is what makes the reveal read as "flowing inward
     toward the convergence point" rather than every ellipse appearing at
     once.

     No base delay here (unlike Card 6 above): tile--social is
     nth-child(4) of its row, whose OWN transition-delay is 0s (see
     .tile:nth-child(4) in main.css), so — unlike Card 6's 0.8s-delayed
     tile--cx — this card is already visible from the moment the row
     triggers, and the draw-in can start immediately. Tier delay step
     and duration are sized so the innermost tier (tier 5) still finishes
     at 5*ORB_TIER_DELAY_STEP + ORB_DURATION = 3000ms, the same ~3s
     one-shot budget as every other card, and cubic-bezier(0.16,1,0.3,1)
     (Card 5's atom-spin curve) decelerates each ellipse into its stop
     instead of an abrupt cut. */
  var orbEllipses = document.querySelectorAll(".orb-ellipse");
  var revealOrbDrawIn = function () {};
  var resetOrbDrawIn = function () {};
  if (orbEllipses.length && orbEllipses[0].getTotalLength) {
    var reduceMotionOrbDraw = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var orbLengths = [];
    orbEllipses.forEach(function (ellipse, i) {
      var length = ellipse.getTotalLength();
      orbLengths[i] = length;
      ellipse.style.strokeDasharray = length;
      ellipse.style.strokeDashoffset = length;
    });
    var ORB_TIER_BY_INDEX = [5, 5, 4, 4, 3, 3, 0, 0, 1, 1, 2, 2];
    var ORB_TIER_DELAY_STEP = 350;
    var ORB_DURATION = 1250;
    var ORB_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
    if (reduceMotionOrbDraw) {
      revealOrbDrawIn = function () {
        orbEllipses.forEach(function (ellipse) { ellipse.style.strokeDashoffset = "0"; });
      };
    } else {
      revealOrbDrawIn = function () {
        orbEllipses.forEach(function (ellipse, i) {
          var delay = ORB_TIER_BY_INDEX[i] * ORB_TIER_DELAY_STEP;
          ellipse.animate(
            [{ strokeDashoffset: orbLengths[i] }, { strokeDashoffset: 0 }],
            { duration: ORB_DURATION, delay: delay, easing: ORB_EASING, fill: "forwards" }
          );
        });
      };
    }
    /* Same reasoning as resetHexDrawIn above: cancel the finished
       Element.animate() call (its fill:forwards otherwise keeps holding
       dashoffset:0) and put each ellipse's dashoffset back to its full
       length so the next row-centered entry draws in from hidden again. */
    resetOrbDrawIn = function () {
      orbEllipses.forEach(function (ellipse, i) {
        if (ellipse.getAnimations) ellipse.getAnimations().forEach(function (anim) { anim.cancel(); });
        ellipse.style.strokeDashoffset = orbLengths[i];
      });
    };
  }

  /* Row-based reveal for the tile grid: unlike the generic .pre-reveal
     mechanism below (fires as soon as ANY part of an element is visible),
     each row of 3 cards only reveals once it's actually CENTERED in the
     viewport. That's done by shrinking the observer's effective root to
     a thin horizontal band through the middle of the viewport
     (rootMargin "-40% 0px -40% 0px" trims 40% off the top and bottom,
     leaving only the middle 20%) — a tile only counts as "intersecting"
     once it overlaps that middle band, not merely on-screen. Each row is
     watched independently, so row 1 (cards 1–3) and row 2 (cards 4–6)
     reveal at their own, unrelated scroll positions. .is-visible lands
     directly on each tile in the row — .tile.is-visible in main.css then
     drives both that card's own fade/slide-in and its internal graphic's
     animation (rings, balls, diamonds, orbs, atom spin, or line
     draw-in).

     Repeatable, not one-shot: the observer is never unobserved, and
     .is-visible is removed again once the row leaves the centered band
     (tracked per-tile in intersectingState rather than trusted from the
     current callback's entries alone — IntersectionObserver only reports
     elements whose state actually changed, so a batch can contain just
     one of the row's three tiles; recomputing "is any tile in the row
     currently intersecting" from the full tracked state, not just
     entries.some() on that partial batch, avoids wrongly resetting the
     row while a tile outside this particular batch is still centered).
     Removing .is-visible alone is enough to reset the CSS-driven cards
     (Cards 1, 2, 3, 5, and the tile's own fade/slide) since their
     "revealed" look only exists via a `.tile.is-visible …` rule with no
     other state left behind — but Cards 4 and 6 draw in via
     Element.animate() outside of CSS entirely, so their finished,
     fill:forwards animations need an explicit reset (see
     resetHexDrawIn/resetOrbDrawIn above) or a later re-entry would find
     them already fully drawn instead of hidden. */
  var tileRows = [
    [".tile--brand", ".tile--usage", ".tile--concept"],
    [".tile--social", ".tile--pricing", ".tile--cx"]
  ];
  var playTileDrawIn = function (tile) {
    if (tile.classList.contains("tile--cx")) revealHexDrawIn();
    if (tile.classList.contains("tile--social")) revealOrbDrawIn();
  };
  var resetTileDrawIn = function (tile) {
    if (tile.classList.contains("tile--cx")) resetHexDrawIn();
    if (tile.classList.contains("tile--social")) resetOrbDrawIn();
  };
  tileRows.forEach(function (selectors) {
    var tilesInRow = selectors
      .map(function (sel) { return document.querySelector(sel); })
      .filter(Boolean);
    if (!tilesInRow.length) return;
    if ("IntersectionObserver" in window) {
      var intersectingState = tilesInRow.map(function () { return false; });
      var rowIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var idx = tilesInRow.indexOf(entry.target);
            if (idx !== -1) intersectingState[idx] = entry.isIntersecting;
          });
          var rowIsCentered = intersectingState.some(Boolean);
          tilesInRow.forEach(function (tile) {
            if (rowIsCentered && !tile.classList.contains("is-visible")) {
              tile.classList.add("is-visible");
              playTileDrawIn(tile);
            } else if (!rowIsCentered && tile.classList.contains("is-visible")) {
              tile.classList.remove("is-visible");
              resetTileDrawIn(tile);
            }
          });
        },
        { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
      );
      tilesInRow.forEach(function (tile) { rowIo.observe(tile); });
    } else {
      tilesInRow.forEach(function (tile) {
        tile.classList.add("is-visible");
        playTileDrawIn(tile);
      });
    }
  });

  /* Scroll reveal for .pre-reveal elements — fires as soon as any part of
     the element is visible (unlike the row-centered reveal above), and
     fades/slides the element itself directly. Repeatable like the row
     reveal above: .is-visible toggles on and off with entry.isIntersecting
     directly (each element is observed independently here, so there's no
     multi-tile "row" state to reconcile the way the tile rows need). */
  var revealTargets = document.querySelectorAll(".pre-reveal");
  if ("IntersectionObserver" in window && revealTargets.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }
})();
