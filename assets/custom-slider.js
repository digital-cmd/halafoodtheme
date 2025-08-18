// @license
// greengrub, by Logicgo Themes


// hero slider js

document.addEventListener('DOMContentLoaded', function () {
  var herosliderSwipers = [];

  function initherosliderSwiper(swiperContainer) {
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;
      var slider = swiperContainer.dataset.slider;
      var breakpoints = {};
      if(slider === 'third_slider'){
        breakpoints = {
          1200: {
            slidesPerView: 3,
            spaceBetween: 30
          },
          991: {
            slidesPerView: 2,
            spaceBetween: 30
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 15
          },
          480: {
            slidesPerView: 1,
            spaceBetween: 10
          }
        };
      }
    if(slider === 'five_slider'){
      breakpoints = {
          1200: {
            slidesPerView: 2,
            spaceBetween: 30
          },
          991: {
            slidesPerView: 2,
            spaceBetween: 15
          },
          768: {
            slidesPerView: 2
          },
          480: {
            slidesPerView: 1
          }
        };
      }
    if(slider === 'sixth_slider'){
        breakpoints = {
          480: {
            slidesPerView: 1,
            spaceBetween: 0
          },
          768: {
            slidesPerView: 1,
            spaceBetween: 0
          },
          992: {
            slidesPerView: 1.24,
            spaceBetween: 30,
            centeredSlides: true
          }
        };
      }

      var herosliderSwiper = new Swiper(swiperContainer, {
          slidesPerView: 1,
          spaceBetween: 30,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          navigation: {
              nextEl: swiperContainer.querySelector(".slider-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".slider-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".slider-swiper-pagination"),
              clickable: true,
          },
          breakpoints: breakpoints
      });

      herosliderSwipers.push(herosliderSwiper);
  }

  // Initialize Hero slider Swiper on page load
  document.querySelectorAll('.classic-container').forEach(function (swiperContainer) {
      initherosliderSwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Hero slider Swiper on section select
      herosliderSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      herosliderSwipers = [];
      document.querySelectorAll('.classic-container').forEach(function (swiperContainer) {
          initherosliderSwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Hero slider Swiper on section deselect if necessary
      herosliderSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      herosliderSwipers = [];
  });
});

// featured collection slider js

document.addEventListener('DOMContentLoaded', function () {
  var FeaturedcollectionSwipers = [];

  function initFeaturedcollectionSwiper(swiperContainer) {
      var enable = swiperContainer.dataset.enable;
      var desktopspace = swiperContainer.dataset.desktopspace;
      var mobilespace = swiperContainer.dataset.mobilespace;
      var desktop = swiperContainer.dataset.desktop;
      var largeTablet = swiperContainer.dataset.largetablet;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;

    if (enable) {
      var FeaturedcollectionSwiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: desktopspace,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".featured-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".featured-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".featured-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: mobile,
                spaceBetween: mobilespace
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: mobilespace
            },
            841: {
                slidesPerView: largeTablet,
                spaceBetween: mobilespace
            },
            992: {
                slidesPerView: desktop,
                spaceBetween: desktopspace
            },
        },
      });

      FeaturedcollectionSwipers.push(FeaturedcollectionSwiper);
    }
  }

  // Initialize Featured collection Swiper on page load
  document.querySelectorAll('.featured-slider').forEach(function (swiperContainer) {
      initFeaturedcollectionSwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Featured collection Swiper on section select
      FeaturedcollectionSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      FeaturedcollectionSwipers = [];
      document.querySelectorAll('.featured-slider').forEach(function (swiperContainer) {
          initFeaturedcollectionSwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Featured collection Swiper on section deselect if necessary
      FeaturedcollectionSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      FeaturedcollectionSwipers = [];
  });
});

// tab collection slider js

