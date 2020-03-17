const Discord = require('discord.js');
const schedule = require('node-schedule');
const request = require('request');
const config = require('./config.json');
const client = new Discord.Client();

var channelTest;
var channelInformation;

var jours = new Array("dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi");
var mois = new Array("janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre");

client.login(config.token);

client.once("ready", () => {
  console.log("Je suis prêt !");
  client.user.setActivity("Intégrales généralisées");
  channelInformation = client.channels.cache.get(config.channelInformation);
  channelTest = client.channels.cache.get(config.channelTest);
});

client.on('message', message => {
  if (message.content === `${config.prefix}ping`) {
    message.channel.send('pong');
  }
});

var j = schedule.scheduleJob('30 7 * * *', function(){
  openweathermap("Paris, France", function(success, previsions){
    var today = new Date();
    channelTest.send("Bonjour,\nnous sommes le "+jours[today.getDay()]+" "+mois[today.getMonth()]+" "+today.getFullYear()+". Le temps sera "+previsions.condition+" et la température sera de "+previsions.temperature+"°C.\nIl y aura cours de maths à 8h30 puis cours de physique à 13h30.\nBonne journée.");
  });
});

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
