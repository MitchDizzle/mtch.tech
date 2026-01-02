<template>
  <DefaultLayout>
    <div class="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="bg-dark-800/80 backdrop-blur rounded-2xl border-2 border-primary-500/20 p-8 md:p-12 shadow-2xl shadow-primary-900/20">
          <h1 class="text-6xl font-bold mb-8 text-primary-500">
            About Me
          </h1>
          <div class="prose prose-lg max-w-none">
            <p class="text-dark-100 text-xl mb-6 leading-relaxed">
              Hi, I'm <span class="text-primary-400 font-bold text-2xl">Mitch</span>! This is my personal space on the web where I share my projects,
              cooking adventures, and various interests.
            </p>
            <p class="text-dark-100 text-xl leading-relaxed">
              Feel free to explore my portfolio and recipes. This site is built with <span class="text-primary-400 font-semibold">Vue 3 + Vite</span>
              with automatic content discovery - making it easy to keep adding new content.
            </p>
          </div>

          <div class="mt-10 pt-8 border-t-2 border-primary-500/20">
            <h2 class="text-3xl font-bold text-primary-400 mb-6">Tech Stack</h2>
            <div class="flex flex-wrap gap-3">
              <span class="px-5 py-3 bg-primary-500/20 text-primary-300 rounded-lg border-2 border-primary-500/40 font-semibold">Vue 3</span>
              <span class="px-5 py-3 bg-primary-500/20 text-primary-300 rounded-lg border-2 border-primary-500/40 font-semibold">Vite</span>
              <span class="px-5 py-3 bg-primary-500/20 text-primary-300 rounded-lg border-2 border-primary-500/40 font-semibold">TailwindCSS</span>
              <span class="px-5 py-3 bg-primary-500/20 text-primary-300 rounded-lg border-2 border-primary-500/40 font-semibold">Markdown</span>
              <span class="px-5 py-3 bg-primary-500/20 text-primary-300 rounded-lg border-2 border-primary-500/40 font-semibold">GitHub Actions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>
