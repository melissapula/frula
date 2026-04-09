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
                Terms of Service
            </h1>
            <p class="mt-2 text-sm text-slate-500">Last updated: April 9, 2026</p>

            <!-- Pre-launch notice -->
            <div
                class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"
            >
                <p class="font-semibold">⚠️ Pre-launch placeholder</p>
                <p class="mt-1">
                    These terms are a working draft and will be reviewed by an attorney before Frula
                    Homes accepts real users. Don't rely on this version as a binding agreement.
                </p>
            </div>

            <div class="prose prose-slate mt-8 max-w-none text-slate-700">
                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">
                    The short version
                </h2>
                <p>
                    Frula Homes is an information platform for buying and selling homes yourself.
                    We're not a real estate brokerage, we're not your agent, and we're not your
                    attorney. By using Frula you agree to use it for legitimate purposes, treat
                    other users respectfully, and accept that we provide the service "as is."
                </p>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">
                    What Frula is — and isn't
                </h2>
                <p>
                    Frula Homes is an <strong>informational platform</strong>: we help buyers and
                    sellers find each other, communicate, and locate official real estate forms. We
                    are <strong>not</strong>:
                </p>
                <ul>
                    <li>A licensed real estate brokerage or agency</li>
                    <li>A real estate agent or broker representing you</li>
                    <li>An attorney or legal advisor</li>
                    <li>A title company or escrow agent</li>
                    <li>A lender or mortgage broker</li>
                </ul>
                <p>
                    Real estate transactions involve legal and financial decisions that we cannot
                    make for you. You're responsible for consulting your own licensed professionals
                    (attorneys, title companies, inspectors, etc.) about your specific situation.
                </p>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">Your account</h2>
                <ul>
                    <li>You must be 18 or older to use Frula.</li>
                    <li>You're responsible for keeping your password secure.</li>
                    <li>
                        You're responsible for the accuracy of any information you post, including
                        listing details and disclosures.
                    </li>
                    <li>
                        We can suspend or delete accounts that violate these terms or applicable
                        law.
                    </li>
                </ul>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">Listing rules</h2>
                <ul>
                    <li>You must own the property or have the legal right to sell or rent it.</li>
                    <li>Listing information must be accurate to the best of your knowledge.</li>
                    <li>
                        Photos must be of the actual property — no stock photos pretending to be the
                        home.
                    </li>
                    <li>
                        Listings must comply with the federal Fair Housing Act and your state's fair
                        housing laws. No discrimination based on race, color, religion, sex,
                        disability, familial status, or national origin.
                    </li>
                    <li>
                        You must complete any legally-required disclosures (lead-based paint, seller
                        property disclosure, etc.) directly with the buyer — Frula doesn't handle
                        these for you.
                    </li>
                </ul>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">Communication</h2>
                <p>
                    Messages, offers, and viewing requests sent through Frula are between the buyer
                    and seller. Frula doesn't review or moderate them in real time. Be respectful,
                    don't harass other users, and don't send spam or scams.
                </p>
                <p>
                    Offers sent through Frula's offer flow are
                    <strong>expressions of interest</strong>, not binding contracts. The actual
                    purchase agreement is a separate document buyers and sellers prepare and sign
                    themselves.
                </p>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">Pricing</h2>
                <p>
                    Listing your home on Frula is free, and we commit to keeping it that way. In the
                    future we may offer optional paid visibility add-ons for sellers and sponsored
                    placements for vetted local service providers. Any optional paid feature will be
                    clearly labeled and never required to use the platform.
                </p>
                <p>
                    Frula will never take a commission on a home sale, never charge buyers, and
                    never require a subscription to list a home.
                </p>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">Disclaimers</h2>
                <p>
                    Frula Homes is provided <strong>"as is"</strong> without warranties of any kind.
                    We do our best to keep the platform accurate and reliable, but we can't
                    guarantee:
                </p>
                <ul>
                    <li>That listings are accurate or complete</li>
                    <li>That other users will behave honestly or in good faith</li>
                    <li>
                        That the paperwork directory or any guidance reflects the most current state
                        or federal law
                    </li>
                    <li>That the platform will be available 100% of the time</li>
                </ul>
                <p>
                    To the maximum extent allowed by law, Frula Homes and its operator are not
                    liable for damages arising from your use of the platform.
                </p>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">
                    Changes to these terms
                </h2>
                <p>
                    We may update these terms occasionally. Material changes will be announced by
                    email and posted with a new "last updated" date.
                </p>

                <h2 class="font-display mt-8 text-2xl font-bold text-slate-900">Contact</h2>
                <p>
                    Questions? Email
                    <a href="mailto:hello@frulahomes.com" class="text-brand underline"
                        >hello@frulahomes.com</a
                    >.
                </p>
            </div>
        </article>

        <SiteFooter />
    </main>
</template>

<script setup lang="ts">
useSeoMeta({
    title: 'Terms of Service — Frula Homes',
    description: 'The rules for using Frula Homes — what we provide, what you agree to.',
})
</script>
