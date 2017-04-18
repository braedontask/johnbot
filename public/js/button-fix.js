window.addEventListener('resize', function(event) {
	var leftElement1 = document.querySelector( '#leftElement1' );
	var leftElement2 = document.querySelector( '#leftElement2' );

	if ($( window ).width() > 768) {
		classie.add(leftElement1, 'pull-left');
		classie.remove(leftElement1, 'pull-right');
		classie.add(leftElement2, 'pull-left');
		classie.remove(leftElement2, 'pull-right');
	}

	else {
		classie.remove(leftElement1, 'pull-left');
		classie.add(leftElement1, 'pull-right');
		classie.remove(leftElement2, 'pull-left');
		classie.add(leftElement2, 'pull-right');
	}
});

$(document).ready(function() {
	$(".close-btn").on("click", function() {
		$(".jumbotron").hide();
	});
});