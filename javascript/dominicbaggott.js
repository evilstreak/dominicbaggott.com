function getThumbHref( imageHref ) {
  return imageHref.replace( /\..*?$/, "_thumb$&" );
}

$( document ).ready( function() {
  $( '#projects-overview li > a' ).fancybox({
    'callbackOnShow': function() {
      $( '#fancy_content .project-detail-menu li' ).each( function( i ) {
        $( this ).click( function() {
          $( '#fancy_content .project-detail-menu li' ).removeClass( 'selected' ).eq( i ).addClass( 'selected' );
          $( '#fancy_content .scroll-wrapper' ).scrollTo( $( '#fancy_content .scroll-wrapper li' ).eq( i ), 300 );
        });
      });
    },
    'centerOnScroll': true,
    'frameHeight': 671,
    'frameWidth': 980,
    'hideOnContentClick': false,
    'overlayOpacity': 0.3,
    'overlayShow': true,
    'padding': 0,
    'zoomOpacity': 0.5,
    'zoomSpeedIn': 300,
    'zoomSpeedOut': 300
  });

  $( '#projects > div' ).each( function( j ) {
    // make the content scrollable
    var content = $( 'div.scroll-wrapper', this );
    $( 'ul.project-detail', content ).css( 'width', 980 * $( 'li', content ).length + 'px' );

    // make the menu
    var menu = $( '<ul class="project-detail-menu">' ).appendTo( this );
    $( 'li', this ).each( function( i ) {
      $( '<li><img src="' + getThumbHref( $( 'img', this ).attr( 'src' ) ) + '" alt="" height="105" width="140"></li>' )
        .appendTo( menu );
    });
  });

  $( '.project-detail-menu li:first-child' ).addClass( 'selected' );
  $( '#projects-overview li > a' ).append( '<span class="zoom"></span>' );
});
