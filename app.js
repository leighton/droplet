
var api     = require("./lib/api.js")
  , cred    = require("./etc/api-key.json")
  , program = require('commander');

var bind_hander= function(fn, handler){
  return function(){
    var args = Array.prototype.slice.call(arguments);
    //rather fortunate the last argument is commander details
    //make it the handler instead
    args[args.length-1]=handler;
    fn.apply(fn,args);
  }
};

var print_info = function(json){
  if(json.droplets){
    console.log("\nID\tNAME\t\tSTATUS");
    json.droplets.forEach(function(x){
      console.log(x.id + "\t" + x.name + "\t" + x.status);
    });
    console.log("");
  }
};
program
  .command('info')
  .description('Droplet information')
  .action(bind_hander(api.info, print_info));

program
  .command('power <name> <state>')
  .description('Power off or on droplet')
  .action(bind_hander(api.power,console.log));

program
  .command('shutdown <name>')
  .description('Shutdown droplet')
  .action(bind_hander(api.shutdown,console.log));

api.init(cred, function(){
  program.parse(process.argv);
});










