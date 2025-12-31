<template>
  <div class="min-h-screen flex flex-col bg-gray-900">
    <!-- Navigation -->
    <nav class="bg-gray-800 border-b border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <router-link to="/" class="flex items-center px-3 text-xl font-bold text-primary-500 hover:text-primary-400 transition">
              mtch.tech
            </router-link>
          </div>
          <div class="flex space-x-1 items-center">
            <router-link
              to="/about"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200"
              active-class="bg-gray-700 text-white"
            >
              About
            </router-link>
            <router-link
              to="/portfolio"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200"
              active-class="bg-gray-700 text-white"
            >
              Portfolio
            </router-link>
            <router-link
              to="/recipes"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200"
              active-class="bg-gray-700 text-white"
            >
              Recipes
            </router-link>
            <router-link
              to="/blog"
              class="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200"
              active-class="bg-gray-700 text-white"
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
    <footer class="bg-gray-800 border-t border-gray-700 mt-auto">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p class="text-center text-gray-400 text-sm">
          &copy; {{ new Date().getFullYear() }} <span class="text-primary-500 font-semibold">mtch.tech</span> - Built with Vue + Vite
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
</script>
