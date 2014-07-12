var Twit = require( 'twit' ),
    request = require( 'request' ),
    fs = require( 'fs' );

// Microsoft Translation data
var access_token_url = "https://datamarket.accesscontrol.windows.net/v2/OAuth2-13",
    MS_client_id = "cn_propaganda",
    MS_client_secret = "c/DFLZFYPQYWH9VIunYsvqvLAqOK0hd6yILvBcZxIKY=",
    MS_scope = "http://api.microsofttranslator.com",
    access_token = "";

// Twitter data
var T = new Twit({
    consumer_key: "8RTGXToquyd9BqU4b0cmwSMgR"
  , consumer_secret: "1My3fm9a5UHgsadea1afv1px1BiBZhwSl7IctCSlgUCOj2xhLu"
  , access_token: "2612665272-l8ZUeGRU6Q1gUHpfwwxqPYCgvPCAKlBPVktnHjI"
  , access_token_secret: "ONwnXUl6qvhpSWBwlH1gnXhiYC962nEC4cQ4vlzWeBwao"
});

// text files
var INPUT_FILE = "input_file.txt",
    OUTPUT_FILE = "output_file.txt",
    SOURCE = "source.txt",
    TRANSLATED = "translated.txt";

// ============================================================ //

// concurrent process that renews access token every 9 
// minutes, since it expires every 10 minutes

renewToken();
setInterval( renewToken, 540000 );

function renewToken() {
    request.post(
        access_token_url,
        {
            form: {
                client_id: MS_client_id,
                client_secret: MS_client_secret,
                scope: MS_scope,
                grant_type: "client_credentials"
            }
        },
        function( err, res, body ) {
            if( err ) {
                console.log( err );
            } else {
                access_token = JSON.parse( body )[ "access_token" ];
            }
        }
    )
};

// ============================================================ //

var i = setInterval( function() {
    if( access_token === "" ) {
        return;
    } else {
        clearInterval(i);
    }
    console.log( "Access Token is ready. Application is starting" );

    // if, input_file is empty, run _01_array_builder
    // if, output_file is empty, make 'output_file' in dir
    if( !fs.existsSync( INPUT_FILE ) ) { buildInput( INPUT_FILE ); }
    if( !fs.existsSync( OUTPUT_FILE ) ) { createOutput( OUTPUT_FILE ); }

    // START APPLICATION!
    runApplication( INPUT_FILE, OUTPUT_FILE );

}, 1000 );

// param: file to make
function buildInput( file ) {
    if( !fs.existsSync( SOURCE ) ) {
        console.error( "the 'source' file does not exist" );
        process.exit( 1 );
    }

    var data = fs.readFileSync( SOURCE, 'utf8' ),
        array = data.split(/\r\n|\r|\n/g),
        array = array.splice( 0, array.length - 1 );

    fs.writeFileSync( file, JSON.stringify( array ) );
};

// param: file to make
function createOutput( file ) {
    fs.openSync( file, 'w' );
};

// ============================================================ //

// main process that waits n amount of time, translates text and tweets
function runApplication( inputFile, outputFile ) {

    var inputData = readFile( inputFile ),
        outputData = readFile( outputFile );

    if( !inputData ) {
        console.error( "No input! Please check the 'source' file" );
        return;
    }

    if( !outputData ) {
        outputData = [];
    }

    inputData = shuffle( inputData );

    loop();
    var interval = setInterval( loop, 10800000 );

    function loop() {
        if( inputData.length > 0 ) {

            var text = inputData[ 0 ];
            text = text.replace( /[\.,-?@\/#!$%\^&\*;:{}=\-_`~()]/g, '!' );
            translate( text, tweet );

            function tweet( text ) {
                T.post( 'statuses/update', { status: text }, function( err, data, response ) {
                    if( err ) {
                        console.log( err );
                    } else {
                        logTranslation( data[ "text" ] );
                        console.log( data[ "text" ] );
                    }
                });
            };

            // update inputData array and save it to inputFile
            inputData = inputData.splice(1, inputData.length);
            writeToFile( inputData, inputFile );

            // update outputData array and save it to outputFile
            outputData.push( text );
            writeToFile( outputData, outputFile );

        } else {
            clearInterval( interval );

            // application is done. peaceful exit
            process.exit( 0 );
        }
    };
    
};

function shuffle( o ){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function logTranslation( text ) {
    if( !fs.existsSync( TRANSLATED ) ) {
        fs.openSync( TRANSLATED, 'w' );
    }
    fs.writeFileSync( TRANSLATED, text );
};

function readFile( file ) {
    var data = fs.readFileSync( file, "utf8" );
    if( data ) {
        return JSON.parse( fs.readFileSync( file, "utf8") );
    } else {
        return null;
    }

};

function writeToFile( array, file ) {
    var msg = JSON.stringify( array );
    fs.writeFileSync( file, msg );
};

/*
 * param text: text to translate
 * param callback: must take one parameter, the translated text
 */
function translate( text, callback ) {
    var req = "http://api.microsofttranslator.com/V2/Ajax.svc/Translate" +
        "?appId=Bearer " + encodeURIComponent( access_token ) +
        "&from=" + encodeURIComponent( "en" ) +
        "&to=" + encodeURIComponent( "zh-CHS" ) +
        "&text=" + encodeURIComponent( text ) +
        "&oncomplete=a";

    request( req, function( err, res, body ) {
        if( err ) {
            console.log( err );   
        } else {
            var translatedText = body.slice( 4, body.length - 3 );
            callback( translatedText );
        }
    } );
};

