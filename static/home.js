document.addEventListener("DOMContentLoaded", function () {
  // Page preloading for faster navigation
  const prefetchPages = ["/search", "/profile/", "/settings"];

  // Preload pages after initial load
  setTimeout(() => {
    prefetchPages.forEach((url) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = url;
      document.head.appendChild(link);
    });
  }, 2000);

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

        // Focus on input when shown
        if (!input.classList.contains("hidden")) {
          input.click();
        }
      });

      // Add file change listener for preview
      input.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
          handleFilePreview(file, inputId);
          input.classList.add("hidden"); // Hide input after selection
        }
      });
    }
  }

  // Function to handle file preview
  function handleFilePreview(file, inputId) {
    const previewContainer = document.getElementById("file-preview-container");
    const captionTextarea = document.querySelector('textarea[name="caption"]');

    if (!previewContainer) {
      // Create preview container if it doesn't exist
      const container = document.createElement("div");
      container.id = "file-preview-container";
      container.className = "mt-3 p-3 border rounded-lg bg-gray-50 relative";

      // Insert after caption textarea
      if (captionTextarea) {
        captionTextarea.parentNode.insertBefore(
          container,
          captionTextarea.nextSibling
        );
      }
    }

    const container = document.getElementById("file-preview-container");

    // Clear previous preview
    container.innerHTML = "";

    // Create preview based on file type
    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.className = "max-w-full max-h-48 rounded-lg";
      img.onload = () => URL.revokeObjectURL(img.src);

      const fileInfo = document.createElement("div");
      fileInfo.className = "mt-2 text-sm text-gray-600";
      fileInfo.textContent = `📷 ${file.name} (${(
        file.size /
        1024 /
        1024
      ).toFixed(2)} MB)`;

      container.appendChild(img);
      container.appendChild(fileInfo);
    } else if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.className = "max-w-full max-h-48 rounded-lg";
      video.controls = true;
      video.onload = () => URL.revokeObjectURL(video.src);

      const fileInfo = document.createElement("div");
      fileInfo.className = "mt-2 text-sm text-gray-600";
      fileInfo.textContent = `🎥 ${file.name} (${(
        file.size /
        1024 /
        1024
      ).toFixed(2)} MB)`;

      container.appendChild(video);
      container.appendChild(fileInfo);
    }

    // Add remove button to clear file preview
    const removeBtn = document.createElement("button");
    removeBtn.innerHTML = "✕";
    removeBtn.className =
      "absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600";
    removeBtn.type = "button";
    removeBtn.onclick = function () {
      container.remove();
      // Clear the file input
      document.getElementById(inputId).value = "";
    };

    container.appendChild(removeBtn);
    container.style.display = "block";
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
              likeCountElement.textContent = data.like_count; // Fixed: was data.no_of_likes
            }
            // Update button color based on like status
            if (data.liked) {
              // Fixed: was data.action === "liked"
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

  // Save Post functionality
  document.querySelectorAll(".save-post-btn").forEach(function (button) {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const postId = button.getAttribute("data-post-id");
      const csrfToken = document.querySelector(
        'input[name="csrfmiddlewaretoken"]'
      ).value;
      
      const saveText = button.querySelector(".save-text");
      const originalText = saveText.textContent;
      
      // Disable button temporarily
      button.style.opacity = "0.6";
      button.style.pointerEvents = "none";
      saveText.textContent = "Saving...";
      
      fetch("/save_post/", {
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
            // Update button text based on saved status
            if (data.saved) {
              saveText.textContent = "Unsave Post";
            } else {
              saveText.textContent = "Save Post";
            }
            
            // Show success message
            const message = document.createElement("div");
            message.className = "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md z-50";
            message.textContent = data.message;
            document.body.appendChild(message);
            
            // Remove message after 3 seconds
            setTimeout(() => {
              message.remove();
            }, 3000);
          } else {
            saveText.textContent = originalText;
            console.error("Error saving post:", data.error);
          }
          
          // Re-enable button
          button.style.opacity = "1";
          button.style.pointerEvents = "auto";
        })
        .catch((error) => {
          console.error("Error saving post:", error);
          saveText.textContent = originalText;
          button.style.opacity = "1";
          button.style.pointerEvents = "auto";
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

      // Update comment count
      const postId = container.closest("[data-post-id]")?.dataset.postId;
      if (postId) {
        const commentCountElement = document.querySelector(
          `.comment-count[data-post-id="${postId}"]`
        );
        if (commentCountElement) {
          const currentCount = parseInt(
            commentCountElement.textContent.match(/\d+/)?.[0] || 0
          );
          const newCount = currentCount + 1;
          commentCountElement.textContent = `${newCount} comments`;
        }
      }

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

  // Text truncation functionality for long captions
  function initTextTruncation() {
    const maxLength = 100; // Character limit before truncation (reduced for testing)
    
    const captions = document.querySelectorAll('.post-caption');

    captions.forEach((caption, index) => {
      if (!caption) return;

      const fullText = caption.getAttribute('data-full-text') || caption.textContent.trim();
      
      // Only truncate if text is longer than maxLength
      if (fullText.length > maxLength) {
        const truncatedText = fullText.substring(0, maxLength);

        // Check if already processed, i.e if there is already a see more button then skip
        if (caption.querySelector('.see-more-btn')) {
          return;
        }
        
        // Set initial truncated state
        caption.innerHTML = truncatedText;
        caption.classList.add('truncated');
        
        // Create see more button
        const seeMoreBtn = document.createElement('button');
        seeMoreBtn.className = 'see-more-btn';
        seeMoreBtn.textContent = '... see more';
        
        // Create see less button  
        const seeLessBtn = document.createElement('button');
        seeLessBtn.className = 'see-less-btn';
        seeLessBtn.textContent = ' see less';
        seeLessBtn.style.display = 'none';
        
        // Add buttons after caption
        caption.appendChild(seeMoreBtn);
        caption.appendChild(seeLessBtn);
        
        
        // See more functionality
        seeMoreBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          caption.innerHTML = fullText;
          caption.appendChild(seeLessBtn);
          caption.classList.remove('truncated');
          seeLessBtn.style.display = 'inline';
        });
        
        // See less functionality
        seeLessBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          caption.innerHTML = truncatedText;
          caption.appendChild(seeMoreBtn);
          caption.classList.add('truncated');
          seeMoreBtn.style.display = 'inline';
        });
      } else {
        console.log(`Caption ${index} too short for truncation (${fullText.length} chars)`);
      }
    });
  }

  // Initialize text truncation after DOM is loaded
  initTextTruncation();
  
  // Make function available globally for testing
  window.testTruncation = initTextTruncation;

  // Delete notification function
  function deleteNotification(notificationId) {
    if (confirm("Are you sure you want to delete this notification?")) {
      // Get CSRF token from the first form on the page
      const csrfToken = document.querySelector(
        'input[name="csrfmiddlewaretoken"]'
      )?.value;

      if (!csrfToken) {
        alert("Security token not found. Please refresh the page and try again.");
        return;
      }

      // Make AJAX request
      fetch(`/notifications/delete/${notificationId}/`, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrfToken,
        },
      })
        .then((response) => {
          if (response.ok) {
            // Remove the notification element from the DOM with animation
            const notificationElement = document.querySelector(
              `[data-notification-id="${notificationId}"]`
            );
            if (notificationElement) {
              notificationElement.style.transition = "opacity 0.3s ease";
              notificationElement.style.opacity = "0";
              setTimeout(() => {
                notificationElement.remove();
              }, 300);
            }
          } else {
            alert("Failed to delete notification. Please try again.");
          }
        })
        .catch((error) => {
          console.error("Error deleting notification:", error);
          alert("Failed to delete notification. Please try again.");
        });
    }
  }

});