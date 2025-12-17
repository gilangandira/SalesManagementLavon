import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import loginBg from "../../../public/images/login.jpg";

export default function LoginPage() {
  return (

    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Image
        src={loginBg}
        alt="Login Background"
        fill
        className="object-cover  -z-10 "
      />
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
