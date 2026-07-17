import html2canvas from 'html2canvas';

// Helper function to natively convert modern CSS colors (oklch, lab, lch, color-mix, color) into standard PDF-safe HEX/RGB
const convertColorToRgb = (colorStr: string): string => {
  if (!colorStr || typeof colorStr !== 'string') return colorStr;
  if (!/lab\(|oklch\(|lch\(|color\(|color-mix\(/i.test(colorStr)) {
    return colorStr;
  }

  // First attempt: use native Canvas 2D context to parse and resolve the color to HEX/RGB
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillStyle = colorStr;
        const resolved = ctx.fillStyle;
        if (resolved && !/lab\(|oklch\(|lch\(|color\(/i.test(resolved)) {
          return resolved;
        }
      }
    } catch (e) {
      // Fallback below if canvas context fails
    }
  }

  // Fallback regex replacement for unsupported color functions
  return colorStr
    .replace(/lab\([^)]*\)/gi, 'rgb(0, 0, 0)')
    .replace(/oklch\([^)]*\)/gi, 'rgb(0, 0, 0)')
    .replace(/lch\([^)]*\)/gi, 'rgb(0, 0, 0)')
    .replace(/color-mix\([^)]*\)/gi, 'rgb(0, 0, 0)')
    .replace(/color\([^)]*\)/gi, 'rgb(0, 0, 0)');
};

export const safeHtml2Canvas = async (element: HTMLElement, options: any = {}) => {
  const originalGetComputedStyle = typeof window !== 'undefined' ? window.getComputedStyle : null;
  const disabledSheets: CSSStyleSheet[] = [];
  const savedStyleContents: Array<{ tag: HTMLStyleElement; text: string }> = [];

  // 1. Temporarily patch window.getComputedStyle to intercept and convert oklch/lab/lch/color-mix colors
  if (originalGetComputedStyle) {
    window.getComputedStyle = function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
      const style = originalGetComputedStyle.call(window, elt, pseudoElt);
      return new Proxy(style, {
        get(target: any, prop: string | symbol) {
          let val = Reflect.get(target, prop, target);
          if (typeof val === 'function') {
            val = val.bind(target);
            return function (...args: any[]) {
              const res = val.apply(target, args);
              if (typeof res === 'string' && /lab\(|oklch\(|lch\(|color\(|color-mix\(/i.test(res)) {
                return convertColorToRgb(res);
              }
              return res;
            };
          }
          if (typeof val === 'string' && /lab\(|oklch\(|lch\(|color\(|color-mix\(/i.test(val)) {
            return convertColorToRgb(val);
          }
          return val;
        }
      });
    };
  }

  // 2. Temporarily sanitize textContent of all <style> elements in document.head
  if (typeof document !== 'undefined') {
    try {
      const liveStyles = Array.from(document.querySelectorAll('style'));
      liveStyles.forEach((styleTag) => {
        if (styleTag.textContent && /lab\(|oklch\(|lch\(|color\(|color-mix\(/i.test(styleTag.textContent)) {
          savedStyleContents.push({ tag: styleTag, text: styleTag.textContent });
          styleTag.textContent = styleTag.textContent
            .replace(/lab\([^)]*\)/gi, '#000000')
            .replace(/oklch\([^)]*\)/gi, '#000000')
            .replace(/lch\([^)]*\)/gi, '#000000')
            .replace(/color-mix\([^)]*\)/gi, '#000000')
            .replace(/color\([^)]*\)/gi, '#000000');
        }
      });
    } catch (err) {
      console.warn('Pre-canvas style tag sanitization warning:', err);
    }
  }

  // 3. Disable any live CSSStyleSheet containing lab/oklch/lch/color-mix (avoids DOMException deleteRule failures)
  if (typeof document !== 'undefined' && document.styleSheets) {
    try {
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const sheet = document.styleSheets[i];
          if (!sheet || sheet.disabled) continue;

          let hasUnsupportedColor = false;
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) {
              for (let j = 0; j < rules.length; j++) {
                if (/lab\(|oklch\(|lch\(|color\(|color-mix\(/i.test(rules[j]?.cssText || '')) {
                  hasUnsupportedColor = true;
                  break;
                }
              }
            }
          } catch (e) {
            // Cross-origin or locked stylesheet, disable it during capture to be 100% safe
            hasUnsupportedColor = true;
          }

          if (hasUnsupportedColor) {
            sheet.disabled = true;
            disabledSheets.push(sheet);
          }
        } catch (e) {
          // Safe fallback
        }
      }
    } catch (err) {
      console.warn('Stylesheet disabling warning:', err);
    }
  }

  try {
    // 4. Perform html2canvas capture with cloned document cleanup and PDF defaults (scale: 2, useCORS: true, backgroundColor: "#ffffff")
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
      ...options,
      onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
        try {
          // Remove any <style> or <link> tags in clonedDoc that contain unsupported colors
          const styleTags = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styleTags.forEach((tag: any) => {
            const text = tag.textContent || '';
            if (/lab\(|oklch\(|lch\(|color\(|color-mix\(/i.test(text)) {
              tag.remove();
            }
          });

          // Clean all elements with inline style attributes containing lab/oklch/lch/color-mix/color
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el: any) => {
            const styleAttr = el.getAttribute ? el.getAttribute('style') : null;
            if (styleAttr && /lab\(|oklch\(|lch\(|color\(|color-mix\(/i.test(styleAttr)) {
              el.setAttribute('style', convertColorToRgb(styleAttr));
            }
          });
        } catch (err) {
          console.warn('safeHtml2Canvas onclone style cleanup warning:', err);
        }

        if (typeof options.onclone === 'function') {
          options.onclone(clonedDoc, clonedEl);
        }
      }
    });

    return canvas;
  } finally {
    // 5. Restore original window.getComputedStyle
    if (originalGetComputedStyle && typeof window !== 'undefined') {
      window.getComputedStyle = originalGetComputedStyle;
    }

    // 6. Restore original textContent of <style> elements
    savedStyleContents.forEach(({ tag, text }) => {
      try {
        tag.textContent = text;
      } catch (e) {
        // Safe fallback
      }
    });

    // 7. Re-enable all disabled stylesheets
    disabledSheets.forEach((sheet) => {
      try {
        sheet.disabled = false;
      } catch (e) {
        // Safe fallback
      }
    });
  }
};