document.addEventListener('DOMContentLoaded', function () {
  var TabcollectionSwipers = [];

  function initTabcollectionSwiper(swiperContainer) {
      var enable = swiperContainer.dataset.enable;
      var desktopspace = swiperContainer.dataset.desktopspace;
      var mobilespace = swiperContainer.dataset.mobilespace;
      var desktop = swiperContainer.dataset.desktop;
      var largeTablet = swiperContainer.dataset.largetablet;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;

    if (enable) {
      var TabcollectionSwiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: desktopspace,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".tab-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".tab-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".tab-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: mobile,
                spaceBetween: mobilespace
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: mobilespace
            },
            841: {
                slidesPerView: largeTablet,
                spaceBetween: mobilespace
            },
            992: {
                slidesPerView: desktop,
                spaceBetween: desktopspace
            },
        },
      });

      TabcollectionSwipers.push(TabcollectionSwiper);
    }
  }

  // Initialize Tab collection Swiper on page load
  document.querySelectorAll('.tab-slider').forEach(function (swiperContainer) {
      initTabcollectionSwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Tab collection Swiper on section select
      TabcollectionSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      TabcollectionSwipers = [];
      document.querySelectorAll('.tab-slider').forEach(function (swiperContainer) {
          initTabcollectionSwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Tab collection Swiper on section deselect if necessary
      TabcollectionSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      TabcollectionSwipers = [];
  });
});

// Best selling slider js

document.addEventListener('DOMContentLoaded', function () {
  var BestSellingSwipers = [];

  function initBestSellingSwiper(swiperContainer) {
      var enable = swiperContainer.dataset.enable;
      var desktopspace = swiperContainer.dataset.desktopspace;
      var mobilespace = swiperContainer.dataset.mobilespace;
      var desktop = swiperContainer.dataset.desktop;
      var largeTablet = swiperContainer.dataset.largetablet;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;

    if (enable) {
      var BestSellingSwiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: desktopspace,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".best-selling-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".best-selling-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".best-selling-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: mobile,
                spaceBetween: mobilespace
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: mobilespace
            },
            841: {
                slidesPerView: largeTablet,
                spaceBetween: mobilespace
            },
            992: {
                slidesPerView: desktop,
                spaceBetween: desktopspace
            },
        },
      });

      BestSellingSwipers.push(BestSellingSwiper);
    }
  }

  // Initialize Featured collection Swiper on page load
  document.querySelectorAll('.best-selling-slider').forEach(function (swiperContainer) {
      initBestSellingSwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Featured collection Swiper on section select
      BestSellingSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      BestSellingSwipers = [];
      document.querySelectorAll('.best-selling-slider').forEach(function (swiperContainer) {
          initBestSellingSwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Featured collection Swiper on section deselect if necessary
      BestSellingSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      BestSellingSwipers = [];
  });
});

// Deal of the day slider js

document.addEventListener('DOMContentLoaded', function () {
  var DealofdaySwipers = [];

  function initDealofdaySwiper(swiperContainer) {
      var enable = swiperContainer.dataset.enable;
      var desktopspace = swiperContainer.dataset.desktopspace;
      var mobilespace = swiperContainer.dataset.mobilespace;
      var desktop = swiperContainer.dataset.desktop;
      var largeTablet = swiperContainer.dataset.largetablet;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;

    if (enable) {
      var DealofdaySwiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: desktopspace,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".deal-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".deal-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".deal-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: mobile,
                spaceBetween: mobilespace
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: mobilespace
            },
            841: {
                slidesPerView: largeTablet,
                spaceBetween: mobilespace
            },
            992: {
                slidesPerView: largeTablet,
                spaceBetween: desktopspace
            },
            1200: {
                slidesPerView: desktop,
                spaceBetween: desktopspace
            },
        },
      });

      DealofdaySwipers.push(DealofdaySwiper);
    }
  }

  // Initialize Featured collection Swiper on page load
  document.querySelectorAll('.deal-slider').forEach(function (swiperContainer) {
      initDealofdaySwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Featured collection Swiper on section select
      DealofdaySwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      DealofdaySwipers = [];
      document.querySelectorAll('.deal-slider').forEach(function (swiperContainer) {
          initDealofdaySwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Featured collection Swiper on section deselect if necessary
      DealofdaySwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      DealofdaySwipers = [];
  });
});

// testimonial slider js

