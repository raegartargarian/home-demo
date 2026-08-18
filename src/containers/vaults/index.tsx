import { Skeleton } from "@/components/ui/skeleton";
import NoActivity from "@/shared/components/EmptyData";
import { LoadingIndicator } from "@/shared/components/LoadingIndicator";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import { Home } from "lucide-react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GlobalSelectors } from "../global/selectors";
import VaultItem from "./components/VaultItem";
import { vaultsSelectors } from "./selectors";
import { vaultsActions } from "./slice";
import { PageContainer } from "@/shared/components/PageContainer";

const Vaults = () => {
  const dispatch = useDispatch();

  const vaults = useSelector(vaultsSelectors.vaults);
  const isFirstLoading = useSelector(vaultsSelectors.isFirstLoading);
  const isFetching = useSelector(vaultsSelectors.isFetching);
  const currentPage = useSelector(vaultsSelectors.currentPage);
  const hasMore = useSelector(vaultsSelectors.hasMore);
  const authData = useSelector(GlobalSelectors.authData);

  useEffect(() => {
    dispatch(vaultsActions.fetchVaultsStart({ page: 1 }));
  }, [dispatch, authData]);

  const sentinelRef = useInfiniteScroll({
    hasMore,
    isLoading: isFetching,
    onLoadMore: () =>
      dispatch(vaultsActions.fetchVaultsStart({ page: currentPage + 1 })),
  });

  if (!isFirstLoading && vaults.length === 0) {
    return (
      <div className="min-h-screen bg-surface">
        <PageContainer measure="wide">
          <div className="flex justify-center items-center mt-16">
            <NoActivity
              title="No Homes Found"
              description="No homes have been registered yet. Your properties will appear here once they are set up."
            />
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <PageContainer measure="wide">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-surface-inset border border-line flex items-center justify-center">
              <Home className="w-5 h-5 text-ink" />
            </div>
            <div>
              <h1 className="text-2xl font-medium tracking-tight text-ink">
                Your homes
              </h1>
              <p className="text-sm text-ink-muted">
                View your properties and their complete home record
              </p>
            </div>
          </div>
        </div>

        {/* Home Grid */}
        {isFirstLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                className="h-[230px] w-full bg-surface-inset rounded-xl"
                key={index}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaults.map((vault) => (
                <div key={vault.id}>
                  <VaultItem vault={vault} />
                </div>
              ))}
            </div>
            {hasMore && vaults.length > 0 && (
              <div ref={sentinelRef} aria-hidden className="h-px w-full" />
            )}
            {isFetching && (
              <div className="w-full flex items-center justify-center mt-8">
                <LoadingIndicator />
              </div>
            )}
          </>
        )}
      </PageContainer>
    </div>
  );
};

export default Vaults;
