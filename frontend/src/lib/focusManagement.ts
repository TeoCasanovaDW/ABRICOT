/**
 * Moves focus to an element, temporarily making it focusable via `tabindex`
 * if it isn't natively focusable (e.g. a heading or `main` landmark).
 * The temporary `tabindex` is removed once focus leaves the element, so it
 * doesn't linger in the tab order.
 */
export function moveFocusTo(element: HTMLElement | null): void {
  if (!element) return;

  const hadTabIndex = element.hasAttribute("tabindex");
  if (!hadTabIndex) {
    element.setAttribute("tabindex", "-1");
    const cleanup = () => {
      element.removeAttribute("tabindex");
      element.removeEventListener("blur", cleanup);
    };
    element.addEventListener("blur", cleanup, { once: true });
  }

  element.focus();
}

/**
 * Returns focus to a trigger element (e.g. the control that opened a dialog).
 * Falls back to `fallback` if the trigger no longer exists in the document.
 */
export function returnFocusTo(
  trigger: HTMLElement | null,
  fallback?: HTMLElement | null
): void {
  const target = trigger && document.contains(trigger) ? trigger : fallback ?? null;
  moveFocusTo(target);
}
