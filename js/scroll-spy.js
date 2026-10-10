/**
 * Highlights the .tabs-nav link for whichever section currently sits just
 * below the (sticky) nav bar, as the reader scrolls -- so the bar always
 * shows where they are, not just where a click would take them.
 *
 * Approach: on scroll/resize, probe a single point just under the nav's
 * bottom edge and find the section whose box contains it. That's a direct
 * answer to "what's on screen right now", so there's no threshold or margin
 * tuning to get subtly wrong.
 */
(function () {
  const nav = document.querySelector(".tabs-nav");
  if (!nav) return;

  const links = Array.from(nav.querySelectorAll("a[href^='#']"));
  const sections = links
    .map((a) => {
      const id = a.getAttribute("href").slice(1);
      const section = document.getElementById(id);
      return section ? { link: a, section } : null;
    })
    .filter(Boolean);
  if (!sections.length) return;

  function setActive(section) {
    for (const { link, section: s } of sections) {
      link.classList.toggle("is-active", s === section);
    }
  }

  function update() {
    const probeY = nav.getBoundingClientRect().bottom + 2;
    let current = null;
    for (const entry of sections) {
      const rect = entry.section.getBoundingClientRect();
      if (rect.top <= probeY && rect.bottom > probeY) {
        current = entry.section;
        break;
      }
    }
    // Scrolled past the last section (e.g. into the footer): keep it
    // highlighted rather than dropping back to no selection.
    if (!current) {
      const last = sections[sections.length - 1];
      if (last.section.getBoundingClientRect().bottom <= probeY) {
        current = last.section;
      }
    }
    setActive(current);
  }

  let ticking = false;
  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  update();
})();
