"use client";

import ChatInterface from "@/components/ui/customer/ChatInterface";

export default function ChatPage({
    params
}: {
    params: Promise<{ locale: "en" | "kh" }>
}) {
    return <ChatInterface params={params} />;
}