
var api       = require("./lib/api.js")
  , handlers  = require("./lib/handlers")
  , cred      = require("./etc/api-key.json")
  , _         = require("underscore")
  , program   = require('commander')


var bind_handler= function(fn, handler){
  return function(){
    var args = Array.prototype.slice.call(arguments);
    //rather fortunate the last argument is commander details
    //make it the handler instead
    var commander_arg = args[args.length-1];
    //console.log(commander_arg);

    args[args.length-1] = function(){ //bind handler as callback to API
      var a = Array.prototype.slice.call(arguments);
      a.push(commander_arg); //bind commander argument to handler
      handler.apply(handler,a);
    }
    fn.apply(fn,args);
  }
};

/**
 * Droplet API
 */

program
  .command('status')
  .description('Status of your droplets')
  .action(bind_handler(api.status, handlers.tabulate_status));

program
  .command('status <name>')
  .description('Status of your droplet')
  .action(bind_handler(api.status, handlers.print));
//TODO: when calling status <name> both functions are called!

program
  .command('power <name> <state>')
  .description('Power (on|off) droplet')
  .action(bind_handler(api.power, handlers.print));

program
  .command('shutdown <name>')
  .description('Shutdown droplet')
  .action(bind_handler(api.shutdown, handlers.print));

program
  .command('snapshot <droplet_name> <snapshot_name>')
  .description('Snapshot droplet')
  .action(bind_handler(api.snapshot, handlers.print));

program
  .command('destroy <droplet_name>')
  .description('Destroy the droplet')
  .action(bind_handler(api.destroy, handlers.print));


/**
 * Images API
 */
program
  .command('images')
  .description('Droplet images')
  .option('-g, --global', 'Print all images not just private', false)
  .action(function(cmd){
    bind_handler(_.partial(api.images,!cmd.global), handlers.tabulate_images)(cmd)
  });

program
  .command('destroy-image <id>')
  .description('Destroy image')
  .action(bind_handler(api.destroy_image, handlers.print));


/**
 * Composite commands
 */
program
  .command('ice <droplet_name>')
  .description('Snapshot then destroy droplet')
  .action(bind_handler(api.ice, handlers.print));

program
  .command('thaw <droplet_name>')
  .description('Create from snapshot then destroy snapshot')
  .action(bind_handler(api.thaw, handlers.print));


/**
 * Initiate the API and start
 */
api.init(cred, function(){
  program.parse(process.argv);
});

