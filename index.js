const Discord = require('discord.js');
const schedule = require('node-schedule');
const request = require('request');
const R = require('r-script');
const config = require('./config.json');
const edt = require('./edt.json');
const client = new Discord.Client();

//Déclaration des variables contenant les ids
var channelTest;
var channelInformation;

//Tables pour afficher la date
var jours = new Array("dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi");
var mois = new Array("janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre");

//Initialisation du bot
client.login(config.token);
client.once("ready", () => {
  console.log("Je suis prêt !");
  client.user.setActivity("Intégrales généralisées");
  channelInformation = client.channels.cache.get(config.channelInformation);
  channelTest = client.channels.cache.get(config.channelTest);
});

//Réaction aux messages des utilisateurs
client.on('message', message => {
  if (message.content === `${config.prefix}ping`) {
    message.channel.send('pong');
  }
});

//Message quotidien avec texte personnalisé et météo à 7h30
var j = schedule.scheduleJob('30 7 * * *', function(){
  openweathermap("Paris, France", function(success, previsions){
    var today = new Date();
    message = "";
    try{
      if(!success) throw success;
      message = edt.days[today.getDate()-22].text
    }catch(e){
      channelTest.send("Pas de message personnalisé aujourd'hui :( : " + e + "/météo :"+ success);
    }
    channelInformation.send("Bonjour,\nnous sommes le "+jours[today.getDay()]+" "+today.getDate()+" "+mois[today.getMonth()]+" "+today.getFullYear()+". Le temps sera "+previsions.condition+" et la température sera de "+previsions.temperature+"°C.\n"+edt.days[today.getDate()-22].text+"\nBonne journée.");
  });
});

//Statistique quotidienne sur le coronavirus (voir corona.r) à 16h00
var j = schedule.scheduleJob('0 16 * * *', function(){
  R("corona.r").call(function(err, data) {
      if (err){
        channelTest.send("Erreur d'exécution du script R");
      } else {
        const message = new Discord.MessageEmbed()
          .setTitle("Statistiques coronavirus")
          .setFooter("Source : ©Chauve Capé Corp")
          .attachFiles(['result.png'])
          .setImage("attachment://result.png")
          .setTimestamp()
          .addFields(
            {name: "Nouveaux cas", value: data.cases[0], inline: true},
            {name: '\u200B', value: '\u200B', inline: true},
            {name: "Nouveaux morts", value: data.deaths[0], inline: true},
            {name: "Cas totaux", value: data.total, inline: true},
            {name: '\u200B', value: '\u200B', inline: true},
            {name: "Morts totaux", value: data.totalD, inline: true},
            {name: "Tous les français infectés dans :", value: Math.ceil(data.end)+" jours"},
            {name: "Tous les français morts dans :", value: Math.ceil(data.endDeaths)+" jours"},
            {name: "Modélisation des nouveaux cas (j(0)=27 février): ", value: "N(j)=exp("+data.a+"j+"+data.b+")"},
            {name: "Modélisation du nombre de morts (j(0)=27 février): ", value: "N(j)=exp("+data.aD+"j"+data.bD+")"},
          );
        channelInformation.send(message);
      }
    });
});

//Annonce de la pause de 10h30
var pause1 = schedule.scheduleJob('30 10 * * *', function(){
  var today = new Date();
  if(today.getDay() != 5 && today.getDay() != 6)
    channelInformation.send("Une pause s'impose");
});

//Annonce du repas de midi à 12h30
var pause2 = schedule.scheduleJob('30 12 * * *', function(){
  if(today.getDay() != 5 && today.getDay() != 6)
    channelInformation.send("J'ai cru entendre des ventres gargouiller. Il est temps de reprendre des forces.");
});

//Fonction de récupération des données météo depuis l'api openweathermap
var openweathermap = function(city, callback){
  var url = 'http://api.openweathermap.org/data/2.5/weather?q=' + city + '&lang=fr&units=metric&appid=' + config.openWeatherMapId;

  request(url, function(err, response, body){
    try{
      var result = JSON.parse(body);
      if (result.cod != 200) {
        callback(false);
      } else {
        var previsions = {
          temperature : Math.floor(result.main.temp),
          humidity : result.main.humidity,
          wind: Math.round(result.wind.speed * 3.6),
          city : result.name,
          condition: result.weather[0].description,
        };
        callback(true, previsions);
      }
    } catch(e) {
      callback(false);
    }
  });
}
