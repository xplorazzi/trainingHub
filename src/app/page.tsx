import { CatalogClient } from "@/components/catalog/catalog-client";
import { OnboardingBanner } from "@/components/onboarding/onboarding-banner";
import { getSessionUser } from "@/lib/auth";
import { getCatalogModules } from "@/lib/modules";

async function loadCatalog(userId?: string) {
  const modules = await getCatalogModules(userId);
  return modules.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    description: m.description,
    category: m.category,
    durationMins: m.durationMins,
    thumbnail: m.thumbnail,
    required: m.required,
    progress: m.progress,
  }));
}

export default async function HomePage() {
  const user = await getSessionUser();
  const catalogModules = await loadCatalog(user?.id);

  return (
    <div>
      <OnboardingBanner />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Training catalog</h1>
        <p className="mt-2 text-slate-600">
          Complete video modules and quizzes to track your progress.
        </p>
      </div>
      <CatalogClient modules={catalogModules} />
    </div>
  );
}
