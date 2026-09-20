import { isNative } from "./platform";

/**
 * The handful of things a web page does that a web view cannot: opening
 * another site, and handing the user a file. Each one returns the browser
 * behaviour to the caller when `isNative()` is false, so there is a single
 * call path and the web keeps exactly what it had.
 */

/**
 * A web view swallows target="_blank": the click does nothing at all. An
 * in-app browser tab keeps the user inside the app and is what both stores
 * expect for outbound links.
 */
export async function openExternal(url: string): Promise<void> {
  if (!isNative()) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url });
}

/**
 * Hands a link to the system share sheet. Returns false in a browser, where
 * the caller keeps whatever it already did - copying to the clipboard, or a
 * print dialog that only exists there.
 */
export async function shareLink(
  url: string,
  title: string,
  text?: string
): Promise<boolean> {
  if (!isNative()) return false;

  const { Share } = await import("@capacitor/share");
  await Share.share({ title, text, url });
  return true;
}

/**
 * Base64 inflates a file by a third and the bridge copies it again, so a
 * single write of a 100 MB video would need roughly half a gigabyte of live
 * strings and get the app killed on a mid-range phone. Writing in slices
 * keeps the peak flat, at one slice at a time.
 */
const SLICE_BYTES = 1024 * 1024;

/**
 * Downloads run through an anchor with a `download` attribute, which a web
 * view ignores - the tap appears to do nothing. Native builds write the file
 * and offer it through the system share sheet, which is also how the user
 * gets it into Files, Drive or anywhere else.
 *
 * Returns false in a browser, where the caller's own download path is right.
 */
export async function saveAndShare(
  blob: Blob,
  filename: string,
  title?: string
): Promise<boolean> {
  if (!isNative()) return false;

  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);

  // Cache, not Documents: the file has already been handed to the share
  // sheet, and copies left in permanent storage grow without limit.
  const target = { path: filename, directory: Directory.Cache };

  // The first slice creates the file, so an empty blob still produces one.
  const { uri } = await Filesystem.writeFile({
    ...target,
    data: await toBase64(blob.slice(0, SLICE_BYTES)),
  });

  for (let offset = SLICE_BYTES; offset < blob.size; offset += SLICE_BYTES) {
    await Filesystem.appendFile({
      ...target,
      data: await toBase64(blob.slice(offset, offset + SLICE_BYTES)),
    });
  }

  await Share.share({ title: title ?? filename, url: uri });
  return true;
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = String(reader.result);
      // readAsDataURL yields "data:<type>;base64,<payload>" and the plugin
      // wants only the payload.
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}
