(function($) {

  $.fn.menumaker = function(options) {
      
      var cssmenu = $(this), settings = $.extend({
        title: "Menu",
        format: "dropdown",
        sticky: false
      }, options);

      return this.each(function() {
        cssmenu.prepend('<div id="menu-button">' + settings.title + '</div>');
        $(this).find("#menu-button").on('click', function(){
          $(this).toggleClass('menu-opened');
          var mainmenu = $(this).next('ul');
          if (mainmenu.hasClass('open')) { 
            mainmenu.hide().removeClass('open');
          }
          else {
            mainmenu.show().addClass('open');
            if (settings.format === "dropdown") {
              mainmenu.find('ul').show();
            }
          }
        });

        cssmenu.find('li ul').parent().addClass('has-sub');

        multiTg = function() {
          cssmenu.find(".has-sub").prepend('<span class="submenu-button"></span>');
          cssmenu.find('.submenu-button').on('click', function() {
            $(this).toggleClass('submenu-opened');
            if ($(this).siblings('ul').hasClass('open')) {
              $(this).siblings('ul').removeClass('open').hide();
            }
            else {
              $(this).siblings('ul').addClass('open').show();
            }
          });
        };

        if (settings.format === 'multitoggle') multiTg();
        else cssmenu.addClass('dropdown');

        if (settings.sticky === true) cssmenu.css('position', 'fixed');

        resizeFix = function() {
          if ($( window ).width() > 1175) {
            cssmenu.find('ul').show();
            $("a.buy-btn.pull-right").show();
            $("img.menu-pic").show();
          }

          if ($(window).width() <= 1175) {
            cssmenu.find('ul').hide().removeClass('open');
            cssmenu.find('#menu-button').removeClass('menu-opened');
            $("a.buy-btn.pull-right").hide();
            $("img.menu-pic").hide();
          }
        };
        resizeFix();
        return $(window).on('resize', resizeFix);

      });
  };
})(jQuery);

(function($){
$(document).ready(function(){

$(document).ready(function() {

  $("#cssmenu").menumaker({
    title: "Menu",
    format: "multitoggle"
  });

  $("#cssmenu").prepend("<div id='menu-line'></div>");

var foundActive = false, activeElement, hoverElement, linePosition = 0, menuLine = $("#cssmenu #menu-line"), lineWidth, defaultPosition, defaultWidth;

$("#cssmenu > ul > li").each(function() {
  if ($(this).hasClass('active')) {
    activeElement = $(this);
    foundActive = true;
  }
});

if (foundActive === false) {
  activeElement = $("#cssmenu > ul > li").first();
}

defaultWidth = lineWidth = activeElement.width();

defaultPosition = linePosition = activeElement.position().left;

menuLine.css("width", lineWidth);
menuLine.css("left", linePosition);

$("#cssmenu > ul > li").mouseover(function() {
  $('#cssmenu').addClass('hoverActive');
  if (!$("#menu-button").hasClass("menu-opened")) {
    hoverElement = $(this);
    lineWidth = hoverElement.width();
    linePosition = hoverElement.position().left;
    menuLine.css("width", lineWidth);
    menuLine.css("left", linePosition); }
}).mouseleave(function() {
  $('#cssmenu').removeClass('hoverActive');
  if (!$("#menu-button").hasClass("menu-opened")) {
  hoverElement = activeElement;
  lineWidth = hoverElement.width();
  linePosition = hoverElement.position().left;
  menuLine.css("width", lineWidth);
  menuLine.css("left", linePosition); }
});

setInterval(function() {
    if (!($('#cssmenu').hasClass('hoverActive'))) {
      if (!$("#menu-button").hasClass("menu-opened")) {
        hoverElement = activeElement;
        lineWidth = hoverElement.width();
        linePosition = hoverElement.position().left;
        menuLine.css("width", lineWidth);
        menuLine.css("left", linePosition); }
      }
  }, 100);

$("#cssmenu li").on("click", function() {
  $("#cssmenu").find("li").each(function() {
      $(this).removeClass("active");
  })
  $(this).addClass("active");
  activeElement = $(this);

  if ($("#cssmenu").find("#menu-button").hasClass("menu-opened")) {
    $("#menu-button").toggleClass('menu-opened');
    var mainmenu = $("#menu-button").next('ul');
    if (mainmenu.hasClass('open')) { 
      mainmenu.hide().removeClass('open');
    }
  else {
    mainmenu.show().addClass('open');
    if (settings.format === "dropdown") {
      mainmenu.find('ul').show();
    }
  }
}
});

resizeFix = function() {
  if ($( window ).width() > 1175) {
    $("#cssmenu > ul > li").each(function() {
      if ($(this).hasClass('active')) {
        activeElement = $(this);
      }
    });
    lineWidth = activeElement.width();
    linePosition = activeElement.position().left;
    menuLine.css("width", lineWidth);
    menuLine.css("left", linePosition);
  }
};

return $(window).on('resize', resizeFix);

});

});
})(jQuery);