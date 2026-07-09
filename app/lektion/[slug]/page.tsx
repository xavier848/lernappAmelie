"use client";

// Lektions-Route /lektion/[slug] (Spec §4.2): duenner Client-Wrapper,
// der den slug per useParams liest (Next 15: params-Prop waere ein Promise,
// useParams aus next/navigation ist im Client der einfache Weg) und den
// LessonPlayer rendert.
import { useParams } from "next/navigation";
import { LessonPlayer } from "@/components/player/LessonPlayer";

export default function LektionPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug)
    ? (params.slug[0] ?? "")
    : (params?.slug ?? "");

  return <LessonPlayer slug={slug} />;
}
