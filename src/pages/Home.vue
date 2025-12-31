<template>
  <DefaultLayout>
    <div class="bg-gradient-to-b from-gray-50 to-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="text-center">
          <h1 class="text-5xl font-bold text-gray-900 mb-6">
            Welcome to mtch.tech
          </h1>
          <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A modular space for my projects, recipes, and thoughts.
          </p>
          <div class="flex justify-center space-x-4">
            <router-link 
              to="/portfolio"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View Portfolio
            </router-link>
            <router-link 
              to="/recipes"
              class="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
            >
              Browse Recipes
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup>
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>
