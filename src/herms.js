/**
 * Main for the Herms System.  
 * 
 */

const EventEmitter = require('events');

const boardController = require('./board/board-controller').BoardController;
const logger = require('./core/logger');
const levelControllerHLT = require('./valve/level-controller-hlt');
const pidControllerRegistry = require('./pid/pid-controller-registry');
const socketDataEmiter = require('./data-emitter/socket-data-emiter');
const valveControllerHeHwIn = require('./valve/valve-controller-he-hw-in');


class Herms extends EventEmitter {
  constructor() {
    super(); // eventemitter constructor
    this.moduleName = 'Herms';
    this.boardController = boardController;
    this.levelControllerHLT = levelControllerHLT;
    this.pidControllerRegistry = pidControllerRegistry;
    this.socketDataEmiter = socketDataEmiter;
    this.valveControllerHeHwIn = valveControllerHeHwIn;
  }

  start() {
    this.boardController.init(err => {
      if (err) return logger.logError(this.moduleName, 'start', 'Failed to setup board-controller');

      this.boardController.start();
      this.pidControllerRegistry.startPidControllers();
      this.socketDataEmiter.start();
      this.valveControllerHeHwIn.start();
      this.levelControllerHLT.start();
    });
  }
}

module.exports = new Herms();
