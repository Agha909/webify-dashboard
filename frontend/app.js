const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

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

// Toggle forms
document.getElementById("showLogin").onclick = function (e) {
    e.preventDefault();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
};

document.getElementById("showRegister").onclick = function (e) {
    e.preventDefault();
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
};

// Signup handler - calls /api/register/
registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!firstName || !lastName || !email || !password) {
        swal("Error", "Please fill in all required fields.", "error");
        return;
    }

    if (!emailPattern.test(email)) {
        swal("Error", "Please enter a valid email address.", "error");
        return;
    }

    if (password.length < 8) {
        swal("Error", "Password should be at least 8 characters.", "error");
        return;
    }

    // Call backend /api/register/
    fetch('/api/register/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'include',
        body: JSON.stringify({
            username: email.split('@')[0],
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password
        })
    })
    .then(res => {
        if (res.status === 201) {
            swal("Success", "Registration successful! You can now login.", "success");
            registerForm.reset();
            registerForm.classList.add("hidden");
            loginForm.classList.remove("hidden");
        } else if (res.status === 400) {
            return res.json().then(data => {
                swal("Error", JSON.stringify(data), "error");
            });
        } else {
            swal("Error", "Registration failed.", "error");
        }
    })
    .catch(err => {
        console.error(err);
        swal("Error", "Network error during registration.", "error");
    });
});

// Login handler - calls /api/login/
loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const emailLogin = document.getElementById("emailLogin").value.trim();
    const passwordLogin = document.getElementById("passwordLogin").value.trim();

    fetch('/api/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'include',
        body: JSON.stringify({
            email: emailLogin,
            username: emailLogin,
            password: passwordLogin
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.id) {
            swal("Success", `Welcome back, ${data.first_name}!`, "success");
            loginForm.reset();
            window.location.href = "dashboard.html";
        } else {
            swal("Error", data.detail || "Login failed.", "error");
        }
    })
    .catch(err => {
        console.error(err);
        swal("Error", "Network error during login.", "error");
    });
})
