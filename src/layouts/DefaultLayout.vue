<template>
  <div class="min-h-screen flex flex-col">
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <router-link to="/" class="flex items-center px-3 text-lg font-bold text-gray-900 hover:text-gray-600">
              mtch.tech
            </router-link>
          </div>
          <div class="flex space-x-4 items-center">
            <router-link to="/about" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
              About
            </router-link>
            <router-link to="/portfolio" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
              Portfolio
            </router-link>
            <router-link to="/recipes" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
              Recipes
            </router-link>
            <router-link to="/blog" class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
              Blog
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="bg-gray-50 border-t border-gray-200">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p class="text-center text-gray-500 text-sm">
          &copy; {{ new Date().getFullYear() }} mtch.tech - Built with Vue + Vite
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
</script>
