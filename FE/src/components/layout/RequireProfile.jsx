import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { ROUTES } from "../../config/routes";
import { useSession } from "../../store/session";
import { Loading } from "../ui";

// Signed-out visitors stay on Home and get the auth popup instead of a separate page.
export function RequireProfile() {
  const { profile, ready, setSignInOpen } = useSession();
  const blocked = ready && !profile;
  useEffect(() => {
    if (blocked) setSignInOpen("signin");
  }, [blocked, setSignInOpen]);
  if (!ready) return <Loading label="Loading your profile…" />;
  if (!profile) return <Navigate to={ROUTES.HOME} replace />;
  return <Outlet />;
}
