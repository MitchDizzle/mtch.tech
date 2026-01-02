<template>
  <div class="min-h-screen flex flex-col bg-dark-900">
    <!-- Navigation -->
    <nav class="bg-dark-800 border-b border-primary-900/30 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <router-link to="/" class="flex items-center px-3 text-xl font-bold text-primary-500 hover:text-primary-400 transition">
              🏍️ mtch.tech
            </router-link>
          </div>
          <div class="flex space-x-1 items-center">
            <router-link
              to="/about"
              class="px-4 py-2 rounded-lg text-sm font-medium text-dark-200 hover:text-primary-400 hover:bg-dark-700 transition-all duration-200"
              active-class="bg-primary-500/20 text-primary-400 border border-primary-500/30"
            >
              About
            </router-link>
            <router-link
              to="/portfolio"
              class="px-4 py-2 rounded-lg text-sm font-medium text-dark-200 hover:text-primary-400 hover:bg-dark-700 transition-all duration-200"
              active-class="bg-primary-500/20 text-primary-400 border border-primary-500/30"
            >
              Portfolio
            </router-link>
            <router-link
              to="/recipes"
              class="px-4 py-2 rounded-lg text-sm font-medium text-dark-200 hover:text-primary-400 hover:bg-dark-700 transition-all duration-200"
              active-class="bg-primary-500/20 text-primary-400 border border-primary-500/30"
            >
              Recipes
            </router-link>
            <router-link
              to="/blog"
              class="px-4 py-2 rounded-lg text-sm font-medium text-dark-200 hover:text-primary-400 hover:bg-dark-700 transition-all duration-200"
              active-class="bg-primary-500/20 text-primary-400 border border-primary-500/30"
            >
              Blog
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-dark-800 border-t border-primary-900/30 mt-auto">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p class="text-center text-dark-300 text-sm">
          &copy; {{ new Date().getFullYear() }} <span class="text-primary-500 font-semibold">mtch.tech</span> - Built with <span class="text-primary-400">Vue + Vite</span>
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
</script>
