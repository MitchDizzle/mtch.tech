<template>
  <DefaultLayout>
    <div class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700 p-8 md:p-12">
          <h1 class="text-5xl font-bold mb-6">
            <span class="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              About Me
            </span>
          </h1>
          <div class="prose prose-lg prose-invert max-w-none">
            <p class="text-gray-300 text-lg mb-6 leading-relaxed">
              Hi, I'm <span class="text-primary-400 font-semibold">Mitch</span>! This is my personal space on the web where I share my projects, 
              cooking adventures, and various interests.
            </p>
            <p class="text-gray-300 text-lg leading-relaxed">
              Feel free to explore my portfolio and recipes. This site is built with <span class="text-primary-400">Vue 3 + Vite</span>
              with automatic content discovery - making it easy to keep adding new content.
            </p>
          </div>
          
          <div class="mt-10 pt-8 border-t border-gray-700">
            <h2 class="text-2xl font-bold text-primary-400 mb-4">Tech Stack</h2>
            <div class="flex flex-wrap gap-3">
              <span class="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg border border-gray-600">Vue 3</span>
              <span class="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg border border-gray-600">Vite</span>
              <span class="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg border border-gray-600">TailwindCSS</span>
              <span class="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg border border-gray-600">Markdown</span>
              <span class="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg border border-gray-600">GitHub Actions</span>
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
