if ($( window ).width() > 1175) {
	var cbpAnimatedHeader = (function() {

		var docElem = document.documentElement,
			header = document.querySelector( '.nav-header' ),
			didScroll = false,
			changeHeaderOn = 150;

		function init() {
			window.addEventListener( 'scroll', function( event ) {
				if( !didScroll ) {
					didScroll = true;
					setTimeout( scrollPage, 250 );
				}
			}, false );
		}

		function scrollPage() {
			var sy = scrollY();
			if ( sy >= changeHeaderOn ) {
				classie.add( header, 'shrink' );
			}
			else {
				classie.remove( header, 'shrink' );
			}
			didScroll = false;
		}

		function scrollY() {
			return window.pageYOffset || docElem.scrollTop;
		}

		init();

	})();
}

else {
	header = document.querySelector( '.nav-header' )
	header.classList.add('shrink');
}