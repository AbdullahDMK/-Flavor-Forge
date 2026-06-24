// FlavorForge Frontend Application Controller
import {
  initDB,
  getUsers,
  getRecipes,
  getCurrentUser,
  setCurrentUser,
  login,
  signup,
  logout,
  forgotPassword,
  updateUserProfile,
  toggleFollowChef,
  addRecipe,
  submitReview,
  getAverageRating,
  DEFAULT_AVATARS,
  generateRecipePlaceholder
} from './db.js';

// Initialize DB on application startup
initDB();

// Global App State
let currentRatingSelection = 5;
let uploadedPhotoBase64 = null;
let ingredientTags = [];
let instructionSteps = ['', ''];
let selectedAvatarForSignup = DEFAULT_AVATARS[0];
let selectedAvatarForProfile = DEFAULT_AVATARS[0];

// DOM elements
const navbar = document.getElementById('navbar');
const mainContent = document.getElementById('main-content');
const heroSection = document.getElementById('hero-section');
const navAuthContainer = document.getElementById('nav-auth-container');

// Modals
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const forgotModal = document.getElementById('forgot-modal');
const editProfileModal = document.getElementById('edit-profile-modal');

// Toast Notification Handler
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  
  container.appendChild(toast);
  
  // Animate and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Update sticky navbar on scroll
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('navbar-scrolled');
  } else {
    navbar.classList.remove('navbar-scrolled');
  }
});

// Sync Session UI header
function syncSessionUI() {
  const user = getCurrentUser();
  if (user) {
    navAuthContainer.innerHTML = `
      <a href="#create-recipe" class="btn btn-primary btn-sm" style="border-radius: 12px; font-size: 0.85rem;">+ Add Recipe</a>
      <button class="user-avatar-btn" id="nav-user-dropdown-trigger">${user.avatar}</button>
      <div class="avatar-dropdown" id="nav-user-dropdown">
        <div style="padding: 0.8rem 1.2rem; border-bottom: 1px solid var(--gray-light);">
          <div style="font-weight: 600; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis;">${user.name}</div>
          <div style="font-size: 0.75rem; color: var(--gray-text); overflow: hidden; text-overflow: ellipsis;">${user.email}</div>
        </div>
        <a href="#profile/${encodeURIComponent(user.email)}" class="dropdown-item">👤 View Profile</a>
        <button class="dropdown-item" id="btn-edit-profile-trigger">⚙️ Edit Profile</button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" id="btn-logout-action">🚪 Log Out</button>
      </div>
    `;

    // Dropdown toggle
    const trigger = document.getElementById('nav-user-dropdown-trigger');
    const dropdown = document.getElementById('nav-user-dropdown');
    
    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'flex';
        dropdown.style.display = isOpen ? 'none' : 'flex';
      });

      document.addEventListener('click', () => {
        dropdown.style.display = 'none';
      });
      
      dropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    // Edit Profile Modal open
    const editTrigger = document.getElementById('btn-edit-profile-trigger');
    if (editTrigger) {
      editTrigger.addEventListener('click', () => {
        openEditProfileModal(user);
      });
    }

    // Logout Action
    const logoutBtn = document.getElementById('btn-logout-action');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logout();
        showToast('Logged out successfully.');
        syncSessionUI();
        window.location.hash = '#explore';
      });
    }
  } else {
    // Unauthenticated
    navAuthContainer.innerHTML = `
      <button class="btn btn-secondary btn-sm" id="btn-login-open">Log In</button>
      <button class="btn btn-primary btn-sm" id="btn-signup-open">Sign Up</button>
    `;
    
    // Attach event listeners to newly rendered buttons
    document.getElementById('btn-login-open').addEventListener('click', () => openModal(loginModal));
    document.getElementById('btn-signup-open').addEventListener('click', () => {
      renderSignupAvatarPicker();
      openModal(signupModal);
    });
  }
}

// Modal handling helpers
function openModal(modal) {
  modal.classList.add('active');
}

function closeModal(modal) {
  modal.classList.remove('active');
}

