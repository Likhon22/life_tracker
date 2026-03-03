import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { rateLimit } from "@/lib/rateLimit";
import { NextResponse } from "next/server";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                // Attach the user's Google ID to the session so we can query DB
                session.user.id = token.sub as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        }
    }
};

const handler = NextAuth(authOptions);

async function rateLimitedHandler(request: Request, context: any) {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const limitResult = rateLimit(`auth_${ip}`, 20, 60 * 1000); // 20 attempts per minute

    if (!limitResult.success) {
        return new Response("Too many requests", { status: 429 });
    }

    return (handler as any)(request, context);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
