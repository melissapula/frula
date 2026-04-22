<template>
    <footer class="border-t border-slate-200 bg-slate-50 px-6 py-12">
        <div class="mx-auto max-w-6xl">
            <div class="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                <!-- Brand block -->
                <div>
                    <NuxtLink to="/" class="font-display text-brand text-2xl font-bold">
                        Frula Homes
                    </NuxtLink>
                    <p class="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
                        Sell your home. Keep the commission. Frula is a nationwide information
                        platform for for-sale-by-owner listings — free to use, always.
                    </p>
                    <p class="mt-4 text-xs text-slate-500">
                        Built by one human on evenings and weekends.
                    </p>
                </div>

                <!-- Buy column -->
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Buy</p>
                    <ul class="mt-3 space-y-2 text-sm text-slate-700">
                        <li>
                            <NuxtLink to="/browse" class="hover:text-brand"
                                >Browse listings</NuxtLink
                            >
                        </li>
                        <li>
                            <NuxtLink to="/dream-home" class="hover:text-brand"
                                >Dream Home Finder</NuxtLink
                            >
                        </li>
                        <li>
                            <NuxtLink to="/saved" class="hover:text-brand">Saved homes</NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/checklist/buyer-guide" class="hover:text-brand"
                                >Buyer's guide</NuxtLink
                            >
                        </li>
                    </ul>
                </div>

                <!-- Sell column -->
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Sell
                    </p>
                    <ul class="mt-3 space-y-2 text-sm text-slate-700">
                        <li>
                            <NuxtLink to="/sell" class="hover:text-brand">List your home</NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/checklist/seller-prep" class="hover:text-brand"
                                >Seller prep checklist</NuxtLink
                            >
                        </li>
                        <li>
                            <NuxtLink to="/paperwork" class="hover:text-brand"
                                >Paperwork directory</NuxtLink
                            >
                        </li>
                        <li>
                            <NuxtLink to="/how-commissions-work" class="hover:text-brand"
                                >How commissions work</NuxtLink
                            >
                        </li>
                        <li>
                            <NuxtLink to="/account" class="hover:text-brand">Your account</NuxtLink>
                        </li>
                    </ul>
                </div>

                <!-- Company column -->
                <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Company
                    </p>
                    <ul class="mt-3 space-y-2 text-sm text-slate-700">
                        <li>
                            <NuxtLink to="/how-we-make-money" class="hover:text-brand"
                                >How we make money</NuxtLink
                            >
                        </li>
                        <li>
                            <NuxtLink to="/privacy" class="hover:text-brand"
                                >Privacy policy</NuxtLink
                            >
                        </li>
                        <li>
                            <NuxtLink to="/terms" class="hover:text-brand"
                                >Terms of service</NuxtLink
                            >
                        </li>
                        <li>
                            <a href="mailto:hello@frulahomes.com" class="hover:text-brand"
                                >Contact us</a
                            >
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Bottom bar -->
            <div
                class="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"
            >
                <p>© {{ year }} Frula Homes — Sell it yourself.</p>
                <p class="italic">
                    Frula Homes is an informational platform. Not your agent, not your attorney, not
                    your broker.
                </p>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
