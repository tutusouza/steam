const express = require( "express" );
const fs = require( "fs" );
const { resolve } = require( "path" );
const bodyParser = require( 'body-parser' );
require( "dotenv-safe" ).config();
const jwt = require( 'jsonwebtoken' );
const verifyToken = require( "./helpers/verifyJWT" );

const colours = require( "./helpers/customConsole.js" );
const { compileFunction } = require( "vm" );

const app = express();
const _serverPort = 3334;

app.use( bodyParser.json() );

app.get( "/", ( req, res ) => {
    return res.sendFile( `${ __dirname }/views/index.html` );
} );

//authentication
app.post( '/login', ( req, res, next ) => {

    if ( !req.body.user === 'artur' || !req.body.password === '123' )
        return res.status( 500 ).json( { message: 'Login inválido!' } );

    const id = 1; //esse id viria do banco de dados
    const token = jwt.sign( { id }, process.env.SECRET, {
        expiresIn: 3000 // expires in 5min
    } );
    return res.json( { auth: true, token: token } );

} );

app.get( "/stream", ( req, res ) => {
    try {
        let token = req.query.token;
        // let objJWT = jwt.verify( token, process.env.SECRET ); Verificar token

        const range = req.headers.range;
        const CHUNK_SIZE = 10 ** 6;
        if ( !range )
            throw { message: 'Não é uma chamada de stream midia' };

        const file = resolve( __dirname, "videos", "video1.mp4" );
        const fileSize = fs.statSync( file ).size;

        const start = Number( range.replace( /\D/g, "" ) );//Remove letras e tranforma string em numero
        const end = Math.min( start + CHUNK_SIZE, fileSize - 1 );

        const headers = {
            "Content-Range": `bytes ${ start }-${ end }/${ fileSize }`,
            "Accept-Range": `bytes`,
            "Content-type": `video/mp4`
        };
        console.log( range );

        res.writeHead( 206, headers );

        const fileStream = fs.createReadStream( file, { start, end } );

        fileStream.pipe( res );
    } catch ( error ) {
        console.log( error );
        // fileStream.unpipe (res); parar o pipe, porem nao esta no mesmo fluxo
        if ( error.message ) {
            return res.status( 400 ).send( error.message );

        }
        res.status( 403 ).send( 'not ok' );
    }
} );


app.get( "/buffer", verifyToken, ( req, res ) => {
    try {
        const highWaterMark = 2;
        const file = resolve( __dirname, "videos", "error_dashinit.mp4" );
        let chunkSize = 1024 * 1024 / 10;

        const readStream = fs.createReadStream( file, { start: 0, end: 2000 } );
        const fileSize = fs.statSync( file );


        const headers = {
            "Content-Range": `bytes ${ 0 }-${ 2000 }/${ fileSize.size }`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': 0,
            "Accept-Range": `bytes`,
            "Content-type": `video/mp4`
        };

        res.writeHead( 206, headers );

        readStream.pipe( res );

        readStream.on( 'data', chunk => {
            // console.log( chunk );
        } );

        readStream.on( 'open', () => {
            console.log( 'Stream opened...' );
            // console.log( fileSize );

        } );

        readStream.on( 'end', () => {
            console.log( 'Stream Closed...' );
            // res.send( "ok" );
        } );

    } catch ( error ) {
        console.log( error );
    }
} );


app.listen( _serverPort, () => {
    console.clear();
    console.log( colours.fg.blue, `------ Servidor iniciado na porta ${ _serverPort } ------` );
} );


//https://stackoverflow.com/questions/53226595/streaming-audio-in-node-js-with-content-range
//https://simpl.info/mse/



//https://stackoverflow.com/questions/14108536/how-do-i-append-two-video-files-data-to-a-source-buffer-using-media-source-api

//https://medium.com/canal-tech/how-video-streaming-works-on-the-web-an-introduction-7919739f7e1