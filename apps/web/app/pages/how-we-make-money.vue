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

        <article class="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-16">
            <p class="text-brand-600 mb-3 text-xs font-semibold uppercase tracking-widest">
                Our pricing promise
            </p>
            <h1 class="font-display text-3xl font-bold text-slate-900 md:text-5xl">
                How Frula makes money — honestly
            </h1>
            <p class="mt-4 text-lg leading-relaxed text-slate-600">
                Most "free" platforms aren't really free. They charge for surprise things, bake fees
                into closings, or sell your data. Here's what Frula actually does, plain and simple.
            </p>

            <!-- Free forever callout -->
            <div
                class="from-brand-50 border-brand/30 mt-10 rounded-2xl border bg-gradient-to-br to-white p-6 md:p-8"
            >
                <h2 class="font-display text-2xl font-bold text-slate-900">
                    💚 Listing and browsing are free, always.
                </h2>
                <p class="mt-3 text-slate-700">
                    This is a commitment, not a trial period. Here's what's always free for
                    everyone:
                </p>
                <ul class="mt-4 space-y-2 text-sm text-slate-700">
                    <li class="flex items-start gap-2">
                        <span class="text-brand font-bold">✓</span>
                        <span>Listing your home — unlimited photos, full property details</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand font-bold">✓</span>
                        <span>Browsing every listing, nationwide, on the map or in the feed</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand font-bold">✓</span>
                        <span>The Dream Home Finder — unlimited searches, unlimited matches</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand font-bold">✓</span>
                        <span>Saving listings to your favorites</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand font-bold">✓</span>
                        <span>Messaging sellers directly, requesting viewings, making offers</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand font-bold">✓</span>
                        <span
                            >Access to the full paperwork directory and transaction checklists</span
                        >
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand font-bold">✓</span>
                        <span>Email notifications for offers, messages, and new matches</span>
                    </li>
                </ul>
                <p class="mt-4 text-sm font-semibold text-slate-900">
                    We will never charge a commission. We will never charge a closing fee. We will
                    never take a percentage of your sale.
                </p>
            </div>

            <!-- So how do we make money -->
            <section class="mt-12">
                <h2 class="font-display text-2xl font-bold text-slate-900 md:text-3xl">
                    So how will Frula make money?
                </h2>
                <p class="mt-3 text-base leading-relaxed text-slate-600">
                    Frula is bootstrapped and growing slowly on purpose. We don't have investors
                    pushing us to squeeze every user. Here are the two ways we plan to bring in
                    revenue — both optional, both transparent, and neither gets in your way.
                </p>

                <div class="mt-6 space-y-6">
                    <!-- Revenue stream 1 -->
                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <div class="flex items-start gap-3">
                            <div class="text-2xl">🚀</div>
                            <div>
                                <h3 class="font-display text-lg font-bold text-slate-900">
                                    1. Optional visibility boosts for sellers
                                </h3>
                                <p class="mt-2 text-sm leading-relaxed text-slate-600">
                                    Once Frula has enough buyer traffic that listings start
                                    competing for attention, we'll offer small à la carte add-ons
                                    sellers can buy if they want extra prominence. Things like:
                                </p>
                                <ul class="mt-3 space-y-1.5 text-sm text-slate-700">
                                    <li>
                                        • <strong>Featured placement</strong> — your listing appears
                                        at the top of search results and in Dream Home matches for a
                                        set period
                                    </li>
                                    <li>
                                        • <strong>Listing refresh</strong> — bumps your listing back
                                        to the top of the "newest" sort
                                    </li>
                                    <li>
                                        • <strong>Social share kit</strong> — auto-generated images
                                        for Instagram, Facebook, and Nextdoor
                                    </li>
                                </ul>
                                <p class="mt-3 text-sm leading-relaxed text-slate-600">
                                    These will always be optional add-ons in the
                                    <strong>$9 to $29 range</strong> — not subscriptions, not
                                    required, not upsell pressure. If you never buy one, your
                                    listing still works perfectly.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Revenue stream 2 -->
                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <div class="flex items-start gap-3">
                            <div class="text-2xl">🤝</div>
                            <div>
                                <h3 class="font-display text-lg font-bold text-slate-900">
                                    2. Curated directory of vetted service providers
                                </h3>
                                <p class="mt-2 text-sm leading-relaxed text-slate-600">
                                    Every home sale involves a handful of professionals — title
                                    companies, home inspectors, mortgage brokers, closing attorneys,
                                    photographers. When you need one, we'll eventually have a
                                    directory where buyers and sellers can find vetted local
                                    options. Providers pay a small fee to appear in the directory.
                                </p>
                                <p class="mt-3 text-sm leading-relaxed text-slate-600">
                                    <strong>We will never run programmatic display ads</strong>
                                    (Google AdSense, banner networks, etc.). Those degrade trust and
                                    fill pages with scammy junk. Every sponsored provider in our
                                    directory will be hand-vetted, clearly labeled, and relevant to
                                    home transactions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- What we won't do -->
            <section class="mt-12">
                <h2 class="font-display text-2xl font-bold text-slate-900 md:text-3xl">
                    What Frula will never do
                </h2>
                <p class="mt-3 text-base leading-relaxed text-slate-600">
                    Since you've probably been burned by a "free" service before, here's our
                    explicit list of things we're committing never to do.
                </p>
                <ul class="mt-6 space-y-3 text-sm text-slate-700">
                    <li class="flex items-start gap-2">
                        <span class="text-red-500">✗</span>
                        <span>
                            <strong>Never take a commission on your sale.</strong> Not 6%, not 1%,
                            not a flat closing fee. What you sell your home for is what you keep
                            (minus whatever your title company and lender charge, of course — that's
                            between you and them).
                        </span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-red-500">✗</span>
                        <span>
                            <strong>Never charge buyers a single penny.</strong> Browsing,
                            searching, matching, saving, messaging, offering — all free forever.
                        </span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-red-500">✗</span>
                        <span>
                            <strong>Never become a brokerage.</strong> We're not licensed to
                            represent you, and we never will be. Other "FSBO" platforms quietly
                            operate as flat-fee brokerages — we don't, and this is deliberate.
                        </span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-red-500">✗</span>
                        <span>
                            <strong>Never sell your data to anyone.</strong> Your information is
                            yours. We use it to run the platform and nothing else.
                        </span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-red-500">✗</span>
                        <span>
                            <strong>Never run programmatic display ads.</strong> No Google AdSense,
                            no banner networks, no pop-ups.
                        </span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-red-500">✗</span>
                        <span>
                            <strong>Never hide fees in the fine print.</strong> If anything ever
                            costs money, you'll know exactly what and how much before you buy it.
                        </span>
                    </li>
                </ul>
            </section>

            <!-- Founder note -->
            <section class="mt-12 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                <p class="text-brand-600 text-xs font-semibold uppercase tracking-widest">
                    A note from the founder
                </p>
                <p class="mt-3 text-base leading-relaxed text-slate-700">
                    Frula Homes is a solo project, built on evenings and weekends by someone who
                    actually cares about getting this right. I'd rather grow slowly and treat people
                    well than pump up the metrics by charging for things that should be free. If
                    Frula is useful to you, tell a friend — that helps more than any ad budget
                    would.
                </p>
                <p class="mt-3 text-sm text-slate-500">— Missa, Frula Homes</p>
            </section>

            <div class="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <NuxtLink
                    to="/sell"
                    class="bg-brand hover:bg-brand-600 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-sm transition"
                >
                    List your home (free)
                </NuxtLink>
                <NuxtLink
                    to="/browse"
                    class="hover:border-brand hover:text-brand rounded-full border border-slate-300 px-8 py-3 text-sm font-semibold text-slate-700 transition"
                >
                    Browse listings
                </NuxtLink>
            </div>
        </article>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
const moneyDesc =
    'Listing on Frula Homes is free forever. We make money through optional seller visibility boosts and a curated directory of vetted service providers — never commissions, never hidden fees.'
useSeoMeta({
    title: 'How Frula Homes makes money — Frula Homes',
    description: moneyDesc,
    ogTitle: 'How Frula Homes makes money — Frula Homes',
    ogDescription: moneyDesc,
    ogType: 'website',
    ogSiteName: 'Frula Homes',
    twitterCard: 'summary',
    twitterTitle: 'How Frula Homes makes money',
    twitterDescription: moneyDesc,
})
</script>