document.addEventListener('DOMContentLoaded', function () {
  var TestimonialSwipers = [];

  function initTestimonialSwiper(swiperContainer) {
      var desktop = swiperContainer.dataset.desktop;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;

      var TestimonialSwiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: 30,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".testimonial-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".testimonial-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".testimonial-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: mobile,
                spaceBetween: 15
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: 15
            },
            841: {
                slidesPerView: tablet,
                spaceBetween: 15
            },
            992: {
                slidesPerView: desktop,
                spaceBetween: 30
            },
        },
      });

      TestimonialSwipers.push(TestimonialSwiper);
  }

  // Initialize Testimonial collection Swiper on page load
  document.querySelectorAll('.testimonial-slider').forEach(function (swiperContainer) {
      initTestimonialSwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Testimonial collection Swiper on section select
      TestimonialSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      TestimonialSwipers = [];
      document.querySelectorAll('.testimonial-slider').forEach(function (swiperContainer) {
          initTestimonialSwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Testimonial collection Swiper on section deselect if necessary
      TestimonialSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      TestimonialSwipers = [];
  });
});


// testimonial slider style2 js

document.addEventListener('DOMContentLoaded', function () {
  var TestimonialSwipers = [];

  function initTestimonialSwiper(swiperContainer) {
      var desktop = swiperContainer.dataset.desktop;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;

      var TestimonialSwiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: 30,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".testimonial2-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".testimonial2-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".testimonial2-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: mobile,
                spaceBetween: 15
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: 15
            },
            841: {
                slidesPerView: tablet,
                spaceBetween: 15
            },
            992: {
                slidesPerView: desktop,
                spaceBetween: 30
            },
        },
      });

      TestimonialSwipers.push(TestimonialSwiper);
  }

  // Initialize Testimonial collection Swiper on page load
  document.querySelectorAll('.testimonial-slider2').forEach(function (swiperContainer) {
      initTestimonialSwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Testimonial collection Swiper on section select
      TestimonialSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      TestimonialSwipers = [];
      document.querySelectorAll('.testimonial-slider2').forEach(function (swiperContainer) {
          initTestimonialSwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Testimonial collection Swiper on section deselect if necessary
      TestimonialSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      TestimonialSwipers = [];
  });
});

// shipping slider js

document.addEventListener('DOMContentLoaded', function () {
  var ShippingSwipers = [];

  function initShippingSwiper(swiperContainer) {
      var desktop = swiperContainer.dataset.desktop;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;

      var ShippingSwiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: 60,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".shipping-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".shipping-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".shipping-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: mobile,
                spaceBetween: 15
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: 15
            },
            841: {
                slidesPerView: tablet,
                spaceBetween: 30
            },
            992: {
                slidesPerView: desktop,
                spaceBetween: 60
            },
        },
      });

      ShippingSwipers.push(ShippingSwiper);
  }

  // Initialize Shipping collection Swiper on page load
  document.querySelectorAll('.Shipping-inner-row').forEach(function (swiperContainer) {
      initShippingSwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Shipping collection Swiper on section select
      ShippingSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      ShippingSwipers = [];
      document.querySelectorAll('.Shipping-inner-row').forEach(function (swiperContainer) {
          initShippingSwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Shipping collection Swiper on section deselect if necessary
      ShippingSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      ShippingSwipers = [];
  });
});

// blog slider js

document.addEventListener('DOMContentLoaded', function () {
  var FeaturedblogSwipers = [];

  function initFeaturedblogSwiper(swiperContainer) {
      var desktopspace = swiperContainer.dataset.desktopspace;
      var mobilespace = swiperContainer.dataset.mobilespace;
      var desktop = swiperContainer.dataset.desktop;
      var largeTablet = swiperContainer.dataset.largetablet;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;
  
      var FeaturedblogSwiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: desktopspace,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".blog-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".blog-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".blog-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: mobile,
                spaceBetween: mobilespace
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: mobilespace
            },
            841: {
                slidesPerView: largeTablet,
                spaceBetween: mobilespace
            },
            992: {
                slidesPerView: desktop,
                spaceBetween: desktopspace
            },
        },
      });

    FeaturedblogSwipers.push(FeaturedblogSwiper);
  }

  // Initialize Featured blog Swiper on page load
  document.querySelectorAll('.blog-slider').forEach(function (swiperContainer) {
      initFeaturedblogSwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Featured blog Swiper on section select
      FeaturedblogSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      FeaturedblogSwipers = [];
      document.querySelectorAll('.blog-slider').forEach(function (swiperContainer) {
          initFeaturedblogSwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Featured blog Swiper on section deselect if necessary
      FeaturedblogSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      FeaturedblogSwipers = [];
  });
});

