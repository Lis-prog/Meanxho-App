import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { getCurrentUser } from "@/lib/current-user";
import { isLocale } from "@/lib/i18n";

export default async function OnboardingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user || !isLocale(user.locale)) redirect("/api/session/end");
  if (user.onboardingCompletedAt) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-col px-5 py-6">
      <Wordmark />
      <div id="content" className="mt-10">
        {children}
      </div>
    </div>
  );
}
