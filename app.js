var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var gfrApi = require('./gfrApi');
//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var welcomeIntent = new builder.IntentDialog();
var presentationIntent = new builder.IntentDialog();
var finalIntent = new builder.IntentDialog();

var defaultCount = 0;

var timeOfDay = new Date();
var greeting;
if (timeOfDay.getHours() > 4 && timeOfDay.getHours() < 12) {
    greeting = "¡Buenos días ";
} else if (timeOfDay.getHours() >= 12 && timeOfDay.getHours() < 17) {
     greeting = "¡Buenos tardes ";
} else {
     greeting = "¡Buenas noches ";
}

bot.dialog('/', welcomeIntent);
bot.dialog('/presention', presentationIntent);
bot.dialog('/goodbye', finalIntent);

//=========================================================
// Welcome
//=========================================================
welcomeIntent.matches(/^Hello|Hi|Hey|Hola/i, [
    function (session, args, next) {
    	if(session.userData.name) {
    		next();
    	} else {
    		builder.Prompts.text(session, greeting + '! ¿Cuál es tu nombre?');
    	}
    },
    function (session, results) {
        if(!session.userData.name) {
            session.userData.name = results.response;
            session.send('Mucho gusto %s.', session.userData.name); 
            session.beginDialog('/presention');
        } else {
            session.send(greeting + '%s!', session.userData.name);
            session.beginDialog('/menu');
        }       
    }
]);

welcomeIntent.matches(/¿Cuál es tu nombre?/i, 
    function (session) {
       session.beginDialog('/presention');
    }
);

welcomeIntent.onDefault([
    function (session, args, next) {
        defaultCount++;
        session.send('No sé a qué te refieres.');
        if (defaultCount > 2){
            session.beginDialog('/menu');
        } 
    }
]);

//=========================================================
// Presentation
//=========================================================
presentationIntent.onBegin(
    function(session) {
        session.send('Mi nombre es LUCI, significa Lexical Understanding Capable Intelligence por sus siglas en inglés.');
        session.beginDialog('/menu');
    }
);

//=========================================================
// Menu and News
//=========================================================
bot.dialog('/menu', [

    function (session) {
        session.send('¿Cómo te puedo ayudar?');
        builder.Prompts.choice(session,'Interés:', [
            "Noticias",
            "Lotería" ,
            "Horóscopos" 
        ]);
    } ,
    function (session, results) {

       if(results.response.entity === "Noticias") {

           builder.Prompts.choice(session,'Categorías:', ["Recientes","Más Vistas"]);  

       } else if (results.response.entity === "Lotería") {
           session.beginDialog('/lottery');
       } else {
           session.beginDialog('/horoscopes');  
       }
    },
    function (session, results) {
      
        if (results.response.entity === "Recientes") {
            //Latest
            gfrApi.fetchLatest(function(result){
                session.send(result.title + '\n' + result.url);   
                session.beginDialog('/segue');         
            });
       } else if (results.response.entity === "Más Vistas")  {
            //Trending
            gfrApi.fetchTrending(function(result){
                session.send(result.title + '\n' + result.url); 
                session.beginDialog('/segue');   
            });
        } 
    }
]);

//=========================================================
// Horoscopes
//=========================================================
bot.dialog('/horoscopes',[ 
    function(session){
        builder.Prompts.text(session, "¿Cuál es tu signo zodiacal?");
    }, 
    function (session, results) {
        try {
            console.log(results);
            gfrApi.fetchHoroscopes(results.response,function(result){
                session.send(result.text); 
                session.beginDialog('/segue');  
            });    
        } catch (error) {
            console.log(error);
            session.send('No sé a qué te refieres.');
        }
    }
]);

//=========================================================
// Lottery
//=========================================================
bot.dialog('/lottery', [
    function(session){
        builder.Prompts.text(session, "¿Cuál tipo de lotería le interesa?");
    }, 
    function (session, results) {
        try {
          
            gfrApi.fetchLottery(results.response,function(result){
                var str = result.join([separator = ', '])
                var jsonString = JSON.stringify(str);
                session.send('Los números ganadores son los siguientes: ' + jsonString + '.'); 
                session.beginDialog('/segue');   
            });    
        } catch (error) {
            console.log(error);
            session.send('No sé a qué te refieres.');
        }
     }
]);

//=========================================================
// Properties (Housing)
//=========================================================
bot.dialog('/properties', [
]);

//=========================================================
// Segue
//=========================================================
bot.dialog('/segue', [
     function (session){
        builder.Prompts.choice(session, "¿Te puedo ayudar en algo más?", ['Sí', 'No']);
    }, 
    function(session, results){
        console.log(results);
        if (results.response.entity === "Sí") {
            session.beginDialog('/menu');
        } else {
            session.beginDialog('/goodbye');
        }
    }   
]);

//=========================================================
// Goodbye
//=========================================================
finalIntent.matches(/adiós|adios|bye?/i, [
    function (session) {
    	session.userData = {};
    	session.send('¡Nos vemos luego!');
        session.endDialog();
    }
]);
finalIntent.onBegin(
   function (session) {
        session.userData = {};
        session.send('¡Nos vemos luego!');
        session.endDialog();
    }   
);