// brand slider js

document.addEventListener('DOMContentLoaded', function () {
  var BrandSwipers = [];

  function initBrandSwiper(swiperContainer) {
      var desktop = swiperContainer.dataset.desktop;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;

      var BrandSwiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: 0,
          loop: loop,
          autoplay: {
            delay: 1,
            disableOnInteraction: true
          },
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".brand-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".brand-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".brand-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: mobile,
                spaceBetween: 15
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: 15
            },
            841: {
                slidesPerView: tablet,
                spaceBetween: 15
            },
            992: {
                slidesPerView: desktop,
                spaceBetween: 0
            },
        },
      });

      BrandSwipers.push(BrandSwiper);
  }

  // Initialize Brand Swiper on page load
  document.querySelectorAll('.brand-slider').forEach(function (swiperContainer) {
      initBrandSwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Brand Swiper on section select
      BrandSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      BrandSwipers = [];
      document.querySelectorAll('.brand-slider').forEach(function (swiperContainer) {
          initBrandSwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Brand Swiper on section deselect if necessary
      BrandSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      BrandSwipers = [];
  });
});

// category collection 1 slider

document.addEventListener('DOMContentLoaded', function () {
  var categorycollectionSwipers = [];

  function initcategorycollectionSwiper(swiperContainer) {

      var desktop = swiperContainer.dataset.desktop;
      var largeTablet = swiperContainer.dataset.largetablet;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;

      var categorycollectionSwiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: 30,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".category-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".category-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".category-swiper-pagination"),
              clickable: true,
          },
          breakpoints : {
            320: {
                slidesPerView: mobile,
                spaceBetween: 15,
            },
            480: {
                slidesPerView: tablet,
                spaceBetween: 15,
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: 15,
            },
            841: {
                slidesPerView: largeTablet,
                spaceBetween: 15,
            },
            992: {
                slidesPerView: largeTablet,
                spaceBetween: 30,
            },
            1100: {
                slidesPerView: desktop,
                spaceBetween: 30,
            },
          }
      });

    categorycollectionSwipers.push(categorycollectionSwiper);
  }

  // Initialize category collection Swiper on page load
  document.querySelectorAll('.main-collection-list-wrapper').forEach(function (swiperContainer) {
      initcategorycollectionSwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize category collection Swiper on section select
      categorycollectionSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      categorycollectionSwipers = [];
      document.querySelectorAll('.main-collection-list-wrapper').forEach(function (swiperContainer) {
          initcategorycollectionSwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup category collection Swiper on section deselect if necessary
      categorycollectionSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      categorycollectionSwipers = [];
  });
});

// category collection 2 slider

document.addEventListener('DOMContentLoaded', function () {
  var categorycollectionstyle2Swipers = [];

  function initcategorycollectionstyle2Swiper(swiperContainer) {

      var desktop = swiperContainer.dataset.desktop;
      var largeTablet = swiperContainer.dataset.largetablet;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;
      var slider = document.querySelector(".main-collections-list-wrapper").dataset.slider;
      var breakpoints = {};
      
          breakpoints = {
            320: {
              slidesPerView: mobile,
              spaceBetween: 15,
            },
            480: {
                slidesPerView: mobile,
                spaceBetween: 15,
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: 15,
            },
            841: {
                slidesPerView: largeTablet,
                spaceBetween: 15,
            },
            1100: {
                slidesPerView: desktop,
                spaceBetween: 30,
            },
            1200: {
                slidesPerView: desktop,
                spaceBetween: 30,
            },
          };

      var categorycollectionstyle2Swiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: 30,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".second-category-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".second-category-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".second-category-swiper-pagination"),
              clickable: true,
          },
          breakpoints : breakpoints
      });

    categorycollectionstyle2Swipers.push(categorycollectionstyle2Swiper);
  }

  // Initialize category collection style2 Swiper on page load
  document.querySelectorAll('.main-collections-list-wrapper').forEach(function (swiperContainer) {
      initcategorycollectionstyle2Swiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize category collection style2 Swiper on section select
      categorycollectionstyle2Swipers.forEach(function (swiper) {
          swiper.destroy();
      });
      categorycollectionstyle2Swipers = [];
      document.querySelectorAll('.main-collections-list-wrapper').forEach(function (swiperContainer) {
          initcategorycollectionstyle2Swiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup category collection Swiper on section deselect if necessary
      categorycollectionstyle2Swipers.forEach(function (swiper) {
          swiper.destroy();
      });
      categorycollectionstyle2Swipers = [];
  });
});