// Bind modal close events
[loginModal, signupModal, forgotModal, editProfileModal].forEach(modal => {
  if (!modal) return;
  // Click close buttons
  const closeBtn = modal.querySelector('.modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
  
  // Click cancel buttons
  const cancelBtn = modal.querySelector('.modal-cancel-btn');
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(modal));
  
  // Click overlay background
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

// Authentication Forms Logic
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;

  try {
    login(email, pass);
    showToast('Logged in successfully!');
    closeModal(loginModal);
    syncSessionUI();
    document.getElementById('login-form').reset();
    renderCurrentRoute(); // refresh page
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.getElementById('signup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const pass = document.getElementById('signup-password').value;

  try {
    signup(email, pass, name, '', '', selectedAvatarForSignup);
    showToast('Welcome to FlavorForge! Account created.');
    closeModal(signupModal);
    syncSessionUI();
    document.getElementById('signup-form').reset();
    renderCurrentRoute(); // refresh page
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.getElementById('forgot-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value;

  try {
    const res = forgotPassword(email);
    showToast(res.message, 'info');
    closeModal(forgotModal);
    document.getElementById('forgot-form').reset();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Quick triggers between modals
document.getElementById('btn-forgot-password-trigger').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal(loginModal);
  openModal(forgotModal);
});

// Footer auth links redirecting to modals
document.getElementById('footer-btn-login').addEventListener('click', (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (user) {
    showToast('You are already logged in.');
  } else {
    openModal(loginModal);
  }
});

document.getElementById('footer-btn-signup').addEventListener('click', (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (user) {
    showToast('You are already logged in.');
  } else {
    renderSignupAvatarPicker();
    openModal(signupModal);
  }
});

// Avatar selection builders
function renderSignupAvatarPicker() {
  const container = document.getElementById('signup-avatar-grid');
  container.innerHTML = '';
  DEFAULT_AVATARS.forEach((avatar) => {
    const btn = document.createElement('div');
    btn.className = `avatar-picker-item ${selectedAvatarForSignup === avatar ? 'active' : ''}`;
    btn.textContent = avatar;
    btn.addEventListener('click', () => {
      selectedAvatarForSignup = avatar;
      container.querySelectorAll('.avatar-picker-item').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
    });
    container.appendChild(btn);
  });
}

function openEditProfileModal(user) {
  document.getElementById('edit-profile-name').value = user.name || '';
  document.getElementById('edit-profile-location').value = user.location || '';
  document.getElementById('edit-profile-bio').value = user.bio || '';
  selectedAvatarForProfile = user.avatar || DEFAULT_AVATARS[0];

  const container = document.getElementById('edit-profile-avatar-grid');
  container.innerHTML = '';
  DEFAULT_AVATARS.forEach((avatar) => {
    const btn = document.createElement('div');
    btn.className = `avatar-picker-item ${selectedAvatarForProfile === avatar ? 'active' : ''}`;
    btn.textContent = avatar;
    btn.addEventListener('click', () => {
      selectedAvatarForProfile = avatar;
      container.querySelectorAll('.avatar-picker-item').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
    });
    container.appendChild(btn);
  });

  openModal(editProfileModal);
}

document.getElementById('edit-profile-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  const name = document.getElementById('edit-profile-name').value;
  const location = document.getElementById('edit-profile-location').value;
  const bio = document.getElementById('edit-profile-bio').value;

  try {
    updateUserProfile(user.email, {
      name,
      location,
      bio,
      avatar: selectedAvatarForProfile
    });
    showToast('Profile updated successfully!');
    closeModal(editProfileModal);
    syncSessionUI();
    renderCurrentRoute(); // Refresh UI
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Follow actions via event delegation
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('follow-btn-card') || e.target.classList.contains('follow-btn-profile') || e.target.classList.contains('follow-btn-details')) {
    e.stopPropagation();
    e.preventDefault();
    const chefEmail = e.target.getAttribute('data-email');
    try {
      const res = toggleFollowChef(chefEmail);
      showToast(res.isFollowing ? `You are now following this chef!` : `Unfollowed chef.`);
      syncSessionUI();
      renderCurrentRoute(); // Refresh view
    } catch (err) {
      if (err.message.includes('logged in')) {
        showToast(err.message, 'error');
        openModal(loginModal);
      } else {
        showToast(err.message, 'error');
      }
    }
  }
});

// ROUTING MECHANISM
function navigateToRoute() {
  const hash = window.location.hash || '#explore';
  renderRoute(hash);
  updateNavbarActiveLinks(hash);
}

function updateNavbarActiveLinks(hash) {
  const links = ['link-explore', 'link-categories', 'link-chefs'];
  links.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active');
    if (hash.startsWith('#explore') && id === 'link-explore') el.classList.add('active');
    if (hash.startsWith('#categories') && id === 'link-categories') el.classList.add('active');
    if (hash.startsWith('#chefs') && id === 'link-chefs') el.classList.add('active');
  });
}

function renderCurrentRoute() {
  const hash = window.location.hash || '#explore';
  renderRoute(hash);
}

window.addEventListener('hashchange', navigateToRoute);
window.addEventListener('DOMContentLoaded', () => {
  syncSessionUI();
  navigateToRoute();
});

// RENDER CHANNELS
function renderRoute(hash) {
  // Clear file upload state on view transitions
  uploadedPhotoBase64 = null;

  // Toggle Hero Display: only show on Explore
  if (hash === '#explore' || hash === '' || hash === '#') {
    heroSection.style.display = 'block';
  } else {
    heroSection.style.display = 'none';
  }

  // Explore Route
  if (hash === '#explore' || hash === '' || hash === '#') {
    renderExplorePage();
    return;
  }

  // Categories Route
  if (hash.startsWith('#categories')) {
    renderCategoriesPage();
    return;
  }

  // Top Chefs Route
  if (hash.startsWith('#chefs')) {
    renderTopChefsPage();
    return;
  }

  // Create Recipe Route
  if (hash === '#create-recipe') {
    const user = getCurrentUser();
    if (!user) {
      showToast('You must sign in to create a recipe.', 'error');
      openModal(loginModal);
      window.location.hash = '#explore';
      return;
    }
    renderCreateRecipePage();
    return;
  }

  // Recipe Detail Route: #recipe/:id
  if (hash.startsWith('#recipe/')) {
    const id = hash.replace('#recipe/', '');
    renderRecipeDetailPage(id);
    return;
  }

  // Profile Route: #profile/:email
  if (hash.startsWith('#profile/')) {
    const email = decodeURIComponent(hash.replace('#profile/', ''));
    renderProfilePage(email);
    return;
  }

  // Fallback
  renderExplorePage();
}

// View: Explore
function renderExplorePage() {
  mainContent.innerHTML = `
    <section class="section">
      <div class="section-header">
        <span class="eyebrow font-caveat">Trending Creations</span>
        <h2 class="section-title">Explore Recipe Feed</h2>
      </div>
      
      <div class="search-filter-bar">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" id="explore-search" class="search-input" placeholder="Search by recipe title or ingredients...">
        </div>
        <select id="explore-sort" class="filter-select">
          <option value="newest">Latest Uploads</option>
          <option value="rating">Highest Rated</option>
          <option value="time">Cook Time (Fastest)</option>
        </select>
      </div>

      <div class="recipe-grid" id="explore-recipe-grid">
        <div class="loader"></div>
      </div>
    </section>
  `;

  const searchInput = document.getElementById('explore-search');
  const sortSelect = document.getElementById('explore-sort');

  const filterAndRender = () => {
    const query = searchInput.value.toLowerCase().trim();
    const sortVal = sortSelect.value;
    const recipes = getRecipes();
    const currentUser = getCurrentUser();

    let filtered = recipes.filter(r => {
      const matchTitle = r.title.toLowerCase().includes(query);
      const matchIngredients = r.ingredients.some(ing => ing.toLowerCase().includes(query));
      return matchTitle || matchIngredients;
    });

    // Sorting logic
    if (sortVal === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortVal === 'rating') {
      filtered.sort((a, b) => getAverageRating(b) - getAverageRating(a));
    } else if (sortVal === 'time') {
      filtered.sort((a, b) => a.cookTime - b.cookTime);
    }

    renderRecipeGrid(filtered, document.getElementById('explore-recipe-grid'), currentUser);
  };

  searchInput.addEventListener('input', filterAndRender);
  sortSelect.addEventListener('change', filterAndRender);

  // Initial trigger
  filterAndRender();
}

// Helper: Render Recipe Grid
function renderRecipeGrid(recipes, container, currentUser) {
  if (!container) return;

  if (recipes.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🍲</div>
        <div class="empty-state-text">No recipes found matching your search criteria.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = recipes.map(recipe => {
    const avgRating = getAverageRating(recipe);
    const hasReviews = recipe.reviews && recipe.reviews.length > 0;
    
    // Check follow state
    let followBtnHtml = '';
    if (currentUser && currentUser.email.toLowerCase() !== recipe.authorEmail.toLowerCase()) {
      const isFollowing = currentUser.following && currentUser.following.includes(recipe.authorEmail);
      followBtnHtml = `
        <button class="btn btn-secondary btn-sm follow-btn-card" 
                data-email="${recipe.authorEmail}" 
                style="padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.75rem; background-color: ${isFollowing ? 'var(--secondary-light)' : 'transparent'};">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      `;
    } else if (!currentUser) {
      followBtnHtml = `
        <button class="btn btn-secondary btn-sm follow-btn-card" 
                data-email="${recipe.authorEmail}" 
                style="padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.75rem;">
          Follow
        </button>
      `;
    }

    // Dynamic short ingredients preview
    const ingredientsHtml = recipe.ingredients.slice(0, 3).map(ing => {
      // Cut off long ingredients text to keep badges neat
      const shortText = ing.length > 18 ? ing.slice(0, 16) + '...' : ing;
      return `<span class="ing-badge">${shortText}</span>`;
    }).join('');

    const extraIngCount = recipe.ingredients.length - 3;
    const extraIngHtml = extraIngCount > 0 ? `<span class="ing-badge">+${extraIngCount} more</span>` : '';

    return `
      <div class="recipe-card" data-id="${recipe.id}">
        <div class="card-img-wrapper">
          <img src="${recipe.photo}" alt="${recipe.title}" class="card-img" onerror="this.src='${generateRecipePlaceholder(recipe.title, recipe.cuisine)}'">
          <span class="card-badge">${recipe.cuisine}</span>
          <span class="card-difficulty">${recipe.difficulty}</span>
        </div>
        
        <div class="card-content">
          <h3 class="card-title">${recipe.title}</h3>
          
          <div class="rating-stars">
            ★ ${avgRating} 
            <span class="rating-count">(${recipe.reviews ? recipe.reviews.length : 0})</span>
          </div>
          
          <div class="card-meta-grid">
            <div class="card-meta-item">⏱️ ${recipe.cookTime} mins</div>
            <div class="card-meta-item">👥 ${recipe.servings} servings</div>
          </div>
          
          <div class="card-ingredients-preview">
            ${ingredientsHtml}
            ${extraIngHtml}
          </div>
          
          <div class="card-author-row">
            <a href="#profile/${encodeURIComponent(recipe.authorEmail)}" class="author-info">
              <span class="author-avatar">${recipe.authorAvatar}</span>
              <span class="author-name">${recipe.authorName}</span>
            </a>
            ${followBtnHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click navigation on cards
  container.querySelectorAll('.recipe-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Ignore click if user clicked on follow buttons or profile avatar
      if (e.target.closest('.follow-btn-card') || e.target.closest('.author-info')) {
        return;
      }
      const id = card.getAttribute('data-id');
      window.location.hash = `#recipe/${id}`;
    });
  });
}

// View: Categories
function renderCategoriesPage() {
  const categoriesList = ['All', 'Italian', 'Bakery', 'Drinks', 'Dessert', 'Mexican', 'Asian'];
  
  mainContent.innerHTML = `
    <section class="section">
      <div class="section-header">
        <span class="eyebrow font-caveat">World Class Flavors</span>
        <h2 class="section-title">Browse By Category</h2>
      </div>

      <div class="category-filters-container" id="category-filter-list">
        <!-- Rendered categories button list -->
      </div>

      <div class="recipe-grid" id="category-recipe-grid">
        <div class="loader"></div>
      </div>
    </section>
  `;

  const grid = document.getElementById('category-recipe-grid');
  const filtersContainer = document.getElementById('category-filter-list');
  const currentUser = getCurrentUser();

  let activeCategory = 'All';

  const filterRecipes = () => {
    const recipes = getRecipes();
    const filtered = activeCategory === 'All' 
      ? recipes 
      : recipes.filter(r => r.cuisine.toLowerCase() === activeCategory.toLowerCase());
    renderRecipeGrid(filtered, grid, currentUser);
  };

  const renderFilters = () => {
    filtersContainer.innerHTML = categoriesList.map(cat => `
      <button class="cat-filter-btn ${activeCategory === cat ? 'active' : ''}" data-cat="${cat}">
        ${cat === 'All' ? '🍽️ All Cuisines' : cat === 'Italian' ? '🍝 Italian' : cat === 'Bakery' ? '🥐 Bakery' : cat === 'Drinks' ? '🍹 Drinks' : cat === 'Dessert' ? '🍰 Dessert' : cat === 'Mexican' ? '🌮 Mexican' : '🍜 Asian'}
      </button>
    `).join('');

    filtersContainer.querySelectorAll('.cat-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-cat');
        renderFilters();
        filterRecipes();
      });
    });
  };

  renderFilters();
  filterRecipes();
}

