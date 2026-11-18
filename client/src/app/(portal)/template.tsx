/** Re-mounts on every navigation, so each page fades in. */
export default function PortalTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
