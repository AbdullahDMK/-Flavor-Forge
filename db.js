// Database & Authentication Service for FlavorForge
// Uses localStorage for state persistence

const STORAGE_KEYS = {
  USERS: 'flavorforge_users',
  RECIPES: 'flavorforge_recipes',
  CURRENT_USER: 'flavorforge_current_user'
};

// Default avatars to choose from
export const DEFAULT_AVATARS = [
  '👩‍🍳', '👨‍🍳', '🍳', '🍕', '🍰', '🍹', '🌮', '🥗', '🍔', '🥑', '🍣', '🍩'
];

// Helper to generate a beautiful vector placeholder for recipes
export function generateRecipePlaceholder(title, cuisine) {
  const colors = {
    'Italian': ['#e3371e', '#efba7c'],
    'Bakery': ['#efba7c', '#ebc45c'],
    'Drinks': ['#1a0603', '#efba7c'],
    'Dessert': ['#d36f86', '#efba7c'],
    'Mexican': ['#2e7d32', '#ebc45c'],
    'Asian': ['#c62828', '#efba7c'],
    'default': ['#e3371e', '#ebc45c']
  };
  const [c1, c2] = colors[cuisine] || colors['default'];
  
  // Clean the title for a unique gradient ID
  const gradId = 'grad-' + title.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${c1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${c2};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#${gradId})" />
    
    <!-- Pattern overlays -->
    <g opacity="0.1">
      <circle cx="100" cy="100" r="80" fill="#fef6f5" />
      <circle cx="700" cy="400" r="120" fill="#fef6f5" />
      <path d="M 400,100 L 450,150 L 350,150 Z" fill="#fef6f5" />
      <rect x="200" y="300" width="80" height="80" rx="10" fill="#fef6f5" />
    </g>
    
    <!-- Inner border -->
    <rect x="25" y="25" width="750" height="450" rx="15" fill="none" stroke="#fef6f5" stroke-width="2" opacity="0.3" />
    
    <!-- Emojis as graphic representations -->
    <text x="50%" y="200" font-size="120" text-anchor="middle" dominant-baseline="middle" opacity="0.9">
      ${cuisine === 'Drinks' ? '🍹' : cuisine === 'Bakery' ? '🥐' : cuisine === 'Dessert' ? '🍰' : cuisine === 'Italian' ? '🍕' : '🍲'}
    </text>
    
    <!-- Banner -->
    <rect x="50" y="330" width="700" height="120" rx="12" fill="#1a0603" opacity="0.85" />
    <text x="85" y="380" fill="#fef6f5" font-family="'Playfair Display', serif" font-weight="900" font-size="36" letter-spacing="0.5">${title}</text>
    <text x="85" y="420" fill="#efba7c" font-family="'Inter', sans-serif" font-weight="600" font-size="18" letter-spacing="3">${cuisine.toUpperCase()}</text>
  </svg>`;
  
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Initial seeding of data if storage is empty
function seedDatabase() {
  const users = [
    {
      email: 'isabella@flavorforge.com',
      password: 'password123',
      name: 'Isabella Rossi',
      bio: 'Passionate pasta crafter, olive oil enthusiast, and Mediterranean cuisine researcher. Culinary arts graduate from Rome.',
      location: 'Rome, Italy',
      avatar: '👩‍🍳',
      followers: ['marcus@flavorforge.com'],
      following: []
    },
    {
      email: 'marcus@flavorforge.com',
      password: 'password123',
      name: 'Marcus Vance',
      bio: 'Barista by day, artisanal sourdough baker by night. Exploring the intersections of fermentation and flavor.',
      location: 'Seattle, WA',
      avatar: '👨‍🍳',
      followers: [],
      following: ['isabella@flavorforge.com']
    }
  ];

  const recipes = [
    {
      id: 'recipe-1',
      title: 'Tuscan Garlic Butter Shrimp Pasta',
      cuisine: 'Italian',
      cookTime: 25,
      servings: 4,
      difficulty: 'Easy',
      ingredients: [
        '12 oz linguine pasta',
        '1 lb large shrimp (peeled and deveined)',
        '4 tbsp unsalted butter',
        '4 cloves garlic (minced)',
        '1 cup heavy cream',
        '1/2 cup chicken broth',
        '1/2 cup parmesan cheese (grated)',
        '2 cups baby spinach',
        '1/2 cup cherry tomatoes (halved)',
        '1 tsp Italian seasoning',
        'Salt & pepper to taste'
      ],
      instructions: [
        'Boil pasta in a large pot of salted water according to package instructions. Drain and set aside, reserving 1/2 cup of pasta water.',
        'In a large skillet, melt 2 tbsp of butter over medium-high heat. Add the shrimp in a single layer, season with salt, pepper, and Italian seasoning, and cook for 2 minutes per side until pink. Transfer shrimp to a plate.',
        'In the same skillet, melt the remaining 2 tbsp of butter. Add the minced garlic and cook for 1 minute until fragrant.',
        'Pour in the chicken broth and heavy cream. Bring to a simmer, then stir in the grated parmesan cheese until fully melted and smooth.',
        'Add the halved cherry tomatoes and baby spinach. Simmer for 2-3 minutes until the spinach is wilted and the sauce slightly thickens.',
        'Add the cooked linguine and shrimp back into the skillet. Toss everything together, adding a splash of reserved pasta water if the sauce is too thick. Garnish with extra parmesan and serve hot.'
      ],
      photo: generateRecipePlaceholder('Tuscan Garlic Butter Shrimp Pasta', 'Italian'),
      authorEmail: 'isabella@flavorforge.com',
      authorName: 'Isabella Rossi',
      authorAvatar: '👩‍🍳',
      createdAt: '2026-06-18T14:30:00.000Z',
      reviews: [
        {
          authorEmail: 'marcus@flavorforge.com',
          authorName: 'Marcus Vance',
          rating: 5,
          text: 'Absolutely divine! The cream sauce is rich, velvety, and perfectly garlic-infused. A new weeknight staple!',
          date: '2026-06-18'
        }
      ]
    },
    {
      id: 'recipe-2',
      title: 'Sourdough Cinnamon Rolls',
      cuisine: 'Bakery',
      cookTime: 45,
      servings: 12,
      difficulty: 'Hard',
      ingredients: [
        '1/2 cup active sourdough starter',
        '3 cups all-purpose flour',
        '1/2 cup warm milk',
        '1/4 cup granulated sugar',
        '1/4 cup melted butter',
        '1 large egg',
        '1/2 cup brown sugar (filling)',
        '2 tbsp ground cinnamon (filling)',
        '4 tbsp softened butter (filling)',
        '4 oz cream cheese (frosting)',
        '1 cup powdered sugar (frosting)',
        '2 tbsp milk (frosting)'
      ],
      instructions: [
        'In a large mixing bowl, combine sourdough starter, warm milk, sugar, melted butter, egg, and flour. Knead for 8-10 minutes until a smooth, slightly tacky dough forms.',
        'Place dough in a greased bowl, cover with a damp cloth, and let rise at room temperature for 4 to 6 hours, or until doubled in size.',
        'Roll the dough out on a floured surface into a 12x18 inch rectangle. Spread the 4 tbsp of softened butter evenly over the surface, then sprinkle the brown sugar and ground cinnamon mixture.',
        'Roll the dough up tightly starting from the long edge. Cut into 12 equal slices using unflavored dental floss or a sharp knife.',
        'Place the rolls in a greased baking pan, cover, and let rise for another 2 hours at room temperature (or overnight in the fridge).',
        'Preheat oven to 375°F (190°C). Bake for 25-30 minutes until golden brown on top.',
        'For the frosting, beat together cream cheese, powdered sugar, and milk until smooth. Spread over the rolls while they are still warm.'
      ],
      photo: generateRecipePlaceholder('Sourdough Cinnamon Rolls', 'Bakery'),
      authorEmail: 'marcus@flavorforge.com',
      authorName: 'Marcus Vance',
      authorAvatar: '👨‍🍳',
      createdAt: '2026-06-19T09:15:00.000Z',
      reviews: []
    },
    {
      id: 'recipe-3',
      title: 'Matcha Espresso Fusion',
      cuisine: 'Drinks',
      cookTime: 5,
      servings: 1,
      difficulty: 'Easy',
      ingredients: [
        '1 tsp ceremonial grade matcha powder',
        '2 oz hot water (175°F)',
        '1 shot freshly brewed espresso',
        '6 oz oat milk',
        '1 tbsp honey or maple syrup',
        'Ice cubes'
      ],
      instructions: [
        'Sift the matcha powder into a small bowl, add the hot water, and whisk vigorously using a bamboo whisk (chasen) in a W-motion until frothy and clump-free.',
        'Fill a tall serving glass to the top with ice cubes.',
        'Pour the oat milk and honey into the glass, stirring well to combine.',
        'Slowly and gently pour the whisked matcha over the ice to create a distinct green layer.',
        'Finally, pour the freshly brewed espresso shot slowly over the top to create a gorgeous three-layered visual effect. Serve with a straw.'
      ],
      photo: generateRecipePlaceholder('Matcha Espresso Fusion', 'Drinks'),
      authorEmail: 'marcus@flavorforge.com',
      authorName: 'Marcus Vance',
      authorAvatar: '👨‍🍳',
      createdAt: '2026-06-19T16:00:00.000Z',
      reviews: [
        {
          authorEmail: 'isabella@flavorforge.com',
          authorName: 'Isabella Rossi',
          rating: 4,
          text: 'Beautiful layers! The earthiness of the matcha matches nicely with the strong profile of the espresso. Very refreshing!',
          date: '2026-06-19'
        }
      ]
    }
  ];

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
}

// Check database initialization
export function initDB() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS) || !localStorage.getItem(STORAGE_KEYS.RECIPES)) {
    seedDatabase();
  }
}

// Database Getters & Setters
export function getUsers() {
  initDB();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
}

export function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function getRecipes() {
  initDB();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECIPES)) || [];
}

export function saveRecipes(recipes) {
  localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
}

// User Session Management
export function getCurrentUser() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

// Auth Actions
export function login(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error('No user account found with this email.');
  }
  
  if (user.password !== password) {
    throw new Error('Incorrect password. Please try again.');
  }
  
  // Exclude password from session storage
  const sessionUser = { ...user };
  delete sessionUser.password;
  setCurrentUser(sessionUser);
  return sessionUser;
}

export function signup(email, password, name, bio = '', location = '', avatar = '🍳') {
  const users = getUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const newUser = {
    email: email.toLowerCase(),
    password,
    name,
    bio,
    location,
    avatar,
    followers: [],
    following: []
  };

  users.push(newUser);
  saveUsers(users);
  
  // Set session
  const sessionUser = { ...newUser };
  delete sessionUser.password;
  setCurrentUser(sessionUser);
  return sessionUser;
}

export function logout() {
  setCurrentUser(null);
}

export function forgotPassword(email) {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error('No account with that email was found.');
  }
  
  // In a simulated env, we return success and log the "recovery flow" details
  return {
    success: true,
    message: `A simulated password reset link has been generated! For testing, your password is: "${user.password}"`
  };
}

export function updateUserProfile(email, updatedData) {
  const users = getUsers();
  const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (index === -1) throw new Error('User not found.');

  users[index] = { ...users[index], ...updatedData };
  saveUsers(users);

  // If this is the current logged in user, update session
  const session = getCurrentUser();
  if (session && session.email.toLowerCase() === email.toLowerCase()) {
    const sessionUser = { ...users[index] };
    delete sessionUser.password;
    setCurrentUser(sessionUser);
  }

  // Update recipe author name and avatar in all recipes
  const recipes = getRecipes();
  let updatedAny = false;
  recipes.forEach(r => {
    if (r.authorEmail.toLowerCase() === email.toLowerCase()) {
      r.authorName = users[index].name;
      r.authorAvatar = users[index].avatar;
      updatedAny = true;
    }
  });
  if (updatedAny) {
    saveRecipes(recipes);
  }

  return users[index];
}

// Follow / Unfollow Chef
export function toggleFollowChef(chefEmail) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to follow users.');
  }

  if (currentUser.email.toLowerCase() === chefEmail.toLowerCase()) {
    throw new Error('You cannot follow yourself!');
  }

  const users = getUsers();
  const chefIndex = users.findIndex(u => u.email.toLowerCase() === chefEmail.toLowerCase());
  const meIndex = users.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());

  if (chefIndex === -1 || meIndex === -1) {
    throw new Error('User account not found.');
  }

  const chef = users[chefIndex];
  const me = users[meIndex];

  // Initialize arrays if they don't exist
  if (!chef.followers) chef.followers = [];
  if (!me.following) me.following = [];

  const followerIndex = chef.followers.indexOf(me.email);
  const followingIndex = me.following.indexOf(chef.email);

  let isFollowing = false;

  if (followerIndex > -1) {
    // Unfollow
    chef.followers.splice(followerIndex, 1);
    if (followingIndex > -1) me.following.splice(followingIndex, 1);
  } else {
    // Follow
    chef.followers.push(me.email);
    me.following.push(chef.email);
    isFollowing = true;
  }

  saveUsers(users);

  // Update current session
  const sessionUser = { ...me };
  delete sessionUser.password;
  setCurrentUser(sessionUser);

  return { isFollowing, followersCount: chef.followers.length, followingCount: me.following.length };
}

// Recipe Actions
export function addRecipe(recipeData) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to post a recipe.');
  }

  const recipes = getRecipes();
  const newId = 'recipe-' + Date.now();

  const newRecipe = {
    id: newId,
    title: recipeData.title,
    cuisine: recipeData.cuisine,
    cookTime: parseInt(recipeData.cookTime) || 30,
    servings: parseInt(recipeData.servings) || 2,
    difficulty: recipeData.difficulty || 'Easy',
    ingredients: recipeData.ingredients, // Array of strings
    instructions: recipeData.instructions, // Array of strings
    photo: recipeData.photo || generateRecipePlaceholder(recipeData.title, recipeData.cuisine),
    authorEmail: currentUser.email,
    authorName: currentUser.name,
    authorAvatar: currentUser.avatar,
    createdAt: new Date().toISOString(),
    reviews: []
  };

  recipes.unshift(newRecipe);
  saveRecipes(recipes);
  return newRecipe;
}

export function submitReview(recipeId, rating, text) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('You must be logged in to leave a review.');
  }

  const recipes = getRecipes();
  const recipeIndex = recipes.findIndex(r => r.id === recipeId);
  if (recipeIndex === -1) {
    throw new Error('Recipe not found.');
  }

  const newReview = {
    authorEmail: currentUser.email,
    authorName: currentUser.name,
    rating: parseFloat(rating) || 5,
    text: text.trim(),
    date: new Date().toISOString().split('T')[0]
  };

  if (!recipes[recipeIndex].reviews) {
    recipes[recipeIndex].reviews = [];
  }

  // Prevent duplicate reviews by the same user on the same recipe
  const existingReviewIndex = recipes[recipeIndex].reviews.findIndex(r => r.authorEmail.toLowerCase() === currentUser.email.toLowerCase());
  if (existingReviewIndex > -1) {
    recipes[recipeIndex].reviews[existingReviewIndex] = newReview;
  } else {
    recipes[recipeIndex].reviews.push(newReview);
  }

  saveRecipes(recipes);
  return recipes[recipeIndex];
}

// Helper to compute average rating for a recipe
export function getAverageRating(recipe) {
  if (!recipe.reviews || recipe.reviews.length === 0) {
    return 5.0; // default initial star rating for premium look
  }
  const sum = recipe.reviews.reduce((acc, r) => acc + r.rating, 0);
  return parseFloat((sum / recipe.reviews.length).toFixed(1));
}