// View: Top Chefs
function renderTopChefsPage() {
  mainContent.innerHTML = `
    <section class="section">
      <div class="section-header">
        <span class="eyebrow font-caveat">Master Crafters</span>
        <h2 class="section-title">Top Flavor Artisans</h2>
      </div>

      <div class="chef-grid" id="chefs-list-grid">
        <div class="loader"></div>
      </div>
    </section>
  `;

  const container = document.getElementById('chefs-list-grid');
  const users = getUsers();
  const recipes = getRecipes();
  const currentUser = getCurrentUser();

  // Map user stats
  const chefs = users.map(user => {
    const userRecipes = recipes.filter(r => r.authorEmail.toLowerCase() === user.email.toLowerCase());
    return {
      ...user,
      recipeCount: userRecipes.length,
      followersCount: user.followers ? user.followers.length : 0
    };
  });

  // Sort by recipe count desc
  chefs.sort((a, b) => b.recipeCount - a.recipeCount);

  if (chefs.length === 0) {
    container.innerHTML = `<div class="empty-state">No chef profiles exist yet.</div>`;
    return;
  }

  container.innerHTML = chefs.map(chef => {
    let followBtnHtml = '';
    if (currentUser && currentUser.email.toLowerCase() !== chef.email.toLowerCase()) {
      const isFollowing = currentUser.following && currentUser.following.includes(chef.email);
      followBtnHtml = `
        <button class="btn btn-secondary btn-sm follow-btn-profile" 
                data-email="${chef.email}" 
                style="margin-top: 1rem; width: 100%; max-width: 150px; background-color: ${isFollowing ? 'var(--secondary-light)' : 'transparent'};">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      `;
    } else if (!currentUser) {
      followBtnHtml = `
        <button class="btn btn-secondary btn-sm follow-btn-profile" 
                data-email="${chef.email}" 
                style="margin-top: 1rem; width: 100%; max-width: 150px;">
          Follow
        </button>
      `;
    }

    return `
      <div class="chef-card">
        <div class="chef-card-avatar">${chef.avatar}</div>
        <h3 class="chef-card-name">${chef.name}</h3>
        <p class="chef-card-location">📍 ${chef.location || 'Globe'}</p>
        
        <p style="font-size:0.85rem; color:var(--gray-text); line-clamp:2; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; height:2.8rem; margin-bottom:1rem;">
          ${chef.bio || 'Sharing signature flavor crafts on FlavorForge.'}
        </p>

        <div class="chef-card-stats">
          <div class="chef-stat-item">
            <span class="chef-stat-num">${chef.recipeCount}</span>
            <span class="chef-stat-lbl">Recipes</span>
          </div>
          <div class="chef-stat-item">
            <span class="chef-stat-num">${chef.followersCount}</span>
            <span class="chef-stat-lbl">Followers</span>
          </div>
        </div>
        
        <a href="#profile/${encodeURIComponent(chef.email)}" class="btn btn-dark btn-sm" style="width: 100%; max-width: 150px; border-radius:15px; margin-top:0.5rem; text-decoration: none;">View Profile</a>
        ${followBtnHtml}
      </div>
    `;
  }).join('');
}

