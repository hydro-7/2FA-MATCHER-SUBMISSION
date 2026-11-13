import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Bell, Moon, Sun, CalendarDays, House, LogIn, LogOut, RefreshCw, Search, SquarePlus, UserRound, Users } from "lucide-react";
import { CITY_PHOTO_CREDITS, HERO_PHOTO, NAV_ITEMS, PHOTO_CREDITS_PATH } from "../../constants/app";
import { ROUTES } from "../../config/routes";
import { assetUrl } from "../../lib/format";
import { useResource } from "../../hooks/useResource";
import { groupService } from "../../services/groupService";
import { travellerService } from "../../services/travellerService";
import { useSession } from "../../store/session";
import { useTheme } from "../../store/theme";
import { useToasts } from "../../store/toast";
import { AuthModal } from "../AuthModal";

const NAV_ICONS = {
  [ROUTES.HOME]: House,
  [ROUTES.DISCOVER]: Users,
  [ROUTES.TRIPS]: CalendarDays,
  [ROUTES.NEW_GROUP]: SquarePlus,
};

function useLoadProfile() {
  const { userId, profile, setProfile, signOut } = useSession();
  useEffect(() => {
    if (!userId) return signOut();
    if (profile?.id === userId) return;
    let active = true;
    const selectedId = userId;
    const stillSelected = () => active && useSession.getState().userId === selectedId;
    travellerService
      .me()
      .then((loadedProfile) => {
        if (stillSelected()) setProfile(loadedProfile);
      })
      .catch((error) => {
        if (!stillSelected()) return;
        if (error.status === 401) signOut();
        else useSession.setState({ ready: true });
      });
    return () => {
      active = false;
    };
  }, [userId, profile, setProfile, signOut]);
}

function useSearchShortcut() {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate(ROUTES.DISCOVER);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
}

function UserMenu({ profile, onAuth }) {
  const [open, setOpen] = useState(false);
  const signOut = useSession((state) => state.signOut);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [leaving, setLeaving] = useState(false);
  const menu = useRef(null);
  // Stays open until a click outside it or Escape; moving the cursor away does not close it.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event) => !menu.current?.contains(event.target) && setOpen(false);
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  // Sign out only once Home is showing, so the route guard never asks this user to sign back in.
  useEffect(() => {
    if (!leaving || pathname !== ROUTES.HOME) return;
    setLeaving(false);
    signOut();
  }, [leaving, pathname, signOut]);
  if (!profile)
    return (
      <>
        <button className="text-button" onClick={() => onAuth("signin")}>
          Sign in
        </button>
        <button className="signup-btn" onClick={() => onAuth("signup")}>
          <LogIn size={18} /> Sign up
        </button>
      </>
    );
  return (
    <div className="me" ref={menu}>
      <button className="me-btn" aria-expanded={open} aria-label="Account menu" onClick={() => setOpen(!open)}>
        {profile.name.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div className="me-menu">
          <strong>{profile.name}</strong>
          <small>{profile.homeCity}</small>
          <Link to={ROUTES.PROFILE} onClick={() => setOpen(false)}>
            <UserRound size={16} /> Your profile
          </Link>
          <Link to={ROUTES.FRIENDS} onClick={() => setOpen(false)}>
            <Users size={16} /> Friends
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              onAuth("demo");
            }}
          >
            <RefreshCw size={16} /> Switch traveller
          </button>
          <button
            onClick={() => {
              setOpen(false);
              setLeaving(true);
              navigate(ROUTES.HOME);
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppLayout() {
  useLoadProfile();
  useSearchShortcut();
  const profile = useSession((state) => state.profile);
  const toasts = useToasts((state) => state.toasts);
  const location = useLocation();
  const groups = useResource(() => (profile ? groupService.mine() : Promise.resolve([])), `${profile?.id}:${location.pathname}`);
  const pending = (groups.data ?? []).reduce((sum, group) => sum + (group.pendingRequestCount ?? 0), 0);
  const intended = location.state?.from?.split("?")[0];
  const switching = useSession((state) => state.signInOpen);
  const setSwitching = useSession((state) => state.setSignInOpen);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to={ROUTES.HOME} className="logo" aria-label="Travel Together home">
            <img className="logo-mark" src="/booking-logo.png" alt="" />
            <span className="logo-text">Travel Together</span>
          </Link>
          <nav className="topnav" aria-label="Main">
            {NAV_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item.to];
              return (
                <NavLink key={item.to} to={item.to} end className={({ isActive }) => (isActive || intended === item.to ? "active" : "")}>
                  <Icon size={21} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="topbar-actions">
            <Link to={ROUTES.DISCOVER} className="pill-btn" aria-label="Search groups">
              <Search size={20} />
              <kbd>Search</kbd>
            </Link>
            <ThemeToggle />
            {profile && (
              <Link to={ROUTES.TRIPS} className="round-btn" aria-label={`${pending} pending join requests`}>
                <Bell size={20} />
                {pending > 0 && <span className="ping" />}
              </Link>
            )}
            <UserMenu profile={profile} onAuth={setSwitching} />
          </div>
        </div>
      </header>
      {switching && <AuthModal key={switching} initialTab={switching} onClose={() => setSwitching(false)} />}
      <main key={profile?.id}>
        <Outlet />
      </main>
      <footer>
        Travel Together · demo bookings, no payment{" "}
        <span>
          <a href={assetUrl(PHOTO_CREDITS_PATH)} target="_blank" rel="noreferrer">
            Hotel photo credits
          </a>
          <a href={HERO_PHOTO.CREDITS} target="_blank" rel="noreferrer">
            Hero photo credit
          </a>
          <a href={CITY_PHOTO_CREDITS} target="_blank" rel="noreferrer">
            City photo credits
          </a>
        </span>
      </footer>
      <div className="toasts" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast ${item.tone}`}>
            {item.message}
          </div>
        ))}
      </div>
    </>
  );
}

function ThemeToggle() {
  useTheme((state) => state.theme);
  const { isDark, toggle } = useTheme.getState();
  const dark = isDark();
  return (
    <button type="button" className="round-btn" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggle}>
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
