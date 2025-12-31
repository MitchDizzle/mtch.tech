<template>
  <DefaultLayout>
    <div class="relative overflow-hidden">
      <!-- Background gradient -->
      <div class="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div class="absolute inset-0 bg-gradient-to-tr from-primary-900/20 via-transparent to-primary-800/20"></div>
      </div>

      <!-- Content -->
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div class="text-center">
          <!-- Glowing effect -->
          <div class="mb-8">
            <div class="inline-block relative">
              <div class="absolute inset-0 blur-3xl bg-primary-500/30 rounded-full"></div>
              <h1 class="relative text-6xl md:text-7xl font-bold mb-4">
                <span class="bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent">
                  Welcome to mtch.tech
                </span>
              </h1>
            </div>
          </div>

          <p class="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            A modular space for my <span class="text-primary-400 font-semibold">projects</span>,
            <span class="text-primary-400 font-semibold">recipes</span>, and
            <span class="text-primary-400 font-semibold">thoughts</span>.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <router-link
              to="/portfolio"
              class="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-primary-500/50 hover:shadow-primary-500/70 hover:scale-105 transition-all duration-200"
            >
              <span class="relative z-10">View Portfolio</span>
              <div class="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </router-link>
            <router-link
              to="/recipes"
              class="px-8 py-4 bg-gray-800 text-gray-100 rounded-xl font-semibold text-lg border-2 border-gray-700 hover:border-primary-500 hover:bg-gray-700 transition-all duration-200 hover:scale-105"
            >
              Browse Recipes
            </router-link>
          </div>

          <!-- Decorative elements -->
          <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div class="p-6 bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 hover:border-primary-500/50 transition-all duration-200">
              <div class="text-3xl mb-3">🚀</div>
              <h3 class="text-lg font-semibold text-primary-400 mb-2">Auto-Discovery</h3>
              <p class="text-gray-400 text-sm">Drop markdown files and they automatically appear</p>
            </div>
            <div class="p-6 bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 hover:border-primary-500/50 transition-all duration-200">
              <div class="text-3xl mb-3">⚡</div>
              <h3 class="text-lg font-semibold text-primary-400 mb-2">Fast & Modern</h3>
              <p class="text-gray-400 text-sm">Built with Vue 3, Vite, and TailwindCSS</p>
            </div>
            <div class="p-6 bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 hover:border-primary-500/50 transition-all duration-200">
              <div class="text-3xl mb-3">🔄</div>
              <h3 class="text-lg font-semibold text-primary-400 mb-2">Auto-Deploy</h3>
              <p class="text-gray-400 text-sm">Push to GitHub and it deploys automatically</p>
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
