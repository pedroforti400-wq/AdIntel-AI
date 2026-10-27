import { RecentImports, RecentSearches } from "@/components/dashboard/activity-lists";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImportRun, Search } from "@/modules/ads/types";

export function ActivityRecentSearches({ searches }: { searches: Search[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pesquisas recentes</CardTitle>
        <CardDescription>Últimas buscas feitas no explorador.</CardDescription>
      </CardHeader>
      <CardContent>
        <RecentSearches searches={searches} />
      </CardContent>
    </Card>
  );
}

export function ActivityRecentImports({ runs }: { runs: ImportRun[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Importações recentes</CardTitle>
        <CardDescription>Execuções de coleta e seus resultados de deduplicação.</CardDescription>
      </CardHeader>
      <CardContent>
        <RecentImports runs={runs} />
      </CardContent>
    </Card>
  );
}
