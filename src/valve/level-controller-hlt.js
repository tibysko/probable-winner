const boardController = require('../board/board-controller').BoardController;
const parameterController = require('../parameters/parameter-controller');
const ValveConstants = require('./valve-controller').ValveConstants;
const valveController = require('./valve-controller').ValveController;

const L1_OFFSET = 'l1_offset';
const L1_SCALING = 'l1_scaling';
const MASHWATER = 'MashWater';
const SPARGEWATER = 'SpargeWater';

class LevelControllerHlt {

  constructor() {

    this.valveController = valveController;
    this.boardController = boardController;
    this.parameterController = parameterController;

    this.actLevelHlt = 0;
    this.levelScaling = 1;
    this.levelOffset = 0;
    this.activateSparge = false; //Todo fix startbutton from gui
    this.activateDoughIn = false; //Todo fix button from gui
    this.auto = false; //Todo fix auto from gui
    this.startLevel = 0;
    this.valveClosed = 0;
    this.spargeActive = false; //Todo show in gui
    this.doughInActive = false; //Todo show in gui
    this.stateValve = 0;
    // this._checkLevelHlt();
  }

  start() {
    this._updateParameters();
    this._setupListeners();
  }

  getWaterLevel() {
    return this.actLevelHlt;
  }

  /**
   * Private methods
   */

  _checkLevelHlt() {

    switch (this.stateValve) {
      // Manual mode
      case 0:
        this.spargeActive = false;
        this.doughInActive = false;

        if (this.auto) {
          this.stateValve = 100;
          break;
        }

        // Auto wait for start sparge
      case 10:
        // Dough in activated
        if (this.activateMashWater) {
          this.valveController.setState('MLT_HW_IN', ValveConstants.START_OPEN, function () {});
          this.startLevel = this.actLevelHlt;
          this.doughInActive = true;
          this.stateValve = 100;
          break;
          // Sparge activated
        } else if (this.activateSparge) {
          this.valveController.setState('MLT_HW_IN', ValveConstants.START_OPEN, function () {});
          this.startLevel = this.actLevelHlt;
          this.spargeActive = true;
          this.stateValve = 200;
          break;
        }


        // Dough in active
      case 100:
        // Go back to Manual mode
        if (!this.auto) {
          this.stateValve = 0;
          break;
          // Sparge done
        } else if ((this.startLevel - this.actLevelHlt) <= MASHWATER && this.startLevel > this.actLevelHlt) {
          this.valveController.setState('MLT_HW_IN', ValveConstants.START_CLOSE, function () {});
          this.spargeActive = false;
          this.stateValve = 110;
          break;
        }

        // Set alarm for sparge done
      case 110:
        // Todo Set alarm for sparge done
        this.stateValve = 0;
        break;


        // Sparge active
      case 200:
        // Go back to Manual mode
        if (!this.auto) {
          this.stateValve = 0;
          break;
          // Sparge done
        } else if ((this.startLevel - this.actLevelHlt) <= SPARGEWATER && this.startLevel > this.actLevelHlt) {
          this.valveController.setState('MLT_HW_IN', ValveConstants.START_CLOSE, function () {});
          this.spargeActive = false;
          this.stateValve = 210;
          break;
        }

        // Set alarm for sparge done
      case 210:
        // Todo Set alarm for sparge done
        this.stateValve = 0;
        break;

    }

  }

  _setupListeners() {
    this.parameterController.on('data', () => {
      this._updateParameters();
    });

    this.boardController.on('data', (data) => {
      if (data['L1_HLT'] && data['L1_HLT'].value) {
        let l1HltValue = parseFloat(data['L1_HLT'].value);
        this.actLevelHlt = Math.round((10.0 * ((l1HltValue / this.levelScaling) + this.levelOffset))) / 10;
      }
      if (data['MLT_HW_IN_CLOSED']) {
        this.valveClosed = data['MLT_HW_IN_CLOSED'].value;
      }

    });
  }
 
  _updateParameters() {
    this.levelScaling = this.parameterController.getValue(L1_SCALING);
    this.levelOffset = this.parameterController.getValue(L1_OFFSET);
  }
}

module.exports = new LevelControllerHlt();
