"use client";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(
  () => import("@/components/chat/chat-widget").then((mod) => mod.ChatWidget),
  { ssr: false },
);

const InstallAppPrompt = dynamic(
  () => import("@/components/pwa/install-app-prompt").then((mod) => mod.InstallAppPrompt),
  { ssr: false },
);

/** Loads chat + install prompt after hydration so the first paint stays light. */
export function DeferredChrome() {
  return (
    <>
      <ChatWidget />
      <InstallAppPrompt />
    </>
  );
}