// category collection 3 slider

document.addEventListener('DOMContentLoaded', function () {
  var categorycollectionstyle3Swipers = [];

  function initcategorycollectionstyle3Swiper(swiperContainer) {

      var desktop = swiperContainer.dataset.desktop;
      var largeTablet = swiperContainer.dataset.largetablet;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;

      var categorycollectionstyle3Swiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: 30,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".third-category-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".third-category-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".third-category-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: mobile,
                spaceBetween: 15,
            },
            480: {
                slidesPerView: tablet,
                spaceBetween: 15,
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: 15,
            },
            768: {
                slidesPerView: largeTablet,
                spaceBetween: 15,
            },
            840: {
                slidesPerView: desktop,
                spaceBetween: 15,
            },
            992: {
                slidesPerView: desktop,
                spaceBetween: 30,
            },
          },
      });

    categorycollectionstyle3Swipers.push(categorycollectionstyle3Swiper);
  }

  // Initialize category collection Swiper on page load
  document.querySelectorAll('.main-collections-list-wrapper3').forEach(function (swiperContainer) {
      initcategorycollectionstyle3Swiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize category collection style3 Swiper on section select
      categorycollectionstyle3Swipers.forEach(function (swiper) {
          swiper.destroy();
      });
      categorycollectionstyle3Swipers = [];
      document.querySelectorAll('.main-collections-list-wrapper3').forEach(function (swiperContainer) {
          initcategorycollectionstyle3Swiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup category collection style3 Swiper on section deselect if necessary
      categorycollectionstyle3Swipers.forEach(function (swiper) {
          swiper.destroy();
      });
      categorycollectionstyle3Swipers = [];
  });
});

// bestselling collection slider

document.addEventListener('DOMContentLoaded', function () {
  var specialCollectionSwipers = [];

  function initSpecialCollectionSwiper(swiperContainer) {
    var autoplay = swiperContainer.dataset.autoplay;
    var loop = swiperContainer.dataset.loop;
    var speed = swiperContainer.dataset.speed;

    var specialCollectionSwiper = new Swiper(swiperContainer, {
      slidesPerView: 1,
      spaceBetween: 0,
      loop: true,
      autoplay: autoplay,
      speed: speed,
      navigation: {
        nextEl: swiperContainer.querySelector(".special-swiper-button-next"),
        prevEl: swiperContainer.querySelector(".special-swiper-button-prev")
      },
      breakpoints: {
        320: {
          slidesPerView: 1,
        }
      },
    });

    specialCollectionSwipers.push(specialCollectionSwiper);
  }

  // Initialize Special Collection Swiper on page load
  document.querySelectorAll('.featured-slider__products2').forEach(function (element) {
    initSpecialCollectionSwiper(element);
  });

  document.addEventListener('shopify:section:select', function () {
    // Reinitialize Special Collection Swiper on section select
    specialCollectionSwipers.forEach(function (swiper) {
      swiper.destroy();
    });
    specialCollectionSwipers = [];
    document.querySelectorAll('.featured-slider__products2').forEach(function (element) {
      initSpecialCollectionSwiper(element);
    });
  });

  document.addEventListener('shopify:section:deselect', function () {
    // Cleanup Special Collection Swiper on section deselect if necessary
    specialCollectionSwipers.forEach(function (swiper) {
      swiper.destroy();
    });
    specialCollectionSwipers = [];
  });
});

// multicolumn slider
document.addEventListener('DOMContentLoaded', function () {
  var MulticolumnSwipers = [];

  function initmulticolumnSwiper(swiperContainer) {
      var desktop = swiperContainer.dataset.desktop;
      var largeTablet = swiperContainer.dataset.largetablet;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;

      var MulticolumnSwiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: 30,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".multicolumn-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".multicolumn-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".multicolumn-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: mobile,
                spaceBetween: 15
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: 15
            },
            841: {
                slidesPerView: largeTablet,
                spaceBetween: 15
            },
            992: {
                slidesPerView: desktop,
                spaceBetween: 30
            },
        },
      });

    MulticolumnSwipers.push(MulticolumnSwiper);
  }

  // Initialize Multicolumn Swiper on page load
  document.querySelectorAll('.multicolumn-slider').forEach(function (swiperContainer) {
      initmulticolumnSwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Multicolumn Swiper on section select
      MulticolumnSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      MulticolumnSwipers = [];
      document.querySelectorAll('.multicolumn-slider').forEach(function (swiperContainer) {
          initmulticolumnSwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Multicolumn Swiper on section deselect if necessary
      MulticolumnSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      MulticolumnSwipers = [];
  });
});

