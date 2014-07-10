var fs = require( "fs" );

var data = fs.readFileSync( "source", 'utf8' ),
    array = data.split(/\r\n|\r|\n/g),
    array = array.splice( 0, array.length - 1 );

fs.writeFileSync( "input_file", JSON.stringify( array ) );
