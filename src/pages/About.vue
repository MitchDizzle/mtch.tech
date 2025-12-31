<template>
  <DefaultLayout>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-6">About Me</h1>
      <div class="prose prose-lg">
        <p class="text-gray-700 mb-4">
          Hi, I'm Mitch! This is my personal space on the web where I share my projects, 
          cooking adventures, and various interests.
        </p>
        <p class="text-gray-700">
          Feel free to explore my portfolio and recipes. This site is built with Vue 3 + Vite
          with automatic content discovery - making it easy to keep adding new content.
        </p>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>
