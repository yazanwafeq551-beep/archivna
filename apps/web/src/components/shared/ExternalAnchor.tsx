import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { isNative } from "@/lib/platform";
import { openExternal } from "@/lib/nativeBridge";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/**
 * A link to somewhere outside the app. In a browser this is an ordinary
 * anchor and behaves like one - middle click, "open in new tab", the status
 * bar preview, all of it. Inside a web view `target="_blank"` is swallowed
 * and the tap does nothing at all, so there the click opens a system browser
 * tab instead.
 */
export function ExternalAnchor({ href, onClick, children, ...rest }: Props) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!isNative() || event.defaultPrevented) return;

    event.preventDefault();
    void openExternal(href);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
