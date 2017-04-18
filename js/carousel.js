$(document).ready(function() {
    resizeCaptionFix = function() {

        if ($(window).width() > 1400) {
            $(".carousel img").css("padding-bottom", "60px");
        }

        else if (($(window).width() > 765) && ($(window).width() <= 1400)) {
            $(".carousel img").css("padding-bottom", "60px");
        }

        else if (($(window).width() > 300) && ($(window).width() <= 765)) {
            $(".carousel img").css("padding-bottom", "40px");
        }

        else {
            $(".carousel img").css("padding-bottom", "40px");
        }
    };

    resizeCaptionFix();
    $(window).on('resize', resizeCaptionFix);
});