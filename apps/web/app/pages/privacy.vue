<template>
    <main class="min-h-screen bg-slate-50">
        <header class="border-b border-slate-200 bg-white">
            <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 md:px-8">
                <NuxtLink to="/" class="font-display text-brand text-2xl font-bold"
                    >Frula Homes</NuxtLink
                >
                <AuthNav />
            </div>
        </header>

        <article class="mx-auto max-w-3xl px-4 py-12 md:px-8">
            <p class="text-brand-600 text-xs font-semibold uppercase tracking-widest">Legal</p>
            <h1 class="font-display mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
                Privacy Policy
            </h1>
            <p class="mt-2 text-sm text-slate-500">Last updated: April 9, 2026</p>

            <div class="prose prose-slate mt-8 max-w-none text-slate-700">
                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">
                    The short version
                </h2>
                <p>
                    Frula Homes is an information platform for buying and selling homes yourself. We
                    collect the minimum amount of personal information needed to operate the
                    platform, we don't sell your data, and we don't run third-party ad networks. If
                    you delete your account, we delete your data.
                </p>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">What we collect</h2>
                <ul>
                    <li>
                        <strong>Account information:</strong> your email address, password (stored
                        as a one-way hash), display name, and any profile details you choose to
                        provide.
                    </li>
                    <li>
                        <strong>Listing information:</strong> the addresses, photos, descriptions,
                        and prices of any homes you list. Active listings are public by design.
                    </li>
                    <li>
                        <strong>Messages, offers, and viewing requests</strong> you send through the
                        platform. These are visible to the other party in the conversation.
                    </li>
                    <li>
                        <strong>Saved listings and dream-home preferences</strong> you set, used
                        only to power your matching results and notifications.
                    </li>
                    <li>
                        <strong>Listing view counts</strong> on listings you visit, used to give
                        sellers anonymous engagement stats. We don't reveal which individuals viewed
                        which listings.
                    </li>
                </ul>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">How we use it</h2>
                <ul>
                    <li>
                        To run the platform — show you listings, send your messages to recipients,
                        fire notifications, etc.
                    </li>
                    <li>
                        To send you account-related emails (password resets, new offers, viewing
                        requests, etc). We don't send marketing emails without your consent.
                    </li>
                    <li>To prevent abuse and keep the platform safe for everyone.</li>
                </ul>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">
                    What we don't do
                </h2>
                <ul>
                    <li><strong>We don't sell your personal data</strong> to anyone.</li>
                    <li>
                        <strong>We don't run third-party ad networks</strong> like Google AdSense.
                        Any sponsored placements on Frula are hand-vetted by us and clearly labeled.
                    </li>
                    <li>
                        <strong>We don't track you across other websites</strong>. No cross-site
                        cookies, no fingerprinting.
                    </li>
                    <li>
                        <strong
                            >We don't share buyer behavior with sellers in identifying ways.</strong
                        >
                        Sellers see anonymous aggregate stats (e.g. "12 people saved this home"),
                        not individual identities.
                    </li>
                </ul>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">
                    Third-party services we use
                </h2>
                <ul>
                    <li>
                        <strong>Supabase</strong> hosts our database and handles authentication.
                    </li>
                    <li><strong>Cloudinary</strong> stores listing photos.</li>
                    <li>
                        <strong>Mapbox</strong> renders the interactive maps. Mapbox does receive a
                        request from your browser when a map loads.
                    </li>
                    <li>
                        <strong>Resend</strong> delivers transactional emails (password resets,
                        offers, viewing requests).
                    </li>
                    <li>
                        <strong>OpenStreetMap / Nominatim</strong> handles geocoding when sellers
                        add a new address.
                    </li>
                </ul>
                <p>
                    Each of these has its own privacy policy. We chose them because they have
                    reasonable privacy practices and don't require us to hand over more data than
                    necessary.
                </p>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">Your rights</h2>
                <p>
                    You can request a copy of your data, edit your profile, or delete your account
                    at any time. Deleting your account removes your profile, listings, saved homes,
                    and message history. Some records may be retained for legal or anti-abuse
                    reasons (e.g. messages reported as harassment).
                </p>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">Contact</h2>
                <p>
                    Questions? Email
                    <a href="mailto:hello@frulahomes.com" class="text-brand underline"
                        >hello@frulahomes.com</a
                    >. We're a small operation — replies usually within a few days.
                </p>
            </div>
        </article>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
useSeoMeta({
    title: 'Privacy Policy — Frula Homes',
    description: 'How Frula Homes collects, uses, and protects your information.',
    ogTitle: 'Privacy Policy — Frula Homes',
    ogDescription: 'How Frula Homes collects, uses, and protects your information.',
    ogType: 'website',
    ogSiteName: 'Frula Homes',
})
</script>
