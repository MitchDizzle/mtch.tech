<template>
  <DefaultLayout>
    <div class="relative overflow-hidden">
      <!-- Background gradient with orange glow -->
      <div class="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-950">
        <div class="absolute inset-0 bg-gradient-to-tr from-primary-900/30 via-transparent to-primary-800/30"></div>
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
      </div>

      <!-- Content -->
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div class="text-center">
          <!-- Main heading with massive orange glow -->
          <div class="mb-8">
            <div class="inline-block relative">
              <div class="absolute inset-0 blur-3xl bg-primary-500/50 rounded-full"></div>
              <h1 class="relative text-6xl md:text-8xl font-black mb-4">
                <span class="text-primary-500 drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]">
                  Welcome to mtch.tech
                </span>
              </h1>
            </div>
          </div>

          <p class="text-2xl md:text-3xl text-dark-100 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            A modular space for my <span class="text-primary-400 font-bold">projects</span>,
            <span class="text-primary-400 font-bold">recipes</span>, and
            <span class="text-primary-400 font-bold">thoughts</span>.
          </p>

          <!-- CTA Buttons with more orange -->
          <div class="flex flex-col sm:flex-row justify-center gap-4">
            <router-link
              to="/portfolio"
              class="group relative px-10 py-5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold text-xl shadow-2xl shadow-primary-500/60 hover:shadow-primary-500/80 hover:scale-105 transition-all duration-200 border-2 border-primary-400"
            >
              <span class="relative z-10">View Portfolio →</span>
            </router-link>
            <router-link
              to="/recipes"
              class="px-10 py-5 bg-dark-800 text-dark-100 rounded-xl font-bold text-xl border-2 border-primary-500 hover:border-primary-400 hover:bg-primary-500/10 transition-all duration-200 hover:scale-105"
            >
              Browse Recipes →
            </router-link>
          </div>

          <!-- Feature cards with orange borders -->
          <div class="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div class="p-8 bg-dark-800/80 backdrop-blur rounded-2xl border-2 border-primary-500/30 hover:border-primary-500 transition-all duration-200 shadow-xl">
              <div class="text-5xl mb-4">🚀</div>
              <h3 class="text-2xl font-bold text-primary-400 mb-3">Auto-Discovery</h3>
              <p class="text-dark-200 text-lg">Drop markdown files and they automatically appear</p>
            </div>
            <div class="p-8 bg-dark-800/80 backdrop-blur rounded-2xl border-2 border-primary-500/30 hover:border-primary-500 transition-all duration-200 shadow-xl">
              <div class="text-5xl mb-4">⚡</div>
              <h3 class="text-2xl font-bold text-primary-400 mb-3">Fast & Modern</h3>
              <p class="text-dark-200 text-lg">Built with Vue 3, Vite, and TailwindCSS</p>
            </div>
            <div class="p-8 bg-dark-800/80 backdrop-blur rounded-2xl border-2 border-primary-500/30 hover:border-primary-500 transition-all duration-200 shadow-xl">
              <div class="text-5xl mb-4">🔄</div>
              <h3 class="text-2xl font-bold text-primary-400 mb-3">Auto-Deploy</h3>
              <p class="text-dark-200 text-lg">Push to GitHub and it deploys automatically</p>
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
