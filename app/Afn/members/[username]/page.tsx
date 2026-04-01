import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth-helpers";
import { absoluteFromSiteBase, getSiteOriginForMetadata } from "@/lib/siteUrl";
import { getAfnProfileByUsername, getAfnProfileSettings } from "@server/afnStorage";
import { FOUNDER_TYPE_LABELS, isFounderType } from "@/lib/community/constants";
import { MemberProfilePageClient } from "./MemberProfilePageClient";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const viewer = await getSessionUser();
  const viewerId = viewer?.id ? Number(viewer.id) : null;
  const profile = await getAfnProfileByUsername(username);
  if (!profile) {
    return { title: "Member | Ascendra Founder Network", robots: { index: false, follow: false } };
  }
  const settings = await getAfnProfileSettings(profile.userId);
  const isOwn = viewerId === profile.userId;
  if (settings?.profileVisibility === "private" && !isOwn) {
    return { title: "Member | Ascendra Founder Network", robots: { index: false, follow: false } };
  }

  const base = getSiteOriginForMetadata();
  const path = `/Afn/members/${encodeURIComponent(username)}`;
  const name = profile.displayName || profile.username || profile.fullName || "Member";
  const baseDesc =
    profile.headline?.trim() ||
    (profile.bio ? profile.bio.replace(/\s+/g, " ").slice(0, 155) : "") ||
    `Connect with ${name} on the Ascendra Founder Network.`;
  const tribe =
    profile.founderTribe && isFounderType(profile.founderTribe)
      ? FOUNDER_TYPE_LABELS[profile.founderTribe]
      : null;
  const description = tribe ? `${baseDesc} ${tribe}.` : baseDesc;

  const shareImage =
    profile.coverImageUrl?.trim() ||
    profile.avatarUrl?.trim() ||
    "";
  const shareImageAbs = shareImage ? absoluteFromSiteBase(base, shareImage) : undefined;

  return {
    title: `${name} | Ascendra Founder Network`,
    description,
    alternates: { canonical: `${base}${path}` },
    openGraph: {
      title: `${name} | Ascendra Founder Network`,
      description,
      url: `${base}${path}`,
      type: "profile",
      ...(shareImageAbs ? { images: [{ url: shareImageAbs }] } : {}),
    },
    twitter: {
      card: shareImageAbs ? "summary_large_image" : "summary",
      title: name,
      description,
      ...(shareImageAbs ? { images: [shareImageAbs] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function CommunityMemberProfilePage({ params }: PageProps) {
  const { username } = await params;
  const viewer = await getSessionUser();
  const viewerId = viewer?.id ? Number(viewer.id) : null;
  const profile = await getAfnProfileByUsername(username);
  if (!profile) notFound();
  const settings = await getAfnProfileSettings(profile.userId);
  const isOwn = viewerId === profile.userId;
  if (settings?.profileVisibility === "private" && !isOwn) notFound();
  const showContactLinks = isOwn || settings?.showContactLinks !== false;

  const siteBase = getSiteOriginForMetadata();
  const slug = profile.username ?? username;
  const publicUrl = `${siteBase}/Afn/members/${encodeURIComponent(slug)}`;
  const displayName = profile.displayName || profile.username || profile.fullName || "Member";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    description: profile.headline || profile.bio?.slice(0, 280) || undefined,
    url: publicUrl,
    ...(profile.coverImageUrl?.trim()
      ? { image: absoluteFromSiteBase(siteBase, profile.coverImageUrl.trim()) }
      : profile.avatarUrl?.trim()
        ? { image: absoluteFromSiteBase(siteBase, profile.avatarUrl.trim()) }
        : {}),
    ...(profile.location ? { workLocation: { "@type": "Place", name: profile.location } } : {}),
    ...(profile.linkedinUrl ? { sameAs: [profile.linkedinUrl] } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MemberProfilePageClient
        profile={profile}
        showContactLinks={showContactLinks}
        isOwnProfile={isOwn}
        viewerUserId={viewerId}
      />
    </>
  );
}
