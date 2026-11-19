import { logoutAction } from "@/server/auth";
import { t, type Locale } from "@/lib/i18n";
import { quietButtonClass } from "@/lib/styles";

function DoorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M12 3.5h3.2A1.3 1.3 0 0 1 16.5 4.8v10.4a1.3 1.3 0 0 1-1.3 1.3H12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M11.5 10H3.5m0 0 2.5-2.5M3.5 10 6 12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoutButton({ locale, wide }: { locale: Locale; wide?: boolean }) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={`${quietButtonClass} ${wide ? "w-full" : ""}`}>
        <DoorIcon />
        {t(locale, "logout")}
      </button>
    </form>
  );
}
