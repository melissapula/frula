<template>
  <main>
    <!-- Hero -->
    <section class="bg-gradient-to-b from-brand-50 to-white px-6 pt-16 pb-20 md:pt-24 md:pb-28">
      <div class="mx-auto max-w-5xl text-center">
        <p class="mb-4 text-sm font-medium uppercase tracking-widest text-brand-600">For Sale By Owner — Minnesota</p>
        <h1 class="font-display text-4xl font-bold leading-tight text-slate-900 md:text-6xl">
          Sell your home.<br />Keep the commission.
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg text-slate-600 md:text-xl">
          Frula Homes gives you everything an agent does — listing, photos, market analysis,
          paperwork guides, and a transaction checklist — without the 6% fee.
        </p>
        <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <NuxtLink to="/sell" class="rounded-full bg-brand px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-600">
            List Your Home
          </NuxtLink>
          <NuxtLink to="/browse" class="rounded-full border border-slate-300 px-8 py-4 text-base font-semibold text-slate-700 transition hover:border-brand hover:text-brand">
            Browse Listings
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="border-y border-slate-100 bg-white px-6 py-12">
      <div class="mx-auto grid max-w-5xl grid-cols-1 gap-8 text-center md:grid-cols-3">
        <div>
          <div class="font-display text-4xl font-bold text-brand">$18,000</div>
          <p class="mt-2 text-sm text-slate-600">Average commission saved on a $300k home</p>
        </div>
        <div>
          <div class="font-display text-4xl font-bold text-brand">74%</div>
          <p class="mt-2 text-sm text-slate-600">Of homebuyers search on mobile first</p>
        </div>
        <div>
          <div class="font-display text-4xl font-bold text-brand">$49</div>
          <p class="mt-2 text-sm text-slate-600">Starting price to list your home</p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="px-6 py-20">
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center font-display text-3xl font-bold md:text-4xl">Everything you need to sell</h2>
        <div class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard title="Smart Listing Builder" description="Photo uploads, auto-fill from public parcel data, and a guided form built for mobile." />
          <FeatureCard title="Free CMA Tool" description="Our market analysis uses real Minnesota sales data — not Zillow's guesswork." />
          <FeatureCard title="MN Paperwork Guides" description="Step-by-step walkthroughs for every Minnesota disclosure and contract." />
          <FeatureCard title="Transaction Checklists" description="Stay on track from offer to closing with smart, MN-specific checklists." />
          <FeatureCard title="Buyer Messaging" description="Field questions and showings directly through the platform." />
          <FeatureCard title="Optional TC Services" description="Need help? Hire Missa, our licensed coordinator, à la carte." />
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-100 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
      <p>© 2026 Frula Homes — Built in Minnesota.</p>
    </footer>
  </main>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Frula Homes — Sell it yourself',
  description: 'For Sale By Owner platform for Minnesota. Keep your commission.',
})
</script>
