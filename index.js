const Discord = require('discord.js');
const schedule = require('node-schedule');
const request = require('request');
const R = require('r-script');
const config = require('./config.json');
const edt = require('./edt.json');
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
    message = "";
    try{
      message = edt.days[today.getDate()-22].text
    }catch(e){
      channelTest.send("Pas de message personnalisé aujourd'hui :( : " + e);
    }
    channelInformation.send("Bonjour,\nnous sommes le "+jours[today.getDay()]+" "+today.getDate()+" "+mois[today.getMonth()]+" "+today.getFullYear()+". Le temps sera "+previsions.condition+" et la température sera de "+previsions.temperature+"°C.\n"+edt.days[today.getDate()-22].text+"\nBonne journée.");
  });
});

var j = schedule.scheduleJob('0 18 * * *', function(){
  R("corona.r").call(function(err, data) {
      if (err) throw err;
      const message = new Discord.MessageEmbed()
        .setTitle("Statistiques coronavirus")
        .setFooter("Source : ©Chauve Capé Corp")
        .attachFiles(['result.png'])
        .setImage("attachment://result.png")
        .addFields(
          {name: "Nouveaux cas", value: data.Cases[0]},
          {name: "Nombre de morts", value: data.Deaths[0]},
          {name: "Modélisation des nouveaux cas (j(0)=27 février): ", value: "N(j)=exp("+data.a+"j+"+data.b+")"},
          {name: "Tous les français infecté dans :", value: Math.ceil(data.end)+" jours"}
        );
      channelInformation.send(message);
    });
});

var pause1 = schedule.scheduleJob('30 10 * * *', function(){
  channelInformation.send("Une pause s'impose");
});

var pause2 = schedule.scheduleJob('30 12 * * *', function(){
  channelInformation.send("J'ai cru entendre des ventres gargouiller. Il est temps de reprendre des forces.");
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
