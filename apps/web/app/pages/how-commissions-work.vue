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
                A seller's guide
            </p>
            <h1 class="font-display text-3xl font-bold text-slate-900 md:text-5xl">
                How real estate commissions actually work
            </h1>
            <p class="mt-3 text-base italic text-slate-500">
                The money, the incentives, and what's changed.
            </p>
            <p class="mt-6 text-lg leading-relaxed text-slate-600">
                If you're thinking about selling your home, you've probably heard that "the seller
                pays 6%." That's been the conventional wisdom for decades — but it's both
                oversimplified and increasingly outdated. As of August 2024, the entire commission
                structure in U.S. real estate is being rewritten, and most buyers and sellers
                haven't caught up yet.
            </p>
            <p class="mt-4 text-base leading-relaxed text-slate-600">
                This guide walks through how commissions actually flow, where the money goes, why
                traditional commission structures can create misaligned incentives, and what your
                alternatives look like in 2026.
            </p>

            <!-- Money flow section -->
            <section class="mt-12">
                <h2 class="font-display text-2xl font-bold text-slate-900 md:text-3xl">
                    The money flow: a concrete example
                </h2>
                <p class="mt-3 text-base leading-relaxed text-slate-600">
                    Say you sell your home for <strong>$400,000</strong> with a
                    <strong>5% total commission</strong> — that's <strong>$20,000</strong> coming
                    off the top at closing.
                </p>

                <div class="mt-6 space-y-5">
                    <!-- Step 1 -->
                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <p class="text-brand-600 text-xs font-semibold uppercase tracking-widest">
                            Step 1
                        </p>
                        <h3 class="font-display mt-1 text-lg font-bold text-slate-900">
                            The brokerage split
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            The total commission is traditionally split between two brokerages: the
                            one representing the seller (listing brokerage) and the one representing
                            the buyer (buyer's brokerage). The most common split is 50/50.
                        </p>
                        <ul class="mt-3 space-y-1.5 text-sm text-slate-700">
                            <li>• Listing brokerage: <strong>$10,000</strong></li>
                            <li>• Buyer's brokerage: <strong>$10,000</strong></li>
                        </ul>
                    </div>

                    <!-- Step 2 -->
                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <p class="text-brand-600 text-xs font-semibold uppercase tracking-widest">
                            Step 2
                        </p>
                        <h3 class="font-display mt-1 text-lg font-bold text-slate-900">
                            The franchise fee (at franchised brokerages)
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            If either brokerage is part of a national franchise — Keller Williams,
                            RE/MAX, Coldwell Banker, Berkshire Hathaway HomeServices, Century 21,
                            and others — a franchise royalty is typically taken off the top before
                            anyone else gets paid. This is usually 6–8% of the gross commission.
                        </p>
                        <ul class="mt-3 space-y-1.5 text-sm text-slate-700">
                            <li>• Franchise fee: <strong>~$700</strong> (7% of $10,000)</li>
                            <li>
                                • Remaining to split between agent and broker:
                                <strong>$9,300</strong>
                            </li>
                        </ul>
                    </div>

                    <!-- Step 3 -->
                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <p class="text-brand-600 text-xs font-semibold uppercase tracking-widest">
                            Step 3
                        </p>
                        <h3 class="font-display mt-1 text-lg font-bold text-slate-900">
                            The agent/broker split
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            Agents don't receive commissions directly. Legally, commission must be
                            paid to the Broker of Record, who then pays the agent according to their
                            contract. Common models include:
                        </p>
                        <div class="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
                            <p>
                                <strong>Percentage splits</strong> — A newer agent might start at
                                50/50 with their broker. Experienced producers negotiate up to
                                70/30, 80/20, or 90/10. The higher the agent's production, the
                                better the split they can command.
                            </p>
                            <p>
                                <strong>Cap models</strong> — Used by Keller Williams, eXp, REAL
                                Broker, and others. The agent pays a smaller percentage to the
                                brokerage until hitting an annual cap (commonly $12,000–$25,000),
                                then keeps 100% minus a small per-transaction fee for the rest of
                                the year. Favorable for high producers, unfavorable for part-time
                                agents.
                            </p>
                        </div>
                        <p class="mt-4 text-sm text-slate-600">
                            For a mid-career agent on a 70/30 split:
                        </p>
                        <ul class="mt-2 space-y-1.5 text-sm text-slate-700">
                            <li>• Agent's share: <strong>$6,510</strong> (70% of $9,300)</li>
                            <li>• Broker's share: <strong>$2,790</strong> (30% of $9,300)</li>
                        </ul>
                    </div>

                    <!-- Step 4 -->
                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <p class="text-brand-600 text-xs font-semibold uppercase tracking-widest">
                            Step 4
                        </p>
                        <h3 class="font-display mt-1 text-lg font-bold text-slate-900">
                            Transaction fees
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            Most brokerages also charge a flat per-transaction fee of $195–$625 to
                            cover E&amp;O insurance, compliance, tech platforms, and administrative
                            overhead. This comes out of the agent's share.
                        </p>
                        <ul class="mt-3 space-y-1.5 text-sm text-slate-700">
                            <li>
                                • Agent's take after transaction fee:
                                <strong>~$6,115 before taxes</strong>
                            </li>
                        </ul>
                    </div>

                    <!-- Step 5 -->
                    <div
                        class="from-brand-50 border-brand/30 rounded-2xl border bg-gradient-to-br to-white p-6 md:p-8"
                    >
                        <p class="text-brand-600 text-xs font-semibold uppercase tracking-widest">
                            Step 5
                        </p>
                        <h3 class="font-display mt-1 text-lg font-bold text-slate-900">
                            What the agent actually keeps
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-700">
                            That $6,115 isn't take-home pay. From there, the agent covers:
                        </p>
                        <ul class="mt-3 space-y-1.5 text-sm text-slate-700">
                            <li>• Self-employment taxes (15.3%)</li>
                            <li>• Federal and state income tax</li>
                            <li>
                                • MLS dues, NAR/state/local Realtor association fees
                                ($500–$1,500/year combined)
                            </li>
                            <li>• Marketing costs for the listing (photography, signage, ads)</li>
                            <li>• Vehicle, fuel, and showing expenses</li>
                            <li>• Continuing education and licensing renewal</li>
                        </ul>
                        <p class="mt-4 text-sm font-semibold text-slate-900">
                            An agent's actual net on that $400K sale is often in the $3,500–$4,500
                            range — a meaningful number, but far from the $10,000 most sellers think
                            is going to "their agent."
                        </p>
                    </div>
                </div>
            </section>

            <!-- 2024 Settlement -->
            <section class="mt-14">
                <h2 class="font-display text-2xl font-bold text-slate-900 md:text-3xl">
                    The 2024 settlement: what actually changed
                </h2>
                <p class="mt-3 text-base leading-relaxed text-slate-600">
                    In March 2024, the National Association of Realtors (NAR) settled a series of
                    antitrust lawsuits — most notably <em>Sitzer v. NAR</em> (also called
                    <em>Burnett v. NAR</em>), in which a federal jury had found NAR and several
                    large brokerages liable for $1.8 billion (trebled to roughly $5 billion) for
                    conspiring to inflate commissions.
                </p>
                <p class="mt-4 text-base leading-relaxed text-slate-600">
                    The settlement took effect <strong>August 17, 2024</strong> and made two
                    structural changes:
                </p>

                <div class="mt-6 space-y-5">
                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <h3 class="font-display text-lg font-bold text-slate-900">
                            1. Commission offers can no longer appear on the MLS
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            Previously, when a listing agent posted a home on the MLS, they
                            specified exactly what commission the buyer's agent would receive. This
                            information was visible to every agent in the market. Critics argued
                            (and the jury agreed) that this enabled steering — buyer's agents
                            avoiding homes with lower buyer-agent commissions.
                        </p>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <h3 class="font-display text-lg font-bold text-slate-900">
                            2. Buyers must sign written representation agreements
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            Before touring homes, buyers now sign a contract with their agent
                            specifying what that agent will be paid. This formally decouples buyer
                            and seller agent compensation. The buyer is responsible for their
                            agent's fee, though they can ask the seller to cover it as a concession
                            in their offer.
                        </p>
                    </div>
                </div>

                <div
                    class="from-brand-50 border-brand/30 mt-6 rounded-2xl border bg-gradient-to-br to-white p-6 md:p-8"
                >
                    <p class="text-sm font-semibold text-slate-900">In practice, this means:</p>
                    <ul class="mt-3 space-y-2 text-sm text-slate-700">
                        <li class="flex items-start gap-2">
                            <span class="text-brand font-bold">→</span>
                            <span
                                >Sellers are no longer automatically expected to pay the buyer's
                                agent.</span
                            >
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-brand font-bold">→</span>
                            <span>Buyers now negotiate their own agent's fee directly.</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-brand font-bold">→</span>
                            <span
                                >Concessions (where the seller covers the buyer's agent cost as part
                                of the deal) are still common, but negotiated per transaction rather
                                than baked in.</span
                            >
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-brand font-bold">→</span>
                            <span
                                >FSBO sellers can compete more fairly, because the buyer's agent is
                                paid by their own client regardless of how the home is listed.</span
                            >
                        </li>
                    </ul>
                </div>
            </section>

            <!-- Incentive Problem -->
            <section class="mt-14">
                <h2 class="font-display text-2xl font-bold text-slate-900 md:text-3xl">
                    The incentive problem
                </h2>
                <p class="mt-3 text-base leading-relaxed text-slate-600">
                    Here's where commission-based real estate gets structurally interesting, and
                    where most sellers don't realize what they're signing up for.
                </p>

                <div class="mt-6 space-y-5">
                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <h3 class="font-display text-lg font-bold text-slate-900">
                            The speed problem (seller side)
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            Economist Steven Levitt analyzed thousands of Chicago-area home sales in
                            <em>Freakonomics</em> and found that real estate agents sell
                            <strong>their own homes for about 3% more</strong> than comparable
                            client homes, and leave them on the market about
                            <strong>10 days longer</strong> before accepting an offer.
                        </p>
                        <p class="mt-3 text-sm leading-relaxed text-slate-600">
                            The reason is simple math. If your home is worth $400,000 and your agent
                            could sell it in one week at $380,000 or in two months at $405,000, the
                            agent's incentive math looks like:
                        </p>
                        <ul class="mt-3 space-y-1.5 text-sm text-slate-700">
                            <li>• Extra sale price: <strong>$25,000</strong></li>
                            <li>
                                • Agent's marginal share:
                                <strong>~$525</strong> (after brokerage and agent splits)
                            </li>
                            <li>
                                • Extra time invested:
                                <strong>7+ weeks</strong> of showings, marketing, and holding costs
                            </li>
                        </ul>
                        <p class="mt-3 text-sm leading-relaxed text-slate-600">
                            For the agent, the fast sale is far more profitable per hour. For the
                            seller, the patient sale is far more profitable, period. This is why
                            many sellers feel pressured to "be realistic" on price and accept the
                            first reasonable offer.
                        </p>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <h3 class="font-display text-lg font-bold text-slate-900">
                            The bidding problem (buyer side)
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            Buyer's agents earn more when their clients pay more — but the stronger
                            incentive is actually to close <em>at all</em>. A buyer who loses a
                            bidding war and walks away pays the agent zero. So buyer's agents often
                            push clients to bid aggressively, not for the extra few hundred in
                            commission, but because failed deals pay nothing.
                        </p>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <h3 class="font-display text-lg font-bold text-slate-900">
                            The upgrade problem (buyer side)
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            Showing a client a $300,000 house vs. a $500,000 house is roughly the
                            same amount of work, but the commission is $6,000 vs. $10,000. There's a
                            structural reason first-time buyers often feel subtly nudged toward the
                            top of their budget rather than the bottom.
                        </p>
                    </div>
                </div>

                <p class="mt-6 text-sm italic leading-relaxed text-slate-600">
                    None of this means individual agents are acting in bad faith. Most agents are
                    honest professionals trying to do right by their clients. The issue is that the
                    compensation structure itself creates incentive pressure that runs against the
                    client's interest, and that pressure is baked in whether the individual agent
                    notices it or not.
                </p>
            </section>

            <!-- Alternatives -->
            <section class="mt-14">
                <h2 class="font-display text-2xl font-bold text-slate-900 md:text-3xl">
                    Your alternatives
                </h2>
                <p class="mt-3 text-base leading-relaxed text-slate-600">
                    The 2024 settlement has accelerated a shift that was already underway: more
                    compensation models that don't rely on percentage-of-sale commissions.
                </p>

                <div class="mt-6 space-y-5">
                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <h3 class="font-display text-lg font-bold text-slate-900">
                            Flat-fee listing services
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            You pay a flat fee (typically $500–$3,000) for MLS access and basic
                            listing services. No percentage, no stake in your final price. The agent
                            has no financial incentive to push you toward a fast sale.
                        </p>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <h3 class="font-display text-lg font-bold text-slate-900">
                            Flat-fee buyer's agents
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            The buyer pays a flat fee ($3,000–$5,000) regardless of home price.
                            Aligns the agent toward finding the right house, not the most expensive
                            one.
                        </p>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <h3 class="font-display text-lg font-bold text-slate-900">
                            Hourly consulting
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            Pay a licensed agent $150–$300/hour for specific services: contract
                            review, negotiation coaching, comps analysis. Rare in practice, but
                            legal in most states and dramatically cheaper for sellers who want
                            professional guidance without full representation.
                        </p>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
                        <h3 class="font-display text-lg font-bold text-slate-900">Buyer rebates</h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-600">
                            In 41 states, buyer's agents can rebate part of their commission to the
                            buyer at closing. This partially offsets the "bigger house means more
                            commission" incentive.
                        </p>
                    </div>

                    <div
                        class="from-brand-50 border-brand/30 rounded-2xl border bg-gradient-to-br to-white p-6 md:p-8"
                    >
                        <h3 class="font-display text-lg font-bold text-slate-900">
                            For sale by owner (FSBO)
                        </h3>
                        <p class="mt-2 text-sm leading-relaxed text-slate-700">
                            The seller handles the transaction themselves, typically with tools and
                            resources to replace traditional agent services: pricing analysis, MLS
                            access via flat-fee services, contract templates, and transaction
                            coordination. On a $400,000 home, FSBO can save a seller
                            <strong>$20,000 or more</strong> compared to a traditional 5%
                            commission.
                        </p>
                        <p class="mt-3 text-sm leading-relaxed text-slate-700">
                            Research on FSBO outcomes is mixed and often misrepresented. NAR's own
                            data claims FSBO homes sell for less than agented homes, but that number
                            conflates arms-length FSBO sales with family-member and friend sales
                            (often intentionally below market). A controlled academic study of
                            FSBO.com sellers in Madison, Wisconsin found that FSBO sellers
                            <strong>netted roughly the same</strong> as agented sellers after
                            commissions — meaning the savings largely accrued to the seller rather
                            than being lost in a lower sale price.
                        </p>
                    </div>
                </div>
            </section>

            <!-- What it means for you -->
            <section class="mt-14">
                <h2 class="font-display text-2xl font-bold text-slate-900 md:text-3xl">
                    What this means for you
                </h2>
                <p class="mt-3 text-base leading-relaxed text-slate-600">
                    Selling a home is the largest financial transaction most people ever make, and
                    the commission structure has been largely unchanged since the MLS was invented.
                    The 2024 settlement is the first real structural shift in a century, and it's
                    created space for sellers to make choices they didn't previously have.
                </p>
                <p class="mt-4 text-base leading-relaxed text-slate-600">
                    The right choice isn't the same for everyone. A complicated estate sale, a
                    luxury listing, or a seller with no time or experience might genuinely benefit
                    from full-service traditional representation. A straightforward sale of an
                    owner-occupied home in a healthy market is an entirely different situation.
                </p>
                <p class="mt-4 text-base leading-relaxed text-slate-600">
                    The point of this guide isn't to tell you FSBO is always the answer. It's to
                    make sure you know what you're actually paying for, who the incentives are
                    aligned with, and what your alternatives are. That's information the traditional
                    real estate industry hasn't been particularly eager to share, and it's
                    information you deserve before you sign anything.
                </p>
            </section>

            <!-- Disclaimer -->
            <div class="mt-14 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <p class="text-xs italic leading-relaxed text-slate-500">
                    This article is for educational purposes and does not constitute legal or
                    financial advice. Commission practices, licensing laws, and allowable commission
                    arrangements vary by state and are evolving rapidly in the wake of the 2024 NAR
                    settlement. Consult a qualified professional for advice specific to your
                    transaction.
                </p>
            </div>

            <!-- CTAs -->
            <div class="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <NuxtLink
                    to="/sell"
                    class="bg-brand hover:bg-brand-600 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-sm transition"
                >
                    List your home (free)
                </NuxtLink>
                <NuxtLink
                    to="/how-we-make-money"
                    class="hover:border-brand hover:text-brand rounded-full border border-slate-300 px-8 py-3 text-sm font-semibold text-slate-700 transition"
                >
                    How Frula makes money
                </NuxtLink>
            </div>
        </article>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
const desc =
    'A plain-English guide to how real estate commissions actually flow, where the money goes, the incentive problems baked into percentage-of-sale pay, and what alternatives sellers have after the 2024 NAR settlement.'
useSeoMeta({
    title: 'How real estate commissions actually work — Frula Homes',
    description: desc,
    ogTitle: 'How real estate commissions actually work — Frula Homes',
    ogDescription: desc,
    ogType: 'article',
    ogSiteName: 'Frula Homes',
    twitterCard: 'summary',
    twitterTitle: 'How real estate commissions actually work',
    twitterDescription: desc,
})
</script>
