<template>
    <main>
        <!-- Hero -->
        <section class="from-brand-50 bg-gradient-to-b to-white px-6 pb-20 pt-16 md:pb-28 md:pt-24">
            <div class="mx-auto max-w-5xl text-center">
                <p class="text-brand-600 mb-4 text-sm font-medium uppercase tracking-widest">
                    For Sale By Owner — Nationwide
                </p>
                <h1
                    class="font-display text-4xl font-bold leading-tight text-slate-900 md:text-6xl"
                >
                    Sell your home.<br />Keep the commission.
                </h1>
                <p class="mx-auto mt-6 max-w-2xl text-lg text-slate-600 md:text-xl">
                    Frula Homes gives you everything an agent does — listing, photos, market
                    analysis, paperwork guides, and a transaction checklist — without the 6% fee.
                </p>
                <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <NuxtLink
                        to="/sell"
                        class="bg-brand shadow-brand/20 hover:bg-brand-600 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition"
                    >
                        List Your Home
                    </NuxtLink>
                    <NuxtLink
                        to="/browse"
                        class="hover:border-brand hover:text-brand rounded-full border border-slate-300 px-8 py-4 text-base font-semibold text-slate-700 transition"
                    >
                        Browse Listings
                    </NuxtLink>
                </div>
            </div>
        </section>

        <!-- Dream Home callout -->
        <section class="px-6 pb-20">
            <div class="mx-auto max-w-5xl">
                <NuxtLink
                    to="/dream-home"
                    class="from-brand to-brand-600 group relative block overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white shadow-xl transition hover:shadow-2xl md:p-12"
                >
                    <!-- Decorative blurs -->
                    <div
                        class="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
                    ></div>
                    <div
                        class="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl"
                    ></div>

                    <div class="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
                        <div>
                            <p
                                class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur"
                            >
                                ✨ For buyers
                            </p>
                            <h2 class="font-display text-3xl font-bold leading-tight md:text-4xl">
                                Find your dream home in 60 seconds.
                            </h2>
                            <p class="mt-3 max-w-2xl text-base text-white/90 md:text-lg">
                                Tell us what your dream home looks like — beds, views, waterfront,
                                garage, anything. We'll rank every for-sale-by-owner listing in the
                                country by how well it matches, and email you when new ones show up.
                            </p>
                        </div>
                        <div class="flex md:justify-end">
                            <span
                                class="text-brand inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold shadow-lg transition group-hover:scale-105"
                            >
                                Try it free →
                            </span>
                        </div>
                    </div>
                </NuxtLink>
            </div>
        </section>

        <!-- Stats -->
        <section class="border-y border-slate-100 bg-white px-6 py-12">
            <div class="mx-auto grid max-w-5xl grid-cols-1 gap-8 text-center md:grid-cols-3">
                <div>
                    <div class="font-display text-brand text-4xl font-bold">$18,000</div>
                    <p class="mt-2 text-sm text-slate-600">
                        Average commission saved on a $300k home
                    </p>
                </div>
                <div>
                    <div class="font-display text-brand text-4xl font-bold">74%</div>
                    <p class="mt-2 text-sm text-slate-600">Of homebuyers search on mobile first</p>
                </div>
                <div>
                    <div class="font-display text-brand text-4xl font-bold">$49</div>
                    <p class="mt-2 text-sm text-slate-600">Starting price to list your home</p>
                </div>
            </div>
        </section>

        <!-- Features -->
        <section class="px-6 py-20">
            <div class="mx-auto max-w-5xl">
                <h2 class="font-display text-center text-3xl font-bold md:text-4xl">
                    Everything you need to sell
                </h2>
                <div class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        title="Smart Listing Builder"
                        description="Photo uploads, auto-fill from public parcel data, and a guided form built for mobile."
                    />
                    <FeatureCard
                        title="Free CMA Tool"
                        description="Real comparable sales analysis built on public records — not Zillow's guesswork."
                    />
                    <FeatureCard
                        title="Paperwork Guides"
                        description="Step-by-step walkthroughs for every disclosure and contract you'll need."
                    />
                    <FeatureCard
                        title="Transaction Checklists"
                        description="State-aware checklists that keep you on track from offer to closing."
                    />
                    <FeatureCard
                        title="Buyer Messaging"
                        description="Field questions and showings directly through the platform."
                    />
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer
            class="border-t border-slate-100 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500"
        >
            <p>© 2026 Frula Homes — Sell it yourself.</p>
        </footer>
    </main>
</template>

<script setup lang="ts">
useSeoMeta({
    title: 'Frula Homes — Sell it yourself',
    description:
        'Nationwide For Sale By Owner platform. List your home, run your own market analysis, and keep your commission.',
})
</script>
