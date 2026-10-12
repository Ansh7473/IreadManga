import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AvatarPreset, type RankTier } from "../api";
import { useAuth } from "../auth/AuthContext";
import { getToken, saveSession, type AuthUser } from "../auth/session";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { RankBadge } from "../components/RankBadge";
import { usePageTitle } from "../hooks/usePageTitle";

function rankOrder(ranks: RankTier[], id: string) {
  return ranks.findIndex((r) => r.id === id);
}

export default function SettingsPage() {
  usePageTitle("Settings");
  const { user, logout, loading, refresh } = useAuth();
  const [avatars, setAvatars] = useState<AvatarPreset[]>([]);
  const [ranks, setRanks] = useState<RankTier[]>([]);
  const [bio, setBio] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setBio(user.bio);
    setSelectedAvatar(user.avatarId);
  }, [user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.avatars();
        if (alive) {
          setAvatars(res.data);
          setRanks(res.ranks);
        }
      } catch {
        /* optional */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const selectedPreset = useMemo(
    () => avatars.find((a) => a.id === selectedAvatar),
    [avatars, selectedAvatar],
  );

  if (loading) return <div className="skeleton" style={{ height: 200 }} />;

  if (!user) {
    return (
      <div className="empty-state">
        You are not signed in. <Link to="/login">Sign in</Link>
      </div>
    );
  }

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api.patchProfile({
        bio,
        avatarId: selectedAvatar,
      });
      const token = getToken();
      if (token) saveSession(token, updated as AuthUser);
      await refresh();
      setMessage("Profile saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const progressPct = Math.round(user.rankProgress.progress * 100);

  return (
    <div className="settings-page">
      <h1>Account</h1>
      <div className="settings-card">
        <ProfileAvatar
          avatarId={user.avatarId}
          glyph={selectedPreset?.glyph}
          gradient={selectedPreset?.gradient}
          size="lg"
          title={user.displayName}
        />
        <div>
          <div className="settings-name-row">
            <strong>{user.displayName}</strong>
            <RankBadge label={user.rank.label} size="md" />
          </div>
          <p>{user.email}</p>
          <p className="settings-stat">
            {user.chaptersRead} chapters read
          </p>
          <small>Member since {new Date(user.createdAt).toLocaleDateString()}</small>
        </div>
      </div>

      <div className="rank-progress block">
        <div className="block-head">
          <h2>Reader rank</h2>
          <Link className="block-more" to="/leaderboard">
            Leaderboard »
          </Link>
        </div>
        {user.rankProgress.next ? (
          <>
            <p className="rank-progress-label">
              {progressPct}% toward {user.rankProgress.next.label} ·{" "}
              {user.rankProgress.remaining} chapters left
            </p>
            <div className="rank-progress-bar" aria-hidden>
              <span style={{ width: `${progressPct}%` }} />
            </div>
          </>
        ) : (
          <p className="rank-progress-label">Max rank — Legend reader.</p>
        )}
      </div>

      <div className="settings-section">
        <label htmlFor="profile-bio">Bio</label>
        <textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={280}
          placeholder="Favorite genres, currently reading…"
        />
      </div>

      <div className="settings-section">
        <h2>Profile avatar</h2>
        <p className="settings-note">
          Advanced avatars unlock as you rank up. Locked ones show the required
          rank.
        </p>
        <div className="avatar-grid">
          {avatars.map((a) => {
            const unlocked =
              rankOrder(ranks, user.rank.id) >= rankOrder(ranks, a.unlockRankId);
            const active = selectedAvatar === a.id;
            return (
              <button
                key={a.id}
                type="button"
                className={`avatar-pick ${active ? "avatar-pick--active" : ""} ${!unlocked ? "avatar-pick--locked" : ""}`}
                disabled={!unlocked}
                onClick={() => setSelectedAvatar(a.id)}
                title={
                  unlocked
                    ? a.label
                    : `Unlock at ${ranks.find((r) => r.id === a.unlockRankId)?.label ?? a.unlockRankId}`
                }
              >
                <ProfileAvatar
                  avatarId={a.id}
                  glyph={a.glyph}
                  gradient={a.gradient}
                  size="md"
                />
                <span className="avatar-pick-label">{a.label}</span>
                {a.tier === "advanced" ? (
                  <span className="avatar-pick-tag">Pro</span>
                ) : null}
                {!unlocked ? <span className="avatar-pick-lock">🔒</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}
      {message ? <p className="settings-saved">{message}</p> : null}

      <div className="settings-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={saving}
          onClick={() => void saveProfile()}
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
          Sign out
        </button>
      </div>

      <p className="settings-note">
        Bookmarks and reading history remain in local storage. Server rank grows
        when you read chapters while signed in.
      </p>
    </div>
  );
}
