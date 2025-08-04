/**
 * Essential Script Functions for Social Media App
 */

jQuery(document).ready(function($) {
    "use strict";
    
    // User setting dropdown on topbar    
    $('.user-img').on('click', function() {
        $('.user-setting').toggleClass("active");
        return false;
    });    
    
    // Close dropdowns when clicking elsewhere
    $("body *").not('.user-img, .user-setting').on("click", function() {
        $(".user-setting").removeClass('active');        
    });
    
    // Notifications Dropdowns
    $('.top-area > .setting-area > li').on("click", function(){
        $(this).siblings().children('div').removeClass('active');
        $(this).children('div').addClass('active');
        return false;
    });
    
    // Remove class active on body
    $("body *").not('.top-area > .setting-area > li').on("click", function() {
        $(".top-area > .setting-area > li > div").removeClass('active');        
    });
    
    // Side message box    
    $('.friendz-list > li, .chat-users > li').on('click', function() {
        $('.chat-box').addClass("show");
        return false;
    });    
    
    $('.close-mesage').on('click', function() {
        $('.chat-box').removeClass("show");
        return false;
    });
    
    // Scrollbar plugin
    if ($.isFunction($.fn.perfectScrollbar)) {
        $('.dropdowns, .twiter-feed, .invition, .followers, .chatting-area, .peoples, #people-list, .chat-list > ul, .message-list, .chat-users, .left-menu').perfectScrollbar();
    }
    
    // Socials menu script
    $('.trigger').on("click", function() {
        $(this).parent(".menu").toggleClass("active");
    });
    
    // Emojies show on text area
    $('.add-smiles > span').on("click", function() {
        $(this).parent().siblings(".smiles-bunch").toggleClass("active");
    });
    
    // Delete notifications
    $('.notification-box > ul li > i.del').on("click", function(){
        $(this).parent().slideUp();
        return false;
    });
    
    // Like posts functionality (if data attributes are present)
    $('.post-meta.liked, .we-video-info .liked').on('click', function() {
        var $this = $(this);
        var isLiked = $this.hasClass('active');
        
        if (isLiked) {
            $this.removeClass('active');
            $this.find('span').text(function(i, text) {
                return parseInt(text) - 1;
            });
        } else {
            $this.addClass('active');
            $this.find('span').text(function(i, text) {
                return parseInt(text) + 1;
            });
        }
        
        return false;
    });
    
    // Basic form submission handling
    $('form').on('submit', function(e) {
        var $form = $(this);
        var $submitBtn = $form.find('button[type="submit"], input[type="submit"]');
        
        // Prevent double submission
        if ($submitBtn.prop('disabled')) {
            e.preventDefault();
            return false;
        }
        
        // Disable submit button temporarily
        $submitBtn.prop('disabled', true);
        
        // Re-enable after a short delay
        setTimeout(function() {
            $submitBtn.prop('disabled', false);
        }, 2000);
    });
    
    // Responsive nav dropdowns
    $('.offcanvas-menu li.menu-item-has-children > a').on('click', function () {
        $(this).parent().siblings().children('ul').slideUp();
        $(this).parent().siblings().removeClass('active');
        $(this).parent().children('ul').slideToggle();
        $(this).parent().toggleClass('active');
        return false;
    });
    
    // Offcanvas menu toggle
    const menu = document.querySelector('#toggle');  
    const menuItems = document.querySelector('#overlay');  
    const menuContainer = document.querySelector('.menu-container');  
    const menuIcon = document.querySelector('.canvas-menu i');  

    function toggleMenu(e) {
        if (menuItems) menuItems.classList.toggle('open');
        if (menuContainer) menuContainer.classList.toggle('full-menu');
        if (menuIcon) {
            menuIcon.classList.toggle('fa-bars');
            menuIcon.classList.toggle('fa-times');
        }
        e.preventDefault();
    }

    if (menu) {
        menu.addEventListener('click', toggleMenu, false);    
    }
    
});
