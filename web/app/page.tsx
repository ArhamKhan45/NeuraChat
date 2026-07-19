import ChatScreen from "@/components/my/chat/ChatScreen";
import { createMetadata } from "@/config/metadata";

export const metadata = createMetadata({
  title: "Dashboard",
});

export default function HomePage() {
  return <ChatScreen />;
}
