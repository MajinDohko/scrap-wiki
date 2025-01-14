//Construimos el servidor y creamos todas las constantes necesarias
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

//Creo una variable para la base de la url
const baseUrl = 'https://es.wikipedia.org';
const url = `${baseUrl}/wiki/Categor%C3%ADa:M%C3%BAsicos_de_rap`;


//PRimera petición al servidor para traerme las url de la página principal de los raperos
app.get('/', (req, res) => {
    axios.get(url).then((response) => {
        if (response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);

            const tituloPagina = $('title').text();

            //Con este bloque voy a traerme los enlaces que comparten ese ID
            const enlaces = [];
            $('#mw-pages a').each((index, element) => {
                const enlace = $(element).attr('href');
                if (enlace.startsWith('/wiki/')) {
                    enlaces.push(`${baseUrl}${enlace}`);
                }
            });

    //Una vez me he traido los enlaces necesarios y los he metido en un array creo otro bloque que me permita acceder a ese array para obtener información de los enlaces extraidos
            const informacionEnlaces = [];
            let enlacesProcesados = 0;


            //Creo un bucle foreach y realizo otra petición get para obtener la información de los enlaces que meti en el array enlaces.
            enlaces.forEach((enlace) => {
                axios.get(enlace).then((response) => {
                    const nuevoHtml = response.data;
                    const $$ = cheerio.load(nuevoHtml);

                //Defino que quiero traerme de cada enlace
                    const titulo = $$('h1').text();
                    const imagenes = [];
                    $$('img').each((index, img) => {
                        imagenes.push($$(img).attr('src'));
                    });

                    const textos = [];
                    $$('p').each((index, p) => {
                        textos.push($$(p).text().trim());
                    });

                    informacionEnlaces.push({
                        url: enlace,
                        titulo,
                        imagenes,
                        textos,
                    });

                    enlacesProcesados++;


                    if (enlacesProcesados === enlaces.length) {
                        res.send(`
                            <h1>${tituloPagina}</h1>
                            <ul>
                                ${informacionEnlaces.map(informacion => `
                                    <li>
                                        <h2>${informacion.titulo}</h2>
                                        <p>URL: <a href="${informacion.url}">${informacion.url}</a></p>
                                        <p>Imágenes:</p>
                                        <ul>
                                            ${informacion.imagenes.map(img => `<li><img src="${img}" alt="Imagen"></li>`).join('')}
                                        </ul>
                                        <p>Textos:</p>
                                        <p>${informacion.textos.slice(0, 2).join('</p><p>')}...</p>
                                    </li>
                                `).join('')}
                            </ul>
                        `);
                    }
                    //Creación de errores por si algún enlace no pudiera ser procesado
                }).catch((error) => {
                    console.error(`Error al procesar la URL: ${enlace}`, error.mensaje);
                    enlacesProcesados++;


                    if (enlacesProcesados === enlaces.length) {
                       //Imprimo en pantalla aquella información que he extraido anteriormente
                        res.send(`
                            <h1>${tituloPagina}</h1>
                            <ul>
                                ${informacionEnlaces.map(informacion => `
                                    <li>
                                        <h2>${informacion.titulo}</h2>
                                        <p>URL: <a href="${informacion.url}">${informacion.url}</a></p>
                                        <p>Imágenes:</p>
                                        <ul>
                                            ${informacion.imagenes.map(img => `<li><img src="${img}" alt="Imagen"></li>`).join('')}
                                        </ul>
                                        <p>Textos:</p>
                                        <p>${informacion.textos.slice(0, 2).join('</p><p>')}...</p>
                                    </li>
                                `).join('')}
                            </ul>
                        `);
                    }
                });
            });
        }
    }).catch((error) => {
        console.error('Error al realizar el scraping inicial:', error.mensaje);
    });
});

//Llamo al servidor en el puerto 3000
app.listen(3000, () => {
    console.log('Express está escuchando en el puerto 3000');
});