// View: Recipe Details
function renderRecipeDetailPage(id) {
  const recipes = getRecipes();
  const recipe = recipes.find(r => r.id === id);

  if (!recipe) {
    mainContent.innerHTML = `
      <section class="section" style="text-align: center;">
        <div class="empty-state">
          <div class="empty-state-icon">❓</div>
          <div class="empty-state-text">Recipe not found. The recipe may have been removed or does not exist.</div>
          <a href="#explore" class="btn btn-primary" style="margin-top: 1.5rem;">Return to Feed</a>
        </div>
      </section>
    `;
    return;
  }

  const currentUser = getCurrentUser();
  const avgRating = getAverageRating(recipe);

  // Followers logic for detail card
  let followBtnHtml = '';
  if (currentUser && currentUser.email.toLowerCase() !== recipe.authorEmail.toLowerCase()) {
    const isFollowing = currentUser.following && currentUser.following.includes(recipe.authorEmail);
    followBtnHtml = `
      <button class="btn btn-secondary btn-sm follow-btn-details" 
              data-email="${recipe.authorEmail}" 
              style="padding: 0.35rem 0.9rem; border-radius: 20px; font-size: 0.8rem; background-color: ${isFollowing ? 'var(--secondary-light)' : 'transparent'};">
        ${isFollowing ? 'Following' : 'Follow'}
      </button>
    `;
  } else if (!currentUser) {
    followBtnHtml = `
      <button class="btn btn-secondary btn-sm follow-btn-details" 
              data-email="${recipe.authorEmail}" 
              style="padding: 0.35rem 0.9rem; border-radius: 20px; font-size: 0.8rem;">
        Follow
      </button>
    `;
  }

  const ingredientsListHtml = recipe.ingredients.map((ing, idx) => `
    <li>
      <label class="ingredient-check-item">
        <input type="checkbox" id="ing-check-${idx}">
        <span>${ing}</span>
      </label>
    </li>
  `).join('');

  const instructionsListHtml = recipe.instructions.map((step, idx) => `
    <div class="step-card">
      <div class="step-num">${idx + 1}</div>
      <div class="step-text">${step}</div>
    </div>
  `).join('');

  // Reviews section render
  const reviewsListHtml = recipe.reviews && recipe.reviews.length > 0 
    ? recipe.reviews.map(rev => `
        <div class="review-card-item">
          <div class="review-author-row">
            <span class="review-author">${rev.authorName} <span style="color: var(--accent); margin-left: 0.5rem;">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</span></span>
            <span class="review-date">${rev.date}</span>
          </div>
          <p class="review-text">${rev.text}</p>
        </div>
      `).reverse().join('')
    : `<div class="empty-state" style="padding: 2rem;"><p class="empty-state-text" style="font-size:0.9rem;">No reviews yet. Be the first to review this recipe!</p></div>`;

  mainContent.innerHTML = `
    <section class="section" style="padding-top: 2rem;">
      <div class="recipe-details-container">
        
        <!-- Details Hero -->
        <div class="details-hero">
          <img src="${recipe.photo}" alt="${recipe.title}" class="details-hero-img" onerror="this.src='${generateRecipePlaceholder(recipe.title, recipe.cuisine)}'">
          <div class="details-hero-overlay">
            <div class="details-hero-content">
              <span class="details-cuisine-badge">${recipe.cuisine}</span>
              <h1 class="details-title">${recipe.title}</h1>
              
              <div class="details-author-row">
                <a href="#profile/${encodeURIComponent(recipe.authorEmail)}" class="details-author-link">
                  <span class="details-author-avatar">${recipe.authorAvatar}</span>
                  <div class="details-author-text">
                    <span class="details-author-name">${recipe.authorName}</span>
                    <span class="details-author-lbl">Recipe Author</span>
                  </div>
                </a>
                
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                  <div class="rating-stars" style="color: var(--accent); font-size: 1.2rem; margin-bottom:0;">
                    ★ ${avgRating} <span class="rating-count" style="color: rgba(254,246,245,0.7);">(${recipe.reviews ? recipe.reviews.length : 0} reviews)</span>
                  </div>
                  ${followBtnHtml}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Details Metadata Bar -->
        <div class="details-meta-row">
          <div class="details-meta-item">
            <span class="details-meta-icon">⏱️</span>
            <div>
              <div class="details-meta-label">Cook Time</div>
              <div class="details-meta-val">${recipe.cookTime} minutes</div>
            </div>
          </div>
          <div class="details-meta-item">
            <span class="details-meta-icon">👥</span>
            <div>
              <div class="details-meta-label">Servings</div>
              <div class="details-meta-val">${recipe.servings} people</div>
            </div>
          </div>
          <div class="details-meta-item">
            <span class="details-meta-icon">🔥</span>
            <div>
              <div class="details-meta-label">Difficulty</div>
              <div class="details-meta-val">${recipe.difficulty}</div>
            </div>
          </div>
        </div>

        <!-- Ingredients and Instructions Grid -->
        <div class="details-grid">
          
          <!-- Ingredients Column -->
          <div class="details-ingredients-sec">
            <h3 class="details-sec-title">Ingredients</h3>
            <ul class="ingredient-checklist">
              ${ingredientsListHtml}
            </ul>
          </div>
          
          <!-- Instructions Column -->
          <div>
            <h3 class="details-sec-title" style="margin-bottom: 2rem;">Instructions</h3>
            <div class="instructions-list">
              ${instructionsListHtml}
            </div>
          </div>
          
        </div>

        <!-- Reviews Section -->
        <div class="reviews-section">
          <h3 class="details-sec-title">Chef Reviews</h3>
          
          <div class="reviews-grid">
            <!-- Review submission form -->
            <div class="review-form-card">
              <h4 style="margin-bottom: 1rem; font-size:1.25rem;">Rate & Review this Recipe</h4>
              
              <form id="recipe-review-submit-form">
                <div class="form-group">
                  <label>Your Rating</label>
                  <div class="rating-select-container" id="rating-select-container">
                    <button type="button" class="star-rating-select-btn active" data-val="1">★</button>
                    <button type="button" class="star-rating-select-btn active" data-val="2">★</button>
                    <button type="button" class="star-rating-select-btn active" data-val="3">★</button>
                    <button type="button" class="star-rating-select-btn active" data-val="4">★</button>
                    <button type="button" class="star-rating-select-btn active" data-val="5">★</button>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="review-input-text">Your Comments</label>
                  <textarea id="review-input-text" class="form-control" placeholder="Share your experience cooking this recipe..." required></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary btn-sm" style="width: 100%;">Post Review</button>
              </form>
            </div>
            
            <!-- List of Reviews -->
            <div>
              <h4 style="margin-bottom: 1.5rem; font-size:1.25rem;">Reviews (${recipe.reviews ? recipe.reviews.length : 0})</h4>
              <div class="reviews-list">
                ${reviewsListHtml}
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </section>
  `;

  // Attach Rating Select Action
  currentRatingSelection = 5; // Reset rating selection
  const starBtns = document.querySelectorAll('.star-rating-select-btn');
  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.getAttribute('data-val'));
      currentRatingSelection = val;
      starBtns.forEach(s => {
        const sVal = parseInt(s.getAttribute('data-val'));
        if (sVal <= val) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });
  });

  // Submit Review Form
  document.getElementById('recipe-review-submit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const comment = document.getElementById('review-input-text').value;

    try {
      submitReview(recipe.id, currentRatingSelection, comment);
      showToast('Thank you! Review posted successfully.');
      renderRecipeDetailPage(recipe.id); // Reload detail view
    } catch (err) {
      if (err.message.includes('logged in')) {
        showToast(err.message, 'error');
        openModal(loginModal);
      } else {
        showToast(err.message, 'error');
      }
    }
  });
}

