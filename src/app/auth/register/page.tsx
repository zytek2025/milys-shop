'use client';

import { RegisterForm } from "@/components/auth/register-form"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
    const router = useRouter();

    return (
        <div className="container relative h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
                <div className="absolute inset-0 bg-zinc-900" />
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-6 w-6"
                    >
                        <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                    </svg>
                    Mily's Premium Shop
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;El estilo es una forma de decir quién eres sin tener que hablar.&rdquo;
                        </p>
                        <footer className="text-sm">Mily's Shop</footer>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Crear una cuenta
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Ingresa tus datos para registrarte
                        </p>
                    </div>
                    <RegisterForm onSuccess={() => router.push('/')} />
                    <p className="px-8 text-center text-sm text-muted-foreground">
                        <Link
                            href="/auth/login"
                            className="hover:text-brand underline underline-offset-4"
                        >
                            ¿Ya tienes cuenta? Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
