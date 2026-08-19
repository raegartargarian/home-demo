import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalSelectors } from "@/containers/global/selectors";
import { useWeb3Auth } from "@/containers/global/Web3AuthProvider";
import { useWalletAddress } from "@/shared/hooks/useWalletAddr";
import { LogOut } from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { CopyableHash } from "./CopyableHash";

/** First letter of whatever we know them by, for the avatar with no picture. */
const initialFor = (name?: string, email?: string): string =>
  (name?.trim()?.[0] ?? email?.trim()?.[0] ?? "?").toUpperCase();

/**
 * The account control in the top bar.
 *
 * Replaces the bare "Log out" button that used to sit here. Signing out is a
 * rare, destructive-feeling action and it was the single most prominent control
 * on every page — one mis-click from the nav pill. Behind an avatar it takes a
 * deliberate second click, and the space buys somewhere to show *who* is signed
 * in and which wallet the records are being filed under, which is what
 * filedgr-web-app's profile panel does.
 *
 * A menu rather than that app's slide-out sheet: its panel carries balances,
 * transfers and transaction history, none of which exist here.
 */
export const ProfileMenu: React.FC = () => {
  const { logout } = useWeb3Auth() || {};
  const authData = useSelector(GlobalSelectors.authData);
  const walletAddress = useWalletAddress();

  const user = authData?.userWeb3;
  const label = user?.name || user?.email || "Signed in";

  // Web3Auth hands back whatever avatar the login provider had, and those URLs
  // expire, 403 on a hotlink, or are simply absent. A broken-image glyph in the
  // header is worse than no picture at all, so one failed load falls back to
  // the initial for the rest of the session.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!user?.profileImage && !imageFailed;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account"
        className="flex items-center gap-2 rounded-full p-0.5 pr-1 text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {showImage ? (
          <img
            src={user.profileImage}
            alt=""
            onError={() => setImageFailed(true)}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blueprint-surface text-sm font-medium text-blueprint-ink">
            {initialFor(user?.name, user?.email)}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64"
      >
        <div className="px-2 py-2">
          <p className="truncate text-sm font-medium text-ink">{label}</p>
          {user?.email && user.name && (
            <p className="truncate text-xs text-ink-subtle">{user.email}</p>
          )}
          {walletAddress && (
            <div className="mt-2">
              <p className="text-[11px] uppercase tracking-wide text-ink-subtle">
                Wallet
              </p>
              {/* The address every record is filed under — worth being able to
                  read off and paste somewhere, which is why it is copyable
                  rather than plain text. */}
              <CopyableHash value={walletAddress} chars={6} className="mt-0.5" />
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="bg-line/60" />

        <DropdownMenuItem
          onSelect={() => logout?.()}
          className="gap-2 rounded-lg px-2 py-2 text-sm text-ink-muted focus:bg-surface-inset focus:text-ink"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
