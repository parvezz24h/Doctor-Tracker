/**
 * Inline script that runs while the HTML is parsed, before React hydrates.
 * The type swap avoids React's dev warning about rendering <script> tags.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