// View: Create Recipe Page
function renderCreateRecipePage() {
  uploadedPhotoBase64 = null;
  ingredientTags = [];
  instructionSteps = ['', '']; // Reset steps count

  mainContent.innerHTML = `
    <section class="section" style="max-width: 800px;">
      <div class="section-header" style="text-align: left; margin-bottom: 2rem;">
        <span class="eyebrow font-caveat">Recipe Forge</span>
        <h2 class="section-title" style="margin-bottom: 0.5rem; display: block;">Forge New Recipe</h2>
        <p style="color: var(--gray-text); font-size: 0.95rem;">Fill out the fields below to publish your culinary creation to the global community feed.</p>
      </div>

      <form id="create-recipe-form" style="background-color: var(--white); padding: 2.5rem; border-radius: var(--border-radius); border: 1px solid var(--secondary-light); box-shadow: var(--shadow);">
        
        <!-- Image Dropzone -->
        <div class="form-group">
          <label>Dish Photo</label>
          <div class="upload-dropzone" id="recipe-photo-dropzone">
            <span class="upload-dropzone-icon">📷</span>
            <span class="upload-dropzone-text">Click to upload or drag & drop</span>
            <span class="upload-dropzone-sub">Supports PNG, JPG, JPEG</span>
            <input type="file" id="recipe-photo-input" accept="image/*" style="display: none;">
          </div>
        </div>

        <div class="form-group">
          <label for="recipe-title">Recipe Title</label>
          <input type="text" id="recipe-title" class="form-control" placeholder="e.g. Grandma's Secret Blueberry Pie" required>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="recipe-cuisine">Cuisine Category</label>
            <select id="recipe-cuisine" class="form-control" required>
              <option value="Italian">Italian</option>
              <option value="Bakery">Bakery</option>
              <option value="Drinks">Drinks</option>
              <option value="Dessert">Dessert</option>
              <option value="Mexican">Mexican</option>
              <option value="Asian">Asian</option>
            </select>
          </div>
          <div class="form-group">
            <label for="recipe-difficulty">Difficulty Level</label>
            <select id="recipe-difficulty" class="form-control" required>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label for="recipe-time">Cook Time (minutes)</label>
            <input type="number" id="recipe-time" class="form-control" min="1" placeholder="30" required>
          </div>
          <div class="form-group">
            <label for="recipe-servings">Servings Count</label>
            <input type="number" id="recipe-servings" class="form-control" min="1" placeholder="4" required>
          </div>
        </div>

        <!-- Comma-Separated Ingredients Input -->
        <div class="form-group">
          <label>Ingredients List</label>
          <div class="ingredients-tags-container" id="ingredients-tags-container">
            <input type="text" id="recipe-ingredients-input" placeholder="Type ingredient and press Enter or comma...">
          </div>
          <p class="upload-dropzone-sub" style="margin-top: 0.25rem;">Type an ingredient and press **Enter** or **Comma** to add tags. You must enter at least 1 ingredient.</p>
        </div>

        <!-- Dynamic Steps Builder -->
        <div class="form-group">
          <label>Step-by-Step Instructions</label>
          <div class="instructions-builder-list" id="instructions-builder-list">
            <!-- Dynamic elements rendering -->
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-add-instruction-step" style="border-radius: 12px; margin-top: 0.5rem;">+ Add Step</button>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem; padding: 1rem;">Publish Recipe</button>
      </form>
    </section>
  `;

  // Bind Photo upload elements
  const dropzone = document.getElementById('recipe-photo-dropzone');
  const fileInput = document.getElementById('recipe-photo-input');

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--primary)';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--secondary)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--secondary)';
    if (e.dataTransfer.files.length) {
      handleUploadedFile(e.dataTransfer.files[0], dropzone);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length) {
      handleUploadedFile(fileInput.files[0], dropzone);
    }
  });

  // Tag inputs helper
  const tagsInput = document.getElementById('recipe-ingredients-input');
  const tagsContainer = document.getElementById('ingredients-tags-container');

  const renderTags = () => {
    tagsContainer.querySelectorAll('.ingredient-tag').forEach(tag => tag.remove());
    ingredientTags.forEach((tag, idx) => {
      const span = document.createElement('span');
      span.className = 'ingredient-tag';
      span.innerHTML = `
        ${tag}
        <button type="button" class="ingredient-tag-remove" data-idx="${idx}">&times;</button>
      `;
      tagsContainer.insertBefore(span, tagsInput);
    });

    // Attach removals
    tagsContainer.querySelectorAll('.ingredient-tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        ingredientTags.splice(idx, 1);
        renderTags();
      });
    });
  };

  tagsInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagsInput.value.trim().replace(/,$/, '');
      if (val && !ingredientTags.includes(val)) {
        ingredientTags.push(val);
        tagsInput.value = '';
        renderTags();
      }
    }
  });

  tagsInput.addEventListener('blur', () => {
    const val = tagsInput.value.trim();
    if (val && !ingredientTags.includes(val)) {
      ingredientTags.push(val);
      tagsInput.value = '';
      renderTags();
    }
  });

  // Dynamic Instructions builder helper
  const renderSteps = () => {
    const list = document.getElementById('instructions-builder-list');
    list.innerHTML = '';
    
    instructionSteps.forEach((step, idx) => {
      const div = document.createElement('div');
      div.className = 'instruction-builder-item';
      div.innerHTML = `
        <span class="step-badge">${idx + 1}</span>
        <textarea class="form-control step-input-field" placeholder="Describe instructions for step ${idx + 1}..." required>${step}</textarea>
        ${instructionSteps.length > 1 ? `<button type="button" class="remove-step-btn" data-idx="${idx}">&times;</button>` : ''}
      `;
      list.appendChild(div);
    });

    // Sync input events
    list.querySelectorAll('.step-input-field').forEach((tx, idx) => {
      tx.addEventListener('input', (e) => {
        instructionSteps[idx] = e.target.value;
      });
    });

    // Remove buttons
    list.querySelectorAll('.remove-step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        instructionSteps.splice(idx, 1);
        renderSteps();
      });
    });
  };

  document.getElementById('btn-add-instruction-step').addEventListener('click', () => {
    instructionSteps.push('');
    renderSteps();
  });

  renderSteps();

  // Form Submit Action
  document.getElementById('create-recipe-form').addEventListener('submit', (e) => {
    e.preventDefault();

    if (ingredientTags.length === 0) {
      showToast('You must add at least one ingredient to your recipe.', 'error');
      return;
    }

    const title = document.getElementById('recipe-title').value;
    const cuisine = document.getElementById('recipe-cuisine').value;
    const difficulty = document.getElementById('recipe-difficulty').value;
    const cookTime = parseInt(document.getElementById('recipe-time').value);
    const servings = parseInt(document.getElementById('recipe-servings').value);

    // Filter out blank instructions steps just in case
    const stepsFiltered = instructionSteps.filter(s => s.trim() !== '');

    if (stepsFiltered.length === 0) {
      showToast('Please specify at least one instruction step.', 'error');
      return;
    }

    try {
      const newRecipe = addRecipe({
        title,
        cuisine,
        difficulty,
        cookTime,
        servings,
        ingredients: ingredientTags,
        instructions: stepsFiltered,
        photo: uploadedPhotoBase64 // Falls back to SVG generated inside addRecipe if null
      });

      showToast('Masterpiece posted successfully!');
      window.location.hash = `#recipe/${newRecipe.id}`;
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function handleUploadedFile(file, dropzone) {
  if (!file.type.startsWith('image/')) {
    showToast('Only image files are supported.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedPhotoBase64 = e.target.result;
    
    // Render preview inside dropzone
    const old = dropzone.querySelector('.upload-preview-img');
    if (old) old.remove();
    
    const img = document.createElement('img');
    img.className = 'upload-preview-img';
    img.src = uploadedPhotoBase64;
    dropzone.appendChild(img);
  };
  reader.readAsDataURL(file);
}

// View: Profile page
function renderProfilePage(email) {
  const users = getUsers();
  const chef = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!chef) {
    mainContent.innerHTML = `
      <section class="section" style="text-align: center;">
        <div class="empty-state">
          <div class="empty-state-icon">👤</div>
          <div class="empty-state-text">Chef profile not found. The user account may have been deleted.</div>
          <a href="#explore" class="btn btn-primary" style="margin-top: 1.5rem;">Return to Explore</a>
        </div>
      </section>
    `;
    return;
  }

  const currentUser = getCurrentUser();
  const recipes = getRecipes();
  const chefRecipes = recipes.filter(r => r.authorEmail.toLowerCase() === chef.email.toLowerCase());

  // Count stats
  const recipeCount = chefRecipes.length;
  const followerCount = chef.followers ? chef.followers.length : 0;
  const followingCount = chef.following ? chef.following.length : 0;

  let actionBtnHtml = '';
  if (currentUser && currentUser.email.toLowerCase() === chef.email.toLowerCase()) {
    // Current user viewing their own profile
    actionBtnHtml = `
      <button class="btn btn-secondary btn-sm" id="btn-edit-profile-action" style="border-radius:20px;">
        ✏️ Edit Profile
      </button>
    `;
  } else {
    // Visitor viewing chef profile
    const isFollowing = currentUser && currentUser.following && currentUser.following.includes(chef.email);
    actionBtnHtml = `
      <button class="btn btn-primary btn-sm follow-btn-profile" 
              data-email="${chef.email}" 
              style="border-radius:20px; background-color: ${isFollowing ? 'var(--secondary)' : 'var(--primary)'}; border-color: ${isFollowing ? 'var(--secondary)' : 'var(--primary)'}; color: ${isFollowing ? 'var(--text)' : 'var(--white)'}">
        ${isFollowing ? 'Following' : 'Follow Chef'}
      </button>
    `;
  }

  mainContent.innerHTML = `
    <section class="section">
      
      <!-- Profile Metadata Card -->
      <div class="profile-card">
        <div class="profile-avatar">${chef.avatar}</div>
        
        <div class="profile-info">
          <div class="profile-name-row">
            <h1 class="profile-name">${chef.name}</h1>
            ${actionBtnHtml}
          </div>
          
          <div class="profile-location">
            📍 <span>${chef.location || 'Everywhere'}</span>
          </div>
          
          <p class="profile-bio">${chef.bio || 'This chef has not shared a bio yet.'}</p>
          
          <div class="profile-stats">
            <div class="profile-stat-item">
              <span class="profile-stat-val">${recipeCount}</span>
              <span class="profile-stat-lbl">Recipes</span>
            </div>
            <div class="profile-stat-item">
              <span class="profile-stat-val">${followerCount}</span>
              <span class="profile-stat-lbl">Followers</span>
            </div>
            <div class="profile-stat-item">
              <span class="profile-stat-val">${followingCount}</span>
              <span class="profile-stat-lbl">Following</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Chef's Recipes Grid -->
      <div>
        <h3 class="details-sec-title" style="margin-bottom: 2.5rem;">Signature Recipes</h3>
        <div class="recipe-grid" id="profile-recipes-grid">
          <div class="loader"></div>
        </div>
      </div>

    </section>
  `;

  // Edit action listener
  const editBtn = document.getElementById('btn-edit-profile-action');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      openEditProfileModal(chef);
    });
  }

  // Render chef recipes
  renderRecipeGrid(chefRecipes, document.getElementById('profile-recipes-grid'), currentUser);
}
