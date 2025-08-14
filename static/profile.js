document.addEventListener("DOMContentLoaded", function () {
  console.log("Profile JavaScript loaded");

  // Post menu dropdown functionality
  document.addEventListener("click", function (e) {
    const menuBtn = e.target.closest(".post-menu-btn");

    if (menuBtn) {
      e.stopPropagation();
      const postId = menuBtn.getAttribute("data-post-id");
      const menu = document.querySelector(
        `.post-menu[data-post-id="${postId}"]`
      );

      if (menu) {
        // Close all other menus
        document.querySelectorAll(".post-menu").forEach((m) => {
          if (m !== menu) m.classList.add("hidden");
        });

        // Toggle current menu
        menu.classList.toggle("hidden");
        console.log("Menu toggled for post", postId);
      }
    } else {
      // Close all menus when clicking outside
      document
        .querySelectorAll(".post-menu")
        .forEach((m) => m.classList.add("hidden"));
    }
  });

  // Like button functionality
  document.querySelectorAll(".like-btn").forEach(function (button) {
    console.log("Like button found:", button);

    // Set initial color based on data-liked attribute
    const isLiked = button.getAttribute("data-liked") === "True";
    button.style.color = isLiked ? "#5a7ad1" : "#65676b";

    button.addEventListener("click", function () {
      console.log("Like button clicked");
      const postId = button.getAttribute("data-post-id");
      const csrfToken = document.querySelector(
        'input[name="csrfmiddlewaretoken"]'
      );

      if (!csrfToken) {
        console.error("CSRF token not found");
        return;
      }

      button.disabled = true;
      button.style.opacity = "0.6";

      console.log("Sending like request for post", postId);

      fetch("/like_post/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRFToken": csrfToken.value,
        },
        body: `post_id=${postId}`,
      })
        .then((response) => {
          console.log("Response received:", response);
          return response.json();
        })
        .then((data) => {
          console.log("Data received:", data);
          if (data.success) {
            // Update like count
            const likeCountElement = document.querySelector(
              `.like-count[data-post-id="${postId}"]`
            );
            if (likeCountElement) {
              likeCountElement.textContent = data.no_of_likes;
            }
            // Update button color based on like status
            if (data.action === "liked") {
              button.style.color = "#5a7ad1"; // Blue when liked
              button.setAttribute("data-liked", "True");
            } else {
              button.style.color = "#65676b"; // Gray when not liked
              button.setAttribute("data-liked", "False");
            }
          } else {
            console.error("Like request failed:", data);
          }
          button.disabled = false;
          button.style.opacity = "1";
        })
        .catch((error) => {
          console.error("Like request error:", error);
          button.disabled = false;
          button.style.opacity = "1";
        });
    });
  });

  // Comment toggle functionality
  document.addEventListener("click", function (e) {
    const toggleBtn = e.target.closest(".comment-toggle-btn");
    if (toggleBtn) {
      e.preventDefault();
      const postId = toggleBtn.getAttribute("data-post-id");
      const commentsSection = document.querySelector(
        `.comments-section[data-post-id="${postId}"]`
      );

      if (commentsSection) {
        commentsSection.classList.toggle("hidden");
        console.log("Comments toggled for post", postId);
      }
    }
  });

  // Comment form submission
  document.addEventListener("submit", function (e) {
    if (e.target.matches(".comment-form")) {
      e.preventDefault();
      const form = e.target;
      const postId = form.getAttribute("data-post-id");
      const commentInput = form.querySelector('input[name="comment"]');
      const csrfToken = form.querySelector('input[name="csrfmiddlewaretoken"]');

      if (!commentInput.value.trim()) {
        return;
      }

      console.log("Submitting comment for post", postId);

      const formData = new FormData();
      formData.append("post_id", postId);
      formData.append("comment", commentInput.value);
      formData.append("csrfmiddlewaretoken", csrfToken.value);

      fetch("/comment/", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Comment response:", data);
          if (data.success) {
            // Clear the input
            commentInput.value = "";
            // You could add the new comment to the DOM here
            // For now, just log success
            console.log("Comment added successfully");
          } else {
            console.error("Comment submission failed:", data);
          }
        })
        .catch((error) => {
          console.error("Comment submission error:", error);
        });
    }
  });

  console.log("Profile JavaScript initialization complete");
});