// instagram slider
document.addEventListener('DOMContentLoaded', function () {
  var InstagramSwipers = [];

  function initInstagramSwiper(swiperContainer) {
      var enable = swiperContainer.dataset.enable === "true";
      var desktop = swiperContainer.dataset.desktop;
      var largeTablet = swiperContainer.dataset.largetablet;
      var tablet = swiperContainer.dataset.tablet;
      var mobile = swiperContainer.dataset.mobile;
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;

    if (enable) {
      var InstagramSwiper = new Swiper(swiperContainer, {
          slidesPerView: desktop,
          spaceBetween: 30,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".instagram-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".instagram-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".instagram-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: mobile,
                spaceBetween: 15
            },
            576: {
                slidesPerView: tablet,
                spaceBetween: 15
            },
            841: {
                slidesPerView: largeTablet,
                spaceBetween: 15
            },
            992: {
                slidesPerView: desktop,
                spaceBetween: 30
            },
        },
      });

      InstagramSwipers.push(InstagramSwiper);
    }
  }

  // Initialize Instagram Swiper on page load
  document.querySelectorAll('.main-instagram-post-section-wrapper').forEach(function (swiperContainer) {
      initInstagramSwiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Instagram Swiper on section select
      InstagramSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      InstagramSwipers = [];
      document.querySelectorAll('.main-instagram-post-section-wrapper').forEach(function (swiperContainer) {
          initInstagramSwiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Instagram Swiper on section deselect if necessary
      InstagramSwipers.forEach(function (swiper) {
          swiper.destroy();
      });
      InstagramSwipers = [];
  });
});

// hero slideshow style2 slider

document.addEventListener('DOMContentLoaded', function () {
  var heroslider2Swipers = [];

  function initheroslider2Swiper(swiperContainer) {
      var autoplay = swiperContainer.dataset.autoplay === "true";
      var loop = swiperContainer.dataset.loop === "true";
      var speed = swiperContainer.dataset.speed;
    
      var heroslider2Swiper = new Swiper(swiperContainer, {
          slidesPerView: 1,
          spaceBetween: 0,
          loop: loop,
          autoplay: autoplay,
          speed: speed,
          grabCursor: true,
          a11y: false,
          navigation: {
              nextEl: swiperContainer.querySelector(".slider2-swiper-button-next"),
              prevEl: swiperContainer.querySelector(".slider2-swiper-button-prev")
          },
          pagination: {
              el: swiperContainer.querySelector(".slider2-swiper-pagination"),
              clickable: true,
          },
          breakpoints: {
            320: {
                slidesPerView: 1
            },
            576: {
                slidesPerView: 1
            },
            841: {
                slidesPerView: 1
            },
            992: {
                slidesPerView: 1
            },
        },
      });
  
      heroslider2Swipers.push(heroslider2Swiper);
  }

  // Initialize Hero slider 2 Swiper on page load
  document.querySelectorAll('.swiper-container-gudget').forEach(function (swiperContainer) {
      initheroslider2Swiper(swiperContainer);
  });

  document.addEventListener('shopify:section:select', function () {
      // Reinitialize Hero slider 2 Swiper on section select
      heroslider2Swipers.forEach(function (swiper) {
          swiper.destroy();
      });
      heroslider2Swipers = [];
      document.querySelectorAll('.swiper-container-gudget').forEach(function (swiperContainer) {
          initheroslider2Swiper(swiperContainer);
      });
  });

  document.addEventListener('shopify:section:deselect', function () {
      // Cleanup Hero slider 2 Swiper on section deselect if necessary
      heroslider2Swipers.forEach(function (swiper) {
          swiper.destroy();
      });
      heroslider2Swipers = [];
  });
});