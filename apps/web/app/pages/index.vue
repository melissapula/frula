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
                    Frula Homes is your information hub for selling or buying a home without an
                    agent. List your property, browse homes nationwide, find the official forms for
                    your state, and stay on track with smart checklists — all in one place.
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
                                country by how well it matches and email you when new ones show up.
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

        <!-- Why Frula -->
        <section class="border-y border-slate-100 bg-white px-6 py-20">
            <div class="mx-auto max-w-5xl">
                <div class="mx-auto max-w-2xl text-center">
                    <p class="text-brand-600 mb-3 text-xs font-semibold uppercase tracking-widest">
                        Why Frula Homes
                    </p>
                    <h2 class="font-display text-3xl font-bold text-slate-900 md:text-4xl">
                        Why would anyone skip the agent?
                    </h2>
                    <p class="mt-4 text-base leading-relaxed text-slate-600">
                        Honestly? Because the math doesn't work for most people. Real estate agents
                        earn their commission by marketing, paperwork, and negotiating — and if
                        you're willing to do those three things yourself, the savings are hard to
                        ignore.
                    </p>
                </div>

                <!-- The seller math block -->
                <div
                    class="from-brand-50 border-brand/20 mt-10 rounded-2xl border bg-gradient-to-br to-white p-6 md:p-10"
                >
                    <div class="grid items-center gap-6 md:grid-cols-[1fr_auto] md:gap-10">
                        <div>
                            <p class="text-brand-700 text-xs font-bold uppercase tracking-wider">
                                💰 The math for sellers
                            </p>
                            <h3
                                class="font-display mt-1 text-2xl font-bold text-slate-900 md:text-3xl"
                            >
                                On a $400,000 home, a 6% commission is
                                <span class="text-brand">$24,000</span>.
                            </h3>
                            <p class="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
                                That's the going rate in most of the U.S., split between the listing
                                agent and the buyer's agent. It comes straight out of the seller's
                                proceeds at closing. For many homeowners, that's more than a year of
                                mortgage payments — paid to someone else. If you'd rather keep it,
                                Frula gives you the tools to sell the home yourself.
                            </p>
                        </div>
                        <div class="flex-none text-center">
                            <div class="font-display text-brand text-5xl font-bold md:text-6xl">
                                $24k
                            </div>
                            <p class="mt-2 text-xs uppercase tracking-wider text-slate-500">
                                Typical 6% commission on a $400k sale
                            </p>
                        </div>
                    </div>
                </div>

                <!-- The buyer math block — nobody else talks about this -->
                <div class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-10">
                    <p class="text-xs font-bold uppercase tracking-wider text-slate-700">
                        🏠 The piece nobody tells buyers
                    </p>
                    <h3 class="font-display mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
                        You pay the buyer's agent commission, too — it's just hidden.
                    </h3>
                    <p class="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
                        Here's the thing most buyers never realize: when a home is listed through a
                        traditional agent, the seller pays a commission that almost always gets
                        baked into the asking price. So if you're the buyer, that commission is
                        really coming out of the price you pay — whether you use a buyer's agent or
                        not. When you buy directly from a for-sale-by-owner seller, that's 2-3%
                        that's actually on the negotiating table. On a $400,000 home, that's
                        <strong>$8,000 to $12,000</strong> you can potentially negotiate off the
                        price, keep in your pocket, or put toward closing costs.
                    </p>
                </div>

                <!-- What makes Frula different from other FSBO sites -->
                <div class="mt-14">
                    <div class="mx-auto max-w-2xl text-center">
                        <h3 class="font-display text-2xl font-bold text-slate-900 md:text-3xl">
                            What makes Frula different
                        </h3>
                        <p class="mt-3 text-slate-600">
                            There are other for-sale-by-owner sites out there. Here's what we do
                            that they don't.
                        </p>
                    </div>

                    <div class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div class="rounded-2xl border border-slate-200 bg-white p-6">
                            <div class="text-2xl">🎯</div>
                            <h4 class="font-display mt-3 text-base font-bold text-slate-900">
                                Truly FSBO, not a hidden brokerage
                            </h4>
                            <p class="mt-2 text-sm leading-relaxed text-slate-600">
                                Many "FSBO" sites are actually licensed flat-fee brokerages that
                                take a cut at closing. Frula is a pure information platform — we
                                never act as your agent or take a commission. Ever.
                            </p>
                        </div>

                        <div class="rounded-2xl border border-slate-200 bg-white p-6">
                            <div class="text-2xl">🗺️</div>
                            <h4 class="font-display mt-3 text-base font-bold text-slate-900">
                                Nationwide from day one
                            </h4>
                            <p class="mt-2 text-sm leading-relaxed text-slate-600">
                                Every state, every county. No "coming soon to your area." List your
                                home anywhere in the U.S., and buyers anywhere can find it. We treat
                                Montana the same as California.
                            </p>
                        </div>

                        <div class="rounded-2xl border border-slate-200 bg-white p-6">
                            <div class="text-2xl">✨</div>
                            <h4 class="font-display mt-3 text-base font-bold text-slate-900">
                                The Dream Home Finder
                            </h4>
                            <p class="mt-2 text-sm leading-relaxed text-slate-600">
                                Buyers tell us what their ideal home looks like — beds, views,
                                waterfront, features — and we rank every nationwide listing by how
                                well it matches. No other FSBO site does this.
                            </p>
                        </div>

                        <div class="rounded-2xl border border-slate-200 bg-white p-6">
                            <div class="text-2xl">💬</div>
                            <h4 class="font-display mt-3 text-base font-bold text-slate-900">
                                Real transaction tools
                            </h4>
                            <p class="mt-2 text-sm leading-relaxed text-slate-600">
                                Structured offers, viewing requests, buyer-seller messaging, and
                                smart checklists — all built in. Most FSBO sites are just listing
                                boards that dump you into email once you get interest.
                            </p>
                        </div>

                        <div class="rounded-2xl border border-slate-200 bg-white p-6">
                            <div class="text-2xl">📄</div>
                            <h4 class="font-display mt-3 text-base font-bold text-slate-900">
                                Official-source paperwork
                            </h4>
                            <p class="mt-2 text-sm leading-relaxed text-slate-600">
                                We point you straight to your state's real estate commission for the
                                official forms. No sketchy third-party copies. No "document
                                preparation" services that create legal ambiguity. Just links you
                                can trust.
                            </p>
                        </div>

                        <div class="rounded-2xl border border-slate-200 bg-white p-6">
                            <div class="text-2xl">💰</div>
                            <h4 class="font-display mt-3 text-base font-bold text-slate-900">
                                You keep the savings
                            </h4>
                            <p class="mt-2 text-sm leading-relaxed text-slate-600">
                                Whether you're a seller skipping the commission or a buyer
                                negotiating directly, the savings stay with you — not a middleman.
                                That's the whole point.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Free-to-list commitment card -->
                <div
                    class="from-brand to-brand-600 mt-14 overflow-hidden rounded-2xl bg-gradient-to-br p-8 text-white shadow-lg md:p-10"
                >
                    <div class="grid items-center gap-6 md:grid-cols-[1fr_auto]">
                        <div>
                            <p class="text-xs font-bold uppercase tracking-widest text-white/80">
                                💚 Our commitment to you
                            </p>
                            <h3 class="font-display mt-2 text-2xl font-bold md:text-3xl">
                                Free to list. Free to browse. Always.
                            </h3>
                            <p class="mt-3 text-sm leading-relaxed text-white/90 md:text-base">
                                Listing your home on Frula is free — not for a trial, not for a
                                promo period, just always. Browsing, saving, messaging, making
                                offers, and requesting viewings are free too. As Frula grows, we'll
                                eventually offer optional paid visibility boosts for sellers who
                                want extra prominence, plus a curated directory of vetted local
                                service providers. None of it will ever be required.
                            </p>
                            <NuxtLink
                                to="/how-we-make-money"
                                class="mt-4 inline-flex items-center text-sm font-semibold text-white underline decoration-white/40 decoration-2 underline-offset-4 hover:decoration-white"
                            >
                                Read our full pricing promise →
                            </NuxtLink>
                        </div>
                        <div class="flex-none text-center">
                            <div class="font-display text-6xl font-bold md:text-7xl">$0</div>
                            <p class="mt-1 text-xs uppercase tracking-wider text-white/80">
                                To list your home
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Honest disclaimer -->
                <p class="mt-10 text-center text-xs italic text-slate-500">
                    FSBO isn't for everyone. If you need someone to handle every detail, a
                    traditional agent is worth considering. Frula is for people who want to manage
                    the process themselves — and keep what they save.
                </p>
            </div>
        </section>

        <!-- Features -->
        <section class="px-6 py-20">
            <div class="mx-auto max-w-5xl">
                <h2 class="font-display text-center text-3xl font-bold md:text-4xl">
                    Everything you need in one place
                </h2>
                <p class="mx-auto mt-3 max-w-2xl text-center text-slate-600">
                    Frula is a nationwide information and listing platform for for-sale-by-owner
                    homes. We connect buyers and sellers, point you to the right official resources,
                    and help you stay organized — so you can sell or buy with confidence.
                </p>
                <div class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        title="Nationwide Listings"
                        description="Browse or list for-sale-by-owner homes in all 50 states. Map, filters, photos, and direct buyer-seller messaging."
                    />
                    <FeatureCard
                        title="Dream Home Finder"
                        description="Describe your perfect home once. We rank every listing nationwide by how well it matches — sorted by score."
                    />
                    <FeatureCard
                        title="Market Estimates"
                        description="Comparable sales data drawn from public records, clearly labeled as seller estimates — not appraisals."
                    />
                    <FeatureCard
                        title="Paperwork Directory"
                        description="Find the official forms, disclosures, and consumer resources for your state — sourced straight from each state's real estate commission."
                    />
                    <FeatureCard
                        title="Transaction Checklists"
                        description="Smart checklists that keep buyers and sellers on track from accepted offer through closing day."
                    />
                    <FeatureCard
                        title="Offers & Viewings"
                        description="Send structured offers and schedule showings directly through the platform. No back-and-forth by text."
                    />
                </div>
                <p class="mx-auto mt-10 max-w-2xl text-center text-xs italic text-slate-500">
                    Frula Homes is an informational platform. We provide resources and tools — we're
                    not your agent, attorney, or licensed representative, and we don't prepare or
                    review legal documents for you.
                </p>
            </div>
        </section>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
useSeoMeta({
    title: 'Frula Homes — Sell it yourself',
    description:
        "Nationwide For Sale By Owner information platform. List your home, browse listings, find your state's official forms, and stay organized with smart checklists — all without paying agent commissions.",
})
</script>
