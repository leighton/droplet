
var api     = require("./lib/api.js")
  , cred    = require("./etc/api-key.json")
  , _       = require("underscore")
  , program = require('commander')
  , Table   = require('cli-table')
  , colors  = require('colors'); 

var bind_hander= function(fn, handler){
  return function(){
    var args = Array.prototype.slice.call(arguments);
    //rather fortunate the last argument is commander details
    //make it the handler instead
    var commander_arg = args[args.length-1];
    args[args.length-1] = function(){ //bind handler as callback to API
      var a = Array.prototype.slice.call(arguments);
      a.push(commander_arg); //bind commander argument to handler
      handler.apply(handler,a);
    }
    fn.apply(fn,args);
  }
};

var print = function(json,cmd){
  console.log(json);
}

var print_status = function(json,cmd){
  if(json.droplets){
    
    var droplets = _.sortBy(json.droplets,function(x){
      return x.status;
    });

    var table = new Table({
      head: ['ID', 'NAME', 'IP ADDRESS', 'STATUS'], 
      colWidths: [10,20,20,10]
    });
    
    _.each(droplets,function(x){
      table.push(
        [x.id, x.name, x.ip_address, x.status==="off" ? x.status.yellow : x.status.green]
      );
    });
    
    console.log(table.toString()); 
  }
};
program
  .command('status')
  .description('Status of your droplets')
  .action(bind_hander(api.status, print_status));

program
  .command('power <name> <state>')
  .description('Power (on|off) droplet')
  .action(bind_hander(api.power,print));

program
  .command('shutdown <name>')
  .description('Shutdown droplet')
  .action(bind_hander(api.shutdown,print));

program
  .command('snapshot <droplet_name> <snapshot_name>')
  .description('Snapshot droplet')
  .action(bind_hander(api.snapshot,print));

/**
 * Images API
 */
var print_images = function(json,cmd){
  
  if(json.images){
    var table = new Table({
      head: ['ID', 'PUBLIC', 'OS', 'NAME'], 
      colWidths: [10,10,15,30]
    });

    _.each(json.images,function(x){
      if(cmd.all){
        table.push(
          [x.id, x.public, x.distribution, x.name]
        );
      }else{
        if(!x.public){
          table.push(
            [x.id, x.public, x.distribution, x.name]
          );
        }
      }
    });
    
    console.log(table.toString());
  }
};
program
  .command('images')
  .description('Droplet images')
  .option('-a, --all', 'Print all images not just private')
  .action(bind_hander(api.images, print_images));

program
  .command('destroy-image <id>')
  .description('Destroy image')
  .action(bind_hander(api.destroy_image, print));


api.init(cred, function(){
  program.parse(process.argv);
});

