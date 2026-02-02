// ============================================
// SOCIAL DASHBOARD - SIMPLE BEGINNER VERSION
// ============================================

// Store all our data
var currentUser = null;
var allPosts = [];
var filteredPosts = [];
var sortOrder = 'latest';
var searchQuery = '';

// Get all HTML elements we need
var signupModal = document.getElementById('signupModal');
var postModal = document.getElementById('postModal');
var dashboard = document.getElementById('dashboard');
var usernameInput = document.getElementById('usernameInput');
var engageBtn = document.getElementById('engageBtn');
var currentUserDisplay = document.getElementById('currentUser');
var logoutBtn = document.getElementById('logoutBtn');
var newPostBtn = document.getElementById('newPostBtn');
var searchInput = document.getElementById('searchInput');
var sortSelect = document.getElementById('sortSelect');
var totalPostsDisplay = document.getElementById('totalPosts');
var userPostsDisplay = document.getElementById('userPosts');
var postText = document.getElementById('postText');
var imageInput = document.getElementById('imageInput');
var imagePreview = document.getElementById('imagePreview');
var transmitBtn = document.getElementById('transmitBtn');
var cancelPostBtn = document.getElementById('cancelPostBtn');
var closePostModal = document.getElementById('closePostModal');
var postsFeed = document.getElementById('postsFeed');

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get CSRF token from cookie
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Get first letter of username for avatar
function getAvatarInitial(username) {
    if (username && username.length > 0) {
        return username.charAt(0).toUpperCase();
    }
    return '?';
}

// Convert timestamp to readable time
function formatTimestamp(timestamp) {
    var date = new Date(timestamp);
    var now = new Date();
    var diff = now - date;
    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);

    if (seconds < 60) {
        return 'Just now';
    }
    if (minutes < 60) {
        return minutes + 'm ago';
    }
    if (hours < 24) {
        return hours + 'h ago';
    }
    if (days < 7) {
        return days + 'd ago';
    }
    
    return date.toLocaleDateString();
}

// Load posts from browser storage
function loadPosts() {
    var stored = localStorage.getItem('dashboard_posts');
    if (stored) {
        try {
            allPosts = JSON.parse(stored);
            filteredPosts = [];
            // Copy all posts to filtered posts
            for (var i = 0; i < allPosts.length; i++) {
                filteredPosts.push(allPosts[i]);
            }
        } catch (e) {
            console.error('Error loading posts:', e);
            allPosts = [];
            filteredPosts = [];
        }
    }
}

// Load posts from backend API
function loadPostsFromServer() {
    var searchParams = new URLSearchParams();
    if (searchQuery) {
        searchParams.append('search', searchQuery);
    }
    if (sortOrder) {
        searchParams.append('sort', sortOrder);
    }
    
    fetch('/api/posts/?' + searchParams.toString(), {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        allPosts = data;
        applyFiltersAndSort();
        renderFeed();
    })
    .catch(err => console.error('Error loading posts:', err));
}

// Make text safe for HTML (prevent hacking)
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Check if user is logged in (fetch current user from backend)
function initAuth() {
    // Try to get current user from Django session (check if authenticated)
    fetch('/api/posts/', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
        if (res.ok) {
            return res.json();
        } else {
            showSignupModal();
        }
    })
    .then(data => {
        if (data) {
            loadPostsFromServer();
            showDashboard();
        }
    })
    .catch(err => {
        console.log('Not authenticated, showing signup modal');
        showSignupModal();
    });
}

// Show the login screen
function showSignupModal() {
    signupModal.classList.remove('hidden');
    dashboard.classList.add('hidden');
    usernameInput.focus();
}

// Show the main dashboard
function showDashboard() {
    signupModal.classList.add('hidden');
    dashboard.classList.remove('hidden');
    updateUserDisplay();
    loadPostsFromServer();
    updateStatistics();
}

// Handle login button click - get user designation
function handleEngage() {
    var username = usernameInput.value.trim();
    if (username) {
        // Just store the designation locally for display - user is already authed
        currentUser = username;
        showDashboard();
    }
}

// Handle logout button click
function handleLogout() {
    if (confirm('Disengage from system? You will need to re-enter your designation.')) {
        fetch('/api/logout/', {
            method: 'POST',
            credentials: 'include',
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        })
        .then(() => {
            currentUser = null;
            showSignupModal();
            usernameInput.value = '';
        })
        .catch(err => console.error(err));
    }
}

// Update username display in header
function updateUserDisplay() {
    if (currentUser) {
        currentUserDisplay.textContent = currentUser.toUpperCase();
    }
}

// ============================================
// POST CREATION FUNCTIONS
// ============================================

// Open the create post window
function openPostModal() {
    postModal.classList.remove('hidden');
    postText.value = '';
    imageInput.value = '';
    imagePreview.classList.add('hidden');
    imagePreview.innerHTML = '';
    transmitBtn.disabled = true;
    postText.focus();
}

// Close the create post window
function closePostModalFunc() {
    postModal.classList.add('hidden');
    postText.value = '';
    imageInput.value = '';
    imagePreview.classList.add('hidden');
    imagePreview.innerHTML = '';
    transmitBtn.disabled = true;
}

