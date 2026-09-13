"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import { UserAvatar, DEFAULT_AVATAR } from "@/components/user-avatar";

type Props = {
  name: string;
  email: string;
  image: string | null;
  role: string;
};

export function ProfileForm({ name, email, image, role }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(image);
  const [imageData, setImageData] = useState<string>("");
  const [clearImage, setClearImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onPickFile(file: File | null) {
    setError(null);
    setMessage(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 400_000) {
      setError("Image must be under 400KB. Compress it or pick a smaller file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setImageData(result);
      setPreview(result);
      setClearImage(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <form
      className="panel-body space-y-5"
      action={(fd) => {
        startTransition(async () => {
          setError(null);
          setMessage(null);
          if (imageData) fd.set("imageData", imageData);
          if (clearImage) fd.set("clearImage", "1");
          const result = await updateProfileAction(fd);
          if (result?.error) {
            setError(result.error);
            return;
          }
          setMessage(result?.message ?? "Saved.");
          setImageData("");
          if (result && "requireReauth" in result && result.requireReauth) {
            router.push("/login?reset=1");
            return;
          }
          router.refresh();
        });
      }}
    >
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar name={name} image={clearImage ? null : preview} size={72} rounded="full" />
        <div className="space-y-2">
          <p className="text-sm text-base-content/60">
            Profile photo · role <span className="font-medium uppercase">{role}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline rounded-xl"
              onClick={() => fileRef.current?.click()}
            >
              Upload photo
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost rounded-xl"
              onClick={() => {
                setClearImage(true);
                setImageData("");
                setPreview(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Use default DP
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-base-content/45">
            Default: <code className="text-[11px]">{DEFAULT_AVATAR}</code> · PNG/JPEG/WebP under 400KB
          </p>
        </div>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Display name</legend>
        <input
          name="name"
          required
          minLength={2}
          defaultValue={name}
          className="input w-full max-w-md rounded-xl"
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Email</legend>
        <input
          value={email}
          disabled
          className="input w-full max-w-md rounded-xl opacity-70"
        />
        <p className="label text-xs opacity-50">Email is used for login and invites; contact an admin to change it.</p>
      </fieldset>

      <div className="divider text-xs opacity-50">Change password (optional)</div>

      <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Current password</legend>
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className="input w-full rounded-xl"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">New password</legend>
          <input
            name="newPassword"
            type="password"
            minLength={6}
            autoComplete="new-password"
            className="input w-full rounded-xl"
          />
        </fieldset>
      </div>

      {error && (
        <div role="alert" className="callout callout-error">
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div role="status" className="callout callout-ok">
          <span>{message}</span>
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary rounded-xl">
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
