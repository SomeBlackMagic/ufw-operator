
const {
    Command,
} = require('simple-command-bus');

export abstract class BaseCommand extends Command {
    abstract readonly $name: string;
    abstract readonly $version: number;
    abstract readonly $uuid: string;

}