// Handle image file selection
function handleImageSelect(event) {
    var file = event.target.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.innerHTML = '<img src="' + e.target.result + '" alt="Preview">';
            imagePreview.classList.remove('hidden');
            checkTransmitButton();
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.classList.add('hidden');
        imagePreview.innerHTML = '';
        checkTransmitButton();
    }
}

// Check if we can submit the post
function checkTransmitButton() {
    var hasText = postText.value.trim().length > 0;
    var hasImage = imageInput.files.length > 0;
    if (hasText || hasImage) {
        transmitBtn.disabled = false;
    } else {
        transmitBtn.disabled = true;
    }
}

// Handle post submission - calls /api/posts/
function handleTransmit() {
    var text = postText.value.trim();
    var imageFile = imageInput.files[0];
    
    if (!text && !imageFile) {
        return;
    }
    
    // If image, convert to base64
    if (imageFile) {
        var reader = new FileReader();
        reader.onload = function(e) {
            submitPostToBackend(text, e.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        submitPostToBackend(text, null);
    }
}

// Submit post to backend
function submitPostToBackend(text, imageBase64) {
    fetch('/api/posts/', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            text: text,
            image_base64: imageBase64
        })
    })
    .then(res => {
        if (res.status === 201) {
            closePostModalFunc();
            loadPostsFromServer();
            updateStatistics();
        } else {
            alert('Failed to create post');
        }
    })
    .catch(err => {
        console.error(err);
        alert('Network error');
    });
}

// Add post to the list
function addPost(post) {
    // Add to beginning of array
    allPosts.unshift(post);
    savePosts();
    closePostModalFunc();
    applyFiltersAndSort();
    renderFeed();
    updateStatistics();
}

// ============================================
// POST INTERACTION FUNCTIONS
// ============================================

