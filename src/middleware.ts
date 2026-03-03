export { default } from "next-auth/middleware";

export const config = {
    // Only protect routes inside the app (e.g., dashboard pages)
    // We already manually protect /api routes with getServerSession
    matcher: [
        "/dashboard/:path*",
        "/settings/:path*",
        "/goals/:path*",
        "/finance/:path*",
        // If the homepage is also the dashboard, we can protect '/' 
        // But since we built a beautiful login UI on '/', we skip putting '/' in the matcher,
        // and let the client-side session handle the redirect instead on the homepage.
    ]
};
