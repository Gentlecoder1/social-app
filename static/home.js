document.addEventListener("DOMContentLoaded", function () {
  // Profile dropdown functionality
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");

  // Notification sidebar functionality
  const rightSidebar = document.getElementById("rightSidebar");
  const headerNotificationToggle = document.getElementById(
    "headerNotificationToggle"
  );
  const mobileNotificationToggle = document.getElementById(
    "mobileNotificationToggle"
  );
  const closeRightSidebar = document.getElementById("closeRightSidebar");
  const rightSidebarOverlay = document.getElementById("rightSidebarOverlay");
  let rightSidebarOpen = false;

  // Left sidebar functionality
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const closeSidebar = document.getElementById("closeSidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  let sidebarOpen = false;

  // upload media dropdown
  // Function to toggle file input visibility
  function setupToggle(pId, inputId) {
    const toggle = document.getElementById(pId);
    const input = document.getElementById(inputId);

    if (toggle && input) {
      toggle.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent global click from hiding it immediately
        input.classList.toggle("hidden");
      });
    }
  }

  // Set up toggles for photo and video (only if elements exist)
  setupToggle("photo-toggle", "photo-input");
  setupToggle("video-toggle", "video-input");

  // Close all inputs when clicking outside
  document.addEventListener("click", () => {
    document.querySelectorAll('input[type="file"]').forEach((input) => {
      input.classList.add("hidden");
    });
  });

  // Toggle profile dropdown
  if (profileButton && profileDropdown) {
    profileButton.addEventListener("click", function (e) {
      e.stopPropagation();
      profileDropdown.classList.toggle("hidden");
    });
  }

  // Toggle right sidebar (notifications)
  function toggleRightSidebar() {
    rightSidebarOpen = !rightSidebarOpen;
    if (rightSidebarOpen) {
      rightSidebar.classList.add("show");
      rightSidebarOverlay.classList.add("show");
      rightSidebarOverlay.classList.remove("hidden");
    } else {
      rightSidebar.classList.remove("show");
      rightSidebarOverlay.classList.remove("show");
      rightSidebarOverlay.classList.add("hidden");
    }
  }

  // Toggle left sidebar
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    if (sidebarOpen) {
      sidebar.classList.add("show");
      sidebarOverlay.classList.add("show");
      sidebarOverlay.classList.remove("hidden");
    } else {
      sidebar.classList.remove("show");
      sidebarOverlay.classList.remove("show");
      sidebarOverlay.classList.add("hidden");
    }
  }

  // Desktop notification toggle
  if (headerNotificationToggle) {
    headerNotificationToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleRightSidebar();
    });
  }

  // Mobile notification toggle
  if (mobileNotificationToggle) {
    mobileNotificationToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleRightSidebar();
    });
  }

  if (closeRightSidebar) {
    closeRightSidebar.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleRightSidebar();
    });
  }

  if (rightSidebarOverlay) {
    rightSidebarOverlay.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleRightSidebar();
    });
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  if (closeSidebar) {
    closeSidebar.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", function () {
    if (profileDropdown) {
      profileDropdown.classList.add("hidden");
    }
  });

  // Prevent clicks inside dropdown from closing it
  if (profileDropdown) {
    profileDropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  // Post menu dropdown functionality
  document.addEventListener("click", function (e) {
    const menuBtn = e.target.closest(".post-menu-btn");

    if (menuBtn) {
      e.stopPropagation();
      const postId = menuBtn.getAttribute("data-post-id");
      const menu = document.querySelector(
        `.post-menu[data-post-id="${postId}"]`
      );

      // Close all other menus
      document.querySelectorAll(".post-menu").forEach((m) => {
        if (m !== menu) m.classList.add("hidden");
      });

      // Toggle current menu
      menu.classList.toggle("hidden");
    } else {
      // Close all menus when clicking outside
      document
        .querySelectorAll(".post-menu")
        .forEach((m) => m.classList.add("hidden"));
    }
  });

  // Like button functionality
  document.querySelectorAll(".like-btn").forEach(function (button) {
    // Set initial color based on data-liked attribute
    const isLiked = button.getAttribute("data-liked") === "True";
    button.style.color = isLiked ? "#5a7ad1" : "#65676b";

    button.addEventListener("click", function () {
      const postId = button.getAttribute("data-post-id");
      const csrfToken = document.querySelector(
        'input[name="csrfmiddlewaretoken"]'
      ).value;
      button.disabled = true;
      button.style.opacity = "0.6";
      fetch("/like_post/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRFToken": csrfToken,
        },
        body: `post_id=${postId}`,
      })
        .then((response) => response.json())
        .then((data) => {
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
          }
          button.disabled = false;
          button.style.opacity = "1";
        })
        .catch(() => {
          button.disabled = false;
          button.style.opacity = "1";
        });
    });
  });

  // Comment SECTION
  const CommentHandler = {
    cache: new Map(),

    init() {
      // Single event delegation for better performance
      document.addEventListener("click", this.handleClick.bind(this));
      document.addEventListener("submit", this.handleSubmit.bind(this));
      document.addEventListener("scroll", this.handleScroll.bind(this), {
        passive: true,
        capture: true,
      });
    },

    handleClick(e) {
      const toggleBtn = e.target.closest(".comment-toggle-btn");
      if (toggleBtn) {
        e.preventDefault();
        this.toggleComments(toggleBtn);
      }
    },

    handleSubmit(e) {
      if (e.target.matches(".comment-form")) {
        e.preventDefault();
        this.submitComment(e.target);
      }
    },

    handleScroll(e) {
      if (e.target.matches(".comments-scroll-container")) {
        this.updateScrollFade(e.target);
      }
    },

    getElements(postId) {
      // Cache DOM queries
      const cacheKey = `post-${postId}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const elements = {
        section: document.querySelector(
          `[data-post-id="${postId}"].comments-section`
        ),
        container: document.querySelector(`#comments-container-${postId}`),
        button: document.querySelector(
          `[data-post-id="${postId}"].comment-toggle-btn`
        ),
        form: document.querySelector(`[data-post-id="${postId}"].comment-form`),
      };

      if (elements.section) {
        elements.fadeOverlay = elements.section.querySelector(
          ".comments-fade-overlay"
        );
        elements.scrollContainer = elements.section.querySelector(
          ".comments-scroll-container"
        );
        elements.icon = elements.button?.querySelector(".comment-icon");
      }

      this.cache.set(cacheKey, elements);
      return elements;
    },

    toggleComments(button) {
      const postId = button.dataset.postId;
      const elements = this.getElements(postId);

      if (!elements.section) return;

      const isHidden = elements.section.classList.contains("hidden");

      if (isHidden) {
        this.showComments(elements);
      } else {
        this.hideComments(elements);
      }
    },

    showComments(elements) {
      const { section, scrollContainer, fadeOverlay, icon } = elements;

      section.classList.remove("hidden");

      // Single RAF call
      requestAnimationFrame(() => {
        section.style.maxHeight = section.scrollHeight + "px";
        section.style.opacity = "1";

        if (icon) icon.style.color = "#1877f2";

        // Check scroll after show
        if (scrollContainer && fadeOverlay) {
          setTimeout(() => this.updateScrollFade(scrollContainer), 100);
        }
      });
    },

    hideComments(elements) {
      const { section, fadeOverlay, icon } = elements;

      section.style.maxHeight = "0px";
      section.style.opacity = "0";
      fadeOverlay?.classList.remove("show-fade");

      if (icon) icon.style.color = "#65676b";

      setTimeout(() => section.classList.add("hidden"), 300);
    },

    updateScrollFade(container) {
      const fadeOverlay = container.closest(".comments-fade-overlay");
      if (!fadeOverlay) return;

      const isScrollable = container.scrollHeight > container.clientHeight;
      const isNearBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 10;

      fadeOverlay.classList.toggle("show-fade", isScrollable && !isNearBottom);
    },

    async submitComment(form) {
      const postId = form.dataset.postId;
      const elements = this.getElements(postId);
      const input = form.querySelector(`#comment-${postId}`);
      const button = form.querySelector('[type="submit"]');
      const text = input?.value.trim();

      if (!text) {
        alert("Please enter a comment");
        return;
      }

      // Loading state
      if (button) {
        button.disabled = true;
        button.style.opacity = "0.6";
      }

      try {
        const formData = new FormData(form);
        // Get CSRF token
        const csrfToken = document.querySelector(
          "[name=csrfmiddlewaretoken]"
        ).value;

        const response = await fetch("/comment/", {
          method: "POST",
          body: formData,
          headers: {
            "X-CSRFToken": csrfToken,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          input.value = "";
          this.addComment(elements, data.comment);
          this.ensureVisible(elements);
        } else {
          console.error("Server error:", data);
          alert(data.error || "Failed to post comment");
        }
      } catch (error) {
        console.error("Comment error:", error);
        alert(
          "Network error: Failed to post comment. Please check your connection and try again."
        );
      } finally {
        if (button) {
          button.disabled = false;
          button.style.opacity = "1";
        }
      }
    },

    addComment(elements, comment) {
      const { container } = elements;
      if (!container) return;

      // Remove no comments message
      const noMsg = container.querySelector(".text-center.post-meta");
      if (noMsg) noMsg.remove();

      // Add comment with exact same structure as server-rendered comments
      const html = `
              <div class="flex comment-item px-4 py-3 bg-black">
                <div class="w-10 h-10 rounded-full border-2 border-blue-600 relative flex-shrink-0">
                  <img src="${
                    comment.profile_pic ||
                    "/media/profile_pics/blank-profile-picture.png"
                  }" 
                       alt="Profile Image" class="absolute h-full rounded-full w-full" />
                </div>
                <div class="text-dark py-2 px-3 rounded-lg bg-gray-50 h-full relative lg:ml-5 ml-2 lg:mr-20">
                  <p class="leading-6 flex flex-col">
                    <a href="/profile/${comment.username}">
                      <strong class="comment-username">${
                        comment.username
                      }</strong>
                    </a>
                    <span class="comment-text">${comment.comment}</span>
                  </p>
                  <div class="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <small class="comment-time text-xs text-gray-500">just now</small>
                  </div>
                </div>
              </div>
            `;

      container.insertAdjacentHTML("beforeend", html);

      // Scroll to new comment
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    },

    ensureVisible(elements) {
      const { section } = elements;
      if (section?.classList.contains("hidden")) {
        this.showComments(elements);
      } else if (section) {
        // Update height
        requestAnimationFrame(() => {
          section.style.maxHeight = section.scrollHeight + "px";
        });
      }
    },
  };

  // Initialize optimized comment handler
  CommentHandler.init();
});