// Toggle like on a post - calls /api/posts/<id>/like/
function toggleLike(postId) {
    fetch('/api/posts/' + postId + '/like/', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(res => res.json())
    .then(data => {
        loadPostsFromServer();
    })
    .catch(err => console.error('Error toggling like:', err));
}

// Delete a post - calls DELETE /api/posts/<id>/
function deletePost(postId) {
    if (confirm('Delete this transmission? This action cannot be undone.')) {
        fetch('/api/posts/' + postId + '/', {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(res => {
            if (res.status === 204) {
                loadPostsFromServer();
                updateStatistics();
            } else {
                alert('Failed to delete post');
            }
        })
        .catch(err => {
            console.error('Error deleting post:', err);
            alert('Network error');
        });
    }
}

// Check if user has liked a post
function hasUserLiked(post) {
    return post.liked_by_me || false;
}

// Check if user owns a post
function isUserPost(post) {
    // API returns author as an object with username, not a string
    var authorUsername = (typeof post.author === 'object') ? post.author.username : post.author;
    return authorUsername === currentUser;
}

// ============================================
// FEED RENDERING FUNCTIONS
// ============================================

// Apply search and sort
function applyFiltersAndSort() {
    // Apply search filter
    if (searchQuery.trim()) {
        var query = searchQuery.toLowerCase();
        filteredPosts = [];
        for (var i = 0; i < allPosts.length; i++) {
            var post = allPosts[i];
            var textMatch = post.text.toLowerCase().indexOf(query) > -1;
            var authorMatch = post.author.toLowerCase().indexOf(query) > -1;
            if (textMatch || authorMatch) {
                filteredPosts.push(post);
            }
        }
    } else {
        // No search, show all posts
        filteredPosts = [];
        for (var i = 0; i < allPosts.length; i++) {
            filteredPosts.push(allPosts[i]);
        }
    }
    
    // Apply sort
    if (sortOrder === 'latest') {
        // Sort by newest first
        for (var i = 0; i < filteredPosts.length; i++) {
            for (var j = i + 1; j < filteredPosts.length; j++) {
                if (filteredPosts[j].timestamp > filteredPosts[i].timestamp) {
                    var temp = filteredPosts[i];
                    filteredPosts[i] = filteredPosts[j];
                    filteredPosts[j] = temp;
                }
            }
        }
    } else if (sortOrder === 'oldest') {
        // Sort by oldest first
        for (var i = 0; i < filteredPosts.length; i++) {
            for (var j = i + 1; j < filteredPosts.length; j++) {
                if (filteredPosts[j].timestamp < filteredPosts[i].timestamp) {
                    var temp = filteredPosts[i];
                    filteredPosts[i] = filteredPosts[j];
                    filteredPosts[j] = temp;
                }
            }
        }
    } else if (sortOrder === 'mostLiked') {
        // Sort by most liked first
        for (var i = 0; i < filteredPosts.length; i++) {
            for (var j = i + 1; j < filteredPosts.length; j++) {
                if (filteredPosts[j].likes > filteredPosts[i].likes) {
                    var temp = filteredPosts[i];
                    filteredPosts[i] = filteredPosts[j];
                    filteredPosts[j] = temp;
                }
            }
        }
    }
}

// Show all posts in the feed
function renderFeed() {
    applyFiltersAndSort();
    
    if (filteredPosts.length === 0) {
        var message = 'Be the first to transmit new data!';
        if (searchQuery) {
            message = 'Try adjusting your search query.';
        }
        postsFeed.innerHTML = '<div class="empty-feed"><h3>NO TRANSMISSIONS FOUND</h3><p>' + message + '</p></div>';
        return;
    }
    
    // Build HTML for all posts
    var html = '';
    for (var i = 0; i < filteredPosts.length; i++) {
        html += createPostHTML(filteredPosts[i]);
    }
    postsFeed.innerHTML = html;
    
    // Add click events to buttons
    attachPostEventListeners();
}

// Create HTML for one post
function createPostHTML(post) {
    var isLiked = hasUserLiked(post);
    var canDelete = isUserPost(post);
    var authorName = (typeof post.author === 'object') ? post.author.first_name || post.author.username : post.author;
    var avatarInitial = getAvatarInitial(authorName);
    // API returns created_at as ISO datetime string, convert to timestamp
    var postTimestamp = new Date(post.created_at).getTime();
    
    var html = '<div class="post-card" data-post-id="' + post.id + '">';
    html += '<div class="post-header">';
    html += '<div class="post-avatar">' + avatarInitial + '</div>';
    html += '<div class="post-author">';
    html += '<div class="post-author-name">' + escapeHtml(authorName) + '</div>';
    html += '<div class="post-timestamp">' + formatTimestamp(postTimestamp) + '</div>';
    html += '</div>';
    html += '<div class="post-actions">';
    if (canDelete) {
        html += '<button class="post-action-btn delete-btn" data-post-id="' + post.id + '">🗑️ DELETE</button>';
    }
    html += '</div>';
    html += '</div>';
    html += '<div class="post-content">';
    if (post.text) {
        html += '<div class="post-text">' + escapeHtml(post.text) + '</div>';
    }
    if (post.image_base64) {
        html += '<div class="post-image"><img src="' + post.image_base64 + '" alt="Post image"></div>';
    }
    html += '</div>';
    html += '<div class="post-footer">';
    var likeIcon = isLiked ? '★' : '☆';
    var likedClass = isLiked ? 'liked' : '';
    html += '<button class="post-action-btn like-btn ' + likedClass + '" data-post-id="' + post.id + '">' + likeIcon + ' LIKE</button>';
    html += '<div class="like-count">';
    var likesCount = post.likes_count || 0;
    var likeClass = likesCount > 0 ? 'liked' : '';
    var likeText = likesCount === 1 ? 'approval' : 'approvals';
    html += '<span class="' + likeClass + '">' + likesCount + ' ' + likeText + '</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    return html;
}

// Add click events to like and delete buttons
function attachPostEventListeners() {
    // Get all like buttons
    var likeButtons = document.querySelectorAll('.like-btn');
    for (var i = 0; i < likeButtons.length; i++) {
        likeButtons[i].addEventListener('click', function() {
            var postId = this.getAttribute('data-post-id');
            toggleLike(postId);
        });
    }
    
    // Get all delete buttons
    var deleteButtons = document.querySelectorAll('.delete-btn');
    for (var i = 0; i < deleteButtons.length; i++) {
        deleteButtons[i].addEventListener('click', function() {
            var postId = this.getAttribute('data-post-id');
            deletePost(postId);
        });
    }
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================

// Update the statistics display
function updateStatistics() {
    var total = allPosts.length;
    var userPostCount = 0;
    for (var i = 0; i < allPosts.length; i++) {
        if (allPosts[i].author === currentUser) {
            userPostCount++;
        }
    }
    
    totalPostsDisplay.textContent = total;
    userPostsDisplay.textContent = userPostCount;
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

// Set up all button clicks and events
function initEventListeners() {
    // Login button
    engageBtn.addEventListener('click', handleEngage);
    
    // Login when Enter key is pressed
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleEngage();
        }
    });
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // New post button
    newPostBtn.addEventListener('click', openPostModal);
    
    // Close post modal buttons
    closePostModal.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent click from bubbling to modal
        closePostModalFunc();
    });
    cancelPostBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent click from bubbling to modal
        closePostModalFunc();
    });
    
    // Post text input
    postText.addEventListener('input', checkTransmitButton);
    
    // Image file input
    imageInput.addEventListener('change', handleImageSelect);
    
    // Submit post button
    transmitBtn.addEventListener('click', handleTransmit);
    
    // Search input
    searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value;
        renderFeed();
    });
    
    // Sort select
    sortSelect.addEventListener('change', function(e) {
        sortOrder = e.target.value;
        renderFeed();
    });
    
    // Close modal when clicking outside (on the dark background)
    postModal.addEventListener('click', function(e) {
        if (e.target === postModal) {
            closePostModalFunc();
        }
    });
}

// ============================================
// START THE APPLICATION
// ============================================

// Initialize everything when page loads
function init() {
    loadPosts();
    initAuth();
    initEventListeners();
}

// Wait for page to load, then start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
