import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/Home.vue'),
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/pages/About.vue'),
  },
  {
    path: '/portfolio',
    name: 'Portfolio',
    component: () => import('@/pages/Portfolio.vue'),
  },
  {
    path: '/portfolio/:slug',
    name: 'PortfolioItem',
    component: () => import('@/pages/PortfolioItem.vue'),
  },
  {
    path: '/recipes',
    name: 'Recipes',
    component: () => import('@/pages/Recipes.vue'),
  },
  {
    path: '/recipes/:category/:slug',
    name: 'RecipeItem',
    component: () => import('@/pages/RecipeItem.vue'),
  },
  {
    path: '/blog',
    name: 'Blog',
    component: () => import('@/pages/Blog.vue'),
  },
  {
    path: '/blog/:slug',
    name: 'BlogPost',
    component: () => import('@/pages/BlogPost.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
