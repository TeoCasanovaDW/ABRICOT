import type { Metadata } from "next";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = {
  title: "Profil",
};

export default function ProfilePage() {
  return <ProfileForm />;
}
