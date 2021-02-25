const express = require( "express" );
const fs = require( "fs" );
const { resolve } = require( "path" );
const bodyParser = require( 'body-parser' );
require( "dotenv-safe" ).config();
const jwt = require( 'jsonwebtoken' );

const colours = require( "./helpers/customConsole.js" );

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
        let objJWT = jwt.verify( token, process.env.SECRET );
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
            "Content-type": `audio/mpeg`
        };

        res.writeHead( 206, headers );

        const fileStream = fs.createReadStream( file, { start, end } );

        fileStream.pipe( res );
    } catch ( error ) {
        console.log( error );
        if ( error.message )
            return res.status( 400 ).send( error.message );
        res.status( 403 ).send( 'not ok' );
    }
} );

app.listen( _serverPort, () => {
    console.clear();
    console.log( colours.fg.blue, `------ Servidor iniciado na porta ${ _serverPort } ------` );
} );


